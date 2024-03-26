import React, { useState } from 'react';
import ClickBlocker from './ClickBlocker';

import './DisplayTable.css';
import { getEndOfWeekString, selectedDate } from './firebase';

import Dropdown from 'react-bootstrap/Dropdown';

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
	
	if (!props.company || !props.company.employees) return;
	return (
		<div className='company-details'>
			<h2> {props.company.name} </h2>
			<ul>
				<li key={0} className='table-key'>
					<div className='dropdown'></div> {/* fake kebab so we get spacing right */}
					<span className='employee-name'>Employee Name</span>
					<span className='employee-weekly-hours'>{getEndOfWeekString(selectedDate.value)}</span>
				</li>
				{props.company.employees.filter( emp => !emp.unclaimed ).map((emp,index) => (
					<EmployeeLine index={index+1} emp={emp} />
				))}

				{props.company.employees.filter(emp => emp.unclaimed ).map((emp, index) => (
					<EmployeeLine index={index+1} emp={emp} />
				))}
			</ul>
		</div>
	)
}

function EmployeeLine(props) {
	const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
		<button className='kebab-container' onClick={e => {e.preventDefault();onClick(e); }} >
			{/* custom icon */}
			{children}
		</button>
	));

	return (
		<li key={props.index}>
			{/* <span className='kebab'>&#8942;</span> */}
			<Dropdown>
				<Dropdown.Toggle as={CustomToggle}>
					<span className='kebab'>&#8942;</span>
				</Dropdown.Toggle>
				<Dropdown.Menu size="sm" title="">
					<Dropdown.Item>Edit Hours</Dropdown.Item>
					<Dropdown.Item>View Code</Dropdown.Item>
					<Dropdown.Item>Remove Employee</Dropdown.Item>
				</Dropdown.Menu>
			</Dropdown>
			<span className='employee-name'> {props.emp.name} </span>
			{/* emp.HoursThisWeek is a computed signal */}
			<span className='employee-weekly-hours'> {props.emp.unclaimed ? "unreg" : props.emp.hoursThisWeek} </span>
		</li>
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
						<li key={index}>{ emp } <button>Remove EMP</button></li>
					))}
				</ul>
			</details>
			<details className='employee-details'>
				<summary>Employees</summary>
				<ul>
					{props.company.employees.map((emp,index) => (
						<li key={index}>{ emp } <button>Remove EMP</button></li>
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
					<li key={item.id}>
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