import { hoursWorked, selectedDate, setSelectedDate, auth, getHours, setHours, } from './firebase';
import Picker from 'react-mobile-picker'
import { useState, useEffect } from "react";
import './HourAdder.css';
import { effect } from "@preact/signals-react";
import ClickBlocker from "./ClickBlocker";

import Calendar from './Calendar';
import { WEEK_VIEW, MONTH_VIEW } from './Calendar';

const selections = {
	hours: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24],
	minutes: [0,.25,.5,.75],
}

export function HourAdder (props) {
	const [calendarView, setCalendarView] = useState( WEEK_VIEW );
	
	// Todo: this functionality should be moved to the calendar component
	const outsidePayPeriod = false; // (buildDocName(selectedDate.value) === buildDocName(new Date()));
	const toggleView = () => {
		if (calendarView === WEEK_VIEW) setCalendarView(MONTH_VIEW);
		else setCalendarView(WEEK_VIEW);
	}

	const handleAddHours = async (e) => {
		e.preventDefault();
		props.setBlocked(true);
		try {
			await setHours(props.uid, selectedDate.value, hoursWorked.value);
			console.log('Hours data added successfully');
			props.setBlocked(false); // do I need to do this in a .then() ?
		} catch (error) {
			console.error('Error adding hours data:', error.message);
			props.setBlocked(false);
		}
	};

	const handleDateChange = async (date) => {
		setSelectedDate(date);
		// const formattedDate = format(date, 'yyyy-MM-dd');
		if (auth.currentUser) {
			const hours = await getHours(props.uid, date);
			hoursWorked.value = hours;
		}
	};

	return (
		<div className="hour-adder-content">
			<button onClick={toggleView}>{ calendarView === WEEK_VIEW ? "Month View" : "Week View" } </button>
			<div className='form'>
				<label className="date-picker-label">
					<Calendar uid={props.uid} view={calendarView} onDayClick={handleDateChange} startSelected={true}/>
				</label>
				<HourSelector handleAddHours={handleAddHours} blocked={props.blocked} locked={outsidePayPeriod}/>
			</div>
		</div>
	);
}

function HourSelector(props) {
	const [pickerValue, setPickerValue] = useState({
		hours: 0,
		minutes: 0,
	});
	const [supposedToBeSame, setSupposedToBeSame] = useState(true);

	useEffect(() => {
		if (supposedToBeSame) setSupposedToBeSame(false);
		hoursWorked.value = pickerValue.hours + pickerValue.minutes;
	}, [pickerValue]);

	effect(() => {
		if (!supposedToBeSame) return;
		if (Math.floor(hoursWorked.value) === pickerValue.hours &&
					hoursWorked.value%1 === pickerValue.minutes) return;
		setPickerValue({
			hours: Math.floor(hoursWorked.value),
			minutes: hoursWorked.value%1
		}); 
	});

	if (props.hide === true) return <div></div>
	else return <div className="hours-and-picker-container">
			<ClickBlocker blocked={ props.blocked || props.locked } locked={ props.locked } />
			<div className="worked-hours-container">
				<p className="worked-hours-label">Hours Worked:</p>
				<p className="worked-hours">{hoursWorked.value}</p>
			</div>
			<div className="killScroll">
				<Picker value={pickerValue} onChange={setPickerValue}>
					{Object.keys(selections).map(name => (
						<Picker.Column key={name} name={name}>
						{selections[name].map(option => (
							<Picker.Item key={option} value={option}>
							{option}
							</Picker.Item>
						))}
						</Picker.Column>
					))}
				</Picker>
			</div>
			<button className="add-hours-button" onClick={props.handleAddHours} disabled={props.blocked}>Add Hours</button>
		</div>
}

export default HourAdder;