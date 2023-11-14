// Dashboard.js
import React, { useEffect, useState } from 'react';
import { auth, getHours, setHours, deleteCache } from './firebase';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import './Dashboard.css';
import Calendar from './Calendar';

function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [hoursWorked, setHoursWorked] = useState('');

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      deleteCache();
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error.message);
    }
  };

  const handleAddHours = async (e) => {
    e.preventDefault();
    try {
      await setHours(auth.currentUser.uid, selectedDate, hoursWorked);
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
      setHoursWorked(hours);
    }
  };

  const handlePresetClick = (presetHours) => {
    setHoursWorked(presetHours);
  };

  const getDate = () => {
    return format(selectedDate,'yyyy-MM-dd');
  }

  useEffect(() => {
    if (!auth.currentUser) navigate('/');
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
          <div className="hours-and-button-container">
            <div className="worked-hours">
              <p className="worked-hours-label">Hours Worked:</p>
              <p>{hoursWorked}</p>
            </div>
            <div className="hours-controls">
              <button
                className="hours-button"
                onClick={() => setHoursWorked(Number(hoursWorked) + 0.25)}
              >
                +
              </button>
              <button
                className="hours-button"
                onClick={() => setHoursWorked(Number(hoursWorked) - 0.25)}
              >
                -
              </button>
            </div>
          </div>
          <div className="presets">
            <button
              className="preset-button"
              onClick={() => handlePresetClick(4)}
            >
              4 hrs
            </button>
            <button
              className="preset-button"
              onClick={() => handlePresetClick(8)}
            >
              8 hrs
            </button>
            <button
              className="preset-button"
              onClick={() => handlePresetClick(12)}
            >
              12 hrs
            </button>
          </div>
          <button onClick={handleAddHours}>Add Hours</button>
        </div>
        
      </div>
    </div>
  );
}

export default Dashboard;
