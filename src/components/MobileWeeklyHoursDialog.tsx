import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, SubmitEvent } from "react";
import { AiOutlineClose } from "react-icons/ai";

import {
  ABBREVIATIONS,
  getEndOfWeekString,
  getPayPeriodArray,
  getStartOfWeekString,
} from "../utils/dateUtils";
import type { WeekDay, WeeklyHours } from "../utils/dataModels";
import { isValidHoursInput } from "../utils/hourValidation";
import styles from "./sass/MobileWeeklyHoursDialog.module.scss";

const weekDays = getPayPeriodArray() as WeekDay[];
const focusableSelector =
  'button:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex="-1"])';

function getPayPeriodDates(selectedDate: Date) {
  const firstDay = new Date(selectedDate);
  while (firstDay.getDay() !== weekDays[0]) {
    firstDay.setDate(firstDay.getDate() - 1);
  }

  return weekDays.map((_, index) => {
    const date = new Date(firstDay);
    date.setDate(firstDay.getDate() + index);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });
}

interface MobileWeeklyHoursDialogProps {
  editedAdditionalHours?: string;
  editedHours: Partial<Record<WeekDay, string>>;
  employeeName: string;
  hasChanges: boolean;
  hasInvalidChanges: boolean;
  onAdditionalHoursBlur: () => void;
  onAdditionalHoursChange: (value: string) => void;
  onClose: () => void;
  onDayHoursBlur: (day: WeekDay) => void;
  onDayHoursChange: (day: WeekDay, value: string) => void;
  onDiscard: () => void;
  onSave: () => void;
  open: boolean;
  saveError?: string;
  saving: boolean;
  selectedDate: Date;
  totalHours: number;
  weeklyHours?: WeeklyHours;
}

export function MobileWeeklyHoursDialog({
  editedAdditionalHours,
  editedHours,
  employeeName,
  hasChanges,
  hasInvalidChanges,
  onAdditionalHoursBlur,
  onAdditionalHoursChange,
  onClose,
  onDayHoursBlur,
  onDayHoursChange,
  onDiscard,
  onSave,
  open,
  saveError,
  saving,
  selectedDate,
  totalHours,
  weeklyHours,
}: MobileWeeklyHoursDialogProps) {
  const titleId = useId();
  const weekId = useId();
  const confirmTitleId = useId();
  const [confirmingClose, setConfirmingClose] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const confirmDialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const isDirty = hasChanges || hasInvalidChanges;
  const payPeriodDates = getPayPeriodDates(selectedDate);

  const requestClose = () => {
    if (saving) return;
    if (isDirty) {
      setConfirmingClose(true);
      return;
    }
    onClose();
  };

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      if (confirmingClose) {
        setConfirmingClose(false);
        return;
      }
      requestClose();
      return;
    }

    if (event.key !== "Tab") return;
    const focusContainer = confirmingClose
      ? confirmDialogRef.current
      : dialogRef.current;
    if (!focusContainer) return;
    const focusableElements = Array.from(
      focusContainer.querySelectorAll<HTMLElement>(focusableSelector),
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

  const submitHours = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasChanges || hasInvalidChanges || saving) return;
    setConfirmingClose(false);
    onSave();
  };

  return (
    <div
      aria-labelledby={titleId}
      aria-describedby={weekId}
      aria-modal="true"
      className={styles.backdrop}
      onClick={requestClose}
      onKeyDown={handleDialogKeyDown}
      role="dialog"
    >
      <section
        className={styles.dialog}
        onClick={(event) => event.stopPropagation()}
        ref={dialogRef}
      >
        <header className={styles.header} inert={confirmingClose}>
          <div>
            <p className={styles.eyebrow}>Weekly hours</p>
            <h2 className={styles.title} id={titleId}>
              {employeeName}
            </h2>
            <p className={styles.week} id={weekId}>
              {getStartOfWeekString(selectedDate)} -{" "}
              {getEndOfWeekString(selectedDate)}
            </p>
          </div>
          <button
            aria-label="Close weekly hours"
            autoFocus
            className={styles.closeButton}
            disabled={saving}
            onClick={requestClose}
            type="button"
          >
            <AiOutlineClose />
          </button>
        </header>

        <form
          className={styles.form}
          inert={confirmingClose}
          onSubmit={submitHours}
        >
          <div className={styles.content}>
            {!weeklyHours ? (
              <p className={styles.loading}>Loading weekly hours...</p>
            ) : (
              <div className={styles.hoursList}>
                {weekDays.map((day, index) => {
                  const value =
                    editedHours[day] ?? String(weeklyHours[day].hours);
                  const isInvalid =
                    editedHours[day] !== undefined &&
                    !isValidHoursInput(editedHours[day], 24);
                  return (
                    <label className={styles.hoursRow} key={day}>
                      <span
                        className={`${styles.hoursLabel} ${styles.dayLabel}`}
                      >
                        <span>{ABBREVIATIONS[day]}</span>
                        <span className={styles.dateLabel}>
                          {payPeriodDates[index]}
                        </span>
                      </span>
                      <input
                        aria-invalid={isInvalid}
                        className={styles.hoursInput}
                        disabled={saving}
                        max="24"
                        min="0"
                        onBlur={() => onDayHoursBlur(day)}
                        onChange={(event) =>
                          onDayHoursChange(day, event.target.value)
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
                    </label>
                  );
                })}
                <label className={styles.hoursRow}>
                  <span className={styles.hoursLabel}>Additional</span>
                  <input
                    aria-invalid={
                      editedAdditionalHours !== undefined &&
                      !isValidHoursInput(editedAdditionalHours)
                    }
                    className={styles.hoursInput}
                    disabled={saving}
                    min="0"
                    onBlur={onAdditionalHoursBlur}
                    onChange={(event) =>
                      onAdditionalHoursChange(event.target.value)
                    }
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
                      String(weeklyHours.additionalHours?.hours ?? 0)
                    }
                  />
                </label>
                <div className={`${styles.hoursRow} ${styles.totalRow}`}>
                  <span className={styles.hoursLabel}>Total</span>
                  <strong className={styles.totalValue}>{totalHours}</strong>
                </div>
              </div>
            )}
            {saveError && (
              <p className={styles.saveError} role="alert">
                {saveError}
              </p>
            )}
          </div>

          <footer className={styles.footer}>
            <button
              className={styles.cancelButton}
              disabled={saving}
              onClick={requestClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className={styles.saveButton}
              disabled={
                !weeklyHours || !hasChanges || hasInvalidChanges || saving
              }
              type="submit"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </footer>
        </form>

        {confirmingClose && (
          <div className={styles.confirmBackdrop}>
            <section
              aria-labelledby={confirmTitleId}
              aria-modal="true"
              className={styles.confirmDialog}
              ref={confirmDialogRef}
              role="alertdialog"
            >
              <h3 id={confirmTitleId}>Discard your changes?</h3>
              <p>You have unsaved weekly hours for {employeeName}.</p>
              <div className={styles.confirmActions}>
                <button
                  autoFocus
                  className={styles.continueButton}
                  onClick={() => setConfirmingClose(false)}
                  type="button"
                >
                  Continue editing
                </button>
                <button
                  className={styles.discardButton}
                  onClick={() => {
                    setConfirmingClose(false);
                    onDiscard();
                  }}
                  type="button"
                >
                  Discard
                </button>
              </div>
            </section>
          </div>
        )}
      </section>
    </div>
  );
}
