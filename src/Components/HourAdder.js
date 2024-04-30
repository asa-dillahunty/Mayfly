import { selectedDate, setSelectedDate, auth, setHours, getHoursEarlyReturn, getHoursThisWeek, getUserNotes, setUserNotes, } from '../utils/firebase';
import { useState, useEffect } from "react";
import './HourAdder.css';
import { effect } from "@preact/signals-react";
import ClickBlocker from "./ClickBlocker";

import Calendar from './Calendar';
import { WEEK_VIEW, MONTH_VIEW } from './Calendar';
import { AiOutlineSnippets } from 'react-icons/ai';

import Picker from './CustomPicker';

export function HourAdder (props) {
	const [calendarView, setCalendarView] = useState( WEEK_VIEW );
	
	// Todo: this functionality should be moved to the calendar component
	const outsidePayPeriod = false; // (buildDocName(selectedDate.value) === buildDocName(new Date()));
	const toggleView = () => {
		if (calendarView === WEEK_VIEW) setCalendarView(MONTH_VIEW);
		else setCalendarView(WEEK_VIEW);
	}

	const handleDateChange = (date) => {
		setSelectedDate(date);
	};

	return (
		<div className="hour-adder-content">
			<button onClick={toggleView}>{ calendarView === WEEK_VIEW ? "Month View" : "Week View" } </button>
			<div className='form'>
				<label className="date-picker-label">
					<Calendar 
						uid={props.uid}
						view={calendarView}
						onDayClick={handleDateChange}
						startSelected={true}/>
				</label>
				<HourSelector 
					uid={props.uid}
					blocked={props.blocked}
					setBlocked={props.setBlocked}
					locked={outsidePayPeriod}
					showNotes={props.showNotes === true}/>
			</div>
		</div>
	);
}

const selections = {
	hours: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24],
	minutes: [0,.5],
}
function HourSelector(props) {
	const [start, setStart] = useState(true);
	const [notes, setNotes] = useState(false);
	const [hoursWorked, setHoursWorked] = useState(-2);
	const [hoursThisWeek, setHoursThisWeek] = useState(0);
	const [pickerValue, setPickerValue] = useState({
		hours: 0,
		minutes: 0,
	});

	useEffect(() => {
		// this should trigger every time the user touches the picker
		if (pickerValue.hours + pickerValue.minutes > 24) {
			// someone cannot work more than 24 hours in a day. (Except me. I'm different)
			setPickerValue({hours:24,minutes:0});
			return;
		}

		if (Math.floor(hoursWorked) === pickerValue.hours && 
			hoursWorked % 1 === pickerValue.minutes) return;
		setHoursWorked( pickerValue.hours + pickerValue.minutes);
	}, [pickerValue]);

	const refreshWeeklyHours = async () => {
		const weekHours = await getHoursThisWeek(props.uid, selectedDate.value)
		if (weekHours !== hoursThisWeek) setHoursThisWeek(weekHours);
	}

	effect(() => {
		if (start) setStart(false);
		else return;

		if (!auth.currentUser) return;
		const hours = getHoursEarlyReturn(props.uid, selectedDate.value);
		refreshWeeklyHours();
		if (hours < 0) return; // we don't have the proper hours yet
		if (hoursWorked === hours) return;
		// tell the picker, it will update the hours
		setPickerValue({
			hours: Math.floor(hours),
			minutes: hours % 1
		});
	});

	const handleAddHours = async (e) => {
		e.preventDefault();
		props.setBlocked(true);

		setHours(props.uid, selectedDate.value, hoursWorked).then(() => {
			refreshWeeklyHours().then(() => {
				props.setBlocked(false);
			}).catch((_e)=>{
				alert(`Error Code 1921. Failed to get hours. Please refresh the page.`);
				props.setBlocked(false);
			});
		}).catch ((error) => {
			// console.error('Error adding hours data:', error.message);
			alert("Please refresh. Error adding hours data: ", error.message);
			props.setBlocked(false);
		});
	};

	if (props.hide === true) return <div></div>
	else return (
		<div className="hours-and-picker-container">
			<ClickBlocker block={ props.blocked || props.locked } locked={ props.locked } />
			<ClickBlocker block={ notes } custom >
				<NotesForm setBlocked={setNotes} uid={props.uid} date={selectedDate.value} />
			</ClickBlocker>
			<div className="worked-hours-container">
				<p className="worked-hours-label">Hours Worked:</p>
				<p className="worked-hours">{ hoursWorked < 0 ? "" : hoursWorked }</p>
				<p className="weekly-total">{ hoursThisWeek < .5 ? "" : "Weekly total: " + hoursThisWeek}</p>
			</div>
			<div className="killScroll">
				<Picker />
				{/* <Picker value={pickerValue} onChange={setPickerValue}>
					{Object.keys(selections).map(name => (
						<Picker.Column key={name} name={name}>
						{selections[name].map(option => (
							<Picker.Item key={option} value={option}>
								{({ selected }) => (
									<div style={{ 
										fontWeight: selected ? 'bold' : 'normal',
									}}>
										{option}
									</div>
								)}
							</Picker.Item>
						))}
						</Picker.Column>
					))}
				</Picker> */}
			</div>
			<div className='add-hours-button-container'>
				<button
					className="add-hours-button"
					onClick={handleAddHours}
					disabled={props.blocked}>
						Add Hours
				</button>
				{ props.showNotes ? (
					<button
						className="add-notes-button"
						onClick={()=>setNotes(true)}
						disabled={props.blocked}>
							<AiOutlineSnippets />
					</button>
				) : "" }
			</div>
		</div>
	)
}

function NotesForm({setBlocked, uid, date}) {
	const [myNotes, setMyNotes] = useState("");
	const [initialLoad, setInitialLoad] = useState(true);
	const [isLoading, setIsLoading] = useState(false);

	const submitChanges = (e) => {
		e.preventDefault();
		setIsLoading(true);
		setUserNotes(uid,date,myNotes).then(()=>{
				setIsLoading(false);
				setBlocked(false);
			}).catch((e)=>{
				alert("Failed to save notes: "+e.message);
				setIsLoading(false);
			});
	}

	const cancelForm = (e) => {
		e.preventDefault();
		setBlocked(false)
	}

	useEffect(() => {
		if (!initialLoad) return;
		getUserNotes(uid,date).then((userNotes)=>{
			setMyNotes(userNotes);
			setInitialLoad(false);
		}).catch((e)=>{
			alert("Failed to get notes. Please refresh: "+e.message);
			setInitialLoad(false);
		});
	});

	return (
		<form className="add-notes-form" onSubmit={submitChanges}>
			<ClickBlocker block={ isLoading || initialLoad } loading />
			<textarea
				name='notes-area'
				className="notes-input"
				placeholder="Notes"
				value={myNotes}
				onChange={(e) => setMyNotes(e.target.value)}
			/>
			<div className='button-container'>
				<button className='submit-button' onClick={submitChanges} disabled={isLoading}>Save</button>
				<button className='cancel-button' onClick={cancelForm} disabled={isLoading}>Cancel</button>
			</div>
		</form>
	);
}

export default HourAdder;