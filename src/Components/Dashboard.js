// Dashboard.js
import React, { useEffect, useState } from 'react';
import { auth } from './firebase';
import { useNavigate } from 'react-router-dom';

import { format } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { setHours } from './firebase';

function Dashboard() {
  const [selectedDate, setSelectedDate] = useState('');
  const [hoursWorked, setHoursWorked] = useState('');

  const navigate = useNavigate()  

  const handleLogout = async () => {
    try {
      await auth.signOut();
      console.log("Current User: ", auth.currentUser);
      navigate('/');
      // Navigate the user to the login page or any other appropriate action
    } catch (error) {
      console.error('Error signing out:', error.message);
    }
  };

  const handleAddHours = async (e) => {
    e.preventDefault();
    try {
      // Save the hours worked data to your Firebase Firestore
      // Use selectedDate and hoursWorked in this function
      // Example: await firebase.firestore().collection('hours').add({ date: selectedDate, hours: hoursWorked });
      console.log(auth.currentUser.uid,selectedDate,hoursWorked);
      await setHours(auth.currentUser.uid,selectedDate,hoursWorked);
      console.log('Hours data added successfully');
      setSelectedDate('');
      setHoursWorked('');
    } catch (error) {
      console.error('Error adding hours data:', error.message);
    }
  };

  useEffect(() => {
    if (!auth.currentUser) navigate('/');
  });

  let footer = <p>select bitch</p>
  return (
    <div>
      <h1>Dashboard</h1>
      <button onClick={handleLogout}>Log Out</button>
      <form onSubmit={handleAddHours}>
        <label>
          Select Date:
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            footer={footer}
          />
        </label>
        <label>
          Hours Worked:
          <input
            type="number"
            value={hoursWorked}
            onChange={(e) => setHoursWorked(e.target.value)}
          />
        </label>
        <button type="submit">Add Hours</button>
      </form>
    </div>
  );
}

export default Dashboard;
