import React, { useState } from 'react';

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css'; // need this for the react-bootstrap package

import Login, { PasswordReset, Signup } from "./Pages/Login";
import Dashboard from './Pages/Dashboard';
import Admin from './Pages/Admin';
import OmniAdmin from './Pages/OmniAdmin';


function App() {
	const [currPage, setCurrPage] = useState(pageListEnum.Login);

	switch (currPage) {
		case pageListEnum.Login:
			return <Login setCurrPage={setCurrPage} />;
		case pageListEnum.Signup:
			return <Signup setCurrPage={setCurrPage} />
		case pageListEnum.Reset:
			return <PasswordReset setCurrPage={setCurrPage} />;
		case pageListEnum.Dashboard:
			return <Dashboard setCurrPage={setCurrPage} />;
		case pageListEnum.Admin:
			return <Admin setCurrPage={setCurrPage} />;
		case pageListEnum.OmniAdmin:
			return <OmniAdmin setCurrPage={setCurrPage} />;
		case pageListEnum.Test:

		default:
			return <Login setCurrPage={setCurrPage} />;
	}
}

export const pageListEnum = {
	Login:"login",
	Signup: "signup",
	Dashboard:"dashboard",
	Admin:"admin",
	OmniAdmin:"omniAdmin",
	Reset:"reset"
}

// signInWithEmailAndPassword(auth, email, password)
//   .then((userCredential) => {
//     // Signed in 
//     const user = userCredential.user;
//     // ...
//   })
//   .catch((error) => {
//     const errorCode = error.code;
//     const errorMessage = error.message;
//   });

// onAuthStateChanged(auth, (user) => {
//   if (user) {
//     // User is signed in, see docs for a list of available properties
//     // https://firebase.google.com/docs/reference/js/auth.user
//     const uid = user.uid;
//     // ...
//   } else {
//     // User is signed out
//     // ...
//   }
// });


export default App;
