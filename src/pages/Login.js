// Login.js
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";

import { auth, resetPassword } from "../utils/firebase";
import "./Login.css";
import ClickBlocker from "../components/ClickBlocker";
import { pageListEnum } from "../App";
import { createUser } from "../utils/firebaseQueries.ts";

function Login(props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [blocked, setBlocked] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    // block sign in while waiting
    setBlocked(true);
    // disable login butto
    attemptSignIn();
  };

  const attemptSignIn = async () => {
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        // Signed in
        // Should trigger a listener implemented in App.js
      })
      .catch((error) => {
        // const errorCode = error.code;
        const errorMessage = error.message;
        alert("Failed to sign in: " + errorMessage);
        setBlocked(false);
      });
  };

  return (
    <div className="login-container">
      <ClickBlocker block={blocked} loading={true} />
      <div className="login-form">
        <h1 className="login-title">
          {/* <img src={logo} className="login-logo" alt="logo" />
					<span className='title'>ayfly</span> Login */}
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
          <button type="submit" className="login-button" disabled={blocked}>
            Sign In
          </button>
          <p className="signup-p">
            <span
              onClick={() => {
                props.setCurrPage(pageListEnum.Forgot);
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

export function ForgotPassword(props) {
  const [email, setEmail] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleReset = (e) => {
    e.preventDefault();
    setBlocked(true);

    resetPassword(email)
      .then(() => {
        setCompleted(true);
        setBlocked(false);
      })
      .catch((e) => {
        alert("Failed to reset password: " + e.message);
        setBlocked(false);
      });
  };

  if (completed) {
    return (
      <div className="login-container return-to-login">
        <div className="login-form">
          <h1 className="login-title">
            <span className="title">Mayfly</span>
            <br /> Reset Complete!
          </h1>
          <button
            type="submit"
            className="login-button"
            disabled={blocked}
            onClick={() => props.setCurrPage(pageListEnum.Login)}
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="login-container">
      <ClickBlocker block={blocked} loading={true} />
      <div className="login-form">
        <h1 className="login-title">
          {/* <img src={logo} className="login-logo" alt="logo" />
					<span className='title'>ayfly</span> Login */}
          <span className="title">Mayfly</span> <br /> Account Recovery
        </h1>
        <form onSubmit={handleReset}>
          <input
            type="username"
            className="login-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" className="login-button" disabled={blocked}>
            Send Reset Email
          </button>
          <p className="signup-p">
            Remembered?&nbsp;
            <span
              onClick={() => {
                props.setCurrPage(pageListEnum.Login);
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

export function Signup(props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [blocked, setBlocked] = useState(false);
  const createNewUser = (e) => {
    e.preventDefault();
    setBlocked(true);

    const empData = {
      username: email,
      password: password,
    };
    createUser(empData)
      .then(() => {
        setBlocked(false);
        props.setCurrPage(pageListEnum.Dashboard);
      })
      .catch((e) => {
        alert("Failed to create new user: " + e.message);
        setBlocked(false);
      });
  };

  return (
    <div className="login-container">
      <ClickBlocker block={blocked} loading={true} />
      <div className="login-form">
        <h1 className="login-title">
          {/* <img src={logo} className="login-logo" alt="logo" />
					<span className='title'>ayfly</span> Login */}
          Sign Up for <span className="title">Mayfly</span>
        </h1>
        <form onSubmit={createNewUser}>
          <input
            type="username"
            className="login-input"
            placeholder="Username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="login-input"
            placeholder="Create Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            className="login-input"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button type="submit" className="login-button" disabled={blocked}>
            Sign Up
          </button>
          <p className="signup-p">
            Already have an account?&nbsp;
            <span
              onClick={() => {
                props.setCurrPage(pageListEnum.Login);
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
