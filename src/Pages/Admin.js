import React, { useEffect, useState } from 'react';
import { auth, deleteCache, getCompany, getMyCompanyID, performLogout, createUnclaimedEmployee, createUser, getCompanyFromCache } from '../lib/firebase';
import './Admin.css';
import { AdminCompanyDisplayTable } from '../Components/DisplayTable';
import ClickBlocker from '../Components/ClickBlocker';
import EmployeeInfoForm from '../Components/EmployeeInfoForm';
import { effect } from '@preact/signals-react';

function AdminDashboard(props) {
	const [companyData, setCompanyData] = useState({});
	const [infoFormOpen, setInfoFormOpen] = useState(false);
	const [blocked, setBlocked] = useState(false);

	const fetchCompany = async () => {
		// this needs to somehow wait for selected date to update first
		// update state! must somehow trigger an update in signals state
		setBlocked(true);
		const companyID = await getMyCompanyID(auth.currentUser.uid);
		const companyObj = await getCompanyFromCache(companyID);
		companyObj.id = companyID;
		setCompanyData(companyObj);
		setBlocked(false);
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
			<div className="dashboard-content contain-click-blocker">
				<ClickBlocker block={blocked} loading/>
				<AdminCompanyDisplayTable company={companyData} refreshTable={fetchCompany}/>
				<button className="add-emp" onClick={() => { setBlocked(true); }}>Add Employee</button>
				<ClickBlocker custom={true} block={infoFormOpen}>
					<EmployeeInfoForm setBlocked={setInfoFormOpen} refreshTable={fetchCompany} companyID={companyData.id} add/>
				</ClickBlocker>
			</div>
		</div>
	);
}

export default AdminDashboard;
