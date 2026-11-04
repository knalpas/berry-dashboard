export type Role = "admin" | "user";

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  passwordHash: string;
  createdAt: string;
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

/* ---------- Money ---------- */

export type AccountKind =
  | "current"
  | "savings"
  | "isa"
  | "investment"
  | "pension"
  | "credit"
  | "loan";

export type Account = {
  id: string;
  name: string;
  kind: AccountKind;
  /** Always entered as a positive number. Credit / loan balances are what you owe. */
  balance: number;
  /** Month-end style snapshots keyed by YYYY-MM, used for net-worth change. */
  history: Record<string, number>;
  updatedAt: string;
};

export type Transaction = {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  /** Positive = money in, negative = money out. */
  amount: number;
  category: string;
};

export type Bill = {
  id: string;
  name: string;
  amount: number;
  dayOfMonth: number; // 1–31
  category: string;
};

export type Goal = {
  id: string;
  name: string;
  target: number;
  saved: number;
  deadline?: string; // YYYY-MM-DD
};

/* ---------- Admin ---------- */

export type AdminArea =
  | "Tax"
  | "Pension"
  | "Investments"
  | "Insurance"
  | "Home"
  | "Documents"
  | "Health"
  | "Other";

export type Repeat = "none" | "monthly" | "yearly";

export type AdminTask = {
  id: string;
  title: string;
  area: AdminArea;
  dueDate?: string; // YYYY-MM-DD
  repeat: Repeat;
  done: boolean;
  lastDoneAt?: string;
  notes?: string;
  advice?: string;
  references?: { label: string; url: string }[];
};

export type Settings = {
  /** Monthly spending limit per category. */
  budgets: Record<string, number>;
  /** Manually tracked tax-year allowances (resets are manual). */
  isaUsed: number;
  pensionUsed: number;
  notes: string;
};

export type Workspace = {
  accounts: Account[];
  transactions: Transaction[];
  bills: Bill[];
  goals: Goal[];
  tasks: AdminTask[];
  settings: Settings;
};

export type UserData = Workspace & {
  userId: string;
  updatedAt: string;
};

export type Database = {
  users: User[];
  userData: Record<string, UserData>;
};

export type Collection =
  | "accounts"
  | "transactions"
  | "bills"
  | "goals"
  | "tasks";
