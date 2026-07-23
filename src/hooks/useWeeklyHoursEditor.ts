import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { getUserWeekQuery, userWeekMutation } from "../utils/firebaseQueries";
import { normalizeHours } from "../utils/hourValidation";
import {
  analyzeWeeklyHoursDraft,
  applyWeeklyHoursDraft,
} from "../utils/weeklyHours";
import type { WeekDay, WeeklyHours } from "../utils/dataModels";

export interface WeeklyHoursEditor {
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

/**
 * Edits one user's selected week for the lifetime of the mounted hook.
 * Callers that change the user or week should remount the hook's component.
 */
export function useWeeklyHoursEditor(
  userId: string,
  selectedDate: Date,
): WeeklyHoursEditor {
  const [editedHours, setEditedHours] = useState<
    Partial<Record<WeekDay, string>>
  >({});
  const [editedAdditionalHours, setEditedAdditionalHours] = useState<
    string | undefined
  >();
  const [saveError, setSaveError] = useState<string>();
  const hoursQuery = useQuery(getUserWeekQuery(userId, selectedDate));
  const saveWeek = useMutation(userWeekMutation());
  const weeklyHours = hoursQuery.data;

  const { hasChanges, hasInvalidChanges, totalHours } = useMemo(
    () =>
      analyzeWeeklyHoursDraft(weeklyHours, {
        editedAdditionalHours,
        editedHours,
      }),
    [editedAdditionalHours, editedHours, weeklyHours],
  );

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
    const updatedWeek = applyWeeklyHoursDraft(weeklyHours, {
      editedAdditionalHours,
      editedHours,
    });

    setSaveError(undefined);
    saveWeek.mutate({
      userId,
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
