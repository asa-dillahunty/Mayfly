import { useState, useEffect } from "react";
import { AiOutlineSnippets } from "react-icons/ai";
import { useQuery } from "@tanstack/react-query";

import Calendar, { WEEK_VIEW, MONTH_VIEW } from "./Calendar";
import ClickBlocker from "./ClickBlocker";
import Picker from "./CustomPicker";
import { getUserWeekQuery, useSetHours } from "../utils/firebaseQueries.ts";
import { getRegularHoursTotal } from "../utils/weeklyHours";

import NotesForm from "./NotesForm.tsx";
import styles from "./sass/HourAdder.module.scss";

interface HourAdderProps {
  uid: string;
  showNotes: boolean;
  blocked: boolean;
  setBlocked: (value: boolean) => void;
}

export function HourAdder({
  uid,
  showNotes,
  blocked,
  setBlocked,
}: HourAdderProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState(WEEK_VIEW);

  // TODO: toggleView functionality should be moved to the calendar component
  const outsidePayPeriod = false;
  const toggleView = () => {
    if (calendarView === WEEK_VIEW) setCalendarView(MONTH_VIEW);
    else setCalendarView(WEEK_VIEW);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  return (
    <div className={styles.hourAdderContent}>
      <button onClick={toggleView}>
        {calendarView === WEEK_VIEW ? "Month View" : "Week View"}{" "}
      </button>
      <div>
        <label className={styles.datePickerLabel}>
          <Calendar
            uid={uid}
            view={calendarView}
            onDayClick={handleDateChange}
            startSelected={true}
            selectedDate={selectedDate}
          />
        </label>
        <HourSelector
          uid={uid}
          blocked={blocked}
          setBlocked={setBlocked}
          locked={outsidePayPeriod}
          showNotes={showNotes === true}
          selectedDate={selectedDate}
        />
      </div>
    </div>
  );
}

interface HourSelectorProps {
  uid: string;
  blocked: boolean;
  setBlocked: (value: boolean) => void;
  locked: boolean;
  showNotes: boolean;
  selectedDate: Date;
  hide?: boolean;
}

function HourSelector({
  uid,
  blocked,
  setBlocked,
  locked,
  showNotes,
  selectedDate,
  hide = false,
}: HourSelectorProps) {
  const [notes, setNotes] = useState(false);
  const [hoursWorked, setHoursWorked] = useState(-2);
  const [pickerValue, setPickerValue] = useState({
    hours: 0,
    minutes: 0,
  });

  const weeklyHoursQuery = useQuery(getUserWeekQuery(uid, selectedDate));
  const weeklyHours = weeklyHoursQuery.data;
  const hoursThisWeek = getRegularHoursTotal(weeklyHours);

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
      <div>
        <ClickBlocker block={blocked || locked} locked={locked} />
        <ClickBlocker block={notes} custom>
          <NotesForm
            setBlocked={setNotes}
            uid={uid}
            date={selectedDate}
            defaultNotes={weeklyHours[selectedDate.getDay()].notes}
          />
        </ClickBlocker>
        <div className={styles.workedHoursContainer}>
          <p className={styles.workedHoursLabel}>Hours Worked:</p>
          <p className={styles.workedHours}>
            {hoursWorked < 0 ? "" : hoursWorked}
          </p>
          <p className={styles.weeklyTotal}>
            {hoursThisWeek < 0.5 ? "" : "Weekly total: " + hoursThisWeek}
          </p>
        </div>
        <div className={styles.killScroll}>
          <Picker value={pickerValue} onChange={setPickerValue} />
        </div>
        <div className={styles.addHoursButtonContainer}>
          <button
            className={styles.addHoursButton}
            onClick={handleAddHours}
            disabled={blocked}
          >
            Update Hours
          </button>
          {showNotes && (
            <button
              className={styles.addNotesButton}
              onClick={() => setNotes(true)}
              disabled={blocked}
            >
              <AiOutlineSnippets />
            </button>
          )}
        </div>
      </div>
    );
  }
}

export default HourAdder;
