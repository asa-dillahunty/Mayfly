// Login.js
import React, { useEffect, useState } from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";


import { auth, getIsAdmin, FAKE_EMAIL_EXTENSION, createUser } from './firebase';
import './Login.css';
import logo from '../MayflyLogo.png';
import ClickBlocker from './ClickBlocker';
import { pageListEnum } from '../App';

function Login(props) {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [blocked, setBlocked] = useState(false);
	const [signup, setSignup]  = useState(false);

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
			signInWithEmailAndPassword(auth, email + FAKE_EMAIL_EXTENSION, password)
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
			<ClickBlocker block={signup} custom={true}>
				<SignUp setCurrPage={props.setCurrPage} cancelFunc={()=>setSignup(false)}/>
			</ClickBlocker>
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
					<p className='signup-p'>Don't have an account?&nbsp;
						<span onClick={()=>{setSignup(true)}}>Sign up!</span>
					</p>
				</form>
			</div>
		</div>
	);
}

export default Login;


function SignUp (props) {
	const [blocked,setBlocked] = useState(false);
	const createNewUser = () => {
		const empName = document.getElementById("user-name").value;
		const empUsername = document.getElementById("user-username").value;
		const empPassword = document.getElementById("user-password").value;

		const empData = {
			name:empName,
			username:empUsername,
			password:empPassword
		}
		console.log(empData);
		createUser(empData)
			.then( () => {
				setBlocked(false);
				props.setCurrPage(pageListEnum.Dashboard);
			});
	}

	return (
		<div className="signup-container">
			<ClickBlocker block={blocked} loading={true} />
			<div className='add-user-form'>
				<div className='input-container'>
					<label htmlFor="user-name">Name:</label>
					<input id='user-name' name="user-name" type='text'></input>
				</div>
				<div className='input-container'>
					<label htmlFor="user-username">Username:</label>
					<input id='user-username' name="user-username" type='text'></input>
				</div>
				<div className='input-container'>
					<label htmlFor="user-password">Password:</label>
					<input id='user-password' name="user-password" type='text'></input>
				</div>
				<div className='button-container'>
					<button className='submit-button' onClick={createNewUser}>Submit</button>
					<button className='cancel-button' onClick={props.cancelFunc}>Cancel</button>
				</div>
			</div>
		</div>
	);
}