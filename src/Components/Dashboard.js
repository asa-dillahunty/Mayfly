// Dashboard.js
import React, { useEffect, useState } from 'react';
import { auth, getHours, setHours, deleteCache } from './firebase';
import { useNavigate } from 'react-router-dom';
// import { format } from 'date-fns';
// import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import './Dashboard.css';
import Calendar from './Calendar';
import HourAdder from './HourAdder';
import { hoursWorked } from './firebase';

function Dashboard() {
	const [selectedDate, setSelectedDate] = useState(new Date());

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

	const handleAddHours = async (e) => {
		e.preventDefault();
		try {
			await setHours(auth.currentUser.uid, selectedDate, hoursWorked.value);
			console.log('Hours data added successfully');
		} catch (error) {
			console.error('Error adding hours data:', error.message);
		}
	};

	const handleDateChange = async (date) => {
		setSelectedDate(date);
		// const formattedDate = format(date, 'yyyy-MM-dd');
		if (auth.currentUser) {
			const hours = await getHours(auth.currentUser.uid, date);
			hoursWorked.value = hours;
		}
	};

	// const getDate = () => {
	//   return format(selectedDate,'yyyy-MM-dd');
	// }

	useEffect(() => {
		if (!auth.currentUser) navigate('/Primer');
		handleDateChange(selectedDate);
	}, [selectedDate,navigate]);

	return (
		<div className="dashboard-container">
		<div className="dashboard-header">
			<h1>Dashboard</h1>
				<button className="dashboard-logout" onClick={handleLogout}>
					Log Out
				</button>
			</div>
			<div className="dashboard-content">
				<div className='form'>
					<label className="date-picker-label">
						Select Date:
						<Calendar selectedDate={selectedDate} onDayClick={handleDateChange}/>
						{/* <DayPicker
						selected={selectedDate}
						onDayClick={handleDateChange}
						className="DayPicker"
						/> */}
					</label>
					<HourAdder handleAddHours={handleAddHours}/>
				</div>
			</div>
		</div>
	);
}

export default Dashboard;
