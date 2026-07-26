import { useState } from "react";
import { usePerformLogout } from "../../utils/firebase.ts";
import styles from "./sass/DashboardHeader.module.scss";

export default function DashboardHeader() {
  const [blocked, setBlocked] = useState(false);
  // TODO: we do not need blocked here. We can use react query to prevent multiple posts and get loading status for logging out
  const performLogout = usePerformLogout();

  const handleLogout = async () => {
    setBlocked(true);
    try {
      await performLogout();
      setBlocked(false);
    } catch (e) {
      setBlocked(false);
      console.error(
        "Error code 7034: " +
          (e instanceof Error ? e.message : "Unknown logout error"),
      );
    }
  };

  return (
    <div className={styles.headerContainer}>
      <h1>Mayfly</h1>
      <button
        className={styles.logoutButton}
        onClick={handleLogout}
        disabled={blocked}
      >
        Log Out
      </button>
    </div>
  );
}
