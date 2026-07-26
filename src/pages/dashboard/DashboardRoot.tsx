import { getCurrentUserId } from "../../utils/firebase.ts";
import { useQuery } from "@tanstack/react-query";
import { getAdminDataQuery } from "../../utils/firebaseQueries.ts";
import DashboardHeader from "./DashboardHeader.tsx";
import EmployeeDashboard from "./EmployeeDashboard.tsx";
import AdminDashboard from "./AdminDashboard.tsx";
import OmniAdminDashboard from "./OmniAdmin.tsx";

import styles from "./sass/Dashboard.module.scss";

export default function DashboardRoot() {
  const currentUserId = getCurrentUserId();

  const { data: adminData } = useQuery(getAdminDataQuery(currentUserId));
  // TODO: test for no admin data. how to handle? consider going to login

  return (
    <div className={styles.dashboardContainer}>
      <DashboardHeader />
      {!adminData ? (
        <></>
      ) : adminData.omniAdmin ? (
        <OmniAdminDashboard />
      ) : adminData.isAdmin ? (
        <AdminDashboard />
      ) : (
        <EmployeeDashboard />
      )}
    </div>
  );
}
