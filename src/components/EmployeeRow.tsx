import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { FaSave, FaUndo } from "react-icons/fa";

import { EmployeeRowActions } from "./EmployeeRowActions";
import { HoursInput } from "./HoursInput";
import { useWeeklyHoursEditor } from "../hooks/useWeeklyHoursEditor";
import {
  getAdminDataQuery,
  getCompanyEmployeeQuery,
} from "../utils/firebase/firebaseQueries";
import { ABBREVIATIONS, getPayPeriodArray } from "../utils/dateUtils";
import type { CompanyEmployee, WeekDay } from "../utils/dataModels";
import styles from "./sass/EmployeeRow.module.scss";

const weekDays = getPayPeriodArray() as WeekDay[];

export interface EmployeeRowProps {
  employee: CompanyEmployee;
  companyId: string;
  companyName: string;
  selectedDate: Date;
  canManage: boolean;
  menuOpen: boolean;
  onDirtyChange: (employeeId: string, dirty: boolean) => void;
  onMenuOpenChange: (employeeId: string, open: boolean) => void;
}

export function EmployeeRow({
  employee,
  companyId,
  companyName,
  selectedDate,
  canManage,
  menuOpen,
  onDirtyChange,
  onMenuOpenChange,
}: EmployeeRowProps) {
  const employeeQuery = useQuery(
    getCompanyEmployeeQuery(companyId, employee.id),
  );
  const employeeAdminQuery = useQuery(getAdminDataQuery(employee.id));
  const editor = useWeeklyHoursEditor(employee.id, selectedDate);
  const queriedEmployee = employeeQuery.data as
    | Partial<CompanyEmployee>
    | undefined;
  const employeeData = (
    queriedEmployee?.id ? queriedEmployee : employee
  ) as CompanyEmployee;
  const saveButtonVisible = editor.hasChanges || editor.hasInvalidChanges;

  useEffect(() => {
    onDirtyChange(employee.id, saveButtonVisible);
    return () => onDirtyChange(employee.id, false);
  }, [employee.id, onDirtyChange, saveButtonVisible]);

  if (employeeAdminQuery.data?.hidden) return null;

  return (
    <tr
      className={`${styles.employeeRow} ${
        saveButtonVisible ? styles.editedRow : ""
      }`}
    >
      <EmployeeRowActions
        canManage={canManage}
        companyId={companyId}
        companyName={companyName}
        editor={editor}
        employee={employeeData}
        menuOpen={menuOpen}
        onMenuOpenChange={onMenuOpenChange}
        selectedDate={selectedDate}
      />
      <th className={styles.nameCell} scope="row">
        {employeeData.name}
      </th>
      {weekDays.map((day) => {
        const savedValue = editor.weeklyHours?.[day].hours ?? 0;
        const draftValue = editor.editedHours[day];
        const value = draftValue ?? String(savedValue);
        const edited =
          draftValue !== undefined &&
          (draftValue.trim() === "" || Number(draftValue) !== savedValue);
        return (
          <td className={styles.dayCell} key={day}>
            <HoursInput
              ariaLabel={`${ABBREVIATIONS[day]} hours for ${employeeData.name}`}
              className={styles.hoursInput}
              disabled={!canManage || !editor.weeklyHours || editor.saving}
              draftValue={draftValue}
              edited={edited}
              maximum={24}
              onBlur={() => editor.normalizeDayHours(day)}
              onChange={(newValue) => editor.setDayHours(day, newValue)}
              value={value}
            />
          </td>
        );
      })}
      <td className={styles.additionalCell}>
        <HoursInput
          ariaLabel={`Additional hours for ${employeeData.name}`}
          className={styles.hoursInput}
          disabled={!canManage || !editor.weeklyHours || editor.saving}
          draftValue={editor.editedAdditionalHours}
          edited={
            editor.editedAdditionalHours !== undefined &&
            (editor.editedAdditionalHours.trim() === "" ||
              Number(editor.editedAdditionalHours) !==
                (editor.weeklyHours?.additionalHours?.hours ?? 0))
          }
          onBlur={editor.normalizeAdditionalHours}
          onChange={editor.setAdditionalHours}
          value={
            editor.editedAdditionalHours ??
            String(editor.weeklyHours?.additionalHours?.hours ?? 0)
          }
        />
      </td>
      <td className={styles.totalCell}>{editor.totalHours}</td>
      <td className={styles.saveCell}>
        <div
          className={`${styles.saveActions} ${
            saveButtonVisible ? "" : styles.hiddenSaveActions
          }`}
        >
          <button
            aria-label={`Discard hour changes for ${employeeData.name}`}
            className={styles.discardButton}
            disabled={!canManage || editor.saving}
            onClick={editor.discard}
            tabIndex={saveButtonVisible ? undefined : -1}
            title="Discard changes"
            type="button"
          >
            <FaUndo />
          </button>
          <button
            aria-label={`Save hours for ${employeeData.name}`}
            className={styles.saveButton}
            disabled={
              !canManage ||
              !editor.hasChanges ||
              editor.hasInvalidChanges ||
              editor.saving
            }
            onClick={() => editor.save()}
            tabIndex={saveButtonVisible ? undefined : -1}
            title="Save changes"
            type="button"
          >
            <FaSave />
          </button>
        </div>
      </td>
    </tr>
  );
}
