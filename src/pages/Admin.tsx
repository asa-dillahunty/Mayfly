import React, { useState } from "react";
import { performLogout, auth } from "../utils/firebase";

import {
  getEndOfWeekString,
  getStartOfWeekString,
  selectedDate,
  buildDocName,
  ABBREVIATIONS,
} from "../utils/dateUtils.ts";

import "./Admin.css";
import {
  AdminCompanyDisplayTable,
  DisplayTableSkeleton,
} from "../components/DisplayTable";
import ClickBlocker from "../components/ClickBlocker";
import EmployeeInfoForm from "../components/EmployeeInfoForm";
import jsPDF from "jspdf";
import logo from "../assets/DillahuntyFarmsLogo.png";
import { AiFillPlusCircle, AiOutlinePrinter } from "react-icons/ai";
import { useQuery } from "@tanstack/react-query";
import {
  getAdminDataQuery,
  getCompanyQuery,
  getCompanyEmployeeList,
} from "../utils/firebaseQueries.ts";

function AdminDashboard(props) {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Mayfly</h1>
        <button
          className="dashboard-logout"
          onClick={() => performLogout(props.setCurrPage)}
        >
          Log Out
        </button>
      </div>
      <ContentContainer />
    </div>
  );
}

function ContentContainer() {
  const [infoFormOpen, setInfoFormOpen] = useState(false);
  const [previewPDF, setPreviewPDF] = useState(false);
  const { data: adminData, isLoading: isLoadingId } = useQuery(
    getAdminDataQuery(auth.currentUser.uid)
  );
  const { data: companyData, isLoading: isLoadingCompany } = useQuery(
    getCompanyQuery(adminData?.company)
  );

  const isLoading = isLoadingId || isLoadingCompany;

  if (isLoading) {
    return (
      <div className="dashboard-content contain-click-blocker skeleton">
        <DisplayTableSkeleton />
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="dashboard-content contain-click-blocker skeleton">
        <h3>There has been an error. Please refresh and report the issue</h3>
      </div>
    );
  }

  return (
    <div className="dashboard-content contain-click-blocker">
      {/* <ClickBlocker block={blocked} loading /> */}
      {/* <ClickBlocker block={previewPDF !== false} custom>
          <iframe id="pdfobject" title="pdfObject" src={previewPDF} />
        </ClickBlocker> */}

      <AdminCompanyDisplayTable company={companyData} />

      <div className="admin-button-container">
        <button
          className="add-emp"
          onClick={() => {
            setInfoFormOpen(true);
          }}
        >
          <AiFillPlusCircle />
          Add Employee
        </button>
        <button
          className="print-table"
          onClick={() => createPrintable(companyData)}
        >
          <AiOutlinePrinter className="print-table" />
        </button>
      </div>

      <ClickBlocker custom={true} block={infoFormOpen}>
        <EmployeeInfoForm
          setFormOpen={setInfoFormOpen}
          companyId={companyData.id}
          add
        />
      </ClickBlocker>
    </div>
  );
}

export default AdminDashboard;

const createPrintable = (dataObject) => {
  const newDoc = new jsPDF();
  const logoPrint = new Image();
  const docName = buildDocName(selectedDate.value);
  logoPrint.src = logo;

  const defaultFontSize = 16;
  const smallFontSize = 12;
  const lineHeight = 8;
  // const defaultFont = newDoc.getFontSize();
  // console.log(defaultFont);

  // get the employee list, how?
  getCompanyEmployeeList(dataObject.id, docName).then(async (empList) => {
    let line = 0;
    let shownEmps = 0;
    for (let i = 0; i < empList.length; i++) {
      // for (let i=0; i<1; i++) {
      if (empList[i].hidden) continue;
      if (shownEmps !== 0 && shownEmps % 2 === 0) {
        newDoc.addPage();
        line = 0;
      }

      line += 2;
      newDoc.setFontSize(defaultFontSize);

      newDoc.addImage(logoPrint, "png", 160, line * lineHeight, 30, 30);
      // newDoc.text("Employer Name:", 10, line * lineHeight);
      newDoc.text("H. T. Dillahunty & Sons", 10, line * lineHeight);
      line++;

      // newDoc.text("Employer Address:", 10, line * lineHeight);
      newDoc.text("58 SFC 617 Hughes, AR  72348", 10, line * lineHeight);
      line++;

      // newDoc.text("Employer ID:", 10, line * lineHeight);
      newDoc.text("710450529", 10, line * lineHeight);
      line++;

      newDoc.text("State of Employment - Arkansas", 10, line * lineHeight);
      // newDoc.text("Arkansas", 70, line * lineHeight);
      line++;
      line += 0.5;

      // newDoc.text(`Employee:`, 10, line * lineHeight);
      newDoc.text(`${empList[i].name}`, 11, line * lineHeight);
      line++;

      // newDoc.text(`Week:`, 10, line * lineHeight);
      newDoc.text(
        `${getStartOfWeekString(
          selectedDate.value
        )}   -   ${getEndOfWeekString(selectedDate.value)}`,
        11,
        line * lineHeight
      );
      line++;

      newDoc.setFontSize(smallFontSize);
      for (let j = 0; j < empList[i].hoursList.length; j++) {
        newDoc.text(
          `${ABBREVIATIONS[(j + 4) % 7]}`,
          15 + 13 * j,
          line * lineHeight
        );
      }

      newDoc.text(
        "Hours Worked    Hours Offered    Hours Paid",
        15 + 13 * 8 - 5,
        line * lineHeight
      );
      const leftX = 15 + 13 * 8 - 10;
      const midLeftX = 15 + 13 * 8 + 24;
      const midRightX = 15 + 13 * 8 + 56;
      const rightX = 15 + 13 * 8 + 81;

      const topY = (line - 0.75) * lineHeight;
      const bottomY = (line + 1.75) * lineHeight;

      newDoc.line(leftX, topY, leftX, bottomY);
      newDoc.line(midLeftX, topY, midLeftX, bottomY);
      newDoc.line(midRightX, topY, midRightX, bottomY);
      newDoc.line(rightX, topY, rightX, bottomY);

      newDoc.line(leftX, topY, rightX, topY);
      newDoc.line(leftX, bottomY, rightX, bottomY);
      // line++;
      line += 0.5;

      for (let j = 0; j < empList[i].hoursList.length; j++) {
        newDoc.text(
          `${empList[i].hoursList[(j + 4) % 7]}`,
          15 + 13 * j,
          line * lineHeight
        );
      }

      line += 0.5;
      newDoc.text(
        `${empList[i].hoursWorkedThisWeek}`,
        15 + 13 * 8 + 3,
        line * lineHeight
      );
      newDoc.text(
        `${empList[i].hoursPaidThisWeek}`,
        15 + 13 * 8 + 65,
        line * lineHeight
      );
      line -= 0.5;

      line += 0.5;
      newDoc.setFontSize(defaultFontSize);
      line++;

      newDoc.text(`Rate Per Hour`, 10, line * lineHeight);
      newDoc.text(`Gross Pay`, 70, line * lineHeight);
      line++;

      newDoc.setFontSize(smallFontSize);
      line -= 0.2;
      newDoc.text(`$${empList[i].rate}`, 10, line * lineHeight);
      // Math.round(num * 100) / 100
      newDoc.text(
        `$${(
          Math.round(empList[i].rate * empList[i].hoursPaidThisWeek * 100) / 100
        ).toFixed(2)}`,
        70,
        line * lineHeight
      );
      line += 0.2;
      // line++;

      newDoc.setFontSize(smallFontSize);
      newDoc.text(
        `Date Paid:   ${new Date().toDateString()}`,
        140,
        line * lineHeight
      );
      line++;

      // newDoc.setFontSize(defaultFontSize);
      newDoc.text(`Deductions:   FICA / FED`, 10, line * lineHeight);

      shownEmps++;
    }

    newDoc.setProperties({
      title: `${dataObject.name}-hours-week-${docName}.pdf`,
    });
    const url = newDoc.output("bloburi");
    window.open(url, "_blank");
    //   setPreviewPDF(url);
    // newDoc.save(`${dataObject.name}-hours-week-${docName}.pdf`);
  });
};
