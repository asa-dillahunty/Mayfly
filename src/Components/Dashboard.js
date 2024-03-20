// Dashboard.js
import React, { useState } from 'react';
import { auth, deleteCache,  } from './firebase';
import { useNavigate } from 'react-router-dom';
// import { format } from 'date-fns';
// import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import './Dashboard.css';
import HourAdder from './HourAdder';
import ClickBlocker from './ClickBlocker';

function Dashboard() {
	const navigate = useNavigate();
	const [blocked, setBlocked] = useState(false);

	const handleLogout = async () => {
		setBlocked(true);
		try {
			deleteCache();
			await auth.signOut();
			navigate('/Primer');
			// could this also result in a component attempting to update after it is unmounted?
			setBlocked(false);
		} catch (error) {
			console.error('Error signing out:', error.message);
			setBlocked(false);
		}
	};

	return (
		<div className="dashboard-container">
			<ClickBlocker block={blocked} />
			<div className="dashboard-header">
				<h1>Dashboard</h1>
				<button className="dashboard-logout" onClick={handleLogout} disabled={blocked}>
					Log Out
				</button>
			</div>
			<HourAdder uid={auth.currentUser.uid} blocked={blocked} setBlocked={setBlocked} />
		</div>
	);
}

export default Dashboard;
