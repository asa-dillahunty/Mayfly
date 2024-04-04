import { createCompanyEmployee, createEmployeeAuth, createUnclaimedEmployee } from "./firebase";

import './EmployeeInfoForm.css';
import { useState } from "react";

function EmployeeInfoForm (props) {
	let fn = "";
	let ln = "";
	if (props.edit) {
		fn = props.fn;
		ln = props.ln
	}

	const [firstName, setFirstName] = useState(fn);
	const [lastName, setLastName] = useState(ln);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const cancelForm = (e) => {
		e.preventDefault();
		props.setBlocked(false);
	}

	const submitChanges = (e) => {
		e.preventDefault();
		props.setBlocked(true);
		// TODO: 
		// 	do some checking on the data gathered from the form
		//	Edit needs to check if a user is "unclaimed" and persist that property

		const empData = {
			name:firstName+" "+lastName,
			firstName:firstName,
			lastName:lastName
		}
		if (email) {
			empData.email = email;
		}
		
		// if edit -> create company employee
		// if add -> create Unclaimed Employee
		if (props.edit)  {
			createCompanyEmployee(empData, props.empID, props.companyID)
				.then( () => {
					props.refreshTable().then(() => {
						props.setBlocked(false)
					});
				});
		}
		else if (props.add) {
			createEmployeeAuth(empData, props.companyID)
				.then( () => {
					props.refreshTable().then(() => {
						props.setBlocked(false)
					});
				});
		}
		else {
			console.log("Error: did nothing");
		}
	}

	return (
		<div className='employee-info-form'>
			<h1 className="login-title"> 
				{props.edit ? "Edit Employee Info" : "Create New Employee"}
			</h1>
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
				{!props.add ? "" : 
				<>
					<label htmlFor="employee-email">Email:</label>
					<input
						type="email"
						className="name-input"
						placeholder="Email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>
				</>}
				<div className='button-container'>
					<button className='submit-button' onClick={submitChanges} disabled={props.blocked}>Submit</button>
					<button className='cancel-button' onClick={cancelForm} disabled={props.blocked}>Cancel</button>
				</div>
			</form>
		</div>
	);
}

export default EmployeeInfoForm;