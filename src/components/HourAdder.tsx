import { useRef, useState } from "react";
import type { MouseEvent } from "react";
import { AiOutlineSnippets } from "react-icons/ai";
import { useQuery } from "@tanstack/react-query";

import Calendar from "./Calendar";
import Picker from "./CustomPicker";
import { getUserWeekQuery, useSetHours } from "../utils/firebaseQueries.ts";
import { getRegularHoursTotal } from "../utils/weeklyHours";
import type { WeeklyHours } from "../utils/dataModels";

import { NotesDialog } from "./NotesDialog";
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
  const weeklyHoursQuery = useQuery(getUserWeekQuery(uid, selectedDate));
  const weeklyHours = weeklyHoursQuery.data;

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  return (
    <div className={styles.hourAdderContent}>
      <div>
        <label className={styles.datePickerLabel} inert={blocked}>
          <Calendar
            uid={uid}
            onDayClick={handleDateChange}
            selectedDate={selectedDate}
          />
        </label>
        {weeklyHours && (
          <HourSelector
            key={`${selectedDate.getTime()}-${weeklyHours[selectedDate.getDay()].hours}`}
            uid={uid}
            blocked={blocked}
            setBlocked={setBlocked}
            showNotes={showNotes === true}
            selectedDate={selectedDate}
            weeklyHours={weeklyHours}
          />
        )}
      </div>
    </div>
  );
}

interface HourSelectorProps {
  uid: string;
  blocked: boolean;
  setBlocked: (value: boolean) => void;
  showNotes: boolean;
  selectedDate: Date;
  weeklyHours: WeeklyHours;
}

function HourSelector({
  uid,
  blocked,
  setBlocked,
  showNotes,
  selectedDate,
  weeklyHours,
}: HourSelectorProps) {
  const savedHours = weeklyHours[selectedDate.getDay()].hours;
  const [notes, setNotes] = useState(false);
  const [pickerValue, setPickerValue] = useState(() => ({
    hours: Math.floor(savedHours),
    minutes: savedHours % 1,
  }));
  const notesButtonRef = useRef<HTMLButtonElement>(null);
  const setTheseHours = useSetHours();
  const hoursWorked = pickerValue.hours + pickerValue.minutes;
  const hoursThisWeek = getRegularHoursTotal(weeklyHours);

  const handlePickerChange = (value: {
    hours: number;
    minutes: number;
  }) => {
    setPickerValue(
      value.hours + value.minutes > 24
        ? { hours: 24, minutes: 0 }
        : value,
    );
  };

  const handleAddHours = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (blocked) return;
    setBlocked(true);

    setTheseHours(uid, selectedDate, hoursWorked, () => {
      setBlocked(false);
    });
  };

  return (
    <div aria-busy={blocked}>
      <NotesDialog
        date={selectedDate}
        defaultNotes={weeklyHours[selectedDate.getDay()].notes}
        onOpenChange={setNotes}
        open={notes}
        returnFocusRef={notesButtonRef}
        uid={uid}
      />
      <div className={styles.workedHoursContainer}>
        <p className={styles.workedHoursLabel}>Hours Worked:</p>
        <p className={styles.workedHours}>{hoursWorked}</p>
        <p className={styles.weeklyTotal}>
          {hoursThisWeek < 0.5 ? "" : "Weekly total: " + hoursThisWeek}
        </p>
      </div>
      <div className={styles.killScroll} inert={blocked}>
        <Picker value={pickerValue} onChange={handlePickerChange} />
      </div>
      <div className={styles.addHoursButtonContainer}>
        <button
          className={styles.addHoursButton}
          onClick={handleAddHours}
          disabled={blocked}
          type="button"
        >
          {blocked ? "Updating..." : "Update Hours"}
        </button>
        {showNotes && (
          <button
            aria-label="Edit work notes"
            className={styles.addNotesButton}
            onClick={() => setNotes(true)}
            disabled={blocked}
            ref={notesButtonRef}
            type="button"
          >
            <AiOutlineSnippets />
          </button>
        )}
      </div>
    </div>
  );
}

export default HourAdder;
