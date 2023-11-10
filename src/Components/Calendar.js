// custom calendar with a header and rows for the days
//  takes a list of props for the rows (users) data to display
//  takes a prop for the current day (or null is current day) displays the week that day is in
//  takes a prop for if displaying the adjust hours buttons

// custom row should display data per person 
//  takes a prop for if display name
//  takes a prop for current week number
//  days need to be selectable. 
import { signal } from '@preact/signals-react';
import './Calendar.css';

const currentDate = signal(new Date())


const ABBREVIATIONS = [ "Sun","Mon","Tue","Wed","Thu","Fri","Sat" ]
function DateCell(props) {
    // props needs a date!
    return <td className="date">
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
    const DaysDisplayed = 7
    return <div>
        <h2>This is the calendar</h2>
        <p>This is the date: {currentDate.value.toString()}</p>
        <table className="dateCarousel">
            <tr>
                {/* I bet this is horrible for performance */}
                { [...Array(DaysDisplayed)].map((_x,i) => <DateCell key={i} date={new Date(new Date().setDate(currentDate.value.getDate()-(DaysDisplayed-i-1)))} />) }
            </tr>
        </table>
    </div>
}

export default Calendar;