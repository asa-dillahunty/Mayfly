import { PAY_PERIOD_DAYS } from "./dateUtils";
import type { WeekDay, WeeklyHours } from "./dataModels";
import { isValidHoursInput } from "./hourValidation";

export interface WeeklyHoursDraft {
  editedAdditionalHours?: string;
  editedHours: Partial<Record<WeekDay, string>>;
}

export interface WeeklyHoursDraftAnalysis {
  additionalHours: number;
  hasChanges: boolean;
  hasInvalidChanges: boolean;
  regularHours: number;
  totalHours: number;
}

export function getRegularHoursTotal(weeklyHours?: WeeklyHours): number {
  return PAY_PERIOD_DAYS.reduce<number>(
    (total, day) => total + (weeklyHours?.[day].hours ?? 0),
    0,
  );
}

export function getAdditionalHours(weeklyHours?: WeeklyHours): number {
  return weeklyHours?.additionalHours?.hours ?? 0;
}

export function getPaidHoursTotal(weeklyHours?: WeeklyHours): number {
  return getRegularHoursTotal(weeklyHours) + getAdditionalHours(weeklyHours);
}

export function analyzeWeeklyHoursDraft(
  weeklyHours: WeeklyHours | undefined,
  draft: WeeklyHoursDraft,
): WeeklyHoursDraftAnalysis {
  const regularHours = PAY_PERIOD_DAYS.reduce<number>((total, day) => {
    const editedValue = draft.editedHours[day];
    const storedValue = weeklyHours?.[day].hours ?? 0;
    const value =
      editedValue !== undefined && isValidHoursInput(editedValue, 24)
        ? Number(editedValue)
        : storedValue;
    return total + value;
  }, 0);
  const additionalHours =
    draft.editedAdditionalHours !== undefined &&
    isValidHoursInput(draft.editedAdditionalHours)
      ? Number(draft.editedAdditionalHours)
      : getAdditionalHours(weeklyHours);
  const hasInvalidChanges =
    PAY_PERIOD_DAYS.some((day) => {
      const value = draft.editedHours[day];
      return value !== undefined && !isValidHoursInput(value, 24);
    }) ||
    (draft.editedAdditionalHours !== undefined &&
      !isValidHoursInput(draft.editedAdditionalHours));
  const hasChanges =
    PAY_PERIOD_DAYS.some((day) => {
      const value = draft.editedHours[day];
      return (
        value !== undefined &&
        isValidHoursInput(value, 24) &&
        Number(value) !== weeklyHours?.[day].hours
      );
    }) ||
    (draft.editedAdditionalHours !== undefined &&
      isValidHoursInput(draft.editedAdditionalHours) &&
      Number(draft.editedAdditionalHours) !== getAdditionalHours(weeklyHours));

  return {
    additionalHours,
    hasChanges,
    hasInvalidChanges,
    regularHours,
    totalHours: regularHours + additionalHours,
  };
}

export function withDayHours(
  weeklyHours: WeeklyHours,
  day: WeekDay,
  hours: number,
): WeeklyHours {
  return {
    ...weeklyHours,
    [day]: {
      ...weeklyHours[day],
      hours,
    },
  };
}

export function withAdditionalHours(
  weeklyHours: WeeklyHours,
  hours: number,
): WeeklyHours {
  return {
    ...weeklyHours,
    additionalHours: {
      ...weeklyHours.additionalHours,
      hours,
    },
  };
}

export function withDayNotes(
  weeklyHours: WeeklyHours,
  day: WeekDay,
  notes: string,
): WeeklyHours {
  return {
    ...weeklyHours,
    [day]: {
      ...weeklyHours[day],
      notes,
    },
  };
}

export function applyWeeklyHoursDraft(
  weeklyHours: WeeklyHours,
  draft: WeeklyHoursDraft,
): WeeklyHours {
  let updatedWeek = weeklyHours;

  for (const day of PAY_PERIOD_DAYS) {
    const value = draft.editedHours[day];
    if (value !== undefined) {
      updatedWeek = withDayHours(updatedWeek, day, Number(value));
    }
  }

  if (draft.editedAdditionalHours !== undefined) {
    updatedWeek = withAdditionalHours(
      updatedWeek,
      Number(draft.editedAdditionalHours),
    );
  }

  return updatedWeek;
}
