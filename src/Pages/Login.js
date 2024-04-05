// Login.js
import React, { useEffect, useState } from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";


import { auth, getIsAdmin, createUser, resetPassword } from '../lib/firebase';
import './Login.css';
import logo from '../MayflyLogo.png';
import ClickBlocker from '../Components/ClickBlocker';
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
			signInWithEmailAndPassword(auth, email, password)
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
					<span className='title'>ayfly</span> Login */}
					<span className='title'>Mayfly</span> Login
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
					<p className='signup-p'>
						<span onClick={()=>{props.setCurrPage(pageListEnum.Reset)}}>Forgot your password?</span>
					</p>
				</form>
			</div>
		</div>
	);
}

export default Login;

export function PasswordReset (props) {
	const [email, setEmail] = useState('');
	const [blocked, setBlocked] = useState(false);

	const handleReset = (e) => {
		e.preventDefault();
		setBlocked(true);

		resetPassword(email)
			.then( () => {
				setBlocked(false);
				props.setCurrPage(pageListEnum.Login);
			});
	}

	return (
		<div className="login-container">
			<ClickBlocker block={blocked} loading={true} />
			<div className="login-form">
				<h1 className="login-title"> 
					{/* <img src={logo} className="login-logo" alt="logo" />
					<span className='title'>ayfly</span> Login */}
					<span className='title'>Mayfly</span> <br /> Account Recovery
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
					<p className='signup-p'>Remembered?&nbsp;
						<span onClick={()=>{props.setCurrPage(pageListEnum.Login)}}>Login</span>
					</p>
				</form>
			</div>
		</div>
	);
}

export function Signup (props) {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [blocked, setBlocked] = useState(false);
	const createNewUser = (e) => {
		e.preventDefault();
		setBlocked(true);

		const empData = {
			username:email,
			password:password
		}
		console.log(empData);
		createUser(empData)
			.then( () => {
				setBlocked(false);
				props.setCurrPage(pageListEnum.Dashboard);
			});
	}

	return (
		<div className="login-container">
			<ClickBlocker block={blocked} loading={true} />
			<div className="login-form">
				<h1 className="login-title"> 
					{/* <img src={logo} className="login-logo" alt="logo" />
					<span className='title'>ayfly</span> Login */}
					Sign Up for <span className='title'>Mayfly</span>
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
					<p className='signup-p'>Already have an account?&nbsp;
						<span onClick={()=>{props.setCurrPage(pageListEnum.Login)}}>Login</span>
					</p>
				</form>
			</div>
		</div>
	);
}