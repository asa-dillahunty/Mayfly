import React, { useEffect, useState } from 'react';
import { auth, deleteCache, getCompany, getMyCompanyID, performLogout, getCompanyFromCache, selectedDate, decrementDate, buildDocName, ABBREVIATIONS, getStartOfWeekString, getEndOfWeekString } from '../lib/firebase';
import './Admin.css';
import { AdminCompanyDisplayTable, DisplayTableSkeleton } from '../Components/DisplayTable';
import ClickBlocker from '../Components/ClickBlocker';
import EmployeeInfoForm from '../Components/EmployeeInfoForm';
import jsPDF from 'jspdf';
import logo from '../MayflyLogo.png';

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
	};

	const createPrintable = () => {
		const newDoc = new jsPDF();
		const logoPrint = new Image();
		logoPrint.src = logo;

		let height = -1;
		for (let i=0; i<companyData.Employees.length; i++) {
			if (companyData.Employees[i].hidden) continue;

			height++;
			newDoc.text(`${companyData.Employees[i].name}     ${getStartOfWeekString(selectedDate.value)}   -   ${getEndOfWeekString(selectedDate.value)}`, 10, 40 * (height+1) - 20);
			newDoc.addImage(logoPrint, 'png', 175, 40 * (height+1) - 20, 20, 20)

			for (let j=0; j<companyData.Employees[i].hoursList.length; j++) {
				newDoc.text(`${ABBREVIATIONS[(j+4)%7]}`, 
					15 + 15*(j+1), 40*(height+1) - 10
				);
			}

			newDoc.text("Total", 30 + 15 * 8, 40*(height+1) - 10);

			for (let j=0; j<companyData.Employees[i].hoursList.length; j++) {
				newDoc.text(`${companyData.Employees[i].hoursList[(j+4)%7]}`, 
					15 + 15*(j+1), 40*(height+1)
				);
			}

			newDoc.text(`${companyData.Employees[i].hoursThisWeek}`, 30 + 15 * 8, 40*(height+1));
		}
		
		newDoc.save(`${companyData.name}-hours-week-${buildDocName(selectedDate.value)}.pdf`);
	};
	
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
				<button className="add-emp" onClick={ createPrintable }>Print Hours</button>
				<ClickBlocker custom={true} block={infoFormOpen}>
					<EmployeeInfoForm setFormOpen={setInfoFormOpen} refreshTable={fetchCompany} deepRefresh={deepRefresh} companyID={companyData.id} add/>
				</ClickBlocker>
			</div>
		</div>
	);
}

export default AdminDashboard;
