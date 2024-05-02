import React, { useState } from 'react';
import ClickBlocker from './ClickBlocker';

import './DisplayTable.css';
import { ADMIN_DOC_NAME, buildDocName, createCompany, deleteCompanyEmployee, getEndOfWeekString, getHours, getStartOfWeekString, makeAdmin, selectedDate, setSelectedDate } from '../utils/firebase';

import Dropdown from 'react-bootstrap/Dropdown';
import HourAdder from './HourAdder';
import EmployeeInfoForm from './EmployeeInfoForm';
import { AiFillLeftSquare, AiFillRightSquare, AiOutlineMore } from 'react-icons/ai';
import ConnectionHandler, { dataStatusEnum } from '../utils/ConnectionHandler';

function CreateCompanyPopup(props) {
	const [companyName,setCompanyName] = useState('');

	const onSubmit = () => {
		if (companyName.trim() === '') return;
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
			<h2> </h2>
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
					<ConnectionHandler key={index+1} emp empID={emp.id} companyData={props.company}>
						<EmployeeLine refreshTable={props.refreshTable} company={props.company}/>
					</ConnectionHandler>
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

const CustomToggle = React.forwardRef(({ children, onClick }, _ref) => (
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

	const empData = props.dataObject;

	const deleteUser = () => {
		setBlocked(true);
		deleteCompanyEmployee(empData.id, props.company.id)
			.then(() => {
				props.refreshTable().then(() => {
					setBlocked(false);
					setConfirmDelete(false);
				}).catch((_e) => {
					alert(`Error Code 0012. Please refresh the page.`)
					setBlocked(false);
					setConfirmDelete(false);
				});
			}).catch((_e) => {
				alert(`Error Code 7982. Failed to delete ${empData.id}. Please refresh the page.`)
				setBlocked(false);
				setConfirmDelete(false);
			});
	}

	const toggleShow = () => {
		setShowMore(!showMore);
	}
	const toggleEdit = () => {
		setEditUser(!editUser);
	}

	const countTotalHours = () => {
		const docName = buildDocName(selectedDate.value);
		if (!empData[docName]) {
			console.log("here");
			props.requestData({
				type:"hours",
				params: {
					date:selectedDate.value,
					docName:docName
				}
			});
		} else {
			var total = 0;
			for (var value in empData[docName]) {
				total += empData[docName][value].hours;
			}
			return total;
		}
		return 0;
	}

	if (!empData.id) return <></>
	if (empData[ADMIN_DOC_NAME].hidden) return <></>;
	console.log(empData);
	return (
		<li>
			{/* <span className='kebab'>&#8942;</span> */}
			<ClickBlocker block={editUser} custom>
				<EmployeeInfoForm 
					setFormOpen={setEditUser}
					refreshTable={props.refreshTable}
					empID={empData.id}
					companyID={props.company.id}
					edit
					fn={empData.firstName}
					ln={empData.lastName} />
			</ClickBlocker>
			<ClickBlocker 
				block={confirmDelete}
				confirm
				message={`Are you sure you want to remove ${empData.name} from ${props.company.name}?`}
				messageEmphasized={"This action cannot be undone."}
				onConfirm={deleteUser}
				onCancel={()=>setConfirmDelete(false)}
			/>
			<ClickBlocker block={blocked} loading />
			<Dropdown>
				<Dropdown.Toggle as={CustomToggle}>
					<span className='kebab'><AiOutlineMore /></span>
				</Dropdown.Toggle>
				<Dropdown.Menu size="sm" title="">
					{empData.unclaimed ? <></> : <Dropdown.Item onClick={toggleShow}>Edit Hours</Dropdown.Item>}
					<Dropdown.Item onClick={toggleEdit}>Edit User</Dropdown.Item>
					<Dropdown.Item onClick={()=>setConfirmDelete(true)}>Remove Employee</Dropdown.Item>
					{!props.adminAble ? <></> : <Dropdown.Item onClick={()=>{makeAdmin(empData.id)}}>Make Admin</Dropdown.Item>}
				</Dropdown.Menu>
			</Dropdown>
			<span className='employee-name'> {empData.name} </span>
			{/* emp.HoursThisWeek is a computed signal */}
			{ empData.status === dataStatusEnum.loading ?
				<span className='employee-weekly-hours code'> Loading </span> :
				<span className='employee-weekly-hours'> { countTotalHours() } </span>
			}
			{empData.unclaimed ? 
				<></> :
				<ClickBlocker block={showMore} custom={true}>
					<div className='more-info'>
						<HourAdder uid={empData.id} blocked={blocked} setBlocked={setBlocked}/>
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
	const [formOpen, setFormOpen] = useState(false);

	return (
		<details className='company-details'>
			<summary> {props.company.name} </summary>
			<AdminCompanyDisplayTable company={props.company} refreshTable={props.refreshTable} adminAble={props.addAdmins} />
			<button className="add-emp" onClick={() => { setFormOpen(true); }}>Add Employee</button>
			<ClickBlocker custom block={formOpen}>
				<EmployeeInfoForm 
					setFormOpen={setFormOpen}
					refreshTable={props.refreshTable}
					companyID={props.company.id}
					admin
					add
				/>
			</ClickBlocker>
			<button onClick={() => props.onDelete(props.company)}>Delete Company</button>
		</details>
	)
}

function DisplayTable(props) {
	const [createVisible, setCreateVisible] = useState(false);

	const toggleCreateVisible = () => setCreateVisible(!createVisible);

	const addCompany = (companyName) => {
		createCompany(companyName);
	}

	const onCancel = () => {
		toggleCreateVisible();
	};

	const tempDelete = (companyData) => {
		console.log(companyData);
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
				<CreateCompanyPopup onAdd={addCompany} onCancel={onCancel} />
			</ClickBlocker>
		</div>
	);
}

export default DisplayTable;