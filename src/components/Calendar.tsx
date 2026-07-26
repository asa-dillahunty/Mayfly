import { useLayoutEffect } from "react";

import { ABBREVIATIONS } from "../utils/dateUtils.ts";
import { useQuery } from "@tanstack/react-query";
import { getUserWeekQuery } from "../utils/firebase/firebaseQueries.ts";

import styles from "./sass/Calendar.module.scss";

export const WEEK_VIEW = 0;
export const DAYS_DISPLAYED = 8;

const buildDateArray = () => {
  const currentDate = new Date();
  const dateArray = [];
  dateArray.length = 0;
  for (let i = 0; i < DAYS_DISPLAYED; i++) {
    const temp = new Date(new Date().setDate(currentDate.getDate() - i));
    dateArray.push(new Date(temp.toDateString()));
  }
  return dateArray;
};

interface DateCellProps {
  date: Date;
  onDayClick: (date: Date) => void;
  uid: string;
  isSelected: boolean;
}

function DateCell({ date, onDayClick, uid, isSelected }: DateCellProps) {
  const weeklyHoursQuery = useQuery(getUserWeekQuery(uid, date));
  const hours = weeklyHoursQuery.data?.[date.getDay()].hours;

  return (
    <td
      className={styles.date + (isSelected ? " " + styles.selected : "")}
      onClick={() => onDayClick(date)}
    >
      <p className={styles.dateDay}>{ABBREVIATIONS[date.getUTCDay()]}</p>
      <p className={styles.dateNum}>{date.getUTCDate()}</p>
      <p className={styles.dateHours}>{hours !== undefined ? hours : ""}</p>
      <div
        className={
          hours !== undefined && hours > 6
            ? `${styles.statusCircle} ${styles.goodHours}`
            : `${styles.statusCircle} ${styles.badHours}`
        }
      ></div>
    </td>
  );
}

interface CalendarProps {
  uid: string;
  onDayClick: (date: Date) => void;
  selectedDate: Date;
}

export default function Calendar({
  uid,
  onDayClick,
  selectedDate,
}: CalendarProps) {
  const onVisibilityChange = () => {
    if (document.visibilityState !== "visible") return;
  };

  useLayoutEffect(() => {
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  const calendarDates = buildDateArray();

  return (
    <div className={styles.carouselWrapper} dir="rtl">
      <table className={styles.dateCarousel}>
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
}
