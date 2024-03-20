import { useEffect } from 'react';
import { DayPicker } from 'react-day-picker';

import './Calendar.css';
import { auth, selectedDate, setSelectedDate, currentDate, getHoursSignal } from './firebase';

export const WEEK_VIEW = 0;
export const MONTH_VIEW = 1;
export const DAYS_DISPLAYED = 8;

const DateArray = [];
const buildDateArray = () => {
	DateArray.length = 0;
	let temp;
	for (var i=0;i<DAYS_DISPLAYED;i++) {
		temp = new Date(new Date().setDate(currentDate.value.getDate() - i));
		DateArray.push(new Date(temp.toDateString()));
	}
	console.log("Date Array Built: ", DateArray);
}
buildDateArray();


const ABBREVIATIONS = [ "Sun","Mon","Tue","Wed","Thu","Fri","Sat" ];
function DateCell(props) {
	const selectedThisDateCell = () => {
		setSelectedDate(props.date);
		props.onDayClick(props.date);
	}
	
	return <td className={"date" + (props.isSelected ? " selected" : "")} onClick={selectedThisDateCell}>
		<p className="dateDay">{ABBREVIATIONS[props.date.getUTCDay()]}</p>
		<p className="dateNum">{props.date.getUTCDate()}</p>
		<p className="dateHours">{getHoursSignal(props.uid,props.date).value}</p>
		<div className={getHoursSignal(props.uid,props.date).value > 6 ? "statusCircle goodHours" : "statusCircle badHours"}></div>
	</td>
}

function Calendar(props) {
	// should only run on mount (depend)
	useEffect(() => {
		if (props.startSelected) {
			// run get hours to make sure the data is cached on load
			// this is if a user is needed if a user is already logged in on a refresh
			// getHours(props.uid,DateArray[0]);

			props.onDayClick(DateArray[0]);
		}
	},[props]);

	if (props.view === WEEK_VIEW) {
		return <div className='carouselWrapper' dir="rtl">
			<table className="dateCarousel">
				<tbody>
					<tr>
						{/* I bet this is horrible for performance */}
						{ DateArray.map((currDate,i) => 
							<DateCell uid={props.uid} key={i} date={currDate} isSelected={currDate === selectedDate.value} onDayClick={props.onDayClick} />
						) }
					</tr>
				</tbody>
			</table>
		</div>
	}
	else if (props.view === MONTH_VIEW) {
		return <DayPicker selected={selectedDate.value} onDayClick={props.onDayClick} className="DayPicker" />
	}
}

export default Calendar;