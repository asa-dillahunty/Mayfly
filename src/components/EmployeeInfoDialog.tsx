import { useId, useState } from "react";
import type { RefObject } from "react";

import EmployeeInfoForm from "./EmployeeInfoForm";
import { ModalDialog } from "./ModalDialog";
import type { CompanyEmployee } from "../utils/dataModels";

interface EmployeeInfoDialogProps {
  add?: boolean;
  admin?: boolean;
  companyId: string;
  edit?: boolean;
  employee?: CompanyEmployee;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

export function EmployeeInfoDialog({
  add,
  admin,
  companyId,
  edit,
  employee,
  onOpenChange,
  open,
  returnFocusRef,
}: EmployeeInfoDialogProps) {
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
        <EmployeeInfoForm
          add={add}
          admin={admin}
          companyId={companyId}
          edit={edit}
          empData={employee}
          onPendingChange={setPending}
          setFormOpen={onOpenChange}
          titleId={titleId}
        />
      )}
    </ModalDialog>
  );
}
