export interface AdminData {
  company: string;
  isAdmin: boolean;
  omniAdmin: boolean;
  hidden?: boolean;
}

export interface EmployeeData {
  firstName: string;
  lastName: string;
  name: string;
  rate: number;
}

export interface CompanyEmployee extends EmployeeData {
  id: string;
  email?: string;
  isAdmin?: boolean;
  unclaimed?: boolean;
}

export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface DayHours {
  hours: number;
  notes?: string;
}

export interface WeeklyHours {
  [day: number]: DayHours;
  0: DayHours;
  1: DayHours;
  2: DayHours;
  3: DayHours;
  4: DayHours;
  5: DayHours;
  6: DayHours;
  additionalHours?: { hours: number };
}
