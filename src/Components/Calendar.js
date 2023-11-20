// custom calendar with a header and rows for the days
//  takes a list of props for the rows (users) data to display
//  takes a prop for the current day (or null is current day) displays the week that day is in
//  takes a prop for if displaying the adjust hours buttons

// custom row should display data per person 
//  takes a prop for if display name
//  takes a prop for current week number
//  days need to be selectable. 
import { signal } from '@preact/signals-react';
import { useEffect } from 'react';
import { DayPicker } from 'react-day-picker';

import './Calendar.css';
import { selectedDate, setSelectedDate } from './firebase';

export const WEEK_VIEW = 0;
export const MONTH_VIEW = 1;

const currentDate = signal(new Date(new Date().toDateString()));
const DaysDisplayed = 7
const DateArray = [];
const buildDateArray = () => {
	DateArray.length = 0;
	let temp;
	for (var i=0;i<DaysDisplayed;i++) {
		temp = new Date(new Date().setDate(currentDate.value.getDate()-(DaysDisplayed-i-1)));
		DateArray.push(new Date(temp.toDateString()));
	}
	console.log("Date Array Built: ", DateArray);
}
buildDateArray();


const ABBREVIATIONS = [ "Sun","Mon","Tue","Wed","Thu","Fri","Sat" ]
function DateCell(props) {
	const selectedThisDateCell = () => {
		setSelectedDate(props.date);
		props.onDayClick(props.date);
	}
	// props needs a date!
	return <td className={"date" + (props.isSelected ? " selected" : "")} onClick={selectedThisDateCell}>
		<p className="dateDay">{ABBREVIATIONS[props.date.getUTCDay()]}</p>
		<p className="dateNum">{props.date.getUTCDate()}</p>
	</td>
}

function Calendar(props) {
	// var temp = new Date();
	// console.log(temp);
	// console.log("copmare:",temp.setDate(currentDate.value.getDate()+1));
	// console.log(temp);
	// console.log("copmare:",new Date(new Date().setDate(currentDate.value.getDate()+1)));
	
	// console.log(selectedDate,currentDate,currentDate == selectedDate, currentDate === selectedDate)

	// should only run on mount (depend)
	useEffect(() => {
		// scroll left
		// 
	}, []);

	if (props.view === WEEK_VIEW) {

		return <div className='carouselWrapper'>
			<table className="dateCarousel">
				<tbody>
					<tr>
						{/* I bet this is horrible for performance */}
						{ DateArray.map((currDate,i) => 
							<DateCell key={i} date={currDate} isSelected={currDate === selectedDate.value} onDayClick={props.onDayClick} />
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