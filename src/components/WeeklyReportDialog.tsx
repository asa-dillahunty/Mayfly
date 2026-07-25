import { useId, useRef, useState } from "react";
import type { FormEvent, RefObject } from "react";

import { ModalDialog } from "./ModalDialog";
import { getEndOfWeekString, getStartOfWeekString } from "../utils/dateUtils";
import type { PrintableEmployeeReportRow } from "../utils/dataModels";
import styles from "./sass/WeeklyReportDialog.module.scss";

interface WeeklyReportDialogProps {
  dataError?: string;
  employees?: PrintableEmployeeReportRow[];
  hasUnsavedChanges: boolean;
  loading: boolean;
  onCancel: () => void;
  onCreateReport: (employees: PrintableEmployeeReportRow[]) => void;
  open: boolean;
  returnFocusRef?: RefObject<HTMLElement | null>;
  selectedDate: Date;
}

export function WeeklyReportDialog({
  dataError,
  employees,
  hasUnsavedChanges,
  loading,
  onCancel,
  onCreateReport,
  open,
  returnFocusRef,
  selectedDate,
}: WeeklyReportDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const warningId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const [selectionOverrides, setSelectionOverrides] = useState<
    Record<string, boolean>
  >({});
  const reportEmployees = employees ?? [];
  const dataLoading = loading || (!employees && !dataError);
  const selectedEmployees = reportEmployees.filter(
    (employee) => selectionOverrides[employee.id] ?? employee.paidHours > 0,
  );
  const descriptionIds = hasUnsavedChanges
    ? `${descriptionId} ${warningId}`
    : descriptionId;

  const setAllEmployeesSelected = (selected: boolean) => {
    setSelectionOverrides(
      Object.fromEntries(
        reportEmployees.map((employee) => [employee.id, selected]),
      ),
    );
  };

  const submitReport = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedEmployees.length > 0) onCreateReport(selectedEmployees);
  };

  return (
    <ModalDialog
      ariaDescribedBy={descriptionIds}
      ariaLabelledBy={titleId}
      className={styles.dialog}
      initialFocusRef={cancelButtonRef}
      onRequestClose={onCancel}
      open={open}
      returnFocusRef={returnFocusRef}
    >
      <form
        aria-busy={dataLoading}
        className={styles.content}
        onSubmit={submitReport}
      >
        <header className={styles.header}>
          <h2 id={titleId}>Print weekly report</h2>
          <p id={descriptionId}>
            Choose employees for {getStartOfWeekString(selectedDate)} -{" "}
            {getEndOfWeekString(selectedDate)}.
          </p>
        </header>

        {hasUnsavedChanges && (
          <p className={styles.warning} id={warningId}>
            This report uses saved hours. Unsaved changes will not appear.
          </p>
        )}

        {dataLoading && (
          <p className={styles.status} role="status">
            Loading saved employee hours...
          </p>
        )}

        {!dataLoading && dataError && (
          <p className={styles.error} role="alert">
            {dataError}
          </p>
        )}

        {!dataLoading && !dataError && reportEmployees.length === 0 && (
          <p className={styles.status}>No visible employees found.</p>
        )}

        {!dataLoading && !dataError && reportEmployees.length > 0 && (
          <>
            <div className={styles.bulkActions}>
              <button
                className={styles.bulkButton}
                disabled={selectedEmployees.length === reportEmployees.length}
                onClick={() => setAllEmployeesSelected(true)}
                type="button"
              >
                Select all
              </button>
              <button
                className={styles.bulkButton}
                disabled={selectedEmployees.length === 0}
                onClick={() => setAllEmployeesSelected(false)}
                type="button"
              >
                Clear all
              </button>
            </div>
            <fieldset className={styles.employeeFieldset}>
              <legend>Employees</legend>
              <ul className={styles.employeeList}>
                {reportEmployees.map((employee) => {
                  const selected =
                    selectionOverrides[employee.id] ?? employee.paidHours > 0;
                  return (
                    <li key={employee.id}>
                      <label className={styles.employeeOption}>
                        <input
                          checked={selected}
                          onChange={(event) =>
                            setSelectionOverrides((overrides) => ({
                              ...overrides,
                              [employee.id]: event.target.checked,
                            }))
                          }
                          type="checkbox"
                        />
                        <span>{employee.name}</span>
                        <span className={styles.hours}>
                          {employee.paidHours}{" "}
                          {employee.paidHours === 1 ? "hour" : "hours"}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          </>
        )}

        <div className={styles.actions}>
          <button
            className={styles.cancelButton}
            onClick={onCancel}
            ref={cancelButtonRef}
            type="button"
          >
            Cancel
          </button>
          <button
            className={styles.createButton}
            disabled={
              dataLoading ||
              Boolean(dataError) ||
              selectedEmployees.length === 0
            }
            type="submit"
          >
            Create report
            {selectedEmployees.length > 0
              ? ` (${selectedEmployees.length})`
              : ""}
          </button>
        </div>
      </form>
    </ModalDialog>
  );
}
