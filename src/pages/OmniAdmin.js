import React, { useEffect, useState } from "react";
import {
  getCompanies,
  getCompanyFromCache,
  performLogout,
  transferEmpData,
} from "../utils/firebase";
// import { format } from 'date-fns';
// import { DayPicker } from 'react-day-picker';
import "react-day-picker/dist/style.css";
import "./OmniAdmin.css";
import DisplayTable from "../components/DisplayTable";
import ClickBlocker from "../components/ClickBlocker";
import { useQuery } from "@tanstack/react-query";
import { useCompanies } from "../utils/firebaseQueries.ts";

function OmniAdminDashboard(props) {
  const [oldUserID, setOldUserID] = useState("");
  const [newUserID, setNewUserID] = useState("");
  const [blocked, setBlocked] = useState(false);

  const handleLogout = async () => {
    performLogout(props.setCurrPage);
  };

  const { data: companies, pending } = useCompanies();

  const addCompany = (company) => {
    console.log("add company: " + company);
  };

  const deleteCompany = (company) => {
    console.log("delete company: " + company.id + " - " + company.name);
  };

  const handleTransferData = (e) => {
    e.preventDefault();
    setBlocked(true);
    transferEmpData(oldUserID, newUserID)
      .then(() => {
        setBlocked(false);
      })
      .catch(() => {
        alert("error");
        setBlocked(false);
      });
  };

  if (!companies || pending) {
    return <div>Loading</div>;
  }
  return (
    <div className="dashboard-container">
      <ClickBlocker block={blocked} loading />
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
          addAdmins
        />
        <details className="data-transfer-details">
          <summary>Transfer User Data (Ruann)</summary>
          <form className="data-transfer-form" onSubmit={handleTransferData}>
            <input
              type="userID"
              className="data-transfer-input"
              placeholder="Old ID"
              value={oldUserID}
              onChange={(e) => setOldUserID(e.target.value)}
            />
            <input
              type="userID"
              className="data-transfer-input"
              placeholder="New ID"
              value={newUserID}
              onChange={(e) => setNewUserID(e.target.value)}
            />
            <button type="submit" className="data-transfer-button">
              Transfer User Data
            </button>
          </form>
        </details>
      </div>
    </div>
  );
}

export default OmniAdminDashboard;
