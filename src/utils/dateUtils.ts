import { signal } from "@preact/signals-react";

const daysInChunk = 7;
const startOfPayPeriod = 4; // Thursday
export const FAKE_EMAIL_EXTENSION = "@dillahuntyfarms.com";
export const ABBREVIATIONS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const selectedDate = signal(new Date(new Date().toDateString()));
export const setSelectedDate = (date) => {
  selectedDate.value = date;
};

export const incrementDate = (thisDate) => {
  thisDate.setDate(thisDate.getDate() + 1);
  return thisDate;
};

export const decrementDate = (thisDate) => {
  thisDate.setDate(thisDate.getDate() - 1);
  return thisDate;
};

/**
 * This function does a lot of math. Is this something I want to cache? #dynamicProgramming
 */
function getWeek(selectedDatetime) {
  // get the first day of the year of the pay period (Thursday)
  const selectedDateUTC = Date.UTC(
    selectedDatetime.getFullYear(),
    selectedDatetime.getMonth(),
    selectedDatetime.getDate()
  );

  const dayOfWeekOfDayOne = new Date(
    selectedDatetime.getFullYear(),
    0,
    1
  ).getDay();
  // this actually gets the first wednesday
  // we do +6 instead of -1 to avoid negative output from the mod
  const firstThursday = Date.UTC(
    selectedDatetime.getFullYear(),
    0,
    1 + ((startOfPayPeriod - dayOfWeekOfDayOne + 6) % 7)
  );
  // add a check here for the cusp of the year. Go back to last year. (or maybe return -1)
  if (firstThursday >= selectedDateUTC) {
    return -1;
  }

  const days = Math.floor((selectedDateUTC - firstThursday) / 86400000); //  24 * 60 * 60 * 1000
  const weekNumber = Math.ceil(days / 7);
  return weekNumber;
}

function getStartOfPayPeriod(date) {
  let firstDay = new Date(date.getTime());
  while (firstDay.getDay() !== startOfPayPeriod) {
    firstDay.setDate(firstDay.getDate() - 1);
  }
  return firstDay;
}

function getEndOfPayPeriod(date) {
  let finalDay = new Date(date.getTime());
  finalDay.setDate(finalDay.getDate() + 1);
  while (finalDay.getDay() !== startOfPayPeriod) {
    finalDay.setDate(finalDay.getDate() + 1);
  }
  return finalDay;
}

export function getWeekSpanString(selectedDate) {
  // we move ahead one day just in case it is the day of the pay period
  let finalDay = getEndOfPayPeriod(selectedDate);
  let firstDay = getStartOfPayPeriod(selectedDate);
  // why + 1 ? date.getMonth() starts at 0 for January
  return (
    firstDay.getMonth() +
    1 +
    "/" +
    firstDay.getDate() +
    " - " +
    (finalDay.getMonth() + 1) +
    "/" +
    finalDay.getDate()
  );
}

export function getStartOfWeekString(selectedDate) {
  let firstDay = new Date(selectedDate.getTime());
  while (firstDay.getDay() !== startOfPayPeriod) {
    firstDay.setDate(firstDay.getDate() - 1);
  }
  return (
    firstDay.getMonth() +
    1 +
    "/" +
    firstDay.getDate() +
    "/" +
    (firstDay.getFullYear() % 100)
  );
}

export function getEndOfWeekString(selectedDate) {
  let finalDay = new Date(selectedDate.getTime());
  while (finalDay.getDay() !== startOfPayPeriod - 1) {
    finalDay.setDate(finalDay.getDate() + 1);
  }
  // why + 1 ? date.getMonth() starts at 0 for January
  // why % 100 ? grabs last two digits of the year
  return (
    finalDay.getMonth() +
    1 +
    "/" +
    finalDay.getDate() +
    "/" +
    (finalDay.getFullYear() % 100)
  );
}

export function buildDocName(date) {
  // if (date === undefined) return "";
  const weekNum = getWeek(date);

  /*
    if the start of the last year was wednesday or it was a (tuesday and a leap year)
    then there are actually 53 weeks instead of 52
  */
  if (weekNum === -1)
    return date.getFullYear() - 1 + "-52"; // cusp edge case
  else return date.getFullYear() + "-" + weekNum;
}
