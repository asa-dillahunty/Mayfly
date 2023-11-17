import { hoursWorked } from "./firebase"
import './HourAdder.css';



function HourAdder(props) {
	const handlePresetClick = (presetHours) => {
		hoursWorked.value = presetHours;
	};

	if (props.hide === true) return <div></div>
	else return <div>
			<div className="hours-and-button-container">
				<div className="worked-hours">
					<p className="worked-hours-label">Hours Worked:</p>
					<p>{hoursWorked}</p>
				</div>
				<div className="hours-controls">
					<button
						className="hours-button"
						onClick={() => hoursWorked.value = (Number(hoursWorked) + 0.25)}
					>
						+
					</button>
					<button
						className="hours-button"
						onClick={() => hoursWorked.value = (Number(hoursWorked) - 0.25)}
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
			<button onClick={props.handleAddHours}>Add Hours</button>
		</div>
}

export default HourAdder;