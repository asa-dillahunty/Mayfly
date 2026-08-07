import { useState, type SubmitEvent } from "react";
import { LoadingDialog } from "../../components/LoadingDialog.tsx";
import { auth } from "../../utils/firebase/firebaseAuth.ts";

import "./PasswordReset.css";
import styles from "./sass/Login.module.scss";

import {
  confirmPasswordReset,
  signInWithEmailLink,
  updatePassword,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { pageRoutes } from "../../pageRoutes.ts";

interface PasswordResetProps {
  reset: boolean;
  token: string;
}

export default function PasswordReset({ reset, token }: PasswordResetProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [blocked, setBlocked] = useState(false);
  const navigate = useNavigate();

  const [errorMessage, setErrorMessage] = useState("");

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      );
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBlocked(true);

    try {
      if (!reset && !validateEmail(email)) {
        throw new Error("Please enter a valid email address");
      }

      // not going to bully people on passwords too hard
      if (password !== confirmPassword) {
        throw new Error("Passwords don't match");
      } else if (password.length < 3) {
        throw new Error("Passwords must contain at least 3 characters");
      }

      if (reset) {
        await confirmPasswordReset(auth, token, password);
        setErrorMessage("");
        // we cannot sign the user in here because we do not have their email

        // wait a second so the user can see it was a success then move to login
        setTimeout(function () {
          setBlocked(false);
          // replace state to get rid of url parameters
          // we do that because I am afraid of users bookmarking a page with
          //	and indefinitely being directed to the wrong page
          window.history.replaceState(null, "", window.location.pathname);
          navigate(pageRoutes.login.path);
        }, 1000);
      } else {
        await signInWithEmailLink(auth, email, window.location.href);
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error("Unable to sign in with this email link.");
        }
        await updatePassword(currentUser, password);
        setBlocked(false);

        // replace state to get rid of url parameters
        // we do that because I am afraid of users bookmarking a page with
        //	and indefinitely being directed to the wrong page
        window.history.replaceState(null, "", window.location.pathname);
        navigate(pageRoutes.dashboard.path);
      }
    } catch (error) {
      // Display error message
      setErrorMessage(
        error instanceof Error ? error.message : "There has been an error.",
      );
      setBlocked(false);
    }
  };

  // TODO: Replace Toast with something better. Consider removing it since the page changes immediately on success
  return (
    <div className={styles.loginContainer}>
      {blocked && (
        <LoadingDialog
          message={
            reset ? "Resetting your password..." : "Setting your password..."
          }
        />
      )}
      {/* <Toast
        onClose={() => setShowToast(false)}
        show={showToast}
        delay={2000}
        autohide
      >
        <Toast.Body>Password set successfully!</Toast.Body>
      </Toast> */}
      <div className={styles.loginForm}>
        <h1 className={styles.loginTitle}>
          {/* <img src={logo} className="login-logo" alt="logo" />
					<span className='title'>ayfly</span> Login */}
          <span className={styles.title}>Mayfly</span> <br />
          {reset ? "Password Reset" : "Password Creation"}
        </h1>
        {errorMessage && (
          <div className={styles.errorMessage}>*{errorMessage}</div>
        )}
        <form onSubmit={handleSubmit}>
          {reset ? (
            <></>
          ) : (
            <input
              type="email"
              className={styles.loginInput}
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
          <input
            type="password"
            className={styles.loginInput}
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            className={styles.loginInput}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button
            type="submit"
            className={styles.loginButton}
            disabled={blocked}
          >
            {reset ? "Reset Password" : "Set Password"}
          </button>
          <p className={styles.forgotLink}>
            Already done this?&nbsp;
            <span
              onClick={() => {
                navigate(pageRoutes.login.path, { replace: true });
              }}
            >
              Login
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}
