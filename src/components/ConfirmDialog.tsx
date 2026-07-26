import { useId, useRef } from "react";
import type { ReactNode, RefObject } from "react";

import { ModalDialog } from "./ModalDialog";
import styles from "./sass/ConfirmDialog.module.scss";

interface ConfirmDialogProps {
  cancelLabel?: string;
  confirmLabel?: string;
  emphasizedMessage?: ReactNode;
  message: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  pending?: boolean;
  pendingLabel?: string;
  returnFocusRef?: RefObject<HTMLElement | null>;
  title: ReactNode;
}

export function ConfirmDialog({
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  emphasizedMessage,
  message,
  onCancel,
  onConfirm,
  open,
  pending = false,
  pendingLabel = "Working...",
  returnFocusRef,
  title,
}: ConfirmDialogProps) {
  const titleId = useId();
  const messageId = useId();
  const emphasizedMessageId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const descriptionIds = emphasizedMessage
    ? `${messageId} ${emphasizedMessageId}`
    : messageId;

  return (
    <ModalDialog
      ariaDescribedBy={descriptionIds}
      ariaLabelledBy={titleId}
      className={styles.dialog}
      dismissible={!pending}
      initialFocusRef={cancelButtonRef}
      onRequestClose={onCancel}
      open={open}
      returnFocusRef={returnFocusRef}
      role="alertdialog"
    >
      <section aria-busy={pending} className={styles.content}>
        <h2 className={styles.title} id={titleId}>
          {title}
        </h2>
        <p className={styles.message} id={messageId}>
          {message}
        </p>
        {emphasizedMessage && (
          <p className={styles.emphasizedMessage} id={emphasizedMessageId}>
            {emphasizedMessage}
          </p>
        )}
        <div className={styles.actions}>
          <button
            className={styles.cancelButton}
            disabled={pending}
            onClick={onCancel}
            ref={cancelButtonRef}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className={styles.confirmButton}
            disabled={pending}
            onClick={onConfirm}
            type="button"
          >
            {pending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </section>
    </ModalDialog>
  );
}
