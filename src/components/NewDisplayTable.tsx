import { useQuery } from "@tanstack/react-query";
import styles from "./sass/NewDisplayTable.module.scss";
import { getAdminDataQuery, getCompanyQuery } from "../utils/firebaseQueries";
import { getCurrentUserId } from "../utils/firebase";

interface DisplayTableProps {
  companyId?: string;
  selectedDate: Date;
  setSelectedDate: () => {}; // TODO: update this
}

export function NewDisplayTable({
  companyId,
  selectedDate,
  setSelectedDate,
}: DisplayTableProps) {
  const currentUserId = getCurrentUserId();

  const { data: adminData, isLoading: isLoadingUser } = useQuery(
    getAdminDataQuery(currentUserId),
  );

  // if not provided a companyId, infer it from current user
  const { data: companyData, isLoading: isLoadingCompany } = useQuery(
    getCompanyQuery(companyId ? companyId : adminData?.company),
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
