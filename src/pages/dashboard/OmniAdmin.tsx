import { useRef, useState } from "react";

import { CreateCompanyDialog } from "../../components/CreateCompanyDialog";
import { EmployeeInfoDialog } from "../../components/EmployeeInfoDialog";
import { DisplayTable } from "../../components/DisplayTable";
import type { CompanySummary } from "../../utils/dataModels";
import { useCompanies } from "../../utils/firebaseQueries";
import styles from "./sass/OmniAdmin.module.scss";

const companyNameCollator = new Intl.Collator(undefined, {
  sensitivity: "base",
});

function getCompanyName(company: CompanySummary) {
  const name = company.name?.trim();
  return name || `Unnamed company (${company.id})`;
}

export default function OmniAdminDashboard() {
  const [addingEmployee, setAddingEmployee] = useState(false);
  const [createCompanyOpen, setCreateCompanyOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    null,
  );
  const addEmployeeButtonRef = useRef<HTMLButtonElement>(null);
  const createCompanyButtonRef = useRef<HTMLButtonElement>(null);
  const { data: companyData, isError, isPending } = useCompanies();
  const companies = [...companyData].sort((firstCompany, secondCompany) => {
    const nameComparison = companyNameCollator.compare(
      getCompanyName(firstCompany),
      getCompanyName(secondCompany),
    );

    return (
      nameComparison ||
      companyNameCollator.compare(firstCompany.id, secondCompany.id)
    );
  });
  const selectedCompany =
    companies.find((company) => company.id === selectedCompanyId) ??
    companies[0];

  const selectCompany = (companyId: string) => {
    if (companyId === selectedCompany?.id) return;

    setHasUnsavedChanges(false);
    setAddingEmployee(false);
    setSelectedDate(new Date());
    setSelectedCompanyId(companyId);
  };

  const handleCompanyCreated = (companyId: string) => {
    selectCompany(companyId);
    setCreateCompanyOpen(false);
  };

  return (
    <main
      aria-labelledby="omni-admin-dashboard-title"
      className={styles.dashboardContainer}
    >
      <header className={styles.introduction}>
        <p className={styles.eyebrow}>OmniAdmin</p>
        <h2 id="omni-admin-dashboard-title">Company management</h2>
        <p>Select a company to view its workspace and manage its employees.</p>
      </header>
      <div className={styles.dashboardActions}>
        <button
          aria-describedby={
            hasUnsavedChanges ? "company-selection-disabled-message" : undefined
          }
          className={styles.createCompanyButton}
          disabled={hasUnsavedChanges || isPending}
          onClick={() => setCreateCompanyOpen(true)}
          ref={createCompanyButtonRef}
          type="button"
        >
          Create company
        </button>
      </div>
      {isPending ? (
        <section aria-live="polite" className={styles.queryState}>
          <h3>Loading companies...</h3>
          <p>The company workspace will be ready shortly.</p>
        </section>
      ) : isError ? (
        <section className={styles.queryState} role="alert">
          <h3>Unable to load companies</h3>
          <p>
            Refresh the page to try again. If the problem continues, report the
            issue.
          </p>
        </section>
      ) : !selectedCompany ? (
        <section className={styles.queryState}>
          <h3>No companies found</h3>
          <p>Create a company to open its workspace.</p>
        </section>
      ) : (
        <div className={styles.workspaceLayout}>
          <nav
            aria-describedby={
              hasUnsavedChanges
                ? "company-selection-disabled-message"
                : undefined
            }
            aria-labelledby="company-selector-title"
            className={styles.companyNavigation}
          >
            <h3 id="company-selector-title">Companies</h3>
            {hasUnsavedChanges && (
              <p
                className={styles.unsavedMessage}
                id="company-selection-disabled-message"
                role="status"
              >
                Save or undo table changes before switching companies.
              </p>
            )}
            <div className={styles.companyList}>
              {companies.map((company) => {
                const selected = company.id === selectedCompany.id;

                return (
                  <button
                    aria-current={selected ? "page" : undefined}
                    className={styles.companyButton}
                    disabled={hasUnsavedChanges && !selected}
                    key={company.id}
                    onClick={() => selectCompany(company.id)}
                    type="button"
                  >
                    {getCompanyName(company)}
                  </button>
                );
              })}
            </div>
          </nav>
          <section
            aria-label={`Company workspace for ${getCompanyName(
              selectedCompany,
            )}`}
            className={styles.companyWorkspace}
          >
            <p className={styles.workspaceEyebrow}>Company workspace</p>
            <DisplayTable
              companyId={selectedCompany.id}
              key={selectedCompany.id}
              onSelectedDateChange={setSelectedDate}
              onUnsavedChangesChange={setHasUnsavedChanges}
              selectedDate={selectedDate}
            />
            <div className={styles.workspaceActions}>
              <button
                aria-label={`Add employee to ${getCompanyName(
                  selectedCompany,
                )}`}
                className={styles.addEmployeeButton}
                onClick={() => setAddingEmployee(true)}
                ref={addEmployeeButtonRef}
                type="button"
              >
                Add employee
              </button>
            </div>
          </section>
          <EmployeeInfoDialog
            add
            admin
            companyId={selectedCompany.id}
            key={selectedCompany.id}
            onOpenChange={setAddingEmployee}
            open={addingEmployee}
            returnFocusRef={addEmployeeButtonRef}
          />
        </div>
      )}
      <CreateCompanyDialog
        onCompanyCreated={handleCompanyCreated}
        onOpenChange={setCreateCompanyOpen}
        open={createCompanyOpen}
        returnFocusRef={createCompanyButtonRef}
      />
    </main>
  );
}
