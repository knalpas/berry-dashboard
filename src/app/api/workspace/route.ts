import { NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import { requireSession } from "@/lib/auth";
import { getUserData, updateUserData } from "@/lib/db";
import { addMonths, monthKey, today } from "@/lib/dates";
import { UserData, Workspace } from "@/lib/types";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const money = z.coerce.number().finite();

const schemas = {
  accounts: z.object({
    id: z.string().optional(),
    name: z.string().trim().min(1).max(80),
    kind: z.enum([
      "current",
      "savings",
      "isa",
      "investment",
      "pension",
      "credit",
      "loan",
    ]),
    balance: money.min(0),
  }),
  transactions: z.object({
    id: z.string().optional(),
    date: isoDate,
    description: z.string().trim().min(1).max(120),
    amount: money,
    category: z.string().trim().min(1).max(40),
  }),
  bills: z.object({
    id: z.string().optional(),
    name: z.string().trim().min(1).max(80),
    amount: money.min(0),
    dayOfMonth: z.coerce.number().int().min(1).max(31),
    category: z.string().trim().min(1).max(40),
  }),
  goals: z.object({
    id: z.string().optional(),
    name: z.string().trim().min(1).max(80),
    target: money.positive(),
    saved: money.min(0),
    deadline: isoDate.optional().or(z.literal("").transform(() => undefined)),
  }),
  tasks: z.object({
    id: z.string().optional(),
    title: z.string().trim().min(1).max(140),
    area: z.enum([
      "Tax",
      "Pension",
      "Investments",
      "Insurance",
      "Home",
      "Documents",
      "Health",
      "Other",
    ]),
    dueDate: isoDate.optional().or(z.literal("").transform(() => undefined)),
    repeat: z.enum(["none", "monthly", "yearly"]),
    done: z.boolean().optional(),
    notes: z.string().max(2000).optional(),
  }),
} as const;

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("upsert"),
    collection: z.enum(["accounts", "transactions", "bills", "goals", "tasks"]),
    item: z.record(z.unknown()),
  }),
  z.object({
    action: z.literal("delete"),
    collection: z.enum(["accounts", "transactions", "bills", "goals", "tasks"]),
    id: z.string(),
  }),
  z.object({ action: z.literal("complete"), id: z.string() }),
  z.object({ action: z.literal("reopen"), id: z.string() }),
  z.object({
    action: z.literal("settings"),
    settings: z.object({
      budgets: z.record(money.min(0)).optional(),
      isaUsed: money.min(0).optional(),
      pensionUsed: money.min(0).optional(),
      notes: z.string().max(10000).optional(),
    }),
  }),
]);

function strip(data: UserData): Workspace {
  return {
    accounts: data.accounts,
    transactions: [...data.transactions].sort((a, b) =>
      a.date < b.date ? 1 : -1,
    ),
    bills: data.bills,
    goals: data.goals,
    tasks: data.tasks,
    settings: data.settings,
  };
}

function unauthorized() {
  return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
}

export async function GET() {
  const session = await requireSession().catch(() => null);
  if (!session) return unauthorized();
  return NextResponse.json(strip(await getUserData(session.id)));
}

export async function POST(req: Request) {
  const session = await requireSession().catch(() => null);
  if (!session) return unauthorized();

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "That request wasn't valid." },
      { status: 400 },
    );
  }
  const body = parsed.data;

  if (body.action === "upsert") {
    const item = schemas[body.collection].safeParse(body.item);
    if (!item.success) {
      const issue = item.error.issues[0];
      return NextResponse.json(
        { error: `Check the ${issue?.path.join(".") || "form"} field.` },
        { status: 400 },
      );
    }
    const value = item.data as Record<string, unknown> & { id?: string };
    const data = await updateUserData(session.id, (d) => {
      const list = d[body.collection] as unknown as Record<string, unknown>[];
      const id = value.id || uuid();
      const existing = list.find((x) => x.id === id);
      let next: Record<string, unknown> = { ...(existing ?? {}), ...value, id };
      if (body.collection === "accounts") {
        const history = {
          ...((existing?.history as Record<string, number>) ?? {}),
        };
        history[monthKey()] = value.balance as number;
        next = { ...next, history, updatedAt: new Date().toISOString() };
      }
      if (body.collection === "tasks" && !existing)
        next = { done: false, ...next };
      const updated = existing
        ? list.map((x) => (x.id === id ? next : x))
        : [...list, next];
      return { ...d, [body.collection]: updated };
    });
    return NextResponse.json(strip(data));
  }

  if (body.action === "delete") {
    const data = await updateUserData(session.id, (d) => ({
      ...d,
      [body.collection]: (d[body.collection] as { id: string }[]).filter(
        (x) => x.id !== body.id,
      ),
    }));
    return NextResponse.json(strip(data));
  }

  if (body.action === "complete" || body.action === "reopen") {
    const data = await updateUserData(session.id, (d) => ({
      ...d,
      tasks: d.tasks.map((t) => {
        if (t.id !== body.id) return t;
        if (body.action === "reopen") return { ...t, done: false };
        // Repeating tasks roll forward instead of closing.
        if (t.repeat !== "none") {
          const base = t.dueDate ?? today();
          let due = addMonths(base, t.repeat === "monthly" ? 1 : 12);
          while (due < today())
            due = addMonths(due, t.repeat === "monthly" ? 1 : 12);
          return {
            ...t,
            dueDate: due,
            done: false,
            lastDoneAt: new Date().toISOString(),
          };
        }
        return { ...t, done: true, lastDoneAt: new Date().toISOString() };
      }),
    }));
    return NextResponse.json(strip(data));
  }

  const data = await updateUserData(session.id, (d) => ({
    ...d,
    settings: { ...d.settings, ...body.settings },
  }));
  return NextResponse.json(strip(data));
}
