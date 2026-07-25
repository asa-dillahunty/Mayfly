import { useCallback, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AiOutlinePrinter } from "react-icons/ai";

import { EmployeeInfoDialog } from "../../components/EmployeeInfoDialog";
import { NewDisplayTable } from "../../components/NewDisplayTable";
import { WeeklyReportDialog } from "../../components/WeeklyReportDialog";
import { useWeeklyReport } from "../../hooks/useWeeklyReport";
import { getCurrentUserId } from "../../utils/firebase";
import { getAdminDataQuery } from "../../utils/firebaseQueries";
import styles from "./sass/AdminDashboard.module.scss";

export default function AdminDashboard() {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [addingEmployee, setAddingEmployee] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportDialogSession, setReportDialogSession] = useState(0);
  const addEmployeeButtonRef = useRef<HTMLButtonElement>(null);
  const printButtonRef = useRef<HTMLButtonElement>(null);
  const currentUserId = getCurrentUserId();
  const {
    data: adminData,
    isLoading,
    isError,
  } = useQuery(getAdminDataQuery(currentUserId));
  const {
    clearError: clearReportError,
    companyLoading: reportCompanyLoading,
    createReport,
    error: reportError,
    pending: reportPending,
    reportDataError,
    reportDataLoading,
    reportRows,
  } = useWeeklyReport(adminData?.company, selectedDate, reportDialogOpen);

  const handleSelectedDateChange = useCallback(
    (date: Date) => {
      setHasUnsavedChanges(false);
      setReportDialogOpen(false);
      clearReportError();
      setSelectedDate(date);
    },
    [clearReportError],
  );

  const requestReport = () => {
    clearReportError();
    setReportDialogSession((session) => session + 1);
    setReportDialogOpen(true);
  };

  if (isLoading)
    return (
      <div className={styles.dashboardContainer}>Loading dashboard...</div>
    );
  if (isError || !adminData?.company) {
    return (
      <div className={styles.dashboardContainer}>
        There has been an error loading your company. Please refresh and report
        the issue.
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <NewDisplayTable
        companyId={adminData.company}
        onSelectedDateChange={handleSelectedDateChange}
        onUnsavedChangesChange={setHasUnsavedChanges}
        selectedDate={selectedDate}
      />
      <div className={styles.adminActions}>
        <button
          className={styles.addEmployeeButton}
          onClick={() => setAddingEmployee(true)}
          ref={addEmployeeButtonRef}
          type="button"
        >
          Add employee
        </button>
        <button
          aria-busy={reportPending}
          className={styles.printButton}
          disabled={reportPending || reportCompanyLoading}
          onClick={requestReport}
          ref={printButtonRef}
          type="button"
        >
          <AiOutlinePrinter aria-hidden="true" />
          {reportPending ? "Preparing report..." : "Print weekly report"}
        </button>
      </div>
      {reportError && (
        <p className={styles.reportError} role="alert">
          {reportError}
        </p>
      )}
      <EmployeeInfoDialog
        add
        admin={adminData.omniAdmin}
        companyId={adminData.company}
        onOpenChange={setAddingEmployee}
        open={addingEmployee}
        returnFocusRef={addEmployeeButtonRef}
      />
      <WeeklyReportDialog
        dataError={reportDataError}
        employees={reportRows}
        hasUnsavedChanges={hasUnsavedChanges}
        key={reportDialogSession}
        loading={reportDataLoading}
        onCancel={() => setReportDialogOpen(false)}
        onCreateReport={(employees) => {
          setReportDialogOpen(false);
          void createReport(employees);
        }}
        open={reportDialogOpen}
        returnFocusRef={printButtonRef}
        selectedDate={selectedDate}
      />
    </div>
  );
}
