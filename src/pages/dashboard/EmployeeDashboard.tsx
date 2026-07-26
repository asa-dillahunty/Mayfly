import HourAdder from "../../components/HourAdder";
import { useState } from "react";
import { auth } from "../../utils/firebase/firebaseAuth";

export default function EmployeeDashboard() {
  const [blocked, setBlocked] = useState(false);

  const currentUserId = auth?.currentUser?.uid ?? "";

  return (
    <div>
      <HourAdder
        showNotes
        uid={currentUserId}
        blocked={blocked}
        setBlocked={setBlocked}
      />
    </div>
  );
}
