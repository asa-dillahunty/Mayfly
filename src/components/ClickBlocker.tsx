import { useId, useRef } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { RingLoader } from "react-spinners";

import styles from "./sass/ClickBlocker.module.scss";

const focusableSelector =
  'button:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex="-1"])';

interface ClickBlockerProps {
  block: boolean;
  children?: ReactNode;
  confirm?: boolean;
  custom?: boolean;
  loading?: boolean;
  message?: ReactNode;
  messageEmphasized?: ReactNode;
  onCancel?: () => void;
  onConfirm?: () => void;
}

function ClickBlocker({
  block,
  children,
  confirm,
  custom,
  loading,
  message,
  messageEmphasized,
  onCancel,
  onConfirm,
}: ClickBlockerProps) {
  if (!block) return null;
  if (loading) {
    return (
      <div
        aria-label="Loading"
        className={`${styles.blocker} ${styles.loading}`}
        role="status"
      >
        <RingLoader color="#ffffff" />
      </div>
    );
  }
  if (custom) {
    return (
      <div className={`${styles.blocker} ${styles.fast}`}>
        <div className={styles.childContainer}>{children}</div>
      </div>
    );
  }
  if (confirm && onConfirm && onCancel) {
    return (
      <div className={`${styles.blocker} ${styles.fast}`}>
        <ConfirmDialog
          message={message}
          messageEmphasized={messageEmphasized}
          onCancel={onCancel}
          onConfirm={onConfirm}
        />
      </div>
    );
  }
  return <div className={styles.blocker} />;
}

interface ConfirmDialogProps {
  message?: ReactNode;
  messageEmphasized?: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmDialog({
  message,
  messageEmphasized,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const messageId = useId();
  const emphasizedMessageId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
      return;
    }
    if (event.key !== "Tab" || !dialogRef.current) return;
    const focusableElements = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector),
    );
    if (focusableElements.length === 0) return;
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  return (
    <div className={styles.childContainer}>
      <div
        aria-describedby={
          messageEmphasized ? emphasizedMessageId : undefined
        }
        aria-labelledby={messageId}
        aria-modal="true"
        className={styles.confirmContainer}
        onKeyDown={handleDialogKeyDown}
        ref={dialogRef}
        role="alertdialog"
      >
        <p className={styles.confirmMessage} id={messageId}>
          {message}
        </p>
        {messageEmphasized && (
          <p
            className={styles.confirmMessageEmphasized}
            id={emphasizedMessageId}
          >
            {messageEmphasized}
          </p>
        )}
        <div className={styles.buttonContainer}>
          <button
            className={styles.confirmButton}
            onClick={onConfirm}
            type="button"
          >
            Confirm
          </button>
          <button
            autoFocus
            className={styles.cancelButton}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClickBlocker;
