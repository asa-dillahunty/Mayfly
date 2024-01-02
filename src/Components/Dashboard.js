// Dashboard.js
import React, { useState } from 'react';
import { auth, getHours, setHours, deleteCache } from './firebase';
import { useNavigate } from 'react-router-dom';
// import { format } from 'date-fns';
// import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import './Dashboard.css';
import Calendar from './Calendar';
import { WEEK_VIEW, MONTH_VIEW } from './Calendar';
import HourAdder from './HourAdder';
import { hoursWorked, selectedDate, setSelectedDate } from './firebase';

function Dashboard() {
	const navigate = useNavigate();
	const [calendarView, setCalendarView] = useState( WEEK_VIEW );

	// Todo: this functionality should be moved to the calendar component
	const toggleView = () => {
		if (calendarView === WEEK_VIEW) setCalendarView(MONTH_VIEW);
		else setCalendarView(WEEK_VIEW);
	}

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
			await setHours(auth.currentUser.uid, selectedDate.value, hoursWorked.value);
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

	// useEffect(() => {
	// 	if (!auth.currentUser) navigate('/Primer');
	// 	handleDateChange(selectedDate);
	// }, [selectedDate,navigate]);

	return (
		<div className="dashboard-container">
		<div className="dashboard-header">
			<h1>Dashboard</h1>
				<button className="dashboard-logout" onClick={handleLogout}>
					Log Out
				</button>
			</div>
			<div className="dashboard-content">
				<button onClick={toggleView}>{ calendarView === WEEK_VIEW ? "Month View" : "Week View" } </button>
				<div className='form'>
					<label className="date-picker-label">
						<Calendar view={calendarView} onDayClick={handleDateChange} startSelected={true}/>
					</label>
					<HourAdder handleAddHours={handleAddHours}/>
				</div>
			</div>
		</div>
	);
}

export default Dashboard;
