import React, { useEffect, useState } from 'react';

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css'; // need this for the react-bootstrap package

import Login, { PasswordReset, Signup } from "./Pages/Login";
import Dashboard from './Pages/Dashboard';
import Admin from './Pages/Admin';
import OmniAdmin from './Pages/OmniAdmin';
import { auth, getIsAdmin, getIsOmniAdmin, navigateUser } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import ClickBlocker from './Components/ClickBlocker';


function App() {
	const [currPage, setCurrPage] = useState(pageListEnum.Login);
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);


	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, user => {
			setUser(user);
			// in case user is logging out
			if (auth.currentUser)
				navigateUser(auth.currentUser.uid, setCurrPage).then(()=>{
					setLoading(false);
				});
		});
	
		return () => unsubscribe();
	}, [auth]);

	if (loading) return <ClickBlocker loading block/>
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

function LoadingPage() {
	return (
		<div className='loading-page'>
			<ClickBlocker loading block/>
		</div>
	);

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
