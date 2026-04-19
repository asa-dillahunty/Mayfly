import { useNavigate } from "react-router-dom";
import ClickBlocker from "../../components/ClickBlocker";
import { resetPassword } from "../../utils/firebase";
import { useState } from "react";
import { pageRoutes } from "../../App";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [completed, setCompleted] = useState(false);
  const navigate = useNavigate();

  const handleReset = (e: React.SubmitEvent) => {
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
            onClick={() => navigate(pageRoutes.login.path)}
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
                navigate(pageRoutes.login.path);
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
