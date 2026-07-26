import { useId } from "react";
import { RingLoader } from "react-spinners";

import { ModalDialog } from "./ModalDialog";
import styles from "./sass/LoadingDialog.module.scss";

interface LoadingDialogProps {
  message: string;
}

const ignoreCloseRequest = () => {};

export function LoadingDialog({ message }: LoadingDialogProps) {
  const messageId = useId();

  return (
    <ModalDialog
      ariaLabelledBy={messageId}
      className={styles.dialog}
      dismissible={false}
      onRequestClose={ignoreCloseRequest}
      open
    >
      <div aria-busy="true" className={styles.content}>
        <span aria-hidden="true" className={styles.spinner}>
          <RingLoader color="currentColor" />
        </span>
        <p aria-live="polite" className={styles.message} id={messageId}>
          {message}
        </p>
      </div>
    </ModalDialog>
  );
}
