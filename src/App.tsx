import { lazy, Suspense, useEffect, useState } from "react";

import "./App.scss";
import { auth } from "./utils/firebase/firebaseAuth.ts";
import { onAuthStateChanged } from "firebase/auth";
import { LoadingDialog } from "./components/LoadingDialog.tsx";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useSetAtom } from "jotai";
import { UID } from "./utils/atoms.tsx";
import { pageRoutes } from "./pageRoutes.ts";

const Login = lazy(() => import("./pages/auth/Login.tsx"));
const PasswordReset = lazy(() => import("./pages/auth/PasswordReset.tsx"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword.tsx"));
const Signup = lazy(() => import("./pages/auth/Signup.tsx"));
const Lost = lazy(() => import("./pages/Lost.tsx"));
const DashboardRoot = lazy(
  () => import("./pages/dashboard/DashboardRoot.tsx"),
);

interface ActionCodeRoute {
  mode: "resetPassword" | "signUp";
  path: string;
  token: string;
}

function getActionCodeRoute(): ActionCodeRoute | null {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("oobCode");
  const mode = urlParams.get("mode");

  if (!token) return null;
  if (mode === "resetPassword") {
    return {
      mode,
      path: pageRoutes.passwordReset.path,
      token,
    };
  }
  if (mode === "signUp") {
    return {
      mode,
      path: pageRoutes.signup.path,
      token,
    };
  }
  return null;
}

function App() {
  const [actionCodeRoute] = useState(getActionCodeRoute);
  const [loading, setLoading] = useState(actionCodeRoute === null);
  const setUID = useSetAtom(UID);
  const navigate = useNavigate();

  useEffect(() => {
    if (actionCodeRoute) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // in case user is logging out
      setLoading(false);

      if (user) {
        setUID(user.uid);
        navigate(pageRoutes.dashboard.path);
      }
    });

    return () => unsubscribe();
  }, [actionCodeRoute, navigate, setUID]);

  if (loading) return <LoadingDialog message="Loading..." />;
  if (
    actionCodeRoute &&
    window.location.pathname !== actionCodeRoute.path
  ) {
    return <Navigate replace to={actionCodeRoute.path} />;
  }

  return (
    <main>
      <Suspense fallback={<LoadingDialog message="Loading..." />}>
        <Routes>
          <Route path={pageRoutes.login.path} element={<Login />} />
          <Route
            path={pageRoutes.dashboard.path}
            element={<DashboardRoot />}
          />
          <Route path={pageRoutes.forgot.path} element={<ForgotPassword />} />
          <Route
            path={pageRoutes.passwordReset.path}
            element={
              <PasswordReset
                reset={actionCodeRoute?.mode === "resetPassword"}
                token={actionCodeRoute?.token ?? ""}
              />
            }
          />
          <Route path={pageRoutes.signup.path} element={<Signup />} />
          <Route path={pageRoutes.lost.path} element={<Lost />} />
        </Routes>
      </Suspense>
    </main>
  );
}

// signInWithEmailAndPassword(auth, email, password)
//   .then((userCredential) => {
//     // Signed in
//     const user = userCredential.user;
//     // ...
//   })
//   .catch((error) => {
//     const errorCode = error.code;
//     const errorMessage = error.message;
//   });

// onAuthStateChanged(auth, (user) => {
//   if (user) {
//     // User is signed in, see docs for a list of available properties
//     // https://firebase.google.com/docs/reference/js/auth.user
//     const uid = user.uid;
//     // ...
//   } else {
//     // User is signed out
//     // ...
//   }
// });

export default App;
