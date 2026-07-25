import { useId, useRef, useState } from "react";
import type { RefObject, SubmitEvent } from "react";
import { AiOutlineClose } from "react-icons/ai";

import { ConfirmDialog } from "./ConfirmDialog";
import { HoursInput } from "./HoursInput";
import { ModalDialog } from "./ModalDialog";
import {
  ABBREVIATIONS,
  getEndOfWeekString,
  getPayPeriodArray,
  getStartOfWeekString,
} from "../utils/dateUtils";
import type { WeekDay, WeeklyHours } from "../utils/dataModels";
import styles from "./sass/MobileWeeklyHoursDialog.module.scss";

const weekDays = getPayPeriodArray() as WeekDay[];

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
  returnFocusRef?: RefObject<HTMLElement | null>;
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
  returnFocusRef,
  saveError,
  saving,
  selectedDate,
  totalHours,
  weeklyHours,
}: MobileWeeklyHoursDialogProps) {
  const titleId = useId();
  const weekId = useId();
  const [confirmingClose, setConfirmingClose] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const confirmReturnFocusRef = useRef<HTMLElement | null>(null);

  const isDirty = hasChanges || hasInvalidChanges;
  const payPeriodDates = getPayPeriodDates(selectedDate);

  const requestClose = () => {
    if (saving) return;
    if (isDirty) {
      const activeElement = document.activeElement;
      confirmReturnFocusRef.current =
        activeElement instanceof HTMLElement ? activeElement : null;
      setConfirmingClose(true);
      return;
    }
    onClose();
  };

  const submitHours = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasChanges || hasInvalidChanges || saving) return;
    setConfirmingClose(false);
    onSave();
  };

  return (
    <>
      <ModalDialog
        ariaDescribedBy={weekId}
        ariaLabelledBy={titleId}
        className={styles.modal}
        closeOnBackdrop
        dismissible={!saving}
        initialFocusRef={closeButtonRef}
        onRequestClose={requestClose}
        open={open}
        returnFocusRef={returnFocusRef}
      >
        {open && (
          <section className={styles.dialog}>
            <header className={styles.header}>
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
                className={styles.closeButton}
                disabled={saving}
                onClick={requestClose}
                ref={closeButtonRef}
                type="button"
              >
                <AiOutlineClose />
              </button>
            </header>

            <form className={styles.form} onSubmit={submitHours}>
              <div className={styles.content}>
                {!weeklyHours ? (
                  <p className={styles.loading}>Loading weekly hours...</p>
                ) : (
                  <div className={styles.hoursList}>
                    {weekDays.map((day, index) => {
                      const value =
                        editedHours[day] ?? String(weeklyHours[day].hours);
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
                          <HoursInput
                            className={styles.hoursInput}
                            disabled={saving}
                            draftValue={editedHours[day]}
                            maximum={24}
                            onBlur={() => onDayHoursBlur(day)}
                            onChange={(newValue) =>
                              onDayHoursChange(day, newValue)
                            }
                            value={value}
                          />
                        </label>
                      );
                    })}
                    <label className={styles.hoursRow}>
                      <span className={styles.hoursLabel}>Additional</span>
                      <HoursInput
                        className={styles.hoursInput}
                        disabled={saving}
                        draftValue={editedAdditionalHours}
                        onBlur={onAdditionalHoursBlur}
                        onChange={onAdditionalHoursChange}
                        value={
                          editedAdditionalHours ??
                          String(weeklyHours.additionalHours?.hours ?? 0)
                        }
                      />
                    </label>
                    <div className={`${styles.hoursRow} ${styles.totalRow}`}>
                      <span className={styles.hoursLabel}>Total</span>
                      <strong className={styles.totalValue}>
                        {totalHours}
                      </strong>
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
          </section>
        )}
      </ModalDialog>
      <ConfirmDialog
        cancelLabel="Continue editing"
        confirmLabel="Discard"
        message={`You have unsaved weekly hours for ${employeeName}.`}
        onCancel={() => setConfirmingClose(false)}
        onConfirm={() => {
          confirmReturnFocusRef.current = null;
          setConfirmingClose(false);
          onDiscard();
        }}
        open={open && confirmingClose}
        returnFocusRef={confirmReturnFocusRef}
        title="Discard your changes?"
      />
    </>
  );
}
