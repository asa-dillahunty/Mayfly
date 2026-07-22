import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import {
  getUserWeekQuery,
  userWeekMutation,
} from "../utils/firebaseQueries";
import { getPayPeriodArray } from "../utils/dateUtils";
import {
  isValidHoursInput,
  normalizeHours,
} from "../utils/hourValidation";
import type { WeekDay, WeeklyHours } from "../utils/dataModels";

const weekDays = getPayPeriodArray() as WeekDay[];

export interface EmployeeWeekEditor {
  editedAdditionalHours?: string;
  editedHours: Partial<Record<WeekDay, string>>;
  hasChanges: boolean;
  hasInvalidChanges: boolean;
  normalizeAdditionalHours: () => void;
  normalizeDayHours: (day: WeekDay) => void;
  save: (onSuccess?: () => void) => void;
  saveError?: string;
  saving: boolean;
  setAdditionalHours: (value: string) => void;
  setDayHours: (day: WeekDay, value: string) => void;
  discard: () => void;
  totalHours: number;
  weeklyHours?: WeeklyHours;
}

export function useEmployeeWeekEditor(
  employeeId: string,
  selectedDate: Date,
): EmployeeWeekEditor {
  const [editedHours, setEditedHours] = useState<
    Partial<Record<WeekDay, string>>
  >({});
  const [editedAdditionalHours, setEditedAdditionalHours] = useState<
    string | undefined
  >();
  const [saveError, setSaveError] = useState<string>();
  const hoursQuery = useQuery(getUserWeekQuery(employeeId, selectedDate));
  const saveWeek = useMutation(userWeekMutation());
  const weeklyHours = hoursQuery.data;

  const regularHours = useMemo(
    () =>
      weekDays.reduce<number>((total, day) => {
        const editedValue = editedHours[day];
        const storedValue = weeklyHours?.[day].hours ?? 0;
        const value =
          editedValue !== undefined && isValidHoursInput(editedValue, 24)
            ? Number(editedValue)
            : storedValue;
        return total + value;
      }, 0),
    [editedHours, weeklyHours],
  );
  const additionalHoursValue =
    editedAdditionalHours !== undefined &&
    isValidHoursInput(editedAdditionalHours)
      ? Number(editedAdditionalHours)
      : (weeklyHours?.additionalHours?.hours ?? 0);
  const totalHours = regularHours + additionalHoursValue;
  const hasInvalidChanges =
    weekDays.some((day) => {
      const value = editedHours[day];
      return value !== undefined && !isValidHoursInput(value, 24);
    }) ||
    (editedAdditionalHours !== undefined &&
      !isValidHoursInput(editedAdditionalHours));
  const hasChanges =
    weekDays.some((day) => {
      const value = editedHours[day];
      return (
        value !== undefined &&
        isValidHoursInput(value, 24) &&
        Number(value) !== weeklyHours?.[day].hours
      );
    }) ||
    (editedAdditionalHours !== undefined &&
      isValidHoursInput(editedAdditionalHours) &&
      Number(editedAdditionalHours) !==
        (weeklyHours?.additionalHours?.hours ?? 0));

  const setDayHours = (day: WeekDay, value: string) => {
    setEditedHours((hours) => ({ ...hours, [day]: value }));
    setSaveError(undefined);
  };

  const setAdditionalHours = (value: string) => {
    setEditedAdditionalHours(value);
    setSaveError(undefined);
  };

  const normalizeDayHours = (day: WeekDay) => {
    const value = editedHours[day];
    if (value === undefined) return;
    setEditedHours((hours) => ({
      ...hours,
      [day]: normalizeHours(value),
    }));
  };

  const normalizeAdditionalHours = () => {
    if (editedAdditionalHours === undefined) return;
    setEditedAdditionalHours(normalizeHours(editedAdditionalHours));
  };

  const discard = () => {
    setEditedHours({});
    setEditedAdditionalHours(undefined);
    setSaveError(undefined);
  };

  const save = (onSuccess?: () => void) => {
    if (!weeklyHours || !hasChanges || hasInvalidChanges) return;
    const updatedWeek: WeeklyHours = { ...weeklyHours };
    for (const day of weekDays) {
      const value = editedHours[day];
      if (value !== undefined) {
        updatedWeek[day] = { ...weeklyHours[day], hours: Number(value) };
      }
    }
    if (editedAdditionalHours !== undefined) {
      updatedWeek.additionalHours = {
        ...weeklyHours.additionalHours,
        hours: Number(editedAdditionalHours),
      };
    }

    setSaveError(undefined);
    saveWeek.mutate({
      userId: employeeId,
      date: selectedDate,
      userWeek: updatedWeek,
      onSettled: ({ error }: { error?: unknown }) => {
        if (error) {
          setSaveError("Unable to save weekly hours. Please try again.");
          return;
        }
        discard();
        onSuccess?.();
      },
    });
  };

  return {
    discard,
    editedAdditionalHours,
    editedHours,
    hasChanges,
    hasInvalidChanges,
    normalizeAdditionalHours,
    normalizeDayHours,
    save,
    saveError,
    saving: saveWeek.isPending,
    setAdditionalHours,
    setDayHours,
    totalHours,
    weeklyHours,
  };
}
