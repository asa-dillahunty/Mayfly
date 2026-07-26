import { useNavigate } from "react-router-dom";
import { pageRoutes } from "../../pageRoutes";
import { LoadingDialog } from "../../components/LoadingDialog";
import { createUser } from "../../utils/firebase/firebaseQueries";
import { useState } from "react";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [blocked, setBlocked] = useState(false);
  const navigate = useNavigate();

  const createNewUser = (e: React.SubmitEvent) => {
    e.preventDefault();
    setBlocked(true);

    const empData = {
      username: email,
      password: password,
    };
    createUser(empData)
      .then(() => {
        setBlocked(false);
        navigate(pageRoutes.dashboard.path);
      })
      .catch((e) => {
        alert("Failed to create new user: " + e.message);
        setBlocked(false);
      });
  };

  return (
    <div className="login-container">
      {blocked && <LoadingDialog message="Creating your account..." />}
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
