export interface AdminData {
  company: string;
  isAdmin: boolean;
  omniAdmin: boolean;
}

export interface EmployeeData {
  firstName: string;
  lastName: string;
  name: string;
  rate: number;
}

export interface WeeklyHours {
  0: { hours: number; notes?: string };
  1: { hours: number; notes?: string };
  2: { hours: number; notes?: string };
  3: { hours: number; notes?: string };
  4: { hours: number; notes?: string };
  5: { hours: number; notes?: string };
  6: { hours: number; notes?: string };
  additionalHours?: { hours: number };
}
