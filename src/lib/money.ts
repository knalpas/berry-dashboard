import { Account, AccountKind, Transaction } from "./types";
import { monthKey, shiftMonthKey } from "./dates";

export const EXPENSE_CATEGORIES = [
  "Housing",
  "Bills",
  "Groceries",
  "Eating out",
  "Transport",
  "Shopping",
  "Health",
  "Fun",
  "Travel",
  "Savings",
  "Other",
] as const;

export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Refund",
  "Other income",
] as const;

export const ACCOUNT_KINDS: {
  id: AccountKind;
  label: string;
  liability?: boolean;
}[] = [
  { id: "current", label: "Current account" },
  { id: "savings", label: "Savings" },
  { id: "isa", label: "ISA" },
  { id: "investment", label: "Investments" },
  { id: "pension", label: "Pension" },
  { id: "credit", label: "Credit card", liability: true },
  { id: "loan", label: "Loan / mortgage", liability: true },
];

export function isLiability(kind: AccountKind) {
  return kind === "credit" || kind === "loan";
}

export function kindLabel(kind: AccountKind) {
  return ACCOUNT_KINDS.find((k) => k.id === kind)?.label ?? kind;
}

const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});
const gbpRound = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

export function fmt(n: number, opts: { round?: boolean; sign?: boolean } = {}) {
  const s = (opts.round ? gbpRound : gbp).format(Math.abs(n));
  if (n < 0) return `−${s}`;
  if (opts.sign && n > 0) return `+${s}`;
  return s;
}

export function netWorth(accounts: Account[]) {
  return accounts.reduce(
    (sum, a) => sum + (isLiability(a.kind) ? -a.balance : a.balance),
    0,
  );
}

/** Net worth as of the end of a month, using each account's latest snapshot at or before it. */
export function netWorthAt(accounts: Account[], key: string): number | null {
  let found = false;
  let sum = 0;
  for (const a of accounts) {
    const keys = Object.keys(a.history || {})
      .filter((k) => k <= key)
      .sort();
    const k = keys[keys.length - 1];
    if (!k) continue;
    found = true;
    const v = a.history[k];
    sum += isLiability(a.kind) ? -v : v;
  }
  return found ? sum : null;
}

export function netWorthChange(accounts: Account[]) {
  const prev = netWorthAt(accounts, shiftMonthKey(monthKey(), -1));
  if (prev === null) return null;
  return netWorth(accounts) - prev;
}

export function inMonth(t: Transaction, key: string) {
  return t.date.startsWith(key);
}

export type MonthSummary = {
  income: number;
  spent: number;
  saved: number;
  byCategory: { category: string; amount: number }[];
  left: number;
};

export function summarizeMonth(
  transactions: Transaction[],
  key: string,
): MonthSummary {
  let income = 0;
  let saved = 0;
  const cat = new Map<string, number>();
  for (const t of transactions) {
    if (!inMonth(t, key)) continue;
    if (t.amount >= 0) {
      income += t.amount;
    } else if (t.category === "Savings") {
      saved += -t.amount;
    } else {
      cat.set(t.category, (cat.get(t.category) || 0) + -t.amount);
    }
  }
  const byCategory = [...cat.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
  const spent = byCategory.reduce((s, c) => s + c.amount, 0);
  return { income, spent, saved, byCategory, left: income - spent - saved };
}

const SLOTS: Record<string, string> = {
  Housing: "seg-0",
  Bills: "seg-1",
  Groceries: "seg-2",
  "Eating out": "seg-3",
  Transport: "seg-4",
  Shopping: "seg-5",
  Health: "seg-6",
  Fun: "seg-8",
  Travel: "seg-9",
  Savings: "seg-saved",
};

/** Stable colour class per category so the flow bar, legend and lists always agree. */
export function categoryClass(category: string): string {
  return SLOTS[category] ?? "seg-7";
}
