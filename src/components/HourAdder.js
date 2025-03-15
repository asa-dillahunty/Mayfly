import { getUserNotes, setUserNotes } from "../utils/firebase";
import { selectedDate, setSelectedDate } from "../utils/dateUtils.ts";
import { useState, useEffect } from "react";
import { effect } from "@preact/signals-react";

import Calendar, { WEEK_VIEW, MONTH_VIEW } from "./Calendar";
import ClickBlocker from "./ClickBlocker";
import Picker from "./CustomPicker";

import "./HourAdder.css";

import { AiOutlineSnippets } from "react-icons/ai";
import { useQuery } from "@tanstack/react-query";
import { getUserWeekQuery, useSetHours } from "../utils/firebaseQueries.ts";

export function HourAdder(props) {
  const [calendarView, setCalendarView] = useState(WEEK_VIEW);

  // Todo: this functionality should be moved to the calendar component
  const outsidePayPeriod = false; // (buildDocName(selectedDate.value) === buildDocName(new Date()));
  const toggleView = () => {
    if (calendarView === WEEK_VIEW) setCalendarView(MONTH_VIEW);
    else setCalendarView(WEEK_VIEW);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  return (
    <div className="hour-adder-content">
      <button onClick={toggleView}>
        {calendarView === WEEK_VIEW ? "Month View" : "Week View"}{" "}
      </button>
      <div className="form">
        <label className="date-picker-label">
          <Calendar
            uid={props.uid}
            view={calendarView}
            onDayClick={handleDateChange}
            startSelected={true}
          />
        </label>
        <HourSelector
          uid={props.uid}
          blocked={props.blocked}
          setBlocked={props.setBlocked}
          locked={outsidePayPeriod}
          showNotes={props.showNotes === true}
        />
      </div>
    </div>
  );
}

function HourSelector(props) {
  const [start, setStart] = useState(true);
  const [notes, setNotes] = useState(false);
  const [hoursWorked, setHoursWorked] = useState(-2);
  const [pickerValue, setPickerValue] = useState({
    hours: 0,
    minutes: 0,
  });

  const weeklyHoursQuery = useQuery(
    getUserWeekQuery(props.uid, selectedDate.value)
  );

  const hoursThisWeek = () => {
    const weeklyHours = weeklyHoursQuery.data;
    if (!weeklyHours) return 0;
    let total = 0;
    for (const day in weeklyHours) {
      if (day === "additionalHours") continue;
      total += weeklyHours[day].hours;
    }
    return total;
  };

  useEffect(() => {
    // this should trigger every time the user touches the picker
    if (pickerValue.hours + pickerValue.minutes > 24) {
      // someone cannot work more than 24 hours in a day. (Except me. I'm different)
      setPickerValue({ hours: 24, minutes: 0 });
      return;
    }

    if (
      Math.floor(hoursWorked) === pickerValue.hours &&
      hoursWorked % 1 === pickerValue.minutes
    )
      return;
    setHoursWorked(pickerValue.hours + pickerValue.minutes);
  }, [pickerValue, hoursWorked, setHoursWorked]);

  effect(() => {
    // console.log("here", weeklyHoursQuery.isLoading, start);
    if (weeklyHoursQuery.isLoading) return;
    if (start) setStart(false);
    else return;

    // initialize
    const weeklyHours = weeklyHoursQuery.data;
    const hours = weeklyHours[selectedDate.value.getDay()].hours;
    setHoursWorked(hours);
    setPickerValue({
      hours: Math.floor(hours),
      minutes: hours % 1,
    });

    // console.log(
    //   "in - here",
    //   selectedDate.value.getDay(),
    //   buildDocName(selectedDate.value),
    //   hours,
    //   weeklyHours
    // );
  });

  const setTheseHours = useSetHours();

  const handleAddHours = async (e) => {
    e.preventDefault();
    props.setBlocked(true);

    setTheseHours(props.uid, selectedDate.value, hoursWorked, () => {
      props.setBlocked(false);
    });
  };

  if (props.hide === true) return <div></div>;
  else {
    return (
      <div className="hours-and-picker-container">
        <ClickBlocker
          block={props.blocked || props.locked}
          locked={props.locked}
        />
        <ClickBlocker block={notes} custom>
          <NotesForm
            setBlocked={setNotes}
            uid={props.uid}
            date={selectedDate.value}
          />
        </ClickBlocker>
        <div className="worked-hours-container">
          <p className="worked-hours-label">Hours Worked:</p>
          <p className="worked-hours">{hoursWorked < 0 ? "" : hoursWorked}</p>
          <p className="weekly-total">
            {hoursThisWeek() < 0.5 ? "" : "Weekly total: " + hoursThisWeek()}
          </p>
        </div>
        <div className="killScroll">
          <Picker value={pickerValue} onChange={setPickerValue} />
        </div>
        <div className="add-hours-button-container">
          <button
            className="add-hours-button"
            onClick={handleAddHours}
            disabled={props.blocked}
          >
            Add Hours
          </button>
          {props.showNotes ? (
            <button
              className="add-notes-button"
              onClick={() => setNotes(true)}
              disabled={props.blocked}
            >
              <AiOutlineSnippets />
            </button>
          ) : (
            ""
          )}
        </div>
      </div>
    );
  }
}

function NotesForm({ setBlocked, uid, date }) {
  const [myNotes, setMyNotes] = useState("");
  const [initialLoad, setInitialLoad] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const submitChanges = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setUserNotes(uid, date, myNotes)
      .then(() => {
        setIsLoading(false);
        setBlocked(false);
      })
      .catch((e) => {
        alert("Failed to save notes: " + e.message);
        setIsLoading(false);
      });
  };

  const cancelForm = (e) => {
    e.preventDefault();
    setBlocked(false);
  };

  useEffect(() => {
    if (!initialLoad) return;
    getUserNotes(uid, date)
      .then((userNotes) => {
        setMyNotes(userNotes);
        setInitialLoad(false);
      })
      .catch((e) => {
        alert("Failed to get notes. Please refresh: " + e.message);
        setInitialLoad(false);
      });
  });

  return (
    <form className="add-notes-form" onSubmit={submitChanges}>
      <ClickBlocker block={isLoading || initialLoad} loading />
      <textarea
        name="notes-area"
        className="notes-input"
        placeholder="Notes"
        value={myNotes}
        onChange={(e) => setMyNotes(e.target.value)}
      />
      <div className="button-container">
        <button
          className="submit-button"
          onClick={submitChanges}
          disabled={isLoading}
        >
          Save
        </button>
        <button
          className="cancel-button"
          onClick={cancelForm}
          disabled={isLoading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default HourAdder;
