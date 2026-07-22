import { useCallback, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AiOutlineLeft, AiOutlineRight } from "react-icons/ai";

import ClickBlocker from "./ClickBlocker";
import EmployeeInfoForm from "./EmployeeInfoForm";
import { getAdminDataQuery, getCompanyQuery } from "../utils/firebaseQueries";
import { getCurrentUserId } from "../utils/firebase";
import {
  ABBREVIATIONS,
  getEndOfWeekString,
  getPayPeriodArray,
  getStartOfWeekString,
} from "../utils/dateUtils";
import type { CompanyEmployee, WeekDay } from "../utils/dataModels";
import { EmployeeRow } from "./EmployeeRow";
import styles from "./sass/NewDisplayTable.module.scss";

interface DisplayTableProps {
  companyId: string;
}

const weekDays = getPayPeriodArray() as WeekDay[];

function jumpWeek(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

export function NewDisplayTable({ companyId }: DisplayTableProps) {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [addingEmployee, setAddingEmployee] = useState(false);
  const [openEmployeeMenuId, setOpenEmployeeMenuId] = useState<string | null>(
    null,
  );
  const addEmployeeButtonRef = useRef<HTMLButtonElement>(null);
  const currentUserId = getCurrentUserId();
  const adminQuery = useQuery(getAdminDataQuery(currentUserId));
  const companyQuery = useQuery(getCompanyQuery(companyId));
  const adminData = adminQuery.data;
  const companyData = companyQuery.data as
    | { id: string; name?: string; Employees?: CompanyEmployee[] }
    | undefined;
  const canManage = Boolean(
    adminData &&
    (adminData.omniAdmin ||
      (adminData.isAdmin && adminData.company === companyId)),
  );
  const employees = (
    (companyData?.Employees ?? []) as CompanyEmployee[]
  ).filter((employee) => !employee.unclaimed);

  const changeWeek = (amount: number) => {
    setOpenEmployeeMenuId(null);
    setSelectedDate((date) => jumpWeek(date, amount));
  };

  const handleEmployeeMenuOpenChange = useCallback(
    (employeeId: string, open: boolean) => {
      setOpenEmployeeMenuId(open ? employeeId : null);
    },
    [],
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
                onMenuOpenChange={handleEmployeeMenuOpenChange}
                selectedDate={selectedDate}
              />
            ))}
          </tbody>
        </table>
      </div>
      <button
        className={styles.addEmployeeButton}
        onClick={() => {
          setOpenEmployeeMenuId(null);
          setAddingEmployee(true);
        }}
        ref={addEmployeeButtonRef}
        type="button"
      >
        Add employee
      </button>
      {employees.length === 0 && (
        <p className={styles.emptyState}>No registered employees found.</p>
      )}
      <ClickBlocker block={addingEmployee} custom>
        <EmployeeInfoForm
          add
          admin={adminData?.omniAdmin === true}
          companyId={companyId}
          setFormOpen={(open) => {
            setAddingEmployee(open);
            if (!open) {
              requestAnimationFrame(() => addEmployeeButtonRef.current?.focus());
            }
          }}
        />
      </ClickBlocker>
    </section>
  );
}
