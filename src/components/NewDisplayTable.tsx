import { useQuery } from "@tanstack/react-query";
import styles from "./sass/NewDisplayTable.module.scss";
import { getAdminDataQuery, getCompanyQuery } from "../utils/firebaseQueries";
import { getCurrentUserId } from "../utils/firebase";

export function NewDisplayTable() {
  const currentUserId = getCurrentUserId();

  const { data: adminData, isLoading: isLoadingId } = useQuery(
    getAdminDataQuery(currentUserId),
  );
  const { data: companyData, isLoading: isLoadingCompany } = useQuery(
    getCompanyQuery(adminData?.company),
  );

  return <div className={styles.dashboardContainer}></div>;
}
