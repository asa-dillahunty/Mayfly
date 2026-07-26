import { lazy, Suspense } from "react";
import { getCurrentUserId } from "../../utils/firebase/firebaseAuth.ts";
import { useQuery } from "@tanstack/react-query";
import { getAdminDataQuery } from "../../utils/firebase/firebaseQueries.ts";
import DashboardHeader from "./DashboardHeader.tsx";

import styles from "./sass/Dashboard.module.scss";

const EmployeeDashboard = lazy(() => import("./EmployeeDashboard.tsx"));
const AdminDashboard = lazy(() => import("./AdminDashboard.tsx"));
const OmniAdminDashboard = lazy(() => import("./OmniAdmin.tsx"));

export default function DashboardRoot() {
  const currentUserId = getCurrentUserId();

  const { data: adminData } = useQuery(getAdminDataQuery(currentUserId));
  // TODO: test for no admin data. how to handle? consider going to login

  const Dashboard = !adminData
    ? null
    : adminData.omniAdmin
      ? OmniAdminDashboard
      : adminData.isAdmin
        ? AdminDashboard
        : EmployeeDashboard;

  return (
    <div className={styles.dashboardContainer}>
      <DashboardHeader />
      {Dashboard && (
        <Suspense fallback={<div>Loading dashboard...</div>}>
          <Dashboard />
        </Suspense>
      )}
    </div>
  );
}
