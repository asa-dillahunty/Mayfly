import { useLayoutEffect, useState } from 'react';
import { DayPicker } from 'react-day-picker';

import './Calendar.css';
import { selectedDate, currentDate, getHoursSignal, refreshCurrentDate, ABBREVIATIONS } from '../utils/firebase';
import { effect, signal } from '@preact/signals-react';

export const WEEK_VIEW = 0;
export const MONTH_VIEW = 1;
export const DAYS_DISPLAYED = 8;

const buildDateArray = () => {
	const dateArray = [];
	dateArray.length = 0;
	let temp;
	for (var i=0;i<DAYS_DISPLAYED;i++) {
		temp = new Date(new Date().setDate(currentDate.value.getDate() - i));
		dateArray.push(new Date(temp.toDateString()));
	}
	return dateArray;
}

const CalendarDates = signal(buildDateArray());
const refreshDateArray = () => {
	CalendarDates.value = buildDateArray();
}


function DateCell(props) {
	const [isSelected, setIsSelected] = useState(false);
	const selectedThisDateCell = () => {
		setIsSelected(true); // do immediately for responsive behavior
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
	const onVisibilityChange = () => {
		if (document.visibilityState !== 'visible') return;
		refreshCurrentDate();
		refreshDateArray();
	}

	useLayoutEffect(() => {
		document.addEventListener('visibilitychange',onVisibilityChange);
		return () => document.removeEventListener("visibilitychange",onVisibilityChange);
	}, []);

	if (props.view === WEEK_VIEW) {
		return <div className='carouselWrapper' dir="rtl">
			<table className="dateCarousel">
				<tbody>
					<tr>
						{/* I bet this is horrible for performance */}
						{ CalendarDates.value.map((currDate,i) => 
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