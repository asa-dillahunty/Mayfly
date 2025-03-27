import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import "firebase/auth";
import "firebase/functions";
import { getFunctions, httpsCallable } from "firebase/functions";
import { pageListEnum } from "../App";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDi4JBfJPfBUXutm38DqUrjg2s8Q8xi3ls",
  authDomain: "primer-53a41.firebaseapp.com",
  projectId: "primer-53a41",
  storageBucket: "primer-53a41.appspot.com",
  messagingSenderId: "785639513587",
  appId: "1:785639513587:web:8d6c676586571a19228686",
  measurementId: "G-J8SZNH25ZJ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);
export const createEmp = httpsCallable(functions, "createEmployee");
export const deleteEmpCompany = httpsCallable(
  functions,
  "removeEmployeeCompany"
);
export const transferEmployeeData = httpsCallable(
  functions,
  "transferEmployeeData"
);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const db = getFirestore(app);

export const performLogout = async (navigate) => {
  try {
    await auth.signOut();
    navigate(pageListEnum.Login);
  } catch (error) {
    console.error("Error signing out:", error.message);
  }
};

// TODO: this should invalidate some queries
export async function transferEmpData(oldID, newID) {
  const data = { oldCollectionPath: oldID, newCollectionPath: newID };
  const result = await transferEmployeeData(data);
  if (!result.data.success) {
    alert("Failed to remove emp company data");
  }
}

// ASK: should this be a mutation and/or invalidate some queries
export async function resetPassword(email) {
  const result = sendPasswordResetEmail(auth, email);
  return result;
}

export function randomString(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var result = "";
  for (var i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export default app;
