import { getFunctions, httpsCallable } from "firebase/functions";

import { firebaseApp } from "./firebaseApp";

interface CreateEmployeeRequest {
  companyID: string;
  email: string;
  isAdmin?: boolean;
  name: string;
}

interface CreateEmployeeResponse {
  empID: string;
  success: boolean;
}

interface RemoveEmployeeCompanyRequest {
  uid: string;
}

interface CallableSuccessResponse {
  success: boolean;
}

interface TransferEmployeeDataRequest {
  newCollectionPath: string;
  oldCollectionPath: string;
}

const functions = getFunctions(firebaseApp);

export const createEmp = httpsCallable<
  CreateEmployeeRequest,
  CreateEmployeeResponse
>(functions, "createEmployee");

export const deleteEmpCompany = httpsCallable<
  RemoveEmployeeCompanyRequest,
  CallableSuccessResponse
>(functions, "removeEmployeeCompany");

export const transferEmployeeData = httpsCallable<
  TransferEmployeeDataRequest,
  CallableSuccessResponse
>(functions, "transferEmployeeData");
