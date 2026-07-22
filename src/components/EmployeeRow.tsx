import { useQuery } from "@tanstack/react-query";
import { FaSave } from "react-icons/fa";

import { EmployeeRowActions } from "./EmployeeRowActions";
import { useEmployeeWeekEditor } from "./useEmployeeWeekEditor";
import {
  getAdminDataQuery,
  getCompanyEmployeeQuery,
} from "../utils/firebaseQueries";
import { ABBREVIATIONS, getPayPeriodArray } from "../utils/dateUtils";
import { isValidHoursInput } from "../utils/hourValidation";
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
  onMenuOpenChange: (employeeId: string, open: boolean) => void;
}

export function EmployeeRow({
  employee,
  companyId,
  companyName,
  selectedDate,
  canManage,
  menuOpen,
  onMenuOpenChange,
}: EmployeeRowProps) {
  const employeeQuery = useQuery(
    getCompanyEmployeeQuery(companyId, employee.id),
  );
  const employeeAdminQuery = useQuery(getAdminDataQuery(employee.id));
  const editor = useEmployeeWeekEditor(employee.id, selectedDate);
  const queriedEmployee = employeeQuery.data as
    | Partial<CompanyEmployee>
    | undefined;
  const employeeData = (
    queriedEmployee?.id ? queriedEmployee : employee
  ) as CompanyEmployee;

  if (employeeAdminQuery.data?.hidden) return null;

  return (
    <tr className={styles.employeeRow}>
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
        const value =
          editor.editedHours[day] ??
          String(editor.weeklyHours?.[day].hours ?? 0);
        const isInvalid =
          editor.editedHours[day] !== undefined &&
          !isValidHoursInput(editor.editedHours[day], 24);
        return (
          <td className={styles.dayCell} key={day}>
            <input
              aria-invalid={isInvalid}
              aria-label={`${ABBREVIATIONS[day]} hours for ${employeeData.name}`}
              className={styles.hoursInput}
              disabled={!canManage || !editor.weeklyHours || editor.saving}
              max="24"
              min="0"
              onBlur={() => editor.normalizeDayHours(day)}
              onChange={(event) =>
                editor.setDayHours(day, event.target.value)
              }
              step="0.5"
              title={
                isInvalid
                  ? "Enter 0 to 24 hours in half-hour increments."
                  : undefined
              }
              type="number"
              value={value}
            />
          </td>
        );
      })}
      <td className={styles.additionalCell}>
        <input
          aria-invalid={
            editor.editedAdditionalHours !== undefined &&
            !isValidHoursInput(editor.editedAdditionalHours)
          }
          aria-label={`Additional hours for ${employeeData.name}`}
          className={styles.hoursInput}
          disabled={!canManage || !editor.weeklyHours || editor.saving}
          min="0"
          onBlur={editor.normalizeAdditionalHours}
          onChange={(event) =>
            editor.setAdditionalHours(event.target.value)
          }
          step="0.5"
          title={
            editor.editedAdditionalHours !== undefined &&
            !isValidHoursInput(editor.editedAdditionalHours)
              ? "Enter zero or more hours in half-hour increments."
              : undefined
          }
          type="number"
          value={
            editor.editedAdditionalHours ??
            String(editor.weeklyHours?.additionalHours?.hours ?? 0)
          }
        />
      </td>
      <td className={styles.totalCell}>{editor.totalHours}</td>
      <td className={styles.saveCell}>
        {(editor.hasChanges || editor.hasInvalidChanges) && (
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
            type="button"
          >
            <FaSave />
          </button>
        )}
      </td>
    </tr>
  );
}
