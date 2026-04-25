import { useEffect, useState } from "react";
import { useSetNotes } from "../utils/firebaseQueries";
import ClickBlocker from "./ClickBlocker";

import styles from "./sass/NotesForm.module.scss";

export default function NotesForm({ setBlocked, uid, date, defaultNotes }) {
  const [myNotes, setMyNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const setNotes = useSetNotes();
  const submitChanges = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setNotes(uid, date, myNotes, () => {
      setSubmitting(false);
      setBlocked(false); // close the form
    });
  };

  const cancelForm = (e) => {
    e.preventDefault();
    setBlocked(false);
  };

  useEffect(() => {
    const notes = defaultNotes ? defaultNotes : "";
    setMyNotes(notes);
  }, [defaultNotes]);

  return (
    <form className={styles.addNotesForm} onSubmit={submitChanges}>
      <ClickBlocker block={submitting} loading />
      <textarea
        name="notes-area"
        className={styles.notesInput}
        placeholder="Notes"
        value={myNotes}
        onChange={(e) => setMyNotes(e.target.value)}
      />
      <div className={styles.buttonContainer}>
        <button
          className={styles.submitButton}
          onClick={submitChanges}
          disabled={submitting}
        >
          Save
        </button>
        <button
          className={styles.cancelButton}
          onClick={cancelForm}
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
