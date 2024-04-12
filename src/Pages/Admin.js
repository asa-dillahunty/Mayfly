import React, { useEffect, useState } from 'react';
import { auth, deleteCache, getCompany, getMyCompanyID, performLogout, getCompanyFromCache, selectedDate, decrementDate } from '../lib/firebase';
import './Admin.css';
import { AdminCompanyDisplayTable, DisplayTableSkeleton } from '../Components/DisplayTable';
import ClickBlocker from '../Components/ClickBlocker';
import EmployeeInfoForm from '../Components/EmployeeInfoForm';

function AdminDashboard(props) {
	const [companyData, setCompanyData] = useState({});
	const [initialLoad, setInitialLoad] = useState(true);
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

	const deepRefresh = async() => {
		setBlocked(true);
		const companyID = await getMyCompanyID(auth.currentUser.uid);
		const companyObj = await getCompany(companyID);
		companyObj.id = companyID;
		setCompanyData(companyObj);
		setBlocked(false);
	}
	
	useEffect(() => {
		console.log("Fetching Company Data");
		// 4 is start of pay period. This is done because if it's the start of the pay period
		// you probably wanted to see last week's data
		if (selectedDate.value.getDay() === 4) decrementDate(selectedDate.value);
		fetchCompany().then(() => {
			setInitialLoad(false);
		});
	}, []);

	
	if (initialLoad) {
		return (
			<div className="dashboard-container">
				<div className="dashboard-header">
					<h1>Mayfly</h1>
					<button className="dashboard-logout" onClick={() => performLogout(props.setCurrPage)}>
						Log Out
					</button>
				</div>
				<div className="dashboard-content contain-click-blocker skeleton">
					<DisplayTableSkeleton />
				</div>
			</div>
		);
	}
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
				<button className="add-emp" onClick={() => { setInfoFormOpen(true); }}>Add Employee</button>
				<ClickBlocker custom={true} block={infoFormOpen}>
					<EmployeeInfoForm setFormOpen={setInfoFormOpen} refreshTable={fetchCompany} deepRefresh={deepRefresh} companyID={companyData.id} add/>
				</ClickBlocker>
			</div>
		</div>
	);
}

export default AdminDashboard;
