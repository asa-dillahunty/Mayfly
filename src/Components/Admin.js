import React, { useEffect, useState } from 'react';
import { auth, createCompany, deleteCache, getCompanies, getCompany, getMyCompanyID, performLogout } from './firebase';
import { useNavigate } from 'react-router-dom';
import './Admin.css';
import DisplayTable from './DislpayTable';
import { AdminCompanyDisplayTable } from './DislpayTable';

function AdminDashboard() {
	const [companyData, setCompanyData] = useState({});       
	const navigate = useNavigate();

	const fetchCompany = async () => {
		const companyID = await getMyCompanyID(auth.currentUser.uid);
		const companyObj = await getCompany(companyID);
		console.log(companyObj);
		setCompanyData(companyObj);
	};
	
	useEffect(() => {
		fetchCompany();
	}, []);
	
	return (
		<div className="dashboard-container">
		<div className="dashboard-header">
			<h1>Dashboard</h1>
				<button className="dashboard-logout" onClick={() => performLogout(navigate)}>
					Log Out
				</button>
			</div>
			<div className="dashboard-content">
				{/* list of current users 
					- contains option to delete
					- some kind of display of hours worked recently
					- option to add new users */}
				<p>Admin Dashboard!</p>

				<AdminCompanyDisplayTable company={companyData} />
			</div>
		</div>
	);
}

export default AdminDashboard;
