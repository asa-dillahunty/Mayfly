import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  getCompanyQuery,
  getWeeklyReportDataQuery,
} from "../utils/firebaseQueries";
import type { PrintableEmployeeReportRow } from "../utils/dataModels";
import { getCompanyReportProfile } from "../utils/reportingConfig";

interface WeeklyReportState {
  clearError: () => void;
  companyLoading: boolean;
  createReport: (employees: PrintableEmployeeReportRow[]) => Promise<void>;
  error?: string;
  pending: boolean;
  reportDataError?: string;
  reportDataLoading: boolean;
  reportRows?: PrintableEmployeeReportRow[];
}

function prepareReportTab(reportWindow: Window) {
  const reportDocument = reportWindow.document;
  reportDocument.title = "Preparing weekly report";
  reportDocument.documentElement.lang = "en";

  const style = reportDocument.createElement("style");
  style.textContent = `
    :root {
      color: #0e1b08;
      background: #f7fcf5;
      font-family: Verdana, Geneva, Tahoma, sans-serif;
    }

    body {
      min-height: 100vh;
      margin: 0;
      display: grid;
      place-items: center;
    }

    main {
      display: flex;
      max-width: 28rem;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2rem;
      text-align: center;
    }

    .spinner {
      width: 2.5rem;
      height: 2.5rem;
      border: 0.3rem solid #9dd7d9;
      border-top-color: #54bc55;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    h1,
    p {
      margin: 0;
    }

    p {
      line-height: 1.5;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .spinner {
        animation: none;
      }
    }
  `;

  const status = reportDocument.createElement("main");
  status.setAttribute("aria-live", "polite");
  status.setAttribute("role", "status");

  const spinner = reportDocument.createElement("div");
  spinner.className = "spinner";
  spinner.setAttribute("aria-hidden", "true");

  const title = reportDocument.createElement("h1");
  title.textContent = "Preparing weekly report";

  const message = reportDocument.createElement("p");
  message.textContent =
    "Mayfly is generating the PDF. This tab will update automatically.";

  status.append(spinner, title, message);
  reportDocument.head.replaceChildren(style);
  reportDocument.body.replaceChildren(status);
}

function showReportTabError(reportWindow: Window, message: string) {
  const reportDocument = reportWindow.document;
  reportDocument.title = "Unable to create weekly report";
  const status = reportDocument.querySelector("main");
  const spinner = reportDocument.querySelector<HTMLElement>(".spinner");
  const title = reportDocument.querySelector("h1");
  const detail = reportDocument.querySelector("p");

  spinner?.remove();
  status?.setAttribute("role", "alert");
  if (title) title.textContent = "Unable to create weekly report";
  if (detail) detail.textContent = message;
}

export function useWeeklyReport(
  companyId: string | undefined,
  selectedDate: Date,
  loadReportData: boolean,
): WeeklyReportState {
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const companyQuery = useQuery(getCompanyQuery(companyId));
  const reportDataQuery = useQuery({
    ...getWeeklyReportDataQuery(companyId, selectedDate),
    enabled: loadReportData && Boolean(companyId),
  });

  const clearError = useCallback(() => setError(undefined), []);

  const createReport = useCallback(
    async (employees: PrintableEmployeeReportRow[]) => {
      setError(undefined);

      if (employees.length === 0) {
        setError("Select at least one employee to create a report.");
        return;
      }

      if (companyQuery.isError || !companyQuery.data) {
        setError(
          "Unable to load the company information needed for this report.",
        );
        return;
      }

      const companyProfile = getCompanyReportProfile(companyQuery.data.name);
      if (!companyProfile) {
        setError(
          "Weekly report configuration is not available for this company.",
        );
        return;
      }

      const reportWindow = window.open("", "_blank");
      if (!reportWindow) {
        setError(
          "The report window was blocked. Allow popups for Mayfly and try again.",
        );
        return;
      }

      reportWindow.opener = null;
      prepareReportTab(reportWindow);
      setPending(true);

      try {
        const { createPrintable } = await import("../utils/reporting");
        const reportUrl = await createPrintable({
          companyProfile,
          employees,
          selectedDate,
        });
        reportWindow.location.replace(reportUrl);
      } catch (reportCreationError) {
        console.error("Unable to create weekly report", reportCreationError);
        const message = "Unable to create the weekly report. Please try again.";
        setError(message);
        showReportTabError(reportWindow, message);
      } finally {
        setPending(false);
      }
    },
    [companyQuery.data, companyQuery.isError, selectedDate],
  );

  return {
    clearError,
    companyLoading: companyQuery.isLoading,
    createReport,
    error,
    pending,
    reportDataError: reportDataQuery.isError
      ? "Unable to load saved employee hours. Please try again."
      : undefined,
    reportDataLoading: reportDataQuery.isFetching,
    reportRows: reportDataQuery.data,
  };
}
