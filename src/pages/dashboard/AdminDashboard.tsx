import ClickBlocker from "../../components/ClickBlocker";
import { useState } from "react";
import { getCurrentUserId } from "../../utils/firebase";
import { AiOutlinePrinter } from "react-icons/ai";
import EmployeeInfoForm from "../../components/EmployeeInfoForm";
import {
  AdminCompanyDisplayTable,
  DisplayTableSkeleton,
} from "../../components/DisplayTable";
import {
  getAdminDataQuery,
  getCompanyQuery,
} from "../../utils/firebaseQueries";
import { useQuery } from "@tanstack/react-query";
import { createPrintable } from "../../utils/reporting";

import styles from "./sass/AdminDashboard.module.scss";
import { NewDisplayTable } from "../../components/NewDisplayTable";

export default function AdminDashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [infoFormOpen, setInfoFormOpen] = useState(false);
  const [previewPDF, setPreviewPDF] = useState(false); // TODO: show an in-window preview of the PDF

  const currentUserId = getCurrentUserId();

  const { data: adminData, isLoading: isLoadingId } = useQuery(
    getAdminDataQuery(currentUserId),
  );
  const { data: companyData, isLoading: isLoadingCompany } = useQuery(
    getCompanyQuery(adminData?.company ?? ""),
  );

  const isLoading = isLoadingId || isLoadingCompany;

  if (isLoading) {
    return (
      <div className="dashboard-content contain-click-blocker skeleton">
        <DisplayTableSkeleton selectedDate={selectedDate} />
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="dashboard-content contain-click-blocker skeleton">
        <h3>There has been an error. Please refresh and report the issue</h3>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <NewDisplayTable
        company={companyData.id}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />
      {/* <AdminCompanyDisplayTable
        company={companyData}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        adminAble={false}
      /> */}

      <div className={styles.adminButtonsContainer}>
        <button
          className={styles.addEmpButton}
          onClick={() => {
            setInfoFormOpen(true);
          }}
        >
          Add Employee
        </button>
        <button
          className={styles.printButton}
          onClick={() => createPrintable(companyData, selectedDate)}
        >
          <AiOutlinePrinter />
        </button>
      </div>

      <ClickBlocker custom={true} block={infoFormOpen}>
        <EmployeeInfoForm
          setFormOpen={setInfoFormOpen}
          companyId={companyData.id}
          add
        />
      </ClickBlocker>
    </div>
  );
}
