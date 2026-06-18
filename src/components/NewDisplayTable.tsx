import { useQuery } from "@tanstack/react-query";
import styles from "./sass/NewDisplayTable.module.scss";
import { getAdminDataQuery, getCompanyQuery } from "../utils/firebaseQueries";
import { getCurrentUserId } from "../utils/firebase";

export function NewDisplayTable() {
  const currentUserId = getCurrentUserId();

  const { data: adminData, isLoading: isLoadingUser } = useQuery(
    getAdminDataQuery(currentUserId),
  );
  const { data: companyData, isLoading: isLoadingCompany } = useQuery(
    getCompanyQuery(adminData?.company),
  );

  return (
    <div className={styles.dashboardContainer}>
      <p>{currentUserId}</p>
      <p>isLoadingUser: {isLoadingUser}</p>
      <p>isLoadingCompany: {isLoadingCompany}</p>
      <p>company: {adminData?.company}</p>
      <p>company: {companyData?.id}</p>
    </div>
  );
}
