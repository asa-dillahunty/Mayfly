import ClickBlocker from "../../components/ClickBlocker";
import HourAdder from "../../components/HourAdder";
import { useState } from "react";
import { auth } from "../../utils/firebase";

export default function EmployeeDashboard() {
  const [blocked, setBlocked] = useState(false);

  const currentUserId = auth?.currentUser?.uid ?? "";

  return (
    <div>
      <ClickBlocker block={blocked} />

      <HourAdder
        showNotes
        uid={currentUserId}
        blocked={blocked}
        setBlocked={setBlocked}
      />
    </div>
  );
}
