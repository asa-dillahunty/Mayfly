import React, { useEffect, useState } from 'react';
import { auth, deleteCache, getCompany, getMyCompanyID, performLogout, createUnclaimedEmployee, createUser } from './firebase';
import './Admin.css';
import { AdminCompanyDisplayTable } from './DislpayTable';
import ClickBlocker from './ClickBlocker';
import EmployeeInfoForm from './EmployeeInfoForm';

function AdminDashboard(props) {
	const [companyData, setCompanyData] = useState({});
	const [blocked, setBlocked] = useState(false);

	const fetchCompany = async () => {
		const companyID = await getMyCompanyID(auth.currentUser.uid);
		const companyObj = await getCompany(companyID);
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
