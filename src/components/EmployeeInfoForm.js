import {
  useCreateEmployee,
  useUpdateEmployeeData,
} from "../utils/firebaseQueries.ts";
import ClickBlocker from "./ClickBlocker";

import "./EmployeeInfoForm.css";
import { useState } from "react";

const userDataDefault = {
  firstName: "",
  lastName: "",
  name: "",
  email: "",
  rate: 0,
  isAdmin: false,
};

// type EmpInfoFormProps = {
//   edit?: boolean;
//   add?: boolean;
//   empData?: UserDate;
//   companyId: string;
//   setFormOpen: (val:boolean)=>{};
//   admin?:boolean;
// }

function EmployeeInfoForm({
  edit,
  add,
  empData,
  companyId,
  setFormOpen,
  admin,
}) {
  const userData = { ...userDataDefault, ...empData };

  const [firstName, setFirstName] = useState(userData.firstName);
  const [lastName, setLastName] = useState(userData.lastName);
  const [email, setEmail] = useState(userData.email);
  const [hourlyRate, setRate] = useState(userData.rate);
  const [isAdmin, setIsAdmin] = useState(userData.isAdmin);
  const [wageError, setRateError] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const cancelForm = (e) => {
    e.preventDefault();
    setFormOpen(false);
  };

  const toggleIsAdmin = (_e) => {
    setIsAdmin(document.getElementById("admin-checkbox").checked);
  };

  const setEmployeeData = useUpdateEmployeeData();
  const createEmployee = useCreateEmployee();

  const submitChanges = (e) => {
    e.preventDefault();
    if (wageError) {
      alert("Hourly Wage not valid");
      return;
    }
    setBlocked(true);
    // TODO:
    // 	do some checking on the data gathered from the form
    //	Edit needs to check if a user is "unclaimed" and persist that property

    const empData = {
      name: firstName + " " + lastName,
      firstName: firstName,
      lastName: lastName,
      rate: hourlyRate,
      isAdmin: isAdmin,
    };
    if (email) empData.email = email; // why wouldn't there be an email? -> when users edit instead of add

    if (edit) {
      setEmployeeData(userData.id, companyId, empData, () => {
        setBlocked(false);
        setFormOpen(false);
      });
    } else if (add) {
      const settleFunc = ({ error }) => {
        // if an error, we don't close the form. Should we?
        if (error) {
          setBlocked(false);
        } else {
          setBlocked(false);
          setFormOpen(false);
        }
      };
      createEmployee(companyId, empData, settleFunc);
    }
  };

  const trySetRate = (e) => {
    setRate(e.target.value);
    setRateError(isNaN(e.target.value) || isNaN(parseFloat(e.target.value)));
  };

  return (
    <div className="employee-info-form">
      <h1 className="login-title">
        {edit ? "Edit Employee Info" : "Create New Employee"}
      </h1>
      <ClickBlocker block={blocked} loading />
      <form onSubmit={submitChanges}>
        <label htmlFor="employee-first-name">First Name:</label>
        <input
          type="name"
          className="name-input"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <label htmlFor="employee-last-name">Last Name:</label>
        <input
          type="name"
          className="name-input"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        <label htmlFor="employee-wage">
          Rate Per Hour:
          {wageError && <span className="error-asterisk">*</span>}
        </label>
        <input
          type="number"
          className="name-input"
          value={hourlyRate}
          onChange={trySetRate}
        />
        {!add ? (
          ""
        ) : (
          <>
            <label htmlFor="employee-email">Email:</label>
            <input
              type="email"
              className="name-input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </>
        )}
        {!admin ? (
          ""
        ) : (
          <div className="checkbox-container">
            <input
              type="checkbox"
              id="admin-checkbox"
              name="isAdmin"
              onChange={(e) => toggleIsAdmin(e)}
            />
            <label htmlFor="isAdmin">Is Admin?</label>
          </div>
        )}
        <div className="button-container">
          <button
            className="submit-button"
            onClick={submitChanges}
            disabled={blocked}
          >
            Submit
          </button>
          <button
            className="cancel-button"
            onClick={cancelForm}
            disabled={blocked}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default EmployeeInfoForm;
