import React, { useState } from 'react';
import { performLogout, selectedDate, buildDocName, ABBREVIATIONS, getStartOfWeekString, getEndOfWeekString } from '../utils/firebase';
import './Admin.css';
import { AdminCompanyDisplayTable, DisplayTableSkeleton } from '../Components/DisplayTable';
import ClickBlocker from '../Components/ClickBlocker';
import EmployeeInfoForm from '../Components/EmployeeInfoForm';
import jsPDF from 'jspdf';
import logo from '../MayflyLogo.png';
import { AiFillPlusCircle, AiOutlinePrinter } from "react-icons/ai";
import ConnectionHandler from '../utils/ConnectionHandler';

function AdminDashboard(props) {
	return (
		<div className="dashboard-container">
			<div className="dashboard-header">
				<h1>Mayfly</h1>
				<button className="dashboard-logout" onClick={() => performLogout(props.setCurrPage)}>
					Log Out
				</button>
			</div>
			<ConnectionHandler company>
				<ContentContainer />
			</ConnectionHandler>
		</div>
	);
}

function ContentContainer({dataObject, dataRefresh, deepDataRefresh, blocked}) {
	const [infoFormOpen, setInfoFormOpen] = useState(false);

	const createPrintable = () => {
		const newDoc = new jsPDF();
		const logoPrint = new Image();
		logoPrint.src = logo;

		let height = -1;
		for (let i=0; i<dataObject.Employees.length; i++) {
			if (dataObject.Employees[i].hidden) continue;

			height++;
			newDoc.text(`${dataObject.Employees[i].name}     ${getStartOfWeekString(selectedDate.value)}   -   ${getEndOfWeekString(selectedDate.value)}`, 10, 40 * (height+1) - 20);
			// newDoc.addImage(logoPrint, 'png', 175, 40 * (height+1) - 20, 20, 20)

			for (let j=0; j<dataObject.Employees[i].hoursList.length; j++) {
				newDoc.text(`${ABBREVIATIONS[(j+4)%7]}`, 
					15 + 15*(j+1), 40*(height+1) - 10
				);
			}

			newDoc.text("Total", 30 + 15 * 8, 40*(height+1) - 10);

			for (let j=0; j<dataObject.Employees[i].hoursList.length; j++) {
				newDoc.text(`${dataObject.Employees[i].hoursList[(j+4)%7]}`, 
					15 + 15*(j+1), 40*(height+1)
				);
			}

			newDoc.text(`${dataObject.Employees[i].hoursThisWeek}`, 30 + 15 * 8, 40*(height+1));
		}
		
		newDoc.save(`${dataObject.name}-hours-week-${buildDocName(selectedDate.value)}.pdf`);
	};

	if (Object.keys(dataObject).length < 1) {
		return (
			<div className="dashboard-content contain-click-blocker skeleton">
				<DisplayTableSkeleton />
			</div>
		);
	}
	return (
		<div className="dashboard-content contain-click-blocker">
			<ClickBlocker block={blocked} loading/>
			<AdminCompanyDisplayTable company={dataObject} refreshTable={dataRefresh}/>

			<div className='admin-button-container'>
				<button className="add-emp" onClick={() => { setInfoFormOpen(true); }}>
					<AiFillPlusCircle />
					Add Employee
				</button>
				<button className='print-table' onClick={ createPrintable }>
					<AiOutlinePrinter className="print-table" />
				</button>
			</div>
				
			<ClickBlocker custom={true} block={infoFormOpen}>
				<EmployeeInfoForm setFormOpen={setInfoFormOpen} refreshTable={dataRefresh} deepRefresh={deepDataRefresh} companyID={dataObject.id} add/>
			</ClickBlocker>
		</div>
	);
}

export default AdminDashboard;
