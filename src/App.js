import React, { useEffect, useState } from "react";

import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css"; // need this for the react-bootstrap package

import Login, { ForgotPassword, Signup } from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin.tsx";
import OmniAdmin from "./pages/OmniAdmin";
import { auth, navigateUser } from "./utils/firebase";
import { onAuthStateChanged } from "firebase/auth";
import ClickBlocker from "./components/ClickBlocker";
import PasswordReset from "./pages/PasswordReset";

function App() {
  const [currPage, setCurrPage] = useState(pageListEnum.Login);
  const [loading, setLoading] = useState(true);
  const [resetToken, setResetToken] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("oobCode");
    const mode = urlParams.get("mode");
    if (token && mode === "resetPassword") {
      setLoading(false);
      setResetToken(token);
      setCurrPage(pageListEnum.Reset);
      return;
    } else if (token && mode === "signIn") {
      setLoading(false);
      setResetToken(token);
      setCurrPage(pageListEnum.SignInToken);
    }
    const unsubscribe = onAuthStateChanged(auth, (_user) => {
      // in case user is logging out
      if (auth.currentUser) {
        navigateUser(auth.currentUser.uid, setCurrPage)
          .then(() => {
            setLoading(false);
          })
          .catch((_e) => {
            alert(`Error code 4573. Please refresh the page`);
          });
      } else {
        // setCurrPage(pageListEnum.Login);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <ClickBlocker loading block />;
  switch (currPage) {
    case pageListEnum.Login:
      return <Login setCurrPage={setCurrPage} />;
    case pageListEnum.Signup:
      return <Signup setCurrPage={setCurrPage} />;
    case pageListEnum.Forgot:
      return <ForgotPassword setCurrPage={setCurrPage} />;
    case pageListEnum.Reset:
      return (
        <PasswordReset setCurrPage={setCurrPage} token={resetToken} reset />
      );
    case pageListEnum.SignInToken:
      return (
        <PasswordReset
          setCurrPage={setCurrPage}
          token={resetToken}
          reset={false}
        />
      );
    case pageListEnum.Dashboard:
      return <Dashboard setCurrPage={setCurrPage} />;
    case pageListEnum.Admin:
      return <Admin setCurrPage={setCurrPage} />;
    case pageListEnum.OmniAdmin:
      return <OmniAdmin setCurrPage={setCurrPage} />;

    default:
      return <Login setCurrPage={setCurrPage} />;
  }
}

export const pageListEnum = {
  Login: "login",
  Signup: "signup",
  Dashboard: "dashboard",
  Admin: "admin",
  OmniAdmin: "omniAdmin",
  Reset: "reset",
  SignInToken: "signInToken",
  Forgot: "forgot",
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
