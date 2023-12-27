import { hoursWorked } from "./firebase"
import Picker from 'react-mobile-picker'
import './HourAdder.css';

const selections = {
	hours: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24],
	minutes: [0,.25,.5,.75],
}

function HourAdder(props) {
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
			<Picker height={50} value={hoursWorked.value} onChange={setHoursValue}>
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
			<button onClick={props.handleAddHours}>Add Hours</button>
		</div>
}

export default HourAdder;