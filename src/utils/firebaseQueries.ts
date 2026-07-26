import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  auth,
  createEmp,
  db,
  deleteEmpCompany,
  transferEmployeeData,
} from "./firebase.ts";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
} from "firebase/auth";
import { buildDocName } from "./dateUtils.ts";
import { queryClient } from "../main.tsx";
import type {
  AdminData,
  CompanyData,
  CompanyEmployee,
  CompanySummary,
  PrintableEmployeeReportRow,
  WeekDay,
  WeeklyHours,
} from "./dataModels.ts";
import {
  getAdditionalHours,
  getPaidHoursTotal,
  getRegularHoursTotal,
  withAdditionalHours,
  withDayHours,
  withDayNotes,
} from "./weeklyHours.ts";

const COMPANY_LIST_COLLECTION_NAME = "CompanyList";
const ADMIN_DOC_NAME = "Administrative_Data";
const COMPANY_EMPLOYEE_COLLECTION = "Employees";
export const FAKE_EMAIL_EXTENSION = "@dillahuntyfarms.com";

const queryKeys = {
  adminData: (userId: string | undefined | null) =>
    [ADMIN_DOC_NAME, userId] as const,
  companies: () => [COMPANY_LIST_COLLECTION_NAME] as const,
  company: (companyId: string | undefined) =>
    [COMPANY_LIST_COLLECTION_NAME, companyId] as const,
  companyEmployee: (companyId: string, employeeId: string) =>
    [
      COMPANY_LIST_COLLECTION_NAME,
      companyId,
      COMPANY_EMPLOYEE_COLLECTION,
      employeeId,
    ] as const,
  weeklyHours: (userId: string, docName: string) =>
    ["WeeklyHours", userId, docName] as const,
  weeklyReports: () => ["WeeklyReport"] as const,
  weeklyReportsForWeek: (docName: string) => ["WeeklyReport", docName] as const,
  weeklyReport: (companyId: string | undefined, docName: string) =>
    ["WeeklyReport", docName, companyId] as const,
};

const getEmptyWeek = (): WeeklyHours => ({
  0: { hours: 0 },
  1: { hours: 0 },
  2: { hours: 0 },
  3: { hours: 0 },
  4: { hours: 0 },
  5: { hours: 0 },
  6: { hours: 0 },
});

export function getUserWeekQuery(
  userId: string,
  date: Date,
  docName: string = buildDocName(date),
) {
  const query = {
    queryKey: queryKeys.weeklyHours(userId, docName),
    queryFn: async (): Promise<WeeklyHours> => {
      console.log("getUserWeekQuery");
      if (!userId) return getEmptyWeek();

      const docRef = doc(db, userId, docName);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const userWeek = docSnap.data();
        // TODO: how do I verify that this type is correct and throw an error if it is not?
        //  - looks like the best anser is to use Zod
        return userWeek as WeeklyHours;
      } else {
        return getEmptyWeek();
      }
    },
  };
  return query;
}

async function fetchWeek(
  userId: string,
  date: Date,
  docName: string = buildDocName(date),
) {
  return await queryClient.fetchQuery(getUserWeekQuery(userId, date, docName));
}

type UserWeekSettledCallback = (result: UserWeekSettledResult) => void;

interface UserWeekMutationVariables {
  userId: string;
  date: Date;
  userWeek: WeeklyHours;
  onSettled?: UserWeekSettledCallback;
}

interface UserWeekSettledResult {
  error: unknown | null;
  variables: UserWeekMutationVariables;
}

export function userWeekMutation() {
  const mutation = {
    mutationFn: async ({
      userId,
      date,
      userWeek,
    }: UserWeekMutationVariables) => {
      const docName = buildDocName(date);
      console.log("saving week", userWeek);
      await setDoc(doc(db, userId, docName), userWeek);
      return userWeek;
    },
    onSuccess: async (
      data: WeeklyHours,
      variables: UserWeekMutationVariables,
    ) => {
      const docName = buildDocName(variables.date);
      const queryKey = queryKeys.weeklyHours(variables.userId, docName);

      // ASK: update cache - is this always okay?
      queryClient.setQueryData(queryKey, data);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.weeklyReportsForWeek(docName),
      });
    },
    onError: async (error: unknown, variables: UserWeekMutationVariables) => {
      console.log("on userWeekMutation error", error, variables);
      const docName = buildDocName(variables.date);
      const queryKey = queryKeys.weeklyHours(variables.userId, docName);

      // TODO: log the error
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: queryKey });
    },
    onSettled: (
      ...args: [
        WeeklyHours | undefined,
        unknown | null,
        UserWeekMutationVariables,
      ]
    ) => {
      const [, error, variables] = args;
      if (variables.onSettled) {
        variables.onSettled({ error, variables });
      }
    },
  };
  return mutation;
}

type WeeklyHoursUpdater = (currentWeek: WeeklyHours) => WeeklyHours;

function useUpdateUserWeek() {
  const setWeek = useMutation(userWeekMutation());

  return async (
    userId: string,
    date: Date,
    updateWeek: WeeklyHoursUpdater,
    onSettled?: UserWeekSettledCallback,
  ) => {
    const docName = buildDocName(date);
    const currentWeek = await fetchWeek(userId, date, docName);
    const updatedWeek = updateWeek(currentWeek);

    setWeek.mutate({ userId, date, userWeek: updatedWeek, onSettled });
  };
}

export function useSetHours() {
  const updateUserWeek = useUpdateUserWeek();

  const setHours = async (
    userId: string,
    date: Date,
    hours: number,
    onSettled?: UserWeekSettledCallback,
  ) => {
    const day = date.getDay() as WeekDay;
    await updateUserWeek(
      userId,
      date,
      (currentWeek) => withDayHours(currentWeek, day, hours),
      onSettled,
    );
  };

  return setHours;
}

export function useSetAdditionalHours() {
  const updateUserWeek = useUpdateUserWeek();

  const setAdditionalHours = async (
    userId: string,
    date: Date,
    hours: number,
    onSettled?: UserWeekSettledCallback,
  ) => {
    await updateUserWeek(
      userId,
      date,
      (currentWeek) => withAdditionalHours(currentWeek, hours),
      onSettled,
    );
  };

  return setAdditionalHours;
}

export function useSetNotes() {
  const updateUserWeek = useUpdateUserWeek();

  const setNotes = async (
    userId: string,
    date: Date,
    notes: string,
    onSettled?: UserWeekSettledCallback,
  ) => {
    const day = date.getDay() as WeekDay;
    await updateUserWeek(
      userId,
      date,
      (currentWeek) => withDayNotes(currentWeek, day, notes),
      onSettled,
    );
  };

  return setNotes;
}

export function useMakeAdmin() {
  const queryClient = useQueryClient();

  const makeAdmin = async (userId: string) => {
    const adminData = await queryClient.fetchQuery(getAdminDataQuery(userId));
    if (!adminData) {
      throw new Error("Unable to find administrative data for this employee.");
    }
    const newAdminData = {
      ...adminData,
      isAdmin: true,
    };

    console.log(adminData, newAdminData);

    const queryKey = queryKeys.adminData(userId);

    const docRef = doc(db, userId, ADMIN_DOC_NAME);
    // FIXME: this is currently failing permissions
    const result = await updateDoc(docRef, newAdminData);
    console.log(result);
    // ASK: should we invalidate here instead?
    // ASK: should this hide the user?
    queryClient.setQueryData(queryKey, newAdminData);
  };

  return makeAdmin;
}

// TODO: needs validation
// used in claim user process
export async function setMyCompany(userId: string, companyId: string) {
  const docRef = doc(db, userId, ADMIN_DOC_NAME);

  const adminData = await queryClient.fetchQuery(getAdminDataQuery(userId));
  const newAdminData = {
    ...adminData,
    company: companyId,
  };

  await updateDoc(docRef, newAdminData);
  queryClient.invalidateQueries({ queryKey: queryKeys.adminData(userId) });
}

export function getAdminDataQuery(userId: string | undefined | null) {
  const query = {
    queryKey: queryKeys.adminData(userId),
    queryFn: async () => {
      console.log("getAdminDataQuery");
      if (!userId) return null;
      const docRef = doc(db, userId, ADMIN_DOC_NAME);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as AdminData;
      } else return null;
    },
  };
  return query;
}

export function getCompanyEmployeeQuery(companyId: string, empId: string) {
  const query = {
    queryKey: queryKeys.companyEmployee(companyId, empId),
    queryFn: async () => {
      console.log("getCompanyEmployeeQuery");
      if (!companyId || !empId) return {};
      const docRef = doc(
        db,
        COMPANY_LIST_COLLECTION_NAME +
          "/" +
          companyId +
          "/" +
          COMPANY_EMPLOYEE_COLLECTION,
        empId,
      );
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { ...docSnap.data(), id: empId };
      } else {
        throw new Error("Employee doesn't exist");
      }
    },
  };
  return query;
}

export async function fetchCompanyEmployee(companyId: string, empId: string) {
  return await queryClient.fetchQuery(
    getCompanyEmployeeQuery(companyId, empId),
  );
}

export function getWeeklyReportDataQuery(
  companyId: string | undefined,
  selectedDate: Date,
) {
  const docName = buildDocName(selectedDate);

  return {
    queryKey: queryKeys.weeklyReport(companyId, docName),
    queryFn: async (): Promise<PrintableEmployeeReportRow[]> => {
      console.log("getWeeklyReportDataQuery");
      if (!companyId) throw new Error("A company is required.");

      const companyData = await queryClient.fetchQuery(
        getCompanyQuery(companyId),
      );
      const employeeRows = await Promise.all(
        companyData.Employees.map(async (employee) => {
          const [weeklyHours, employeeAdminData] = await Promise.all([
            queryClient.fetchQuery(
              getUserWeekQuery(employee.id, selectedDate, docName),
            ),
            queryClient.fetchQuery(getAdminDataQuery(employee.id)),
          ]);

          if (employeeAdminData?.hidden) return null;

          const dailyHours: Record<WeekDay, number> = {
            0: weeklyHours[0].hours,
            1: weeklyHours[1].hours,
            2: weeklyHours[2].hours,
            3: weeklyHours[3].hours,
            4: weeklyHours[4].hours,
            5: weeklyHours[5].hours,
            6: weeklyHours[6].hours,
          };

          return {
            additionalHours: getAdditionalHours(weeklyHours),
            dailyHours,
            id: employee.id,
            name: employee.name,
            paidHours: getPaidHoursTotal(weeklyHours),
            rate: employee.rate,
            regularHours: getRegularHoursTotal(weeklyHours),
          };
        }),
      );

      return employeeRows.filter(
        (employee): employee is PrintableEmployeeReportRow => employee !== null,
      );
    },
    enabled: companyId !== undefined,
  };
}

export function getCompanyQuery(companyId?: string) {
  const query = {
    queryKey: queryKeys.company(companyId),
    queryFn: async (): Promise<CompanyData> => {
      console.log("getCompanyQuery");
      // TODO: add actual error handling
      // TODO: investigate use and see if this is dumb
      if (!companyId || companyId === "") {
        throw new Error("Invalid Arguments");
      }
      const docRef = doc(db, COMPANY_LIST_COLLECTION_NAME, companyId);
      const docSnap = await getDoc(docRef);
      const employeeCollection = collection(
        db,
        COMPANY_LIST_COLLECTION_NAME +
          "/" +
          companyId +
          "/" +
          COMPANY_EMPLOYEE_COLLECTION,
      );
      const docListSnapshot = await getDocs(employeeCollection);
      const docList = docListSnapshot.docs.map(
        (employeeDoc) =>
          ({
            ...employeeDoc.data(),
            id: employeeDoc.id,
          }) as CompanyEmployee,
      );

      const companyData = {
        ...docSnap.data(),
        id: companyId,
        Employees: docList,
      } as CompanyData;
      return companyData;
    },
    enabled: companyId !== undefined,
  };
  return query;
}

export async function getCompany(companyId: string) {
  return await queryClient.fetchQuery(getCompanyQuery(companyId));
}

export function useCompanies() {
  const companyDocsQuery = useQuery(getCompanyDocsQuery());

  return {
    data: companyDocsQuery.data ?? [],
    isError: companyDocsQuery.isError,
    isPending: companyDocsQuery.isPending,
  };
}

export function getCompanyDocsQuery() {
  const query = {
    queryKey: queryKeys.companies(),
    queryFn: async (): Promise<CompanySummary[]> => {
      console.log("getCompanyDocsQuery");
      const companyList = collection(db, COMPANY_LIST_COLLECTION_NAME);
      const companiesCollectionSnapshot = await getDocs(companyList);
      return companiesCollectionSnapshot.docs.map((companyDocument) => {
        const companyData = companyDocument.data();

        return {
          id: companyDocument.id,
          name:
            typeof companyData.name === "string" ? companyData.name : undefined,
        };
      });
    },
  };
  return query;
}

async function createNewCompany({ companyName }: { companyName: string }) {
  const companyList = collection(db, COMPANY_LIST_COLLECTION_NAME);
  const docRef = await addDoc(companyList, {
    name: companyName,
  });
  return docRef;
}

export function useCreateCompany() {
  const createCompanyMutation = useMutation({
    mutationFn: createNewCompany,
    onSuccess: async (data) => {
      const newCompanyId = data.id;
      const companyQueryKey = queryKeys.company(newCompanyId);
      await queryClient.invalidateQueries({ queryKey: companyQueryKey });
    },
    onError: (error) => {
      console.error(error);
    },
    onSettled: async () => {
      const companiesQueryKey = queryKeys.companies();
      await queryClient.invalidateQueries({ queryKey: companiesQueryKey });
    },
  });

  const createCompany = async (companyName: string) => {
    return await createCompanyMutation.mutateAsync({ companyName });
  };
  return createCompany;
}

type CompanyEmployeeWrite = Omit<CompanyEmployee, "id">;

interface EmployeeMutationSettledResult {
  error: unknown | null;
  variables:
    | UpdateEmployeeVariables
    | RemoveEmployeeVariables
    | CreateEmployeeVariables;
}

type EmployeeMutationSettledCallback = (
  result: EmployeeMutationSettledResult,
) => void | Promise<void>;

interface UpdateEmployeeVariables {
  userId: string;
  companyId: string;
  userData: CompanyEmployeeWrite;
  onSettled?: EmployeeMutationSettledCallback;
}

interface RemoveEmployeeVariables {
  userId: string;
  companyId: string;
  onSettled?: EmployeeMutationSettledCallback;
}

interface CreateEmployeeVariables {
  companyId: string;
  userData: CompanyEmployeeWrite;
  onSettled?: EmployeeMutationSettledCallback;
}

function getCompanyEmployeeWrite(
  userData: CompanyEmployeeWrite,
): CompanyEmployeeWrite {
  return {
    firstName: userData.firstName,
    lastName: userData.lastName,
    name: userData.name,
    rate: userData.rate,
    ...(userData.email === undefined ? {} : { email: userData.email }),
    ...(userData.isAdmin === undefined ? {} : { isAdmin: userData.isAdmin }),
  };
}

export async function setCompanyEmployee(
  variables: UpdateEmployeeVariables,
) {
  const { userId, companyId, userData } = variables;
  console.log("setCompanyEmployee");
  const userDataNoId = getCompanyEmployeeWrite(userData);
  await setDoc(
    doc(
      db,
      COMPANY_LIST_COLLECTION_NAME +
        "/" +
        companyId +
        "/" +
        COMPANY_EMPLOYEE_COLLECTION,
      userId,
    ),
    {
      ...userDataNoId, // without id
    },
  );
  return userDataNoId;
}

export function useUpdateEmployeeData() {
  const setEmployeeDataMutation = useMutation({
    mutationFn: setCompanyEmployee,
    onSuccess: async (
      ...args: [CompanyEmployeeWrite, UpdateEmployeeVariables]
    ) => {
      const [, variables] = args;
      const queryKey = queryKeys.companyEmployee(
        variables.companyId,
        variables.userId,
      );

      await queryClient.invalidateQueries({ queryKey });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.weeklyReports(),
      });
    },
    onError: async (error, variables) => {
      console.error(error);
      const queryKey = queryKeys.companyEmployee(
        variables.companyId,
        variables.userId,
      );

      // TODO: log the error
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: queryKey });

    },
    onSettled: (
      ...args: [
        CompanyEmployeeWrite | undefined,
        Error | null,
        UpdateEmployeeVariables,
      ]
    ) => {
      const [, error, variables] = args;
      if (variables.onSettled) {
        return variables.onSettled({ error, variables });
      }
    },
  });

  const setEmployeeData = async (
    userId: string,
    companyId: string,
    userData: CompanyEmployeeWrite,
    onSettled?: EmployeeMutationSettledCallback,
  ) => {
    setEmployeeDataMutation.mutate({ userId, companyId, userData, onSettled });
  };

  return setEmployeeData;
}

async function deleteCompanyEmployee(variables: RemoveEmployeeVariables) {
  const { userId, companyId } = variables;
  const docRef = doc(
    db,
    COMPANY_LIST_COLLECTION_NAME +
      "/" +
      companyId +
      "/" +
      COMPANY_EMPLOYEE_COLLECTION,
    userId,
  );
  await deleteDoc(docRef);

  const data = { uid: userId };
  const result = await deleteEmpCompany(data);
  if (!result.data.success) {
    throw new Error("Failed to remove emp company data");
  }
  return true;
}

export function useRemoveEmployee() {
  const removeEmployeeMutation = useMutation({
    mutationFn: deleteCompanyEmployee,
    onSettled: (
      ...args: [boolean | undefined, Error | null, RemoveEmployeeVariables]
    ) => {
      const [, error, variables] = args;
      const queryKey = queryKeys.companyEmployee(
        variables.companyId,
        variables.userId,
      );
      queryClient.invalidateQueries({ queryKey: queryKey });

      const companyQueryKey = queryKeys.company(variables.companyId);
      queryClient.invalidateQueries({ queryKey: companyQueryKey });
      queryClient.invalidateQueries({ queryKey: queryKeys.weeklyReports() });

      if (variables.onSettled) {
        return variables.onSettled({ error, variables });
      }
    },
  });

  const removeEmployee = async (
    userId: string,
    companyId: string,
    onSettled?: EmployeeMutationSettledCallback,
  ) => {
    removeEmployeeMutation.mutate({ userId, companyId, onSettled });
  };

  return removeEmployee;
}

async function createEmployeeAuth(variables: CreateEmployeeVariables) {
  const { userData, companyId } = variables;
  if (!userData.email) {
    throw new Error("Employee email is required");
  }
  const data = {
    companyID: companyId,
    email: userData.email,
    name: userData.name,
    isAdmin: userData.isAdmin,
  };
  const result = await createEmp(data);
  if (!result.data.success) {
    throw new Error("Failed to create user");
  }

  console.log(result.data);
  return {
    ...result.data,
    email: userData.email,
  };
}

export function useCreateEmployee() {
  const updateEmployeeData = useUpdateEmployeeData();
  const createEmployeeMutation = useMutation({
    mutationFn: createEmployeeAuth,
    onSuccess: async (data, variables) => {
      const { companyId, userData, onSettled } = variables;
      const settleEmployeeCreation: EmployeeMutationSettledCallback = async (
        result,
      ) => {
        if (!result.error) {
          await queryClient.invalidateQueries({
            queryKey: queryKeys.company(companyId),
          });
        }
        await onSettled?.(result);
      };
      // ASK: should we need to await this or something?
      updateEmployeeData(
        data.empID,
        companyId,
        userData,
        settleEmployeeCreation,
      );
      // await createCompanyEmployee(empData, result.data.empID, companyId);

      const actionCodeSettings = {
        url: "https://mayfly.asadillahunty.com/",
        handleCodeInApp: true,
      };

      // ASK: should we await or catch this?
      sendSignInLinkToEmail(auth, data.email, actionCodeSettings);
      // we are assuming updateEmployeeData will properly invalidate our queries?
    },
    onError: async (error, variables) => {
      // invalidate company query
      const companyQueryKey = queryKeys.company(variables.companyId);
      queryClient.invalidateQueries({ queryKey: companyQueryKey });
      alert(`Something went wrong: ${error.message}`);

      // we have to settle up here, because updateEmployeeData won't be triggered
      if (variables.onSettled) {
        await variables.onSettled({ error, variables });
      }
    },
    // onSettled: this is handled by updateEmployeeData
  });

  const setEmployeeData = async (
    companyId: string,
    userData: CompanyEmployeeWrite,
    onSettled?: EmployeeMutationSettledCallback,
  ) => {
    createEmployeeMutation.mutate({ companyId, userData, onSettled });
  };

  return setEmployeeData;
}

export function useTransferEmpData() {
  const queryClient = useQueryClient();
  const transferEmpData = async (oldId: string, newId: string) => {
    const data = { oldCollectionPath: oldId, newCollectionPath: newId };
    const result = await transferEmployeeData(data);
    if (!result.data.success) {
      throw new Error("Failed to remove emp company data");
    }
    // sure, this shouldn't be used, might as well clear everything
    queryClient.clear();
  };
  return transferEmpData;
}

export async function resetPassword(email: string) {
  const result = sendPasswordResetEmail(auth, email);
  return result;
}

// TODO: make epic for allowing strangers to create accounts?
export async function createUser(userData: {
  username: string;
  password: string;
}) {
  throw new Error("This functionality is not currently supported");
  const email = userData.username + FAKE_EMAIL_EXTENSION;
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    userData.password,
  );
  const user = userCredential.user;

  return user;
}
