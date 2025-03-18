import { useLayoutEffect } from "react";
import { DayPicker } from "react-day-picker";

import "./Calendar.css";
import { ABBREVIATIONS } from "../utils/dateUtils.ts";
import { useQuery } from "@tanstack/react-query";
import { getUserWeekQuery } from "../utils/firebaseQueries.ts";

export const WEEK_VIEW = 0;
export const MONTH_VIEW = 1;
export const DAYS_DISPLAYED = 8;

const buildDateArray = () => {
  const currentDate = new Date();
  const dateArray = [];
  dateArray.length = 0;
  for (var i = 0; i < DAYS_DISPLAYED; i++) {
    const temp = new Date(new Date().setDate(currentDate.getDate() - i));
    dateArray.push(new Date(temp.toDateString()));
  }
  return dateArray;
};

// const CalendarDates = signal(buildDateArray());
// const refreshDateArray = () => {
//   CalendarDates.value = buildDateArray();
// };

function DateCell({ date, onDayClick, uid, isSelected }) {
  const weeklyHoursQuery = useQuery(getUserWeekQuery(uid, date));
  const hours = weeklyHoursQuery.data?.[date.getDay()].hours;

  return (
    <td
      className={"date" + (isSelected ? " selected" : "")}
      onClick={() => onDayClick(date)}
    >
      <p className="dateDay">{ABBREVIATIONS[date.getUTCDay()]}</p>
      <p className="dateNum">{date.getUTCDate()}</p>
      <p className="dateHours">{hours !== undefined ? hours : ""}</p>
      <div
        className={
          hours !== undefined && hours > 6
            ? "statusCircle goodHours"
            : "statusCircle badHours"
        }
      ></div>
    </td>
  );
}

function Calendar({ uid, view, onDayClick, startSelected, selectedDate }) {
  const onVisibilityChange = () => {
    if (document.visibilityState !== "visible") return;
  };

  useLayoutEffect(() => {
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  const calendarDates = buildDateArray();

  if (view === WEEK_VIEW) {
    return (
      <div className="carouselWrapper" dir="rtl">
        <table className="dateCarousel">
          <tbody>
            <tr>
              {calendarDates.map((currDate, i) => (
                <DateCell
                  key={i}
                  uid={uid}
                  date={currDate}
                  onDayClick={onDayClick}
                  isSelected={
                    selectedDate.toDateString() === currDate.toDateString()
                  }
                />
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  } else if (view === MONTH_VIEW) {
    return (
      <DayPicker
        selected={selectedDate}
        onDayClick={onDayClick}
        className="DayPicker"
      />
    );
  }
}

export default Calendar;
