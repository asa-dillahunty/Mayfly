import type { CompanyEmployee, EmployeeData } from "../utils/dataModels.ts";
import {
  useCreateEmployee,
  useUpdateEmployeeData,
} from "../utils/firebaseQueries.ts";
import ClickBlocker from "./ClickBlocker";

import { useId, useState } from "react";
import type { ChangeEvent, MouseEvent, SubmitEvent } from "react";
import styles from "./sass/EmployeeInfoForm.module.scss";

const userDataDefault = {
  firstName: "",
  lastName: "",
  name: "",
  email: "",
  rate: 0,
  isAdmin: false,
};

type EmpInfoFormProps = {
  edit?: boolean;
  add?: boolean;
  empData?: CompanyEmployee;
  companyId: string;
  setFormOpen: (val: boolean) => void;
  admin?: boolean;
};

function EmployeeInfoForm({
  edit,
  add,
  empData,
  companyId,
  setFormOpen,
  admin,
}: EmpInfoFormProps) {
  const userData = { ...userDataDefault, ...empData };
  const fieldId = useId();
  const firstNameId = `${fieldId}-first-name`;
  const lastNameId = `${fieldId}-last-name`;
  const rateId = `${fieldId}-rate`;
  const rateErrorId = `${fieldId}-rate-error`;
  const emailId = `${fieldId}-email`;
  const adminId = `${fieldId}-admin`;

  const [firstName, setFirstName] = useState(userData.firstName);
  const [lastName, setLastName] = useState(userData.lastName);
  const [email, setEmail] = useState(userData.email);
  const [hourlyRate, setRate] = useState(String(userData.rate));
  const [isAdmin, setIsAdmin] = useState(userData.isAdmin);
  const [blocked, setBlocked] = useState(false);

  const parsedHourlyRate = Number(hourlyRate);
  const wageError =
    hourlyRate.trim() === "" ||
    !Number.isFinite(parsedHourlyRate) ||
    parsedHourlyRate < 0;

  const cancelForm = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setFormOpen(false);
  };

  const toggleIsAdmin = (e: ChangeEvent<HTMLInputElement>) => {
    setIsAdmin(e.target.checked);
  };

  const setEmployeeData = useUpdateEmployeeData();
  const createEmployee = useCreateEmployee();

  const submitChanges = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (wageError) {
      alert("Hourly Wage not valid");
      return;
    }
    setBlocked(true);
    // TODO:
    // 	do some checking on the data gathered from the form

    const updatedEmployee: EmployeeData & { email?: string; isAdmin: boolean } =
      {
        name: firstName + " " + lastName,
        firstName: firstName,
        lastName: lastName,
        rate: parsedHourlyRate,
        isAdmin: isAdmin,
      };
    if (email) updatedEmployee.email = email;

    if (edit) {
      setEmployeeData(userData.id!, companyId, updatedEmployee, () => {
        setBlocked(false);
        setFormOpen(false);
      });
    } else if (add) {
      const settleFunc = ({ error }: { error?: unknown }) => {
        // if an error, we don't close the form. Should we?
        if (error) {
          setBlocked(false);
        } else {
          setBlocked(false);
          setFormOpen(false);
        }
      };
      createEmployee(companyId, updatedEmployee, settleFunc);
    }
  };

  const trySetRate = (e: ChangeEvent<HTMLInputElement>) => {
    setRate(e.target.value);
  };

  return (
    <div className={styles.employeeInfoForm}>
      <h1 className={styles.title}>
        {edit ? "Edit Employee Info" : "Create New Employee"}
      </h1>
      <ClickBlocker block={blocked} loading />
      <form onSubmit={submitChanges}>
        <label htmlFor={firstNameId}>First Name:</label>
        <input
          className={styles.input}
          id={firstNameId}
          placeholder="First Name"
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <label htmlFor={lastNameId}>Last Name:</label>
        <input
          className={styles.input}
          id={lastNameId}
          placeholder="Last Name"
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        <label htmlFor={rateId}>Rate Per Hour:</label>
        <input
          aria-describedby={wageError ? rateErrorId : undefined}
          aria-invalid={wageError}
          className={styles.input}
          id={rateId}
          min="0"
          onChange={trySetRate}
          required
          step="0.01"
          type="number"
          value={hourlyRate}
        />
        {wageError && (
          <span className={styles.validationError} id={rateErrorId}>
            Enter an hourly rate of zero or greater.
          </span>
        )}
        {!add ? (
          ""
        ) : (
          <>
            <label htmlFor={emailId}>Email:</label>
            <input
              className={styles.input}
              id={emailId}
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </>
        )}
        {!admin ? (
          ""
        ) : (
          <div className={styles.checkboxContainer}>
            <input
              checked={isAdmin}
              id={adminId}
              name="isAdmin"
              onChange={toggleIsAdmin}
              type="checkbox"
            />
            <label htmlFor={adminId}>Is Admin?</label>
          </div>
        )}
        <div className={styles.buttonContainer}>
          <button
            className={styles.submitButton}
            disabled={blocked || wageError}
            type="submit"
          >
            Submit
          </button>
          <button
            className={styles.cancelButton}
            onClick={cancelForm}
            disabled={blocked}
            type="button"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default EmployeeInfoForm;
