// Login.js
import React, { useEffect, useState } from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";


import { auth, getIsAdmin } from './firebase';
import './Login.css';
import logo from '../PrimerIcon.png';
import ClickBlocker from './ClickBlocker';
import { pageListEnum } from '../App';

function Login(props) {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [blocked, setBlocked] = useState(false);

	const handleSignIn = async (e) => {
		e.preventDefault();
		// block sign in while waiting
		setBlocked(true);
		// disable login butto
		attemptSignIn();
	}

	const attemptSignIn = async () => {
		// Todo:
		// 	- check if admin 
			signInWithEmailAndPassword(auth, email + "@dillahuntyfarms.com", password)
				.then((userCredential) => {
					// Signed in
					// const user = userCredential.user;
					// console.log("User Data:");
					// console.log(user);
					// console.log("User Data Over:");
					navigateUser().then(() =>
						setBlocked(false)
					);
				})
				.catch((error) => {
					// const errorCode = error.code;
					const errorMessage = error.message;
					alert("Failed to sign in: " + errorMessage);
					setBlocked(false);
				});
		
	};

	useEffect(() => {
		if (auth.currentUser) navigateUser();
	});

	const navigateUser = async () => {
		const isAdmin = await getIsAdmin(auth.currentUser.uid)
		// if 'Asa' -> navigate to OmniAdmin Dashboard
		// props.setCurrPage(pageListEnum.OmniAdmin);
		// if admin -> navigate to admin dashboard
		if (isAdmin === true) props.setCurrPage(pageListEnum.Admin);
		else props.setCurrPage(pageListEnum.Dashboard);
		// could this result in a component attempting to be updated when it is unmounted?
	}

	return (
		<div className="login-container">
			<ClickBlocker block={blocked} loading={true} />
			<div className="login-form">
				<h1 className="login-title"> 
					{/* <img src={logo} className="login-logo" alt="logo" />
					rimer Login */}
					<span onClick={()=>props.setCurrPage(pageListEnum.Test)}>Mayfly</span> Login
				</h1>
				<form onSubmit={handleSignIn}>
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
						placeholder="Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
					<button type="submit" className="login-button" disabled={blocked}>
						Sign In
					</button>
				</form>
			</div>
		</div>
	);
}

export default Login;
