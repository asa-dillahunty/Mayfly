import { useId, useState } from "react";
import type { FormEvent, RefObject } from "react";

import { ModalDialog } from "./ModalDialog";
import { useCreateCompany } from "../utils/firebaseQueries";
import styles from "./sass/CreateCompanyDialog.module.scss";

interface CreateCompanyDialogProps {
  onCompanyCreated: (companyId: string) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

interface CreateCompanyFormProps {
  onCancel: () => void;
  onCompanyCreated: (companyId: string) => void;
  onPendingChange: (pending: boolean) => void;
  pending: boolean;
  titleId: string;
}

function CreateCompanyForm({
  onCancel,
  onCompanyCreated,
  onPendingChange,
  pending,
  titleId,
}: CreateCompanyFormProps) {
  const fieldId = useId();
  const errorId = useId();
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const createCompany = useCreateCompany();
  const trimmedCompanyName = companyName.trim();

  const submitCompany = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedCompanyName || pending) return;

    setError(null);
    onPendingChange(true);

    try {
      const companyDocument = await createCompany(trimmedCompanyName);
      onPendingChange(false);
      onCompanyCreated(companyDocument.id);
    } catch {
      onPendingChange(false);
      setError(
        "Unable to create the company. Check your connection and try again.",
      );
    }
  };

  return (
    <form
      aria-busy={pending}
      aria-describedby={error ? errorId : undefined}
      className={styles.form}
      onSubmit={submitCompany}
    >
      <h2 className={styles.title} id={titleId}>
        Create company
      </h2>
      <label htmlFor={fieldId}>Company name</label>
      <input
        autoComplete="organization"
        autoFocus
        className={styles.input}
        disabled={pending}
        id={fieldId}
        onChange={(event) => setCompanyName(event.target.value)}
        type="text"
        value={companyName}
      />
      {error && (
        <p className={styles.error} id={errorId} role="alert">
          {error}
        </p>
      )}
      <div className={styles.actions}>
        <button
          className={styles.cancelButton}
          disabled={pending}
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
        <button
          className={styles.createButton}
          disabled={pending || !trimmedCompanyName}
          type="submit"
        >
          {pending ? "Creating..." : "Create company"}
        </button>
      </div>
    </form>
  );
}

export function CreateCompanyDialog({
  onCompanyCreated,
  onOpenChange,
  open,
  returnFocusRef,
}: CreateCompanyDialogProps) {
  const titleId = useId();
  const [pending, setPending] = useState(false);

  const requestClose = () => {
    if (!pending) onOpenChange(false);
  };

  return (
    <ModalDialog
      ariaLabelledBy={titleId}
      dismissible={!pending}
      onRequestClose={requestClose}
      open={open}
      returnFocusRef={returnFocusRef}
    >
      {open && (
        <CreateCompanyForm
          onCancel={requestClose}
          onCompanyCreated={onCompanyCreated}
          onPendingChange={setPending}
          pending={pending}
          titleId={titleId}
        />
      )}
    </ModalDialog>
  );
}
