import React, { useState } from "react";
import ClickBlocker from "./ClickBlocker";

import "./DisplayTable.css";

import {
  ABBREVIATIONS,
  getEndOfWeekString,
  getStartOfWeekString,
} from "../utils/dateUtils.ts";

import Dropdown from "react-bootstrap/Dropdown";
import HourAdder from "./HourAdder";
import EmployeeInfoForm from "./EmployeeInfoForm";
import {
  AiFillLeftSquare,
  AiFillRightSquare,
  AiOutlineMore,
} from "react-icons/ai";
import { ClipLoader } from "react-spinners";
import logo from "../assets/DillahuntyFarmsLogo.png";
import { useQuery } from "@tanstack/react-query";
import {
  getAdminDataQuery,
  getCompanyEmployeeQuery,
  getUserWeekQuery,
  useCreateCompany,
  useMakeAdmin,
  useRemoveEmployee,
  useSetAdditionalHours,
} from "../utils/firebaseQueries.ts";

function CreateCompanyPopup(props) {
  const [companyName, setCompanyName] = useState("");

  const onSubmit = () => {
    if (companyName.trim() === "") return;
    props.onAdd(companyName);
  };

  return (
    <div className="form-wrapper">
      <input
        placeholder="Company Name"
        type="text"
        value={companyName}
        onChange={(e) => {
          setCompanyName(e.target.value);
        }}
      />
      <button onClick={onSubmit}>Submit</button>
      <br />
      <button onClick={props.onCancel}>Cancel</button>
    </div>
  );
}

export function DisplayTableSkeleton({ selectedDate }) {
  return (
    <div className="company-display-table skeleton">
      <div className="shimmer-box"></div>
      <h2> </h2>
      <ul>
        <li className="table-key">
          {/* <div className='dropdown'></div> fake kebab so we get spacing right */}
          <span className="date-row">
            <AiFillLeftSquare className="week-button" />
            <span className="week-string">
              {getStartOfWeekString(selectedDate)}
              &nbsp;&nbsp;&nbsp;&#x2015;&nbsp;&nbsp;&nbsp;
              {getEndOfWeekString(selectedDate)}
            </span>
            <AiFillRightSquare className="week-button" />
          </span>
        </li>

        {Array.from(Array(6)).map((_, index) => (
          <EmployeeLine key={index} /> // without emp.id, should be skeleton lines
        ))}
      </ul>
    </div>
  );
}

export function AdminCompanyDisplayTable({
  company,
  adminAble,
  selectedDate,
  setSelectedDate,
}) {
  // jumps selectedDate a week forward
  const jumpForward = () => {
    setSelectedDate(
      new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate() + 7
      )
    );
  };

  // jumps selectedDate a week forward
  const jumpBackward = () => {
    setSelectedDate(
      new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate() - 7
      )
    );
  };

  let claimedList;
  let unclaimedList;
  if (company && company.Employees) {
    claimedList = company.Employees.filter((emp) => !emp.unclaimed);
    unclaimedList = company.Employees.filter((emp) => emp.unclaimed);
  }

  return (
    <div className="company-display-table">
      {company.name === "H. T. Dillahunty & Sons" ? (
        <h2>
          {" "}
          <img
            src={logo}
            className="company-logo"
            alt="H. T. Dillahunty & Sons"
          />{" "}
        </h2>
      ) : (
        <h2> {company.name} </h2>
      )}
      <ul>
        <li key={0} className="table-key">
          {/* <div className='dropdown'></div> fake kebab so we get spacing right */}
          <span className="date-row">
            <AiFillLeftSquare className="week-button" onClick={jumpBackward} />
            <span className="week-string">
              {getStartOfWeekString(selectedDate)}
              &nbsp;&nbsp;&nbsp;&#x2015;&nbsp;&nbsp;&nbsp;
              {getEndOfWeekString(selectedDate)}
            </span>
            <AiFillRightSquare className="week-button" onClick={jumpForward} />
          </span>
        </li>
        <li className="big-screen">
          <div className="dropdown">
            {/* <button className="kebab-container">
              <span className="kebab">&#8942;</span>
            </button> */}
          </div>
          <span className="employee-name"></span>
          <span className="employee-daily-hours">{ABBREVIATIONS[4]}</span>
          <span className="employee-daily-hours">{ABBREVIATIONS[5]}</span>
          <span className="employee-daily-hours">{ABBREVIATIONS[6]}</span>
          <span className="employee-daily-hours">{ABBREVIATIONS[0]}</span>
          <span className="employee-daily-hours">{ABBREVIATIONS[1]}</span>
          <span className="employee-daily-hours">{ABBREVIATIONS[2]}</span>
          <span className="employee-daily-hours">{ABBREVIATIONS[3]}</span>
          <span className="employee-weekly-hours"></span>
        </li>
        {claimedList.map((emp) => (
          <EmployeeLine
            key={emp.id}
            company={company}
            empId={emp.id}
            adminAble={adminAble}
            selectedDate={selectedDate}
          />
        ))}

        <li
          key={unclaimedList.length + 1}
          className="table-key"
          hidden={unclaimedList.length < 1}
        >
          <div className="dropdown"></div>
          {/* fake kebab so we get spacing right */}
          <span className="employee-name">Unregistered Employees</span>
          <span className="employee-weekly-hours">Code</span>
        </li>
        {unclaimedList.map((emp, index) => (
          <EmployeeLine
            key={index + claimedList.length + 2}
            emp={emp}
            company={company}
            adminAble={adminAble}
            selectedDate={selectedDate} // likely won't need selected date if unclaimed
          />
        ))}
      </ul>
    </div>
  );
}

const CustomToggle = React.forwardRef(({ children, onClick }, _ref) => (
  <button
    className="kebab-container"
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
  >
    {/* custom icon */}
    {children}
  </button>
));

function EmployeeLine({ empId, company, adminAble, selectedDate }) {
  const [blocked, setBlocked] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [editUser, setEditUser] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const empQuery = useQuery(getCompanyEmployeeQuery(company?.id, empId));
  const empAdminQuery = useQuery(getAdminDataQuery(empId));
  const hoursQuery = useQuery(getUserWeekQuery(empId, selectedDate));
  const { data: weeklyHours } = hoursQuery;
  const { data: empData } = empQuery;
  // what is empData supposed to be?
  // we need { id, firstName, lastName, name }

  const removeEmployee = useRemoveEmployee();
  const makeAdmin = useMakeAdmin();
  const setAdditionalHours = useSetAdditionalHours();

  function deleteUser() {
    setBlocked(true);
    removeEmployee(empId, company.id, () => setBlocked(false));
  }

  const toggleShow = () => {
    setShowMore(!showMore);
  };
  const toggleEdit = () => {
    setEditUser(!editUser);
  };

  const countTotalHours = () => {
    if (!weeklyHours) return 0;

    var total = 0;
    for (var value in weeklyHours) {
      if (value === "additionalHours") continue;
      total += weeklyHours[value].hours;
    }
    return total;
  };

  const findAdditionalHours = () => {
    return weeklyHours?.["additionalHours"]?.hours ?? 0;
  };

  function roundToFortyHours() {
    setBlocked(true);
    const currTotal = countTotalHours();
    if (currTotal > 40) {
      setAdditionalHours(empData.id, selectedDate, 0, () => setBlocked(false));
    } else {
      setAdditionalHours(empData.id, selectedDate, 40 - currTotal, () =>
        setBlocked(false)
      );
    }
  }

  // TODO: should be a skeleton of some kind?
  // ASK: if emp is hidden, this will vanish, might be bad to have a skeleton
  if (!empData?.id || !empAdminQuery.data)
    return (
      <li>
        <span className="kebab">&#8942;</span>
        <span className="employee-name"></span>
        <span className="employee-daily-hours big-screen"></span>
        <span className="employee-daily-hours big-screen"></span>
        <span className="employee-daily-hours big-screen"></span>
        <span className="employee-daily-hours big-screen"></span>
        <span className="employee-daily-hours big-screen"></span>
        <span className="employee-daily-hours big-screen"></span>
        <span className="employee-daily-hours big-screen"></span>
        <span className="employee-weekly-hours"></span>
      </li>
    );
  if (empAdminQuery.data.hidden) return <></>;
  return (
    <li>
      {/* <span className='kebab'>&#8942;</span> */}
      <ClickBlocker block={editUser} custom>
        <EmployeeInfoForm
          empData={empData}
          setFormOpen={setEditUser}
          companyId={company.id}
          edit
        />
      </ClickBlocker>
      <ClickBlocker
        block={confirmDelete}
        confirm
        message={`Are you sure you want to remove ${empData.name} from ${company.name}?`}
        messageEmphasized={"This action cannot be undone."}
        onConfirm={deleteUser}
        onCancel={() => setConfirmDelete(false)}
      />
      <ClickBlocker block={blocked} loading />
      <Dropdown>
        <Dropdown.Toggle as={CustomToggle}>
          <span className="kebab">
            <AiOutlineMore />
          </span>
        </Dropdown.Toggle>
        <Dropdown.Menu size="sm" title="">
          {empData.unclaimed ? (
            <></>
          ) : (
            <Dropdown.Item onClick={toggleShow}>Edit Hours</Dropdown.Item>
          )}
          {empData.unclaimed ? (
            <></>
          ) : (
            <Dropdown.Item onClick={roundToFortyHours}>
              Add Additional Hours
            </Dropdown.Item>
          )}
          <Dropdown.Item onClick={toggleEdit}>
            Edit Employee Information
          </Dropdown.Item>
          <Dropdown.Item onClick={() => setConfirmDelete(true)}>
            Remove Employee
          </Dropdown.Item>
          {!adminAble ? (
            <></>
          ) : (
            <Dropdown.Item
              onClick={() => {
                makeAdmin(empData.id);
              }}
            >
              Make Admin
            </Dropdown.Item>
          )}
        </Dropdown.Menu>
      </Dropdown>
      <span className="employee-name"> {empData.name} </span>
      {!weeklyHours ? (
        <>
          <span className="employee-daily-hours big-screen"></span>
          <span className="employee-daily-hours big-screen"></span>
          <span className="employee-daily-hours big-screen"></span>
          <span className="employee-daily-hours big-screen"></span>
          <span className="employee-daily-hours big-screen"></span>
          <span className="employee-daily-hours big-screen"></span>
          <span className="employee-daily-hours big-screen"></span>
          <span className="employee-weekly-hours">
            <ClipLoader size={16} color="#ffffff" />{" "}
          </span>
        </>
      ) : (
        <>
          <span className="employee-daily-hours big-screen">
            {weeklyHours[4].hours.toFixed(1)}
          </span>
          <span className="employee-daily-hours big-screen">
            {weeklyHours[5].hours.toFixed(1)}
          </span>
          <span className="employee-daily-hours big-screen">
            {weeklyHours[6].hours.toFixed(1)}
          </span>
          <span className="employee-daily-hours big-screen">
            {weeklyHours[0].hours.toFixed(1)}
          </span>
          <span className="employee-daily-hours big-screen">
            {weeklyHours[1].hours.toFixed(1)}
          </span>
          <span className="employee-daily-hours big-screen">
            {weeklyHours[2].hours.toFixed(1)}
          </span>
          <span className="employee-daily-hours big-screen">
            {weeklyHours[3].hours.toFixed(1)}
          </span>
          <span className="employee-weekly-hours small-screen">
            {countTotalHours()}
            {findAdditionalHours() ? `+${findAdditionalHours()}` : ""}
          </span>
        </>
      )}
      {empData.unclaimed ? (
        <></>
      ) : (
        <ClickBlocker block={showMore} custom={true}>
          <div className="more-info">
            <HourAdder
              uid={empData.id}
              blocked={blocked}
              setBlocked={setBlocked}
            />
            <button
              className="toggler"
              onClick={() => {
                toggleShow();
              }}
            >
              Done
            </button>
          </div>
        </ClickBlocker>
      )}
    </li>
  );
}

export function CompanyDisplayTable(props) {
  const [formOpen, setFormOpen] = useState(false);

  return (
    <details className="company-details">
      <summary> {props.company.name} </summary>
      <AdminCompanyDisplayTable
        company={props.company}
        refreshTable={props.refreshTable}
        adminAble={props.addAdmins}
      />
      <button
        className="add-emp"
        onClick={() => {
          setFormOpen(true);
        }}
      >
        Add Employee
      </button>
      <ClickBlocker custom block={formOpen}>
        <EmployeeInfoForm
          setFormOpen={setFormOpen}
          refreshTable={props.refreshTable}
          companyId={props.company.id}
          admin
          add
        />
      </ClickBlocker>
      <button onClick={() => props.onDelete(props.company)}>
        Delete Company
      </button>
    </details>
  );
}

function DisplayTable(props) {
  const [createVisible, setCreateVisible] = useState(false);
  const toggleCreateVisible = () => setCreateVisible(!createVisible);

  const createCompany = useCreateCompany();

  const addCompany = (companyName) => {
    createCompany(companyName, () => setCreateVisible(false));
  };

  const onCancel = () => {
    toggleCreateVisible();
  };

  const tempDelete = (companyData) => {
    console.log(companyData);
  };
  // const removeItem = (id) => {
  // 	setItems(items.filter(item => item.id !== id));
  // };

  return (
    <div className="display-table">
      <ul>
        {props.displayItems.map((item) => (
          <li key={"companies" + item.id}>
            <CompanyDisplayTable
              company={item}
              onDelete={tempDelete}
              refreshTable={props.refreshTable}
              addAdmins={props.addAdmins}
            />
          </li>
        ))}
      </ul>

      <button className="popup-trigger" onClick={toggleCreateVisible}>
        Create Company
      </button>
      {/* <CreateCompanyPopup Visible={createVisible} toggleVisible={toggleCreateVisible} /> */}
      <ClickBlocker block={createVisible} custom={true}>
        <CreateCompanyPopup onAdd={addCompany} onCancel={onCancel} />
      </ClickBlocker>
    </div>
  );
}

export default DisplayTable;
