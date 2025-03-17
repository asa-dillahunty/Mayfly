import { useState, useEffect } from "react";

import Calendar, { WEEK_VIEW, MONTH_VIEW } from "./Calendar";
import ClickBlocker from "./ClickBlocker";
import Picker from "./CustomPicker";

import "./HourAdder.css";

import { AiOutlineSnippets } from "react-icons/ai";
import { useQuery } from "@tanstack/react-query";
import {
  getUserWeekQuery,
  useSetHours,
  useSetNotes,
} from "../utils/firebaseQueries.ts";

export function HourAdder(props) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState(WEEK_VIEW);

  // Todo: this functionality should be moved to the calendar component
  const outsidePayPeriod = false; // (buildDocName(selectedDate) === buildDocName(new Date()));
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
            selectedDate={selectedDate}
          />
        </label>
        <HourSelector
          uid={props.uid}
          blocked={props.blocked}
          setBlocked={props.setBlocked}
          locked={outsidePayPeriod}
          showNotes={props.showNotes === true}
          selectedDate={selectedDate}
        />
      </div>
    </div>
  );
}

function HourSelector({
  uid,
  blocked,
  setBlocked,
  locked,
  showNotes,
  selectedDate,
  hide,
}) {
  const [notes, setNotes] = useState(false);
  const [hoursWorked, setHoursWorked] = useState(-2);
  const [pickerValue, setPickerValue] = useState({
    hours: 0,
    minutes: 0,
  });

  const weeklyHoursQuery = useQuery(getUserWeekQuery(uid, selectedDate));
  const weeklyHours = weeklyHoursQuery.data;

  const hoursThisWeek = () => {
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

  useEffect(() => {
    if (!weeklyHours) return;

    // initialize
    const hours = weeklyHours[selectedDate.getDay()].hours;
    setHoursWorked(hours);
    setPickerValue({
      hours: Math.floor(hours),
      minutes: hours % 1,
    });
  }, [selectedDate, weeklyHours]);

  const setTheseHours = useSetHours();

  const handleAddHours = async (e) => {
    e.preventDefault();
    setBlocked(true);

    setTheseHours(uid, selectedDate, hoursWorked, () => {
      setBlocked(false);
    });
  };

  if (hide === true) return <div></div>;
  else if (!weeklyHours) {
    return <></>;
  } else {
    return (
      <div className="hours-and-picker-container">
        <ClickBlocker block={blocked || locked} locked={locked} />
        <ClickBlocker block={notes} custom>
          <NotesForm
            setBlocked={setNotes}
            uid={uid}
            date={selectedDate}
            defaultNotes={weeklyHours[selectedDate.getDay()].notes}
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
            disabled={blocked}
          >
            Add Hours
          </button>
          {showNotes ? (
            <button
              className="add-notes-button"
              onClick={() => setNotes(true)}
              disabled={blocked}
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

function NotesForm({ setBlocked, uid, date, defaultNotes }) {
  const [myNotes, setMyNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const setNotes = useSetNotes();
  const submitChanges = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setNotes(uid, date, myNotes, () => {
      setSubmitting(false);
      setBlocked(false); // close the form
    });
  };

  const cancelForm = (e) => {
    e.preventDefault();
    setBlocked(false);
  };

  useEffect(() => {
    const notes = defaultNotes ? defaultNotes : "";
    setMyNotes(notes);
  }, [defaultNotes]);

  return (
    <form className="add-notes-form" onSubmit={submitChanges}>
      <ClickBlocker block={submitting} loading />
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
          disabled={submitting}
        >
          Save
        </button>
        <button
          className="cancel-button"
          onClick={cancelForm}
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default HourAdder;
