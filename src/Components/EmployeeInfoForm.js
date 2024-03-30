import { createCompanyEmployee, createUnclaimedEmployee, getMyCompanyID } from "./firebase";

import './EmployeeInfoForm.css';

function EmployeeInfoForm (props) {
	const submitChanges = () => {
		const firstName = document.getElementById("employee-first-name").value;
		const lastName = document.getElementById("employee-last-name").value;

		// TODO: 
		// 	do some checking on the data gathered from the form
		//	Edit needs to check if a user is "unclaimed" and persist that property

		const empData = {
			name:firstName+" "+lastName,
			firstName:firstName,
			lastName:lastName
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
			createUnclaimedEmployee(empData, props.companyID)
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
			<div className='input-container'>
				<label htmlFor="employee-first-name">First Name:</label>
				<input id='employee-first-name' name="employee-first-name" type='text' autoComplete='off'></input>
			</div>
			<div className='input-container'>
				<label htmlFor="employee-last-name">Last Name:</label>
				<input id='employee-last-name' name="employee-last-name" type='text' autoComplete='off'></input>
			</div>
			<div className='button-container'>
				<button className='submit-button' onClick={submitChanges}>Submit</button>
				<button className='cancel-button' onClick={() => props.setBlocked(false)}>Cancel</button>
			</div>
		</div>
	);
}

export default EmployeeInfoForm;