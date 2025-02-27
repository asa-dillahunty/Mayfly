import { createCompanyEmployee, createEmployeeAuth } from "../utils/firebase";
import ClickBlocker from "./ClickBlocker";

import "./EmployeeInfoForm.css";
import { useState } from "react";

function EmployeeInfoForm(props) {
  let fn = "";
  let ln = "";
  let rate = 0;
  if (props.edit) {
    fn = props.fn;
    ln = props.ln;
    rate = props.empData?.rate ?? 0;
  }

  const [firstName, setFirstName] = useState(fn);
  const [lastName, setLastName] = useState(ln);
  const [email, setEmail] = useState("");
  const [hourlyRate, setRate] = useState(rate);
  const [wageError, setRateError] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const cancelForm = (e) => {
    e.preventDefault();
    props.setFormOpen(false);
  };

  const toggleIsAdmin = (_e) => {
    setIsAdmin(document.getElementById("admin-checkbox").checked);
  };

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
    };
    if (email) empData.email = email;
    if (isAdmin) empData.isAdmin = true;

    // if edit -> create company employee
    // if add -> create Unclaimed Employee
    if (props.edit) {
      createCompanyEmployee(empData, props.empID, props.companyID)
        .then(() => {
          props
            .deepRefresh()
            .then(() => {
              setBlocked(false);
              props.setFormOpen(false);
            })
            .catch((_e) => {
              alert(
                `Error Code 3372. Error loading table. Please refresh the page.`
              );
              setBlocked(false);
              props.setFormOpen(false);
            });
        })
        .catch((_e) => {
          alert(
            `Error Code 6450. Failed to create ${props.empID}. Please refresh the page.`
          );
          setBlocked(false);
          props.setFormOpen(false);
        });
    } else if (props.add) {
      createEmployeeAuth(empData, props.companyID)
        .then(() => {
          props
            .deepRefresh()
            .then(() => {
              setBlocked(false);
              props.setFormOpen(false);
            })
            .catch((_e) => {
              alert(
                `Error Code 3373. Error loading table. Please refresh the page.`
              );
              setBlocked(false);
              props.setFormOpen(false);
            });
        })
        .catch((e) => {
          setBlocked(false);
          props.setFormOpen(false);
          console.error(e.message);
          alert("Failed to add user: " + e.message);
        });
    }
    // TODO: fix the cache
  };

  const trysetRate = (e) => {
    setRate(e.target.value);
    setRateError(isNaN(e.target.value) || isNaN(parseFloat(e.target.value)));
  };

  return (
    <div className="employee-info-form">
      <h1 className="login-title">
        {props.edit ? "Edit Employee Info" : "Create New Employee"}
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
          onChange={trysetRate}
        />
        {!props.add ? (
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
        {!props.admin ? (
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
            disabled={props.blocked}
          >
            Submit
          </button>
          <button
            className="cancel-button"
            onClick={cancelForm}
            disabled={props.blocked}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default EmployeeInfoForm;
