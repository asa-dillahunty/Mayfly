import { hoursWorked } from "./firebase"
import Picker from 'react-mobile-picker'
import { useState, useEffect } from "react";
import './HourAdder.css';

const selections = {
	hours: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24],
	minutes: [0,.25,.5,.75],
}

function HourAdder(props) {
	const [pickerValue, setPickerValue] = useState({
		hours: 0,
		minutes: 0,
	});

	useEffect(() => {
		console.log('The state has been updated');
		hoursWorked.value = pickerValue.hours + pickerValue.minutes;
	}, [pickerValue]);

	const killScroll = (e) => {
		e.preventDefault();
	};

	const handlePresetClick = (presetHours) => {
		hoursWorked.value = presetHours;
	};

	const setHoursValue = (value) => {
		// depending on what was changed, you only receive that
		//	if you only change 'hours' only receive hours

		if (value.hours)
			hoursWorked.value = Number(value.hours + hoursWorked.value%1);
		else
			hoursWorked.value = Number(Math.floor(hoursWorked.value) + value.minutes)
		// onClick={() => hoursWorked.value = (Number(hoursWorked) - 0.25)}
	};

	if (props.hide === true) return <div></div>
	else return <div>
			<div className="hours-and-button-container">
				<div className="worked-hours">
					<p className="worked-hours-label">Hours Worked:</p>
					<p>{hoursWorked.value}</p>
				</div>
			</div>
			<div onScroll={killScroll}>
			<Picker height={100} wheel={'normal'} value={pickerValue} onChange={setPickerValue}>
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
			<button onClick={props.handleAddHours}>Add Hours</button>
		</div>
}

export default HourAdder;