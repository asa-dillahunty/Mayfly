// Login.js
import React, { useEffect, useState } from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from 'react-router-dom';


import { auth } from './firebase';
import './Login.css';
import logo from '../PrimerIcon.png';

function Login() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	const handleSignIn = async (e) => {
		e.preventDefault();
		// Todo:
		// 	- block sign in while waiting
			signInWithEmailAndPassword(auth, email + "@dillahuntyfarms.com", password)
				.then((userCredential) => {
					// Signed in
					const user = userCredential.user;
					console.log(user);
					navigate('/Primer/Dashboard');
				})
				.catch((error) => {
					// const errorCode = error.code;
					const errorMessage = error.message;
					alert("Failed to sign in: " + errorMessage);
				});
		
	};

	const navigate = useNavigate();
	useEffect(() => {
		if (auth.currentUser) navigate('/Primer/Dashboard');
	});

	return (
		<div className="login-container">
			<div className="login-form">
				<h1 className="login-title"> 
					<img src={logo} className="login-logo" alt="logo" />
					rimer Login
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
					<button type="submit" className="login-button">
						Sign In
					</button>
				</form>
			</div>
		</div>
	);
}

export default Login;
