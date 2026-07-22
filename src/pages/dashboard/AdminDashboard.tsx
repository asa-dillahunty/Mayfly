import { useQuery } from "@tanstack/react-query";

import { NewDisplayTable } from "../../components/NewDisplayTable";
import { getCurrentUserId } from "../../utils/firebase";
import { getAdminDataQuery } from "../../utils/firebaseQueries";
import styles from "./sass/AdminDashboard.module.scss";

export default function AdminDashboard() {
  const currentUserId = getCurrentUserId();
  const { data: adminData, isLoading, isError } = useQuery(
    getAdminDataQuery(currentUserId),
  );

  if (isLoading) return <div className={styles.dashboardContainer}>Loading dashboard...</div>;
  if (isError || !adminData?.company) {
    return (
      <div className={styles.dashboardContainer}>
        There has been an error loading your company. Please refresh and report the issue.
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <NewDisplayTable companyId={adminData.company} />
    </div>
  );
}
