import dillahuntyFarmsLogo from "../assets/DillahuntyFarmsLogo.png";
import type { CompanyReportProfile } from "./dataModels";

const companyReportProfiles: Record<string, CompanyReportProfile> = {
  "H. T. Dillahunty & Sons": {
    address: "58 SFC 617 Hughes, AR  72348",
    ein: "710450529",
    legalName: "H. T. Dillahunty & Sons",
    logoSource: dillahuntyFarmsLogo,
    stateOfEmployment: "Arkansas",
  },
  "Epic Systems": {
    address: "1979 Milky Way, Verona, WI 53593",
    ein: "123456789",
    legalName: "Epic Systems",
    logoSource: dillahuntyFarmsLogo,
    stateOfEmployment: "Wisconsin",
  },
};

export function getCompanyReportProfile(
  companyName: string | undefined,
): CompanyReportProfile | undefined {
  if (!companyName) return undefined;
  return companyReportProfiles[companyName];
}
