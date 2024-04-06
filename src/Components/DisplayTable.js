import React, { useState } from 'react';
import ClickBlocker from './ClickBlocker';

import './DisplayTable.css';
import { deleteCompanyEmployee, deleteUnclaimedEmployee, getEndOfWeekString, getStartOfWeekString, selectedDate, setSelectedDate } from '../lib/firebase';

import Dropdown from 'react-bootstrap/Dropdown';
import HourAdder from './HourAdder';
import EmployeeInfoForm from './EmployeeInfoForm';

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

	// jumps selectedDate a week forward
	const jumpForward = () => {
		setSelectedDate( new Date(selectedDate.value.getFullYear(), selectedDate.value.getMonth(), selectedDate.value.getDate() + 7) );
		props.refreshTable();
	}

	// jumps selectedDate a week forward
	const jumpBackward = () => {
		setSelectedDate( new Date(selectedDate.value.getFullYear(), selectedDate.value.getMonth(), selectedDate.value.getDate() - 7) );
		props.refreshTable();
	}

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
		<div className='company-display-table'>
			<h2> {props.company.name} </h2>
			<ul>
				<li key={0} className='table-key'>
					{/* <div className='dropdown'></div> fake kebab so we get spacing right */}
					<span className='date-row'>
						<button onClick={jumpBackward}>&#x2BC7;</button>
						<span className='week-string'>{getStartOfWeekString(selectedDate.value)}&nbsp;&nbsp;&nbsp;&#x2015;&nbsp;&nbsp;&nbsp;{getEndOfWeekString(selectedDate.value)}</span>
						<button onClick={jumpForward}>&#x2BC8;</button>
					</span>
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
				<EmployeeInfoForm 
					setBlocked={setEditUser}
					refreshTable={props.refreshTable}
					empID={props.emp.id}
					companyID={props.company.id}
					edit
					fn={props.emp.firstName}
					ln={props.emp.lastName} />
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

export function CompanyDisplayTable(props) {
	const [blocked, setBlocked] = useState(false);

	return (
		<details className='company-details'>
			<summary> {props.company.name} </summary>
			<AdminCompanyDisplayTable company={props.company} refreshTable={props.refreshTable} />
			<button className="add-emp" onClick={() => { setBlocked(true); }}>Add Employee</button>
			<ClickBlocker custom={true} block={blocked}>
				<EmployeeInfoForm setBlocked={setBlocked} refreshTable={props.refreshTable} companyID={props.company.id} add/>
			</ClickBlocker>
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

	const tempDelete = (companyID) => {
		console.log(companyID);
	}
	// const removeItem = (id) => {
	// 	setItems(items.filter(item => item.id !== id));
	// };

	return (
		<div className='display-table'>
			<ul>
				{props.displayItems.map(item => (
					<li key={"companies"+item.id}>
						<CompanyDisplayTable company={item} onDelete={tempDelete} refreshTable={props.refreshTable}/>
					</li>
				))}
			</ul>
			
			<button className='popup-trigger' onClick={toggleCreateVisible}>Create Company</button>
			{/* <CreateCompanyPopup Visible={createVisible} toggleVisible={toggleCreateVisible} /> */}
			<ClickBlocker block={createVisible} custom={true} >
				<CreateCompanyPopup onAdd={tempAdd} onCancel={onCancel} />
			</ClickBlocker>
		</div>
	);
}

export default DisplayTable;