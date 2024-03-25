// Dashboard.js
import React, { useEffect, useState } from 'react';
import { auth, deleteCache, getMyCompanyID, performLogout, setMyCompany, getClaimCodeInfo, createCompanyEmployee, deleteUnclaimedEmployee, getCompanyEmployee } from './firebase';
// import { format } from 'date-fns';
// import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import './Dashboard.css';
import HourAdder from './HourAdder';
import ClickBlocker from './ClickBlocker';

const claimedStateEnum = {
	loading:1,
	claimed:2,
	unclaimed:3
}

function Dashboard(props) {
	const [blocked, setBlocked] = useState(false);
	const [claimedState, setClaimedState] = useState(claimedStateEnum.loading);

	const handleLogout = () => {
		setBlocked(true);
		performLogout(props.setCurrPage).then(() => {
			setBlocked(false);
		});
	};

	useEffect(() => {
		// trigger on load
		if (claimedState !== claimedStateEnum.loading) return; 
		getMyCompanyID(auth.currentUser.uid).then((companyID) => {
			if (companyID !== undefined) setClaimedState(claimedStateEnum.claimed);
			else setClaimedState(claimedStateEnum.unclaimed);
		});
	});

	const executeClaim = () => {
		const claimCode = document.getElementById("claimCode").value;
		getClaimCodeInfo(claimCode).then((data) => {
			const companyID = data.companyID;
			console.log(data);
			setMyCompany(auth.currentUser.uid, companyID).then(() => {
				getCompanyEmployee(companyID, claimCode).then((empData) => {
					delete empData.unclaimed;
					createCompanyEmployee(empData, auth.currentUser.uid, companyID).then(() => {
						deleteUnclaimedEmployee(claimCode, companyID).then(() => {
							setClaimedState(claimedStateEnum.claimed);
						});
					});
				});
			});
		});
	}

	// if loading -> return a skeleton dashboard
	// if claimed -> return the normal dashboard
	// if unclaimed -> show them the the "enter code" screen
	if (claimedState === claimedStateEnum.claimed) {
		return (
			<div className="dashboard-container">
				<ClickBlocker block={blocked} />
				<div className="dashboard-header">
					<h1>Mayfly</h1>
					<button className="dashboard-logout" onClick={handleLogout} disabled={blocked}>
						Log Out
					</button>
				</div>
				<HourAdder uid={auth.currentUser.uid} blocked={blocked} setBlocked={setBlocked} />
			</div>
		);
	}
	else if (claimedState === claimedStateEnum.unclaimed) {
		return (
			<div className="dashboard-container">
				<ClickBlocker block={blocked} />
				<div className="dashboard-header">
					<h1>Mayfly</h1>
					<button className="dashboard-logout" onClick={handleLogout} disabled={blocked}>
						Log Out
					</button>
				</div>
				<p>Hello you are not part of any company right now : enter a code to join a company "HYPGBMWA"</p>
				<label>Input your code</label>
				<input id="claimCode" type='text'></input>
				<button onClick={executeClaim}>click me</button>
			</div>
		);
	}
}

export default Dashboard;
