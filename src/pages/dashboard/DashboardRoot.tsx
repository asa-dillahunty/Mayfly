import { auth } from "../../utils/firebase.ts";
import { useQuery } from "@tanstack/react-query";
import { getAdminDataQuery } from "../../utils/firebaseQueries.ts";
import { DashboardHeader } from "./DashboardHeader.tsx";

export function DashboardRoot() {
  const currentUserId = auth?.currentUser?.uid ?? "";

  const { data: adminData } = useQuery(getAdminDataQuery(currentUserId));
  // TODO: test for no admin data. how to handle? consider going to login

  return (
    <div className="dashboard-container">
      <DashboardHeader />
      {!adminData ? (
        <></>
      ) : adminData.omniAdmin ? (
        <div>omniAdmin</div>
      ) : adminData.isAdmin ? (
        <div>is admin</div>
      ) : (
        <div>is not admin</div>
      )}
      {currentUserId}
    </div>
  );
}
