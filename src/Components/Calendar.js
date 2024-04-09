import { useState } from 'react';
import { DayPicker } from 'react-day-picker';

import './Calendar.css';
import { auth, selectedDate, setSelectedDate, currentDate, getHoursSignal, refreshCurrentDate } from '../lib/firebase';
import { effect } from '@preact/signals-react';

export const WEEK_VIEW = 0;
export const MONTH_VIEW = 1;
export const DAYS_DISPLAYED = 8;

document.addEventListener('visibilitychange', function () {
	refreshCurrentDate();
});

const DateArray = [];
// var count = 0;
const buildDateArray = () => {
	// count++;
	DateArray.length = 0;
	let temp;
	for (var i=0;i<DAYS_DISPLAYED;i++) {
		temp = new Date(new Date().setDate(currentDate.value.getDate() - i));
		DateArray.push(new Date(temp.toDateString()));
	}
	// console.log("Date Array Built: ", DateArray, count);
}
buildDateArray();


const ABBREVIATIONS = [ "Sun","Mon","Tue","Wed","Thu","Fri","Sat" ];
function DateCell(props) {
	const [isSelected, setIsSelected] = useState(false);
	const selectedThisDateCell = () => {
		props.onDayClick(props.date);
	}

	effect( () => {
		if (props.date.getTime() === selectedDate.value.getTime()) {
			if (isSelected) return; // already selected
			else setIsSelected(true);
		}
		else {
			if (!isSelected) return;
			else setIsSelected(false);
		}
	});
	
	return <td className={"date" + (isSelected ? " selected" : "")} onClick={selectedThisDateCell}>
		<p className="dateDay">{ABBREVIATIONS[props.date.getUTCDay()]}</p>
		<p className="dateNum">{props.date.getUTCDate()}</p>
		<p className="dateHours">{getHoursSignal(props.uid,props.date).value}</p>
		<div className={getHoursSignal(props.uid,props.date).value > 6 ? "statusCircle goodHours" : "statusCircle badHours"}></div>
	</td>
}

function Calendar(props) {
	// should only run on mount (depend)
	effect(() => {
		buildDateArray(currentDate.value);
	});

	if (props.view === WEEK_VIEW) {
		return <div className='carouselWrapper' dir="rtl">
			<table className="dateCarousel">
				<tbody>
					<tr>
						{/* I bet this is horrible for performance */}
						{ DateArray.map((currDate,i) => 
							<DateCell
								uid={props.uid}
								key={i}
								date={currDate}
								onDayClick={props.onDayClick} />
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