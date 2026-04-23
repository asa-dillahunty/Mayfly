import { useEffect, useState } from "react";

import "./App.scss";
import { auth } from "./utils/firebase.ts";
import { onAuthStateChanged } from "firebase/auth";
import ClickBlocker from "./components/ClickBlocker.tsx";
import Login from "./pages/auth/Login.tsx";
import PasswordReset from "./pages/auth/PasswordReset.tsx";
import Dashboard from "./pages/dashboard/Dashboard.tsx";
import { Route, Routes, useNavigate } from "react-router-dom";
import { useSetAtom } from "jotai";
import { ResetToken, UID } from "./utils/atoms.tsx";
import ForgotPassword from "./pages/auth/ForgotPassword.tsx";
import Signup from "./pages/auth/Signup.tsx";
import { DashboardRoot } from "./pages/dashboard/DashboardRoot.tsx";
import Lost from "./pages/Lost.tsx";

function App() {
  const [loading, setLoading] = useState(true);
  const setResetToken = useSetAtom(ResetToken);
  const setUID = useSetAtom(UID);
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("oobCode");
    const mode = urlParams.get("mode");

    if (token) {
      setLoading(false);
      setResetToken(token);
      if (mode === "resetPassword") navigate(pageRoutes.passwordReset.path);
      else if (mode === "signUp") navigate(pageRoutes.signup.path);
    }

    const unsubscribe = onAuthStateChanged(auth, (_user) => {
      // in case user is logging out
      setLoading(false);

      if (auth.currentUser) {
        setUID(auth.currentUser.uid);
        navigate(pageRoutes.dashboard.path);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <ClickBlocker loading block />;

  return (
    <main>
      <Routes>
        {Object.values(pageRoutes).map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}
      </Routes>
    </main>
  );
}

export const pageRoutes = {
  login: {
    path: "/",
    element: <Login />,
  },
  dashboard: {
    path: "/dashboard",
    element: <DashboardRoot />,
  },
  forgot: {
    path: "/forgot",
    element: <ForgotPassword />,
  },
  passwordReset: {
    path: "/password-reset",
    element: <PasswordReset />,
  },
  signup: {
    path: "/signup",
    element: <Signup />,
  },
  lost: {
    path: "/*",
    element: <Lost />,
  },
};

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
