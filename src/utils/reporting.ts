import jsPDF from "jspdf";

import {
  ABBREVIATIONS,
  buildDocName,
  getEndOfWeekString,
  getStartOfWeekString,
  PAY_PERIOD_DAYS,
} from "./dateUtils";
import type {
  CompanyReportProfile,
  PrintableEmployeeReportRow,
} from "./dataModels";

interface CreatePrintableOptions {
  companyProfile: CompanyReportProfile;
  employees: PrintableEmployeeReportRow[];
  selectedDate: Date;
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load the company logo."));
    image.src = source;
  });
}

export async function createPrintable({
  companyProfile,
  employees,
  selectedDate,
}: CreatePrintableOptions): Promise<string> {
  const newDoc = new jsPDF();
  const logo = await loadImage(companyProfile.logoSource);
  const docName = buildDocName(selectedDate);
  const defaultFontSize = 16;
  const smallFontSize = 12;
  const lineHeight = 8;
  let line = 0;

  employees.forEach((employee, employeeIndex) => {
    if (employeeIndex !== 0 && employeeIndex % 2 === 0) {
      newDoc.addPage();
      line = 0;
    }

    line += 2;
    newDoc.setFontSize(defaultFontSize);
    newDoc.addImage(logo, "PNG", 160, line * lineHeight, 30, 30);
    newDoc.text(companyProfile.legalName, 10, line * lineHeight);
    line++;
    newDoc.text(companyProfile.address, 10, line * lineHeight);
    line++;
    newDoc.text(companyProfile.ein, 10, line * lineHeight);
    line++;
    newDoc.text(
      `State of Employment - ${companyProfile.stateOfEmployment}`,
      10,
      line * lineHeight,
    );
    line += 1.5;
    newDoc.text(employee.name, 11, line * lineHeight);
    line++;
    newDoc.text(
      `${getStartOfWeekString(selectedDate)}   -   ${getEndOfWeekString(
        selectedDate,
      )}`,
      11,
      line * lineHeight,
    );
    line++;

    newDoc.setFontSize(smallFontSize);
    PAY_PERIOD_DAYS.forEach((day, dayIndex) => {
      newDoc.text(ABBREVIATIONS[day], 15 + 13 * dayIndex, line * lineHeight);
    });

    newDoc.text(
      "Hours Worked    Hours Offered    Hours Paid",
      15 + 13 * 8 - 5,
      line * lineHeight,
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
    line += 0.5;

    PAY_PERIOD_DAYS.forEach((day, dayIndex) => {
      newDoc.text(
        String(employee.dailyHours[day]),
        15 + 13 * dayIndex,
        line * lineHeight,
      );
    });

    line += 0.5;
    newDoc.text(
      String(employee.regularHours),
      15 + 13 * 8 + 3,
      line * lineHeight,
    );
    newDoc.text(
      String(employee.paidHours),
      15 + 13 * 8 + 65,
      line * lineHeight,
    );
    line++;

    newDoc.setFontSize(defaultFontSize);
    newDoc.text("Rate Per Hour", 10, line * lineHeight);
    newDoc.text("Gross Pay", 70, line * lineHeight);
    line += 0.8;

    newDoc.setFontSize(smallFontSize);
    newDoc.text(`$${employee.rate}`, 10, line * lineHeight);
    newDoc.text(
      `$${(Math.round(employee.rate * employee.paidHours * 100) / 100).toFixed(
        2,
      )}`,
      70,
      line * lineHeight,
    );
    line += 0.2;
    newDoc.text(
      `Date Paid:   ${new Date().toDateString()}`,
      140,
      line * lineHeight,
    );
    line++;
    newDoc.text("Deductions:   FICA / FED", 10, line * lineHeight);
  });

  newDoc.setProperties({
    title: `${companyProfile.legalName}-hours-week-${docName}.pdf`,
  });

  return newDoc.output("bloburi").toString();
}
