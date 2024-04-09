import React, { useEffect, useState } from 'react';
import { getCompanies, getCompany, getCompanyFromCache, performLogout } from '../lib/firebase';
// import { format } from 'date-fns';
// import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import './OmniAdmin.css';
import DisplayTable from '../Components/DisplayTable';
import { effect } from '@preact/signals-react';


function OmniAdminDashboard(props) {
	const [companies, setCompanies] = useState([]);

	const handleLogout = async () => {
		performLogout(props.setCurrPage);
	};

	const fetchCompanies = async () => {
		const companiesCollectionSnapshot = await getCompanies();
		console.log(companiesCollectionSnapshot);
		
		const promiseCompanies = await Promise.all(
			companiesCollectionSnapshot.docs.map( async (doc) => {
				return await fetchCompanyData({ id: doc.id, ...doc.data() });
			})
		);
		await Promise.all(promiseCompanies);

		// const updatedCompanies = promiseCompanies.map(item => ({ item.Object}));
		setCompanies(promiseCompanies);
	};

	const fetchCompanyData = async (data) => {
		console.log(data)
		const companyObj = await getCompanyFromCache(data.id);
		companyObj.id = data.id;
		companyObj.name = data.name;
		console.log(companyObj);
		return companyObj;
	};

	const addCompany = (company) => {
		console.log("add company: " + company);
	}

	const deleteCompany = (company) => {
		console.log("delete company: " + company.id + " - " + company.name);
	}

	useEffect(() => {
		fetchCompanies();
	}, []);

	return (
		<div className="dashboard-container">
		<div className="dashboard-header">
			<h1>Dashboard</h1>
				<button className="dashboard-logout" onClick={handleLogout}>
					Log Out
				</button>
			</div>
			<div className="dashboard-content">
				{/* list of current users 
					- contains option to delete
					- some kind of display of hours worked recently
					- option to add new users */}
				<p>Admin Dashboard!</p>

				<DisplayTable
					displayItems={companies}
					onAdd={addCompany}
					onDelete={deleteCompany}
					refreshTable={fetchCompanies}
					addAdmins
					/>
			</div>
		</div>
	);
}

export default OmniAdminDashboard;
