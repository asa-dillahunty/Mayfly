import { useState } from "react";
import { pageListEnum } from "../App";
import ClickBlocker from "../Components/ClickBlocker";
import { auth } from "../lib/firebase";
import Toast from 'react-bootstrap/Toast';

import './PasswordReset.css';
import { confirmPasswordReset } from "firebase/auth";

export default function PasswordReset (props) {
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [blocked, setBlocked] = useState(false);

	const [errorMessage, setErrorMessage] = useState('');
	const [showToast, setShowToast] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setBlocked(true);
		
		try {
			// not going to bully people on passwords too hard
			if (password !== confirmPassword) {
				throw new Error("Passwords don't match");
			}
			else if (password.length < 3) {
				throw new Error("Passwords must contain at least 3 characters");
			}

			await confirmPasswordReset(auth, props.token, password);
			setErrorMessage('');
			setShowToast(true);

			// wait a second so the user can see it was a success then move to login
			setTimeout(function() {
				setBlocked(false);
				// we do this instead of set curr page to get rid of url parameters
				// we do that because I am afraid of users bookmarking a page with
				//	and indefinitely being directed to the wrong page
				window.location.href = "./";
			}, 1000);

		} catch (error) {
			// Display error message
			setErrorMessage(error.message);
			setBlocked(false);
		}
	}

	return (
		<div className="login-container">
			<ClickBlocker block={blocked} loading={true} />
			<Toast onClose={() => setShowToast(false)} show={showToast} delay={2000} autohide >
				<Toast.Body>Password set successfully!</Toast.Body>
			</Toast>
			<div className="login-form">
				<h1 className="login-title"> 
					{/* <img src={logo} className="login-logo" alt="logo" />
					<span className='title'>ayfly</span> Login */}
					<span className='title'>Mayfly</span> <br /> Password Creation
				</h1>
				{errorMessage && <div className="error-message">*{errorMessage}</div>}
				<form onSubmit={handleSubmit}>
					<input
						type="password"
						className="login-input"
						placeholder="New Password"
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
						Reset Password
					</button>
					<p className='signup-p'>Already done this?&nbsp;
						<span onClick={()=>{props.setCurrPage(pageListEnum.Login)}}>Login</span>
					</p>
				</form>
			</div>
		</div>
	);
}