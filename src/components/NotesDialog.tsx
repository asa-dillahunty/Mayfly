import { useId, useState } from "react";
import type { RefObject } from "react";

import { ModalDialog } from "./ModalDialog";
import NotesForm from "./NotesForm";

interface NotesDialogProps {
  date: Date;
  defaultNotes?: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  returnFocusRef?: RefObject<HTMLElement | null>;
  uid: string;
}

export function NotesDialog({
  date,
  defaultNotes,
  onOpenChange,
  open,
  returnFocusRef,
  uid,
}: NotesDialogProps) {
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
        <NotesForm
          date={date}
          defaultNotes={defaultNotes}
          onClose={() => onOpenChange(false)}
          onPendingChange={setPending}
          titleId={titleId}
          uid={uid}
        />
      )}
    </ModalDialog>
  );
}
