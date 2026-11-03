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

export type CvProfile = {
  rawText: string;
  fileName?: string;
  updatedAt: string;
  headline?: string;
  summary?: string;
  skills: string[];
  titles: string[];
  yearsExperience?: number;
  locations: string[];
  keywords: string[];
};

export type JobSource = "remotive" | "arbeitnow" | "manual";

export type JobListing = {
  id: string;
  source: JobSource;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  tags: string[];
  salary?: string;
  postedAt?: string;
  relevance?: number;
  matchReasons?: string[];
};

export type ApplicationStatus =
  | "saved"
  | "drafted"
  | "applied"
  | "interview"
  | "offer"
  | "rejected";

export type JobApplication = {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  url: string;
  status: ApplicationStatus;
  coverLetter?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type Contact = {
  id: string;
  company: string;
  roleHint: string;
  name?: string;
  email?: string;
  linkedinUrl?: string;
  whyInteresting: string;
  outreachDraft?: string;
  status: "to_find" | "identified" | "reached_out" | "replied";
  createdAt: string;
};

export type FinanceItemStatus = "todo" | "doing" | "done" | "n_a";

export type FinanceItem = {
  id: string;
  category: string;
  title: string;
  description: string;
  advice: string;
  references: { label: string; url: string }[];
  status: FinanceItemStatus;
  notes?: string;
  dueHint?: string;
};

export type UserData = {
  userId: string;
  cv?: CvProfile;
  applications: JobApplication[];
  contacts: Contact[];
  finance: FinanceItem[];
  savedJobIds: string[];
  notes: string;
  updatedAt: string;
};

export type Database = {
  users: User[];
  userData: Record<string, UserData>;
};
