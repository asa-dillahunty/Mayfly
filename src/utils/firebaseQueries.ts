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
} from "./firebase";
import { QueryClient, useMutation } from "@tanstack/react-query";
import { queryClient } from "..";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
} from "firebase/auth";
import { buildDocName, selectedDate } from "./dateUtils";

const COMPANY_LIST_COLLECTION_NAME = "CompanyList";
const UNCLAIMED_LIST_COLLECTION_NAME = "UnclaimedList";
const ADMIN_DOC_NAME = "Administrative_Data";
const COMPANY_DOCS_COLLECTION = "CompanyDocs";
const LAST_CHANGE_DOC_NAME = "Last_Change";
const COMPANY_EMPLOYEE_COLLECTION = "Employees";
export const FAKE_EMAIL_EXTENSION = "@dillahuntyfarms.com";

type WeeklyHours = {
  0: { hours: number; notes?: string };
  1: { hours: number; notes?: string };
  2: { hours: number; notes?: string };
  3: { hours: number; notes?: string };
  4: { hours: number; notes?: string };
  5: { hours: number; notes?: string };
  6: { hours: number; notes?: string };
  additionalHours?: { hours: number };
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
  docName: string = buildDocName(date)
) {
  const query = {
    queryKey: ["WeeklyHours", userId, docName],
    queryFn: async (): Promise<WeeklyHours> => {
      if (!userId) return getEmptyWeek();
      console.log("getUserWeekQuery");

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
  docName: string = buildDocName(date)
) {
  return await queryClient.fetchQuery(getUserWeekQuery(userId, date, docName));
}

export function userWeekMutation() {
  const mutation = {
    mutationFn: async ({
      userId,
      date,
      userWeek,
      onSettled,
    }: {
      userId: string;
      date: Date;
      userWeek: WeeklyHours;
      onSettled?: ({ error, variables }) => void;
    }) => {
      const docName = buildDocName(date);
      await setDoc(doc(db, userId, docName), userWeek);
      return userWeek;
    },
    onSuccess: async (data, variables) => {
      const docName = buildDocName(variables.date);
      const queryKey = ["WeeklyHours", variables.userId, docName];

      // ASK: update cache - is this always okay?
      queryClient.setQueryData(queryKey, data);
      // Invalidate and refetch
      // queryClient.invalidateQueries([userId, docName])
    },
    onError: async (_data, variables) => {
      const docName = buildDocName(variables.date);
      const queryKey = ["WeeklyHours", variables.userId, docName];

      // TODO: log the error
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: queryKey });
    },
    onSettled: (_data, error, variables, _context) => {
      if (variables.onSettled) {
        variables.onSettled({ error, variables });
      }
    },
  };
  return mutation;
}

export function useSetHours() {
  const setWeek = useMutation(userWeekMutation());
  const setHours = async (
    userId: string,
    date: Date,
    hours: number,
    onSettled?: ({ error, variables }) => void
  ) => {
    const docName = buildDocName(date);

    const currentWeek = await fetchWeek(userId, date, docName);
    // ASK: do we need to make a deep copy before altering these values?
    currentWeek[date.getDay()].hours = hours;
    setWeek.mutate({ userId, date, userWeek: currentWeek, onSettled });
  };
  return setHours;
}

export async function useSetAdditionalHours() {
  const setWeek = useMutation(userWeekMutation());
  const setAdditionalHours = async (
    userId: string,
    date: Date,
    hours: number,
    onSettled?: ({ error, variables }) => void
  ) => {
    const docName = buildDocName(date);
    const currentWeek = await fetchWeek(userId, date, docName);

    // ASK: do we need to make a deep copy before altering these values?
    if (!currentWeek["additionalHours"]) {
      currentWeek["additionalHours"] = { hours: hours };
    } else if (currentWeek["additionalHours"].hours === hours) {
      return;
    }

    currentWeek["additionalHours"].hours = hours;
    setWeek.mutate({ userId, date, userWeek: currentWeek, onSettled });
  };
  return setAdditionalHours;
}

export async function getHoursWorkedThisWeek(
  userId: string,
  date: Date,
  docName?: string
) {
  const userWeek = await queryClient.fetchQuery(
    getUserWeekQuery(userId, date, docName)
  );

  let totalHours = 0;
  for (const day in userWeek) {
    if (day === "additionalHours") continue;
    totalHours += userWeek[day].hours;
  }
  return totalHours;
}

export async function getHoursPaidThisWeek(
  userId: string,
  date: Date,
  docName?: string
) {
  const userWeek = await queryClient.fetchQuery(
    getUserWeekQuery(userId, date, docName)
  );

  let totalHours = 0;
  for (const day in userWeek) {
    totalHours += userWeek[day].hours; // could probably use some kind of reducer
  }
  return totalHours;
}

export async function getHoursList(
  userId: string,
  date: Date,
  docName: string = buildDocName(date)
) {
  const hoursList = [];
  const userWeek = await fetchWeek(userId, date, docName);

  for (const day in userWeek) {
    hoursList[day] = userWeek[day].hours;
  }

  if (!userWeek["additionalHours"]) {
    hoursList["additionalHours"] = 0;
  }

  return hoursList;
}

// uid - userID
// cid - company ID
// FIXME // TODO: make mutation and/or invalidate some queries
export async function makeAdmin(uid: string, cid?: string) {
  const docRef = doc(db, uid, ADMIN_DOC_NAME);

  // grab current data from cache
  const adminData = await fetchAdminData(uid);
  adminData.isAdmin = true;
  // does this auto update the cache?

  await setDoc(docRef, adminData);
  // Todo:
  //	update cache
}

// export async function pullLastChange(companyID) {
//   // console.log("Pulling Last Change");
//   const docRef = doc(
//     db,
//     COMPANY_LIST_COLLECTION_NAME +
//       "/" +
//       companyID +
//       "/" +
//       COMPANY_DOCS_COLLECTION,
//     LAST_CHANGE_DOC_NAME
//   );
//   const docSnap = await getDoc(docRef);
//   if (
//     !firebaseCache[COMPANY_LIST_COLLECTION_NAME][companyID][
//       COMPANY_DOCS_COLLECTION
//     ]
//   )
//     firebaseCache[COMPANY_LIST_COLLECTION_NAME][companyID][
//       COMPANY_DOCS_COLLECTION
//     ] = {};
//   firebaseCache[COMPANY_LIST_COLLECTION_NAME][companyID][
//     COMPANY_DOCS_COLLECTION
//   ][LAST_CHANGE_DOC_NAME] = { ...docSnap.data() };
//   return docSnap.data();
// }

// export function getLastChangeCached(companyID) {
//   try {
//     return firebaseCache[COMPANY_LIST_COLLECTION_NAME][companyID][
//       COMPANY_DOCS_COLLECTION
//     ][LAST_CHANGE_DOC_NAME];
//   } catch {
//     return {
//       time: {
//         seconds: 0,
//         nanoseconds: 0,
//       },
//     };
//   }
// }

// TODO: investigate if it still makes sense to use this
// export async function setLastChange(empID, docName, companyID) {
//   if (!companyID) companyID = await getMyCompanyID(empID);
//   const docData = {
//     time: serverTimestamp(),
//     empID: empID,
//     docName: docName,
//   };
//   await setDoc(
//     doc(
//       db,
//       COMPANY_LIST_COLLECTION_NAME +
//         "/" +
//         companyID +
//         "/" +
//         COMPANY_DOCS_COLLECTION,
//       LAST_CHANGE_DOC_NAME
//     ),
//     {
//       ...docData,
//     }
//   );
//   if (!firebaseCache[COMPANY_LIST_COLLECTION_NAME])
//     firebaseCache[COMPANY_LIST_COLLECTION_NAME] = {};
//   if (!firebaseCache[COMPANY_LIST_COLLECTION_NAME][companyID])
//     firebaseCache[COMPANY_LIST_COLLECTION_NAME][companyID] = {};
//   if (
//     !firebaseCache[COMPANY_LIST_COLLECTION_NAME][companyID][
//       COMPANY_DOCS_COLLECTION
//     ]
//   )
//     firebaseCache[COMPANY_LIST_COLLECTION_NAME][companyID][
//       COMPANY_DOCS_COLLECTION
//     ] = {};
//   firebaseCache[COMPANY_LIST_COLLECTION_NAME][companyID][
//     COMPANY_DOCS_COLLECTION
//   ][LAST_CHANGE_DOC_NAME] = docData;
// }

// TODO: make mutation and/or invalidate some queries
export async function setMyCompany(userId: string, companyId: string) {
  const docRef = doc(db, userId, ADMIN_DOC_NAME);
  // const docSnap = await getDoc(docRef);

  await updateDoc(docRef, { company: companyId });
  // Currently not possible with permissions for anyone but Asa
}

export function getAdminDataQuery(userId: string) {
  const query = {
    queryKey: [ADMIN_DOC_NAME, userId],
    queryFn: async () => {
      if (!userId) return {};
      console.log("getAdminDataQuery");
      const docRef = doc(db, userId, ADMIN_DOC_NAME);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data();
      } else return {};
    },
  };
  return query;
}

export async function fetchAdminData(userId: string) {
  return await queryClient.fetchQuery(getAdminDataQuery(userId));
}

export function getCompanyEmployeeQuery(companyId: string, empId: string) {
  const query = {
    queryKey: [
      COMPANY_LIST_COLLECTION_NAME,
      companyId,
      COMPANY_EMPLOYEE_COLLECTION,
      empId,
    ],
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
        empId
      );
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { ...docSnap.data(), id: empId };
      } else {
        // TODO:
        // throw an error
        return {};
      }
    },
  };
  return query;
}

export async function fetchCompanyEmployee(companyId: string, empId: string) {
  return await queryClient.fetchQuery(
    getCompanyEmployeeQuery(companyId, empId)
  );
}

export async function getCompanyEmployeeList(
  companyId: string,
  docName: string
) {
  const docList = (await queryClient.fetchQuery(getCompanyQuery(companyId)))[
    COMPANY_EMPLOYEE_COLLECTION
  ];

  for (let i = 0; i < docList.length; i++) {
    const emp = docList[i];
    emp.hoursPaidThisWeek = await getHoursPaidThisWeek(
      emp.id,
      selectedDate.value,
      docName
    );
    emp.hoursWorkedThisWeek = await getHoursWorkedThisWeek(
      emp.id,
      selectedDate.value,
      docName
    );
    emp.hoursList = await getHoursList(emp.id, selectedDate.value, docName);
    emp.hidden = (await fetchAdminData(emp.id)).hidden;
  }

  return docList;
}

export function getCompanyQuery(companyId: string) {
  const query = {
    queryKey: [COMPANY_LIST_COLLECTION_NAME, companyId],
    queryFn: async () => {
      // TODO: replace the "major error occurred with actual error handling"
      // TODO: investigate use and see if this is dumb
      if (!companyId || companyId === "")
        return { name: "Major Error Occurred" };
      console.log("getCompanyQuery");
      const docRef = doc(db, COMPANY_LIST_COLLECTION_NAME, companyId);
      const docSnap = await getDoc(docRef);
      const employeeCollection = collection(
        db,
        COMPANY_LIST_COLLECTION_NAME +
          "/" +
          companyId +
          "/" +
          COMPANY_EMPLOYEE_COLLECTION
      );
      const docListSnapshot = await getDocs(employeeCollection);
      const docList = docListSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const companyData = {
        id: companyId,
        ...docSnap.data(),
        Employees: docList,
      };
      return companyData;
    },
  };
  return query;
}

export async function getCompany(companyId: string) {
  return await queryClient.fetchQuery(getCompanyQuery(companyId));
}

export function getCompaniesQuery() {
  const query = {
    queryKey: [COMPANY_LIST_COLLECTION_NAME],
    queryFn: async () => {
      console.log("getCompaniesQuery");
      const companyList = collection(db, COMPANY_LIST_COLLECTION_NAME);
      return await getDocs(companyList); // Fetch documents from the "Companies" collection
    },
  };
  return query;
}

export async function getCompanies() {
  return await queryClient.fetchQuery(getCompaniesQuery());
}

// TODO: make mutation and/or invalidate some queries
export function createCompany(companyName: string) {
  const companyList = collection(db, COMPANY_LIST_COLLECTION_NAME);
  addDoc(companyList, {
    name: companyName,
  })
    .then((docRef) => {
      console.log("Added Company with ID: ", docRef.id);
      // update displayed company list
    })
    .catch((error) => {
      // do something to alert the user
      console.error(error);
    });
}

// TODO: standardize empData
// TODO: make mutation and/or invalidate some queries
export async function createCompanyEmployee(
  empData,
  empId: string,
  companyId: string
) {
  await setDoc(
    doc(
      db,
      COMPANY_LIST_COLLECTION_NAME +
        "/" +
        companyId +
        "/" +
        COMPANY_EMPLOYEE_COLLECTION,
      empId
    ),
    {
      ...empData,
    }
  );
}

// TODO: make mutation and/or invalidate some queries
export async function deleteCompanyEmployee(empId, companyId) {
  const docRef = doc(
    db,
    COMPANY_LIST_COLLECTION_NAME +
      "/" +
      companyId +
      "/" +
      COMPANY_EMPLOYEE_COLLECTION,
    empId
  );
  await deleteDoc(docRef);

  const data = { uid: empId };
  const result = await deleteEmpCompany(data);
  if (!result.data.success) {
    alert("Failed to remove emp company data");
  }

  // remove them from the cache
  const oldCache =
    firebaseCache[COMPANY_LIST_COLLECTION_NAME][companyId][
      COMPANY_EMPLOYEE_COLLECTION
    ];
  const newCache = oldCache.filter((emp) => emp.id !== empId);
  firebaseCache[COMPANY_LIST_COLLECTION_NAME][companyId][
    COMPANY_EMPLOYEE_COLLECTION
  ] = newCache;

  // grab the employee's collection -> delete their administrative_data
  // const empDocRef = doc(db, empID, ADMIN_DOC_NAME);
  // await updateDoc(empDocRef, {"company":""})
  // await deleteDoc(empDocRef);
}

// TODO: make mutation and/or invalidate some queries
// TODO: investigate if unclaimed employees still belong in the codebase
export async function createUnclaimedEmployee(employeeData, companyID) {
  // grab unclaimed collection
  const unclaimedCollection = collection(db, UNCLAIMED_LIST_COLLECTION_NAME);
  const unclaimedSnapshot = await getDocs(unclaimedCollection); // Fetch documents from the "Companies" collection
  const unclaimedList = unclaimedSnapshot.docs.map((doc) => doc.id);
  // makes a list of unclaimed ids

  let claimCode = "";
  do {
    claimCode = randomString(6);
  } while (unclaimedList.includes(claimCode));

  // add claimCode to the unclaimed collection
  await setDoc(doc(db, UNCLAIMED_LIST_COLLECTION_NAME, claimCode), {
    unclaimed: true,
    companyID: companyID,
  });

  // create a new employee in the collection
  // add it to the company's employees collection
  employeeData.unclaimed = true;
  await createCompanyEmployee(employeeData, claimCode, companyID);

  // add other fields for their name and things :)
  // add it to the new "unclaimed" collection, along with the company ID to trace it back to the company
}

// TODO: make mutation and/or invalidate some queries
export async function deleteUnclaimedEmployee(claimCode, companyID) {
  const docRef = doc(db, UNCLAIMED_LIST_COLLECTION_NAME, claimCode);
  await deleteDoc(docRef);
  await deleteCompanyEmployee(claimCode, companyID);
}

// TODO: make mutation and/or invalidate some queries
export async function createEmployeeAuth(empData, companyID) {
  const data = {
    companyID,
    email: empData.email,
    name: empData.name,
    isAdmin: empData.isAdmin,
  };
  const result = await createEmp(data);
  if (!result.data.success) {
    alert("Failed to create user");
  }

  // need to return the employee's ID as well
  await createCompanyEmployee(empData, result.data.empID, companyID);

  const actionCodeSettings = {
    url: "https://mayfly.asadillahunty.com/",
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(auth, empData.email, actionCodeSettings);
  // await setMyCompany(result.data.empID, companyID);
  // update the cache
  await getCompany(companyID);
}

// TODO: make mutation and/or invalidate some queries
export async function transferEmpData(oldID: string, newID: string) {
  const data = { oldCollectionPath: oldID, newCollectionPath: newID };
  const result = await transferEmployeeData(data);
  if (!result.data.success) {
    alert("Failed to remove emp company data");
  }
}

// TODO: make mutation and/or invalidate some queries
export async function resetPassword(email: string) {
  const result = sendPasswordResetEmail(auth, email);
  return result;
}

// TODO: investigate if this can be removed
export async function getClaimCodeInfo(claimCode) {
  const docRef = doc(db, UNCLAIMED_LIST_COLLECTION_NAME, claimCode);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return undefined;
  return docSnap.data();
}

// TODO: make mutation and/or invalidate some queries
// TODO: standardize userData
export async function createUser(userData) {
  const email = userData.username + FAKE_EMAIL_EXTENSION;
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    userData.password
  );
  const user = userCredential.user;

  return user;
}

export function randomString(length: number) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var result = "";
  for (var i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}
