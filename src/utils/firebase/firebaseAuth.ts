import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { useNavigate, type NavigateFunction } from "react-router-dom";

import { pageRoutes } from "../../pageRoutes";
import { firebaseApp } from "./firebaseApp";

export const auth = getAuth(firebaseApp);

export function getCurrentUserId() {
  return auth.currentUser?.uid ?? "";
}

export async function performLogout(navigate: NavigateFunction) {
  try {
    await auth.signOut();
    navigate(pageRoutes.login.path);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error signing out:", error.message);
    }
  }
}

export function usePerformLogout() {
  const navigate = useNavigate();

  return async () => {
    await performLogout(navigate);
  };
}

export function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email);
}
