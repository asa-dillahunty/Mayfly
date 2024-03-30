import React, { useState } from 'react';
import ClickBlocker from './ClickBlocker';

import './DisplayTable.css';
import { auth, createCompanyEmployee, deleteCompanyEmployee, deleteUnclaimedEmployee, getEndOfWeekString, getMyCompanyID, selectedDate } from './firebase';

import Dropdown from 'react-bootstrap/Dropdown';
import HourAdder from './HourAdder';

function CreateCompanyPopup(props) {
	const [companyName,setCompanyName] = useState('');

	const onSubmit = () => {
		if (companyName.trim() === '') return;
		console.log("Submitted",companyName);
		props.onAdd(companyName);
	}

	return (
		<div className='form-wrapper'>
			<input
				placeholder="Company Name"
				type='text'
				value={companyName}
				onChange={(e) => {setCompanyName(e.target.value)}} />
			<button onClick={onSubmit}>Submit</button>
			<br />
			<button onClick={props.onCancel}>Cancel</button>
		</div>
	);
}

export function AdminCompanyDisplayTable(props) {
	let claimedList;
	let unclaimedList;
	if (props.company && props.company.employees) {
		claimedList = props.company.employees.filter( emp => !emp.unclaimed );
		unclaimedList = props.company.employees.filter( emp => emp.unclaimed );
	}
	if (!props.company || !props.company.employees) {
		// TODO:
		// 	return a skeleton
		return(<></>);
	}
	return (
		<div className='company-details'>
			<h2> {props.company.name} </h2>
			<ul>
				<li key={0} className='table-key'>
					<div className='dropdown'></div> {/* fake kebab so we get spacing right */}
					<span className='employee-name'>Employee Name</span>
					<span className='employee-weekly-hours'>{getEndOfWeekString(selectedDate.value)}</span>
				</li>
				{claimedList.map((emp,index) => (
					<EmployeeLine key={index+1} emp={emp} company={props.company} refreshTable={props.refreshTable} />
				))}

				<li key={unclaimedList.length + 1} className='table-key' hidden={unclaimedList.length < 1}>
					<div className='dropdown'></div> {/* fake kebab so we get spacing right */}
					<span className='employee-name'>Unregistered Employees</span>
					<span className='employee-weekly-hours'>Code</span>
				</li>
				{unclaimedList.map((emp, index) => (
					<EmployeeLine key={index+claimedList.length+2} emp={emp} company={props.company} refreshTable={props.refreshTable} />
				))}
			</ul>
		</div>
	)
}

const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
	<button className='kebab-container' onClick={e => {e.preventDefault();onClick(e); }} >
		{/* custom icon */}
		{children}
	</button>
));

function EmployeeLine(props) {
	const [blocked, setBlocked] = useState(false);
	const [showMore, setShowMore] = useState(false);
	const [editUser, setEditUser] = useState(false);

	const deleteUser = () => {
		setBlocked(true);
		const ans = window.confirm(`You want to remove ${props.emp.name} from ${props.company.name}? This action cannot be undone.`);
		if (!ans) {
			setBlocked(false);
			return;
		}

		if (props.emp.unclaimed) {
			deleteUnclaimedEmployee(props.emp.id, props.company.id)
				.then(() => {
					props.refreshTable().then(() => {
						setBlocked(false);
					});
				});
		}
		else {
			deleteCompanyEmployee(props.emp.id, props.company.id)
				.then(() => {
					props.refreshTable().then(() => {
						setBlocked(false);
					});
				});
		}
	}

	const toggleShow = () => {
		setShowMore(!showMore);
	}
	const toggleEdit = () => {
		setEditUser(!editUser);
	}

	return (
		<li>
			{/* <span className='kebab'>&#8942;</span> */}
			<ClickBlocker block={blocked} />
			<ClickBlocker block={editUser} custom={true}>
				<EditEmployeeForm setBlocked={setEditUser} refreshTable={props.refreshTable} empID={props.emp.id} />
			</ClickBlocker>
			<Dropdown>
				<Dropdown.Toggle as={CustomToggle}>
					<span className='kebab'>&#8942;</span>
				</Dropdown.Toggle>
				<Dropdown.Menu size="sm" title="">
					{props.emp.unclaimed ? <></> : <Dropdown.Item onClick={toggleShow}>Edit Hours</Dropdown.Item>}
					<Dropdown.Item onClick={toggleEdit}>Edit User</Dropdown.Item>
					<Dropdown.Item onClick={deleteUser}>Remove Employee</Dropdown.Item>
				</Dropdown.Menu>
			</Dropdown>
			<span className='employee-name'> {props.emp.name} </span>
			{/* emp.HoursThisWeek is a computed signal */}
			{ props.emp.unclaimed ?
				<span className='employee-weekly-hours code'> { props.emp.id } </span> :
				<span className='employee-weekly-hours'> { props.emp.hoursThisWeek } </span> 
			}
			{props.emp.unclaimed ? 
				<></> :
				<ClickBlocker block={showMore} custom={true}>
					<div className='more-info'>
						<HourAdder uid={props.emp.id} blocked={blocked} setBlocked={setBlocked}/>
						<button
							className='toggler'
							onClick={
								() => {
									props.refreshTable();
									toggleShow();
								}}>
							Done
						</button>
					</div>
				</ClickBlocker>
			}
		</li>
	);
}

export function EditEmployeeForm (props) {
	const submitChanges = () => {
		const empName = document.getElementById("employee-name").value;

		const empData = {
			name:empName,
		}
		
		getMyCompanyID(props.empID).then((companyID) => {
			createCompanyEmployee(empData, props.empID, companyID)
				.then( () => {
					props.refreshTable().then(() => {
						props.setBlocked(false)
					});
				});
		});
	}

	return (
		<div className='add-employee-form'>
			<div className='input-container'>
				<label htmlFor="employee-name">Name:</label>
				<input id='employee-name' name="employee-name" type='text' autoComplete='off'></input>
			</div>
			<div className='button-container'>
				<button className='submit-button' onClick={submitChanges}>Submit</button>
				<button className='cancel-button' onClick={() => props.setBlocked(false)}>Cancel</button>
			</div>
		</div>
	);
}

export function CompanyDisplayTable(props) {

	return (
		<details className='company-details'>
			<summary> {props.company.name} </summary>
			<details className='admin-details'>
				<summary>Admins</summary>
				<ul>
					{props.company.admins.map((emp,index) => (
						<li key={"admins"+index}>{ emp } <button>Remove EMP</button></li>
					))}
				</ul>
			</details>
			<details className='employee-details'>
				<summary>Employees</summary>
				<ul>
					{props.company.employees.map((emp,index) => (
						<li key={"emps"+index}>{ emp } <button>Remove EMP</button></li>
					))}
				</ul>
			</details>
			<button onClick={() => props.onDelete(props.company)}>Delete Company</button>
		</details>
	)
}

function DisplayTable(props) {
	const [inputValue, setInputValue] = useState('');
	const [createVisible, setCreateVisible] = useState(false);

	const toggleCreateVisible = () => setCreateVisible(!createVisible);

	const addItem = () => {
		props.onAdd(inputValue);
		// if (inputValue.trim() !== '') {
		// 	setItems([...items, { id: Date.now(), name: inputValue }]);
		// 	setInputValue('');
		// }
	};

	const tempAdd = (tempName) => {
		console.log(tempName);
	};

	const onCancel = () => {
		toggleCreateVisible();
	};
	// const removeItem = (id) => {
	// 	setItems(items.filter(item => item.id !== id));
	// };

	return (
		<div>
			<input
				type="text"
				value={inputValue}
				onChange={(e) => setInputValue(e.target.value)}
				placeholder="Enter item..."
			/>
			<button onClick={addItem}>Add</button>
			<ul>
				{props.displayItems.map(item => (
					<li key={"companies"+item.id}>
						<CompanyDisplayTable company={item} />
					</li>
				))}
			</ul>
			
			<button className='popup-trigger' onClick={toggleCreateVisible}>Create Company</button>
			{/* <CreateCompanyPopup Visible={createVisible} toggleVisible={toggleCreateVisible} /> */}
			<ClickBlocker 
				block={createVisible}
				custom={true} 
				customContent={ <CreateCompanyPopup onAdd={tempAdd} onCancel={onCancel} /> }
			/>

		</div>
	);
}

export default DisplayTable;