import { auth } from "../../utils/firebase.ts";
import { useQuery } from "@tanstack/react-query";
import { getAdminDataQuery } from "../../utils/firebaseQueries.ts";
import { DashboardHeader } from "./DashboardHeader.tsx";

import styles from "./sass/Dashboard.module.scss";
import EmployeeDashboard from "./EmployeeDashboard.tsx";

export function DashboardRoot() {
  const currentUserId = auth?.currentUser?.uid ?? "";

  const { data: adminData } = useQuery(getAdminDataQuery(currentUserId));
  // TODO: test for no admin data. how to handle? consider going to login

  return (
    <div className={styles.dashboardContainer}>
      <DashboardHeader />
      {!adminData ? (
        <></>
      ) : adminData.omniAdmin ? (
        <div>
          omniAdmin
          {currentUserId}
        </div>
      ) : adminData.isAdmin ? (
        <div>
          is admin
          {currentUserId}
        </div>
      ) : (
        <EmployeeDashboard />
      )}
    </div>
  );
}
