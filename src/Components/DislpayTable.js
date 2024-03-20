import React, { useState } from 'react';
import ClickBlocker from './ClickBlocker';

import './DisplayTable.css';

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
			
			<details className='employee-details'>
				<summary>Employees</summary>
				<ul>
					{props.company.employees.map((emp,index) => (
						<li key={index}>
							<p>Name: {emp.name} | Hours this week: {emp.hoursThisWeek}</p> 
							<button>Remove EMP</button>
						</li>
					))}
				</ul>
			</details>
		</div>
	)
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