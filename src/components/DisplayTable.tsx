import { useCallback, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AiOutlineLeft, AiOutlineRight } from "react-icons/ai";

import { getAdminDataQuery, getCompanyQuery } from "../utils/firebaseQueries";
import { getCurrentUserId } from "../utils/firebase";
import {
  ABBREVIATIONS,
  getEndOfWeekString,
  getPayPeriodArray,
  getStartOfWeekString,
} from "../utils/dateUtils";
import type { WeekDay } from "../utils/dataModels";
import { EmployeeRow } from "./EmployeeRow";
import styles from "./sass/DisplayTable.module.scss";

interface DisplayTableProps {
  companyId: string;
  onSelectedDateChange: (date: Date) => void;
  onUnsavedChangesChange: (hasUnsavedChanges: boolean) => void;
  selectedDate: Date;
}

const weekDays = getPayPeriodArray() as WeekDay[];

function jumpWeek(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

export function DisplayTable({
  companyId,
  onSelectedDateChange,
  onUnsavedChangesChange,
  selectedDate,
}: DisplayTableProps) {
  const [openEmployeeMenuId, setOpenEmployeeMenuId] = useState<string | null>(
    null,
  );
  const dirtyEmployeeIdsRef = useRef(new Set<string>());
  const currentUserId = getCurrentUserId();
  const adminQuery = useQuery(getAdminDataQuery(currentUserId));
  const companyQuery = useQuery(getCompanyQuery(companyId));
  const adminData = adminQuery.data;
  const companyData = companyQuery.data;
  const canManage = Boolean(
    adminData &&
    (adminData.omniAdmin ||
      (adminData.isAdmin && adminData.company === companyId)),
  );
  const employees = companyData?.Employees ?? [];

  const changeWeek = (amount: number) => {
    setOpenEmployeeMenuId(null);
    onSelectedDateChange(jumpWeek(selectedDate, amount));
  };

  const handleEmployeeMenuOpenChange = useCallback(
    (employeeId: string, open: boolean) => {
      setOpenEmployeeMenuId(open ? employeeId : null);
    },
    [],
  );
  const handleEmployeeDirtyChange = useCallback(
    (employeeId: string, dirty: boolean) => {
      const dirtyEmployeeIds = dirtyEmployeeIdsRef.current;
      if (dirty) dirtyEmployeeIds.add(employeeId);
      else dirtyEmployeeIds.delete(employeeId);
      onUnsavedChangesChange(dirtyEmployeeIds.size > 0);
    },
    [onUnsavedChangesChange],
  );

  if (adminQuery.isLoading || companyQuery.isLoading)
    return <div className={styles.loading}>Loading employee table...</div>;
  if (adminQuery.isError || companyQuery.isError || !companyData)
    return (
      <div className={styles.error}>
        Unable to load this company's employee table.
      </div>
    );
  if (!canManage)
    return (
      <div className={styles.error}>
        You do not have permission to manage this company.
      </div>
    );

  return (
    <section className={styles.tableContainer}>
      <div className={styles.tableToolbar}>
        <h2>{companyData.name ?? "Company employees"}</h2>
        <div className={styles.dateRow}>
          <button
            aria-label="Previous week"
            onClick={() => changeWeek(-7)}
            type="button"
          >
            <AiOutlineLeft />
          </button>
          <span>
            {getStartOfWeekString(selectedDate)} -{" "}
            {getEndOfWeekString(selectedDate)}
          </span>
          <button
            aria-label="Next week"
            onClick={() => changeWeek(7)}
            type="button"
          >
            <AiOutlineRight />
          </button>
        </div>
      </div>
      <div className={styles.tableScroll}>
        <table className={styles.employeeTable}>
          <thead>
            <tr>
              <th aria-label="Employee actions" scope="col" />
              <th className={styles.employeeHeader} scope="col">
                Employee
              </th>
              {weekDays.map((day) => (
                <th key={day} scope="col">
                  {ABBREVIATIONS[day]}
                </th>
              ))}
              <th scope="col">Additional</th>
              <th className={styles.totalHeader} scope="col">
                Total
              </th>
              <th
                aria-label="Save regular hours"
                className={styles.saveHeader}
                scope="col"
              />
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <EmployeeRow
                canManage={canManage}
                companyId={companyId}
                companyName={companyData.name ?? "this company"}
                employee={employee}
                key={`${employee.id}-${selectedDate.toDateString()}`}
                menuOpen={openEmployeeMenuId === employee.id}
                onDirtyChange={handleEmployeeDirtyChange}
                onMenuOpenChange={handleEmployeeMenuOpenChange}
                selectedDate={selectedDate}
              />
            ))}
          </tbody>
        </table>
      </div>
      {employees.length === 0 && (
        <p className={styles.emptyState}>No registered employees found.</p>
      )}
    </section>
  );
}
