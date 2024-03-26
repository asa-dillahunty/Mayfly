import React, { useState } from 'react';

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css'; // need this for the react-bootstrap package

import Login, { SignUp } from "./Components/Login";
import Dashboard from './Components/Dashboard';
import Admin from './Components/Admin';
import OmniAdmin from './Components/OmniAdmin';
import Lost from './Components/Lost';
import Test from './Components/Test'


function App() {
	const [currPage, setCurrPage] = useState(pageListEnum.Login);

	switch (currPage) {
		case pageListEnum.Login:
			return <Login setCurrPage={setCurrPage} />;
		case pageListEnum.SignUp:
			return <SignUp setCurrPage={setCurrPage} />;
		case pageListEnum.Dashboard:
			return <Dashboard setCurrPage={setCurrPage} />;
		case pageListEnum.Admin:
			return <Admin setCurrPage={setCurrPage} />;
		case pageListEnum.OmniAdmin:
			return <OmniAdmin setCurrPage={setCurrPage} />;
		case pageListEnum.Test:
			return <Test setCurrPage={setCurrPage} />;
		case pageListEnum.Lost:
			return <Lost setCurrPage={setCurrPage} />;

		default:
			return <Login setCurrPage={setCurrPage} />;
	}
}

export const pageListEnum = {
	Login:"login",
	SignUp:"signup",
	Dashboard:"dashboard",
	Admin:"admin",
	OmniAdmin:"omniAdmin",
	Lost:"lost",
	Test:"test",
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
