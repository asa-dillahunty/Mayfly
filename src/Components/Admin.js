// Dashboard.js
import React from 'react';
import { auth, deleteCache, makeAdmin } from './firebase';
import { useNavigate } from 'react-router-dom';
// import { format } from 'date-fns';
// import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import './Dashboard.css';

function Dashboard() {
	const navigate = useNavigate();

	const handleLogout = async () => {
		try {
			deleteCache();
			await auth.signOut();
			navigate('/Primer');
		} catch (error) {
			console.error('Error signing out:', error.message);
		}
	};

	return (
		<div className="dashboard-container">
		<div className="dashboard-header">
			<h1>Dashboard</h1>
				<button className="dashboard-logout" onClick={handleLogout}>
					Log Out
				</button>
			</div>
			<div className="dashboard-content">
                {/* list of current users 
                    - contains option to delete
                    - some kind of display of hours worked recently
                    - option to add new users */}
				<p>Admin Dashboard!</p>
                <button onClick={() => {makeAdmin( auth.currentUser.uid )}}>Make Me Admin</button>
			</div>
		</div>
	);
}

export default Dashboard;
