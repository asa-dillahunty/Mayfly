import { hoursWorked } from "./firebase"
import Picker from 'react-mobile-picker'
import { useState, useEffect } from "react";
import './HourAdder.css';
import { effect } from "@preact/signals-react";

const selections = {
	hours: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24],
	minutes: [0,.25,.5,.75],
}

function HourAdder(props) {
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
	else return <div>
			<div className="hours-and-button-container">
				<div className="worked-hours">
					<p className="worked-hours-label">Hours Worked:</p>
					<p>{hoursWorked.value}</p>
				</div>
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
			<button onClick={props.handleAddHours} disabled={props.blocked}>Add Hours</button>
		</div>
}

export default HourAdder;