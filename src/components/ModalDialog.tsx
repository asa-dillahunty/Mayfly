import { useEffect, useRef } from "react";
import type { ReactNode, RefObject } from "react";

import styles from "./sass/ModalDialog.module.scss";

interface ModalDialogProps {
  ariaDescribedBy?: string;
  ariaLabelledBy: string;
  children: ReactNode;
  className?: string;
  closeOnBackdrop?: boolean;
  dismissible?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onRequestClose: () => void;
  open: boolean;
  returnFocusRef?: RefObject<HTMLElement | null>;
  role?: "alertdialog" | "dialog";
}

export function ModalDialog({
  ariaDescribedBy,
  ariaLabelledBy,
  children,
  className,
  closeOnBackdrop = false,
  dismissible = true,
  initialFocusRef,
  onRequestClose,
  open,
  returnFocusRef,
  role = "dialog",
}: ModalDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) dialog.showModal();
      initialFocusRef?.current?.focus();
      wasOpenRef.current = true;
      return;
    }

    if (!wasOpenRef.current) return;
    if (dialog.open) dialog.close();
    wasOpenRef.current = false;

    const returnTarget = returnFocusRef?.current;
    if (returnTarget?.isConnected) {
      requestAnimationFrame(() => returnTarget.focus());
    }
  }, [initialFocusRef, open, returnFocusRef]);

  useEffect(
    () => () => {
      const dialog = dialogRef.current;
      if (dialog?.open) dialog.close();
    },
    [],
  );

  return (
    <dialog
      aria-describedby={ariaDescribedBy}
      aria-labelledby={ariaLabelledBy}
      aria-modal="true"
      className={`${styles.dialog} ${className ?? ""}`}
      onClick={(event) => {
        if (
          !closeOnBackdrop ||
          !dismissible ||
          event.target !== event.currentTarget
        )
          return;

        const bounds = event.currentTarget.getBoundingClientRect();
        const clickedOutsideDialog =
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom;
        if (clickedOutsideDialog) onRequestClose();
      }}
      onCancel={(event) => {
        event.preventDefault();
        if (dismissible) onRequestClose();
      }}
      ref={dialogRef}
      role={role}
    >
      {children}
    </dialog>
  );
}
