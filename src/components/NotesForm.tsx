import { useState } from "react";
import type { ChangeEvent, SubmitEvent } from "react";

import { useSetNotes } from "../utils/firebase/firebaseQueries";
import styles from "./sass/NotesForm.module.scss";

interface NotesFormProps {
  date: Date;
  defaultNotes?: string;
  onClose: () => void;
  onPendingChange?: (pending: boolean) => void;
  titleId: string;
  uid: string;
}

export default function NotesForm({
  date,
  defaultNotes,
  onClose,
  onPendingChange,
  titleId,
  uid,
}: NotesFormProps) {
  const [myNotes, setMyNotes] = useState(defaultNotes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const setNotes = useSetNotes();

  const setPending = (pending: boolean) => {
    setSubmitting(pending);
    onPendingChange?.(pending);
  };

  const submitChanges = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setPending(true);
    setNotes(uid, date, myNotes, () => {
      setPending(false);
      onClose();
    });
  };

  const updateNotes = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setMyNotes(event.target.value);
  };

  return (
    <form
      aria-busy={submitting}
      className={styles.addNotesForm}
      onSubmit={submitChanges}
    >
      <h2 className={styles.title} id={titleId}>
        Work notes
      </h2>
      <textarea
        autoFocus
        className={styles.notesInput}
        disabled={submitting}
        name="notes-area"
        onChange={updateNotes}
        placeholder="Notes"
        value={myNotes}
      />
      <div className={styles.buttonContainer}>
        <button
          className={styles.cancelButton}
          disabled={submitting}
          onClick={onClose}
          type="button"
        >
          Cancel
        </button>
        <button
          className={styles.submitButton}
          disabled={submitting}
          type="submit"
        >
          {submitting ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
