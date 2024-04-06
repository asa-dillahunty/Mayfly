import React, { useEffect, useState } from 'react';
import { auth, deleteCache, getCompany, getMyCompanyID, performLogout, createUnclaimedEmployee, createUser, currentWeek } from '../lib/firebase';
import './Admin.css';
import { AdminCompanyDisplayTable } from '../Components/DisplayTable';
import ClickBlocker from '../Components/ClickBlocker';
import EmployeeInfoForm from '../Components/EmployeeInfoForm';
import { effect } from '@preact/signals-react';

function AdminDashboard(props) {
	const [companyData, setCompanyData] = useState({});
	const [blocked, setBlocked] = useState(false);

	const fetchCompany = async () => {
		const companyID = await getMyCompanyID(auth.currentUser.uid);
		const companyObj = await getCompany(companyID, currentWeek.value);
		companyObj.id = companyID;
		console.log(companyObj);
		setCompanyData(companyObj);
	};
	
	useEffect(() => {
		console.log("Fetching Company Data");
		fetchCompany();
	}, []);
	
	return (
		<div className="dashboard-container">
			<div className="dashboard-header">
				<h1>Mayfly</h1>
				<button className="dashboard-logout" onClick={() => performLogout(props.setCurrPage)}>
					Log Out
				</button>
			</div>
			<div className="dashboard-content">
				<AdminCompanyDisplayTable company={companyData} refreshTable={fetchCompany}/>
				<button className="add-emp" onClick={() => { setBlocked(true); }}>Add Employee</button>
				<ClickBlocker custom={true} block={blocked}>
					<EmployeeInfoForm setBlocked={setBlocked} refreshTable={fetchCompany} companyID={companyData.id} add/>
				</ClickBlocker>
			</div>
		</div>
	);
}

export default AdminDashboard;
