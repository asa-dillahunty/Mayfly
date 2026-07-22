import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AiOutlineMore } from "react-icons/ai";
import { FaSave } from "react-icons/fa";

import ClickBlocker from "./ClickBlocker";
import EmployeeInfoForm from "./EmployeeInfoForm";
import { MobileWeeklyHoursDialog } from "./MobileWeeklyHoursDialog";
import {
  getAdminDataQuery,
  getCompanyEmployeeQuery,
  getUserWeekQuery,
  useRemoveEmployee,
  userWeekMutation,
} from "../utils/firebaseQueries";
import { ABBREVIATIONS, getPayPeriodArray } from "../utils/dateUtils";
import {
  isValidHoursInput,
  normalizeHours,
} from "../utils/hourValidation";
import type { CompanyEmployee, WeekDay, WeeklyHours } from "../utils/dataModels";
import styles from "./sass/EmployeeRow.module.scss";

const weekDays = getPayPeriodArray() as WeekDay[];
const openMenuListeners = new Set<(employeeId: string) => void>();

export interface EmployeeRowProps {
  employee: CompanyEmployee;
  companyId: string;
  companyName: string;
  selectedDate: Date;
  canManage: boolean;
}

export function EmployeeRow({
  employee,
  companyId,
  companyName,
  selectedDate,
  canManage,
}: EmployeeRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingHours, setEditingHours] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editedHours, setEditedHours] = useState<
    Partial<Record<WeekDay, string>>
  >({});
  const [editedAdditionalHours, setEditedAdditionalHours] = useState<
    string | undefined
  >();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const actionMenuId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const rowMenuRef = useRef<HTMLDivElement>(null);

  const employeeQuery = useQuery(
    getCompanyEmployeeQuery(companyId, employee.id),
  );
  const employeeAdminQuery = useQuery(getAdminDataQuery(employee.id));
  const hoursQuery = useQuery(getUserWeekQuery(employee.id, selectedDate));
  const removeEmployee = useRemoveEmployee();
  const saveWeek = useMutation(userWeekMutation());
  const weeklyHours = hoursQuery.data;
  const queriedEmployee = employeeQuery.data as
    | Partial<CompanyEmployee>
    | undefined;
  const employeeData = (
    queriedEmployee?.id ? queriedEmployee : employee
  ) as CompanyEmployee;

  useEffect(() => {
    const closeWhenAnotherMenuOpens = (openEmployeeId: string) => {
      if (openEmployeeId !== employee.id) setMenuOpen(false);
    };
    openMenuListeners.add(closeWhenAnotherMenuOpens);
    return () => {
      openMenuListeners.delete(closeWhenAnotherMenuOpens);
    };
  }, [employee.id]);

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
      setMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };

    document.addEventListener("pointerdown", closeOnOutsideInteraction);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideInteraction);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  const toggleMenu = () => {
    const opening = !menuOpen;
    if (opening) {
      for (const listener of openMenuListeners) listener(employee.id);
    }
    setMenuOpen(opening);
  };

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

  const regularHours = useMemo(
    () =>
      weekDays.reduce<number>(
        (total, day) => {
          const editedValue = editedHours[day];
          const storedValue = weeklyHours?.[day].hours ?? 0;
          const value =
            editedValue !== undefined &&
            isValidHoursInput(editedValue, 24)
              ? Number(editedValue)
              : storedValue;
          return total + value;
        },
        0,
      ),
    [editedHours, weeklyHours],
  );
  const additionalHoursValue =
    editedAdditionalHours !== undefined &&
    isValidHoursInput(editedAdditionalHours)
      ? Number(editedAdditionalHours)
      : (weeklyHours?.additionalHours?.hours ?? 0);
  const totalHours = regularHours + additionalHoursValue;
  const hasInvalidChanges =
    weekDays.some((day) => {
      const value = editedHours[day];
      return value !== undefined && !isValidHoursInput(value, 24);
    }) ||
    (editedAdditionalHours !== undefined &&
      !isValidHoursInput(editedAdditionalHours));
  const hasChanges =
    weekDays.some((day) => {
      const value = editedHours[day];
      return (
        value !== undefined &&
        isValidHoursInput(value, 24) &&
        Number(value) !== weeklyHours?.[day].hours
      );
    }) ||
    (editedAdditionalHours !== undefined &&
      isValidHoursInput(editedAdditionalHours) &&
      Number(editedAdditionalHours) !==
        (weeklyHours?.additionalHours?.hours ?? 0));

  const normalizeRegularHours = (day: WeekDay) => {
    const value = editedHours[day];
    if (value === undefined) return;
    setEditedHours((hours) => ({
      ...hours,
      [day]: normalizeHours(value),
    }));
  };

  const normalizeAdditionalHours = () => {
    if (editedAdditionalHours === undefined) return;
    setEditedAdditionalHours(normalizeHours(editedAdditionalHours));
  };

  const discardEditedHours = () => {
    setEditedHours({});
    setEditedAdditionalHours(undefined);
    setSaveError(undefined);
  };

  const saveHours = (onSuccess?: () => void) => {
    if (!weeklyHours || !hasChanges || hasInvalidChanges) return;
    const updatedWeek: WeeklyHours = { ...weeklyHours };
    for (const day of weekDays) {
      const value = editedHours[day];
      if (value !== undefined) {
        updatedWeek[day] = { ...weeklyHours[day], hours: Number(value) };
      }
    }
    if (editedAdditionalHours !== undefined) {
      updatedWeek.additionalHours = {
        ...weeklyHours.additionalHours,
        hours: Number(editedAdditionalHours),
      };
    }

    setSaving(true);
    setSaveError(undefined);
    saveWeek.mutate({
      userId: employee.id,
      date: selectedDate,
      userWeek: updatedWeek,
      onSettled: ({ error }: { error?: unknown }) => {
        setSaving(false);
        if (error) {
          setSaveError("Unable to save weekly hours. Please try again.");
          return;
        }
        discardEditedHours();
        onSuccess?.();
      },
    });
  };

  const deleteEmployee = () => {
    setSaving(true);
    removeEmployee(employee.id, companyId, () => {
      setConfirmDelete(false);
      setSaving(false);
    });
  };

  if (employeeAdminQuery.data?.hidden) return null;

  return (
    <tr className={styles.employeeRow}>
      <td className={styles.actionCell}>
        <button
          aria-controls={menuOpen ? actionMenuId : undefined}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label={`Actions for ${employeeData.name}`}
          className={styles.menuButton}
          disabled={!canManage || saving}
          onClick={toggleMenu}
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
                setSaveError(undefined);
                setEditingHours(true);
                setMenuOpen(false);
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
                setMenuOpen(false);
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
                setMenuOpen(false);
              }}
              role="menuitem"
              type="button"
            >
              Remove employee
            </button>
          </div>
        )}
        <MobileWeeklyHoursDialog
          editedAdditionalHours={editedAdditionalHours}
          editedHours={editedHours}
          employeeName={employeeData.name}
          hasChanges={hasChanges}
          hasInvalidChanges={hasInvalidChanges}
          onAdditionalHoursBlur={normalizeAdditionalHours}
          onAdditionalHoursChange={(value) => {
            setEditedAdditionalHours(value);
            setSaveError(undefined);
          }}
          onClose={closeHoursDialog}
          onDayHoursBlur={normalizeRegularHours}
          onDayHoursChange={(day, value) => {
            setEditedHours((hours) => ({ ...hours, [day]: value }));
            setSaveError(undefined);
          }}
          onDiscard={() => {
            discardEditedHours();
            closeHoursDialog();
          }}
          onSave={() => saveHours(closeHoursDialog)}
          open={editingHours}
          saveError={saveError}
          saving={saving}
          selectedDate={selectedDate}
          totalHours={totalHours}
          weeklyHours={weeklyHours}
        />
        <ClickBlocker block={editingEmployee} custom>
          <EmployeeInfoForm
            companyId={companyId}
            edit
            empData={employeeData}
            setFormOpen={(open) => {
              setEditingEmployee(open);
              if (!open) restoreMenuButtonFocus();
            }}
          />
        </ClickBlocker>
        <ClickBlocker
          block={confirmDelete}
          confirm
          message={`Are you sure you want to remove ${employeeData.name} from ${companyName}?`}
          messageEmphasized="This action cannot be undone."
          onCancel={() => {
            setConfirmDelete(false);
            restoreMenuButtonFocus();
          }}
          onConfirm={deleteEmployee}
        />
        <ClickBlocker block={saving} loading />
      </td>
      <th className={styles.nameCell} scope="row">
        {employeeData.name}
      </th>
      {weekDays.map((day) => {
        const value =
          editedHours[day] ?? String(weeklyHours?.[day].hours ?? 0);
        const isInvalid =
          editedHours[day] !== undefined &&
          !isValidHoursInput(editedHours[day], 24);
        return (
          <td className={styles.dayCell} key={day}>
            <input
              aria-invalid={isInvalid}
              aria-label={`${ABBREVIATIONS[day]} hours for ${employeeData.name}`}
              className={styles.hoursInput}
              disabled={!canManage || !weeklyHours || saving}
              max="24"
              min="0"
              onBlur={() => normalizeRegularHours(day)}
              onChange={(event) =>
                setEditedHours((hours) => ({
                  ...hours,
                  [day]: event.target.value,
                }))
              }
              step="0.5"
              title={
                isInvalid
                  ? "Enter 0 to 24 hours in half-hour increments."
                  : undefined
              }
              type="number"
              value={value}
            />
          </td>
        );
      })}
      <td className={styles.additionalCell}>
        <input
          aria-invalid={
            editedAdditionalHours !== undefined &&
            !isValidHoursInput(editedAdditionalHours)
          }
          aria-label={`Additional hours for ${employeeData.name}`}
          className={styles.hoursInput}
          disabled={!canManage || !weeklyHours || saving}
          min="0"
          onBlur={normalizeAdditionalHours}
          onChange={(event) => setEditedAdditionalHours(event.target.value)}
          step="0.5"
          title={
            editedAdditionalHours !== undefined &&
            !isValidHoursInput(editedAdditionalHours)
              ? "Enter zero or more hours in half-hour increments."
              : undefined
          }
          type="number"
          value={
            editedAdditionalHours ??
            String(weeklyHours?.additionalHours?.hours ?? 0)
          }
        />
      </td>
      <td className={styles.totalCell}>
        {totalHours}
      </td>
      <td className={styles.saveCell}>
        {(hasChanges || hasInvalidChanges) && (
          <button
            aria-label={`Save hours for ${employeeData.name}`}
            className={styles.saveButton}
            disabled={
              !canManage || !hasChanges || hasInvalidChanges || saving
            }
            onClick={() => saveHours()}
            type="button"
          >
            <FaSave />
          </button>
        )}
      </td>
    </tr>
  );
}
