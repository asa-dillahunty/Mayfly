import React, { useState } from 'react';
import ClickBlocker from './ClickBlocker';

import './DisplayTable.css';
import { deleteCompanyEmployee, deleteUnclaimedEmployee, getEndOfWeekString, getStartOfWeekString, makeAdmin, selectedDate, setSelectedDate } from '../lib/firebase';

import Dropdown from 'react-bootstrap/Dropdown';
import HourAdder from './HourAdder';
import EmployeeInfoForm from './EmployeeInfoForm';
import { AiFillLeftSquare, AiFillRightSquare, AiOutlineMore } from 'react-icons/ai';

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

export function DisplayTableSkeleton() {
	return (
		<div className='company-display-table skeleton'>
			<div className="shimmer-box"></div>
			<h2></h2>
			<ul>
				<li className='table-key'>
					{/* <div className='dropdown'></div> fake kebab so we get spacing right */}
					<span className='date-row'>
						<AiFillLeftSquare className='week-button' />
						<span className='week-string'>{getStartOfWeekString(selectedDate.value)}&nbsp;&nbsp;&nbsp;&#x2015;&nbsp;&nbsp;&nbsp;{getEndOfWeekString(selectedDate.value)}</span>
						<AiFillRightSquare className='week-button' />
					</span>
				</li>
				<li>
					<span className='kebab'></span>
					<span className='employee-name'></span>
					<span className='employee-weekly-hours'></span>
				</li>
				<li>
					<span className='kebab'></span>
					<span className='employee-name'></span>
					<span className='employee-weekly-hours'></span> 
				</li>
				<li>
					<span className='kebab'></span>
					<span className='employee-name'></span>
					<span className='employee-weekly-hours'></span> 
				</li>
				<li>
					<span className='kebab'></span>
					<span className='employee-name'></span>
					<span className='employee-weekly-hours'></span> 
				</li>
				<li>
					<span className='kebab'></span>
					<span className='employee-name'></span>
					<span className='employee-weekly-hours'></span> 
				</li>
				<li>
					<span className='kebab'></span>
					<span className='employee-name'></span>
					<span className='employee-weekly-hours'></span> 
				</li>
			</ul>
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
	if (props.company && props.company.Employees) {
		claimedList = props.company.Employees.filter( emp => !emp.unclaimed );
		unclaimedList = props.company.Employees.filter( emp => emp.unclaimed );
	}

	return (
		<div className='company-display-table'>
			<h2> {props.company.name} </h2>
			<ul>
				<li key={0} className='table-key'>
					{/* <div className='dropdown'></div> fake kebab so we get spacing right */}
					<span className='date-row'>
						<AiFillLeftSquare className='week-button' onClick={jumpBackward}/>
						<span className='week-string'>{getStartOfWeekString(selectedDate.value)}&nbsp;&nbsp;&nbsp;&#x2015;&nbsp;&nbsp;&nbsp;{getEndOfWeekString(selectedDate.value)}</span>
						<AiFillRightSquare className='week-button' onClick={jumpForward}/>
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
					<EmployeeLine key={index+claimedList.length+2} emp={emp} company={props.company} refreshTable={props.refreshTable} admin={props.admin}/>
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
	const [confirmDelete, setConfirmDelete] = useState(false);

	
	const deleteUser = () => {
		setBlocked(true);
		deleteCompanyEmployee(props.emp.id, props.company.id)
			.then(() => {
				props.refreshTable().then(() => {
					setConfirmDelete(false);
				}).catch((_e) => {
					alert(`Error Code 0012. Please refresh the page.`)
					setConfirmDelete(false);
					setBlocked(false);
				});
			}).catch((_e) => {
				alert(`Error Code 7982. Failed to delete ${props.emp.id}. Please refresh the page.`)
				setConfirmDelete(false);
				setBlocked(false);
			});
	}

	const toggleShow = () => {
		setShowMore(!showMore);
	}
	const toggleEdit = () => {
		setEditUser(!editUser);
	}

	if (props.emp.hidden) return <></>;
	return (
		<li>
			{/* <span className='kebab'>&#8942;</span> */}
			<ClickBlocker block={blocked} />
			<ClickBlocker block={editUser} custom>
				<EmployeeInfoForm 
					setFormOpen={setEditUser}
					refreshTable={props.refreshTable}
					empID={props.emp.id}
					companyID={props.company.id}
					edit
					fn={props.emp.firstName}
					ln={props.emp.lastName} />
			</ClickBlocker>
			<ClickBlocker 
				block={confirmDelete}
				confirm
				message={`Are you sure you want to remove ${props.emp.name} from ${props.company.name}?`}
				messageEmphasized={"This action cannot be undone."}
				onConfirm={deleteUser}
				onCancel={()=>setConfirmDelete(false)}
				/>
			<Dropdown>
				<Dropdown.Toggle as={CustomToggle}>
					<span className='kebab'><AiOutlineMore /></span>
				</Dropdown.Toggle>
				<Dropdown.Menu size="sm" title="">
					{props.emp.unclaimed ? <></> : <Dropdown.Item onClick={toggleShow}>Edit Hours</Dropdown.Item>}
					<Dropdown.Item onClick={toggleEdit}>Edit User</Dropdown.Item>
					<Dropdown.Item onClick={()=>setConfirmDelete(true)}>Remove Employee</Dropdown.Item>
					{!props.adminAble ? <></> : <Dropdown.Item onClick={()=>{makeAdmin(props.emp.id)}}>Make Admin</Dropdown.Item>}
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
			<AdminCompanyDisplayTable company={props.company} refreshTable={props.refreshTable} adminAble={props.addAdmins} />
			<button className="add-emp" onClick={() => { setBlocked(true); }}>Add Employee</button>
			<ClickBlocker custom={true} block={blocked}>
				<EmployeeInfoForm setBlocked={setBlocked} refreshTable={props.refreshTable} companyID={props.company.id} add admin={props.addAdmins}/>
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
						<CompanyDisplayTable company={item} onDelete={tempDelete} refreshTable={props.refreshTable} addAdmins={props.addAdmins}/>
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