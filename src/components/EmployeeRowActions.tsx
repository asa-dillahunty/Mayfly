import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { AiOutlineMore } from "react-icons/ai";

import ClickBlocker from "./ClickBlocker";
import EmployeeInfoForm from "./EmployeeInfoForm";
import { MobileWeeklyHoursDialog } from "./MobileWeeklyHoursDialog";
import { useRemoveEmployee } from "../utils/firebaseQueries";
import type { CompanyEmployee } from "../utils/dataModels";
import type { EmployeeWeekEditor } from "./useEmployeeWeekEditor";
import styles from "./sass/EmployeeRow.module.scss";

interface EmployeeRowActionsProps {
  canManage: boolean;
  companyId: string;
  companyName: string;
  editor: EmployeeWeekEditor;
  employee: CompanyEmployee;
  menuOpen: boolean;
  onMenuOpenChange: (employeeId: string, open: boolean) => void;
  selectedDate: Date;
}

export function EmployeeRowActions({
  canManage,
  companyId,
  companyName,
  editor,
  employee,
  menuOpen,
  onMenuOpenChange,
  selectedDate,
}: EmployeeRowActionsProps) {
  const [editingHours, setEditingHours] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [removing, setRemoving] = useState(false);
  const actionMenuId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const rowMenuRef = useRef<HTMLDivElement>(null);
  const removeEmployee = useRemoveEmployee();
  const busy = editor.saving || removing;

  useEffect(() => {
    if (!menuOpen) return;

    const closeOnOutsideInteraction = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (
        rowMenuRef.current?.contains(target) ||
        menuButtonRef.current?.contains(target)
      )
        return;
      onMenuOpenChange(employee.id, false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      onMenuOpenChange(employee.id, false);
      menuButtonRef.current?.focus();
    };

    document.addEventListener("pointerdown", closeOnOutsideInteraction);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideInteraction);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [employee.id, menuOpen, onMenuOpenChange]);

  const navigateMenu = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!rowMenuRef.current) return;
    const menuItems = Array.from(
      rowMenuRef.current.querySelectorAll<HTMLButtonElement>(
        'button[role="menuitem"]:not(:disabled)',
      ),
    ).filter((menuItem) => menuItem.offsetParent !== null);
    if (menuItems.length === 0) return;
    const currentIndex = menuItems.indexOf(
      document.activeElement as HTMLButtonElement,
    );
    let nextIndex: number | undefined;

    if (event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % menuItems.length;
    } else if (event.key === "ArrowUp") {
      nextIndex =
        (currentIndex - 1 + menuItems.length) % menuItems.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = menuItems.length - 1;
    }

    if (nextIndex === undefined) return;
    event.preventDefault();
    menuItems[nextIndex].focus();
  };

  const restoreMenuButtonFocus = () => {
    requestAnimationFrame(() => menuButtonRef.current?.focus());
  };

  const closeHoursDialog = () => {
    setEditingHours(false);
    restoreMenuButtonFocus();
  };

  const deleteEmployee = () => {
    setRemoving(true);
    removeEmployee(employee.id, companyId, () => {
      setConfirmDelete(false);
      setRemoving(false);
    });
  };

  return (
    <td className={styles.actionCell}>
      <button
        aria-controls={menuOpen ? actionMenuId : undefined}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label={`Actions for ${employee.name}`}
        className={styles.menuButton}
        disabled={!canManage || busy}
        onClick={() => onMenuOpenChange(employee.id, !menuOpen)}
        ref={menuButtonRef}
        type="button"
      >
        <AiOutlineMore />
      </button>
      {menuOpen && (
        <div
          className={styles.rowMenu}
          id={actionMenuId}
          onKeyDown={navigateMenu}
          ref={rowMenuRef}
          role="menu"
        >
          <button
            className={`${styles.menuItem} ${styles.mobileHoursAction}`}
            onClick={() => {
              setEditingHours(true);
              onMenuOpenChange(employee.id, false);
            }}
            role="menuitem"
            type="button"
          >
            Edit hours
          </button>
          <button
            className={styles.menuItem}
            onClick={() => {
              setEditingEmployee(true);
              onMenuOpenChange(employee.id, false);
            }}
            role="menuitem"
            type="button"
          >
            Edit employee information
          </button>
          <button
            className={`${styles.menuItem} ${styles.dangerAction}`}
            onClick={() => {
              setConfirmDelete(true);
              onMenuOpenChange(employee.id, false);
            }}
            role="menuitem"
            type="button"
          >
            Remove employee
          </button>
        </div>
      )}
      <MobileWeeklyHoursDialog
        editedAdditionalHours={editor.editedAdditionalHours}
        editedHours={editor.editedHours}
        employeeName={employee.name}
        hasChanges={editor.hasChanges}
        hasInvalidChanges={editor.hasInvalidChanges}
        onAdditionalHoursBlur={editor.normalizeAdditionalHours}
        onAdditionalHoursChange={editor.setAdditionalHours}
        onClose={closeHoursDialog}
        onDayHoursBlur={editor.normalizeDayHours}
        onDayHoursChange={editor.setDayHours}
        onDiscard={() => {
          editor.discard();
          closeHoursDialog();
        }}
        onSave={() => editor.save(closeHoursDialog)}
        open={editingHours}
        saveError={editor.saveError}
        saving={editor.saving}
        selectedDate={selectedDate}
        totalHours={editor.totalHours}
        weeklyHours={editor.weeklyHours}
      />
      <ClickBlocker block={editingEmployee} custom>
        <EmployeeInfoForm
          companyId={companyId}
          edit
          empData={employee}
          setFormOpen={(open) => {
            setEditingEmployee(open);
            if (!open) restoreMenuButtonFocus();
          }}
        />
      </ClickBlocker>
      <ClickBlocker
        block={confirmDelete}
        confirm
        message={`Are you sure you want to remove ${employee.name} from ${companyName}?`}
        messageEmphasized="This action cannot be undone."
        onCancel={() => {
          setConfirmDelete(false);
          restoreMenuButtonFocus();
        }}
        onConfirm={deleteEmployee}
      />
      <ClickBlocker block={busy} loading />
    </td>
  );
}
