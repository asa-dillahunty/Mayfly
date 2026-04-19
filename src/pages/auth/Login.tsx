import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";

import { auth } from "../../utils/firebase.ts";
import ClickBlocker from "../../components/ClickBlocker.tsx";
import { useNavigate } from "react-router-dom";
import { pageRoutes } from "../../App.tsx";

import "./Login.css";
import styles from "./sass/Login.module.scss";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [blocked, setBlocked] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async (e: React.SubmitEvent) => {
    e.preventDefault();
    // block sign in while waiting
    setBlocked(true);
    // disable login button
    attemptSignIn();
  };

  const attemptSignIn = async () => {
    try {
      const response = await signInWithEmailAndPassword(auth, email, password);
      // TODO: consider hashing password before sending it in
      // Signed in
      // Should trigger a listener implemented in App.js
      console.log(response);
    } catch (error) {
      if (error instanceof Error) {
        // const errorCode = error.code;
        const errorMessage = error.message;
        alert("Failed to sign in: " + errorMessage);
        // TODO: consider making this a toast
      }
      setBlocked(false);
    }
  };

  return (
    <div className="login-container">
      <ClickBlocker block={blocked} loading={true} />
      <div className="login-form">
        <h1 className="login-title">
          <span className="title">Mayfly</span> Login
        </h1>
        <form onSubmit={handleSignIn}>
          <input
            type="username"
            className="login-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="login-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className={styles["login-button"]}
            disabled={blocked}
          >
            Sign In
          </button>
          <p className="signup-p">
            <span
              onClick={() => {
                navigate(pageRoutes.forgot.path);
              }}
            >
              Forgot your password?
            </span>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
