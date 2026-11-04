"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { Account, Bill, Goal, Transaction, Workspace } from "@/lib/types";
import {
  ACCOUNT_KINDS,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  categoryClass,
  fmt,
  isLiability,
  kindLabel,
  netWorth,
  netWorthChange,
  summarizeMonth,
} from "@/lib/money";
import {
  monthKey,
  monthLabel,
  nextBillDate,
  relativeDue,
  shiftMonthKey,
  shortDate,
  today,
  daysBetween,
} from "@/lib/dates";
import { Send } from "../useWorkspace";
import {
  AddButton,
  Empty,
  Field,
  Icon,
  Meter,
  MoneyInput,
  Panel,
  Sheet,
  SheetForm,
} from "../ui";

type SheetState =
  | { kind: "account"; item?: Account }
  | { kind: "bill"; item?: Bill }
  | { kind: "goal"; item?: Goal }
  | { kind: "tx"; item: Transaction }
  | { kind: "budgets" }
  | null;

export function FinancialTab({ data, send }: { data: Workspace; send: Send }) {
  const [month, setMonth] = useState(monthKey());
  const [sheet, setSheet] = useState<SheetState>(null);
  const close = () => setSheet(null);
  const isCurrent = month === monthKey();

  const summary = useMemo(
    () => summarizeMonth(data.transactions, month),
    [data.transactions, month],
  );
  const monthTx = data.transactions.filter((t) => t.date.startsWith(month));

  const done = async (p: Promise<string | null>) => {
    const err = await p;
    if (!err) close();
    return err;
  };

  return (
    <div className="tab">
      <MonthHero
        month={month}
        isCurrent={isCurrent}
        onShift={(d) => setMonth((m) => shiftMonthKey(m, d))}
        summary={summary}
        accounts={data.accounts}
      />

      <div className="grid-main">
        <Panel title={`${monthLabel(month)} transactions`} className="panel-tx">
          {isCurrent || month < monthKey() ? (
            <QuickAdd month={month} send={send} />
          ) : null}
          {monthTx.length ? (
            <TxList
              items={monthTx}
              onEdit={(t) => setSheet({ kind: "tx", item: t })}
            />
          ) : (
            <Empty>
              Nothing logged for {monthLabel(month)} yet. Add your pay first,
              then spending as it happens — the bar above fills in as you go.
            </Empty>
          )}
        </Panel>

        <div className="stack">
          <Panel
            title="Accounts"
            action={
              <AddButton
                label="Add account"
                onClick={() => setSheet({ kind: "account" })}
              />
            }
          >
            <AccountList
              accounts={data.accounts}
              onEdit={(a) => setSheet({ kind: "account", item: a })}
            />
          </Panel>

          <Panel
            title="Bills"
            action={
              <AddButton
                label="Add bill"
                onClick={() => setSheet({ kind: "bill" })}
              />
            }
          >
            <BillList
              bills={data.bills}
              onEdit={(b) => setSheet({ kind: "bill", item: b })}
            />
          </Panel>

          <Panel
            title="Budgets"
            action={
              <button
                type="button"
                className="link-btn"
                onClick={() => setSheet({ kind: "budgets" })}
              >
                Edit
              </button>
            }
          >
            <Budgets
              budgets={data.settings.budgets}
              summary={summary}
              month={month}
              onSet={() => setSheet({ kind: "budgets" })}
            />
          </Panel>

          <Panel
            title="Goals"
            action={
              <AddButton
                label="Add goal"
                onClick={() => setSheet({ kind: "goal" })}
              />
            }
          >
            <GoalList
              goals={data.goals}
              onEdit={(g) => setSheet({ kind: "goal", item: g })}
            />
          </Panel>
        </div>
      </div>

      {/* ---------- Sheets ---------- */}
      <Sheet
        open={sheet?.kind === "account"}
        title={
          sheet?.kind === "account" && sheet.item
            ? "Update account"
            : "Add account"
        }
        onClose={close}
      >
        {sheet?.kind === "account" ? (
          <SheetForm
            submitLabel={sheet.item ? "Save balance" : "Add account"}
            onSubmit={(f) =>
              done(
                send({
                  action: "upsert",
                  collection: "accounts",
                  item: {
                    id: sheet.item?.id,
                    name: f.get("name"),
                    kind: f.get("kind"),
                    balance: f.get("balance"),
                  },
                }),
              )
            }
            onDelete={
              sheet.item
                ? () =>
                    done(
                      send({
                        action: "delete",
                        collection: "accounts",
                        id: sheet.item!.id,
                      }),
                    )
                : undefined
            }
          >
            <Field label="Name" wide>
              <input
                name="name"
                required
                defaultValue={sheet.item?.name}
                placeholder="Monzo, Vanguard ISA…"
              />
            </Field>
            <Field label="Type">
              <select name="kind" defaultValue={sheet.item?.kind ?? "current"}>
                {ACCOUNT_KINDS.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Balance today"
              hint="For cards and loans, enter what you owe."
            >
              <MoneyInput
                name="balance"
                defaultValue={sheet.item?.balance}
                autoFocus={!!sheet.item}
              />
            </Field>
          </SheetForm>
        ) : null}
      </Sheet>

      <Sheet
        open={sheet?.kind === "bill"}
        title={sheet?.kind === "bill" && sheet.item ? "Edit bill" : "Add bill"}
        onClose={close}
      >
        {sheet?.kind === "bill" ? (
          <SheetForm
            submitLabel={sheet.item ? "Save bill" : "Add bill"}
            onSubmit={(f) =>
              done(
                send({
                  action: "upsert",
                  collection: "bills",
                  item: {
                    id: sheet.item?.id,
                    name: f.get("name"),
                    amount: f.get("amount"),
                    dayOfMonth: f.get("day"),
                    category: f.get("category"),
                  },
                }),
              )
            }
            onDelete={
              sheet.item
                ? () =>
                    done(
                      send({
                        action: "delete",
                        collection: "bills",
                        id: sheet.item!.id,
                      }),
                    )
                : undefined
            }
          >
            <Field label="Name" wide>
              <input
                name="name"
                required
                defaultValue={sheet.item?.name}
                placeholder="Rent, council tax, Netflix…"
              />
            </Field>
            <Field label="Amount per month">
              <MoneyInput name="amount" defaultValue={sheet.item?.amount} />
            </Field>
            <Field label="Day of month">
              <input
                name="day"
                type="number"
                min={1}
                max={31}
                required
                defaultValue={sheet.item?.dayOfMonth ?? 1}
              />
            </Field>
            <Field label="Category" wide>
              <CategorySelect
                name="category"
                defaultValue={sheet.item?.category ?? "Bills"}
              />
            </Field>
          </SheetForm>
        ) : null}
      </Sheet>

      <Sheet
        open={sheet?.kind === "goal"}
        title={
          sheet?.kind === "goal" && sheet.item ? "Update goal" : "Add goal"
        }
        onClose={close}
      >
        {sheet?.kind === "goal" ? (
          <SheetForm
            submitLabel={sheet.item ? "Save goal" : "Add goal"}
            onSubmit={(f) =>
              done(
                send({
                  action: "upsert",
                  collection: "goals",
                  item: {
                    id: sheet.item?.id,
                    name: f.get("name"),
                    target: f.get("target"),
                    saved: f.get("saved"),
                    deadline: f.get("deadline"),
                  },
                }),
              )
            }
            onDelete={
              sheet.item
                ? () =>
                    done(
                      send({
                        action: "delete",
                        collection: "goals",
                        id: sheet.item!.id,
                      }),
                    )
                : undefined
            }
          >
            <Field label="Goal" wide>
              <input
                name="name"
                required
                defaultValue={sheet.item?.name}
                placeholder="Emergency fund, house deposit…"
              />
            </Field>
            <Field label="Target">
              <MoneyInput name="target" defaultValue={sheet.item?.target} />
            </Field>
            <Field label="Saved so far">
              <MoneyInput name="saved" defaultValue={sheet.item?.saved ?? 0} />
            </Field>
            <Field label="Target date" hint="Optional" wide>
              <input
                name="deadline"
                type="date"
                defaultValue={sheet.item?.deadline}
              />
            </Field>
          </SheetForm>
        ) : null}
      </Sheet>

      <Sheet
        open={sheet?.kind === "tx"}
        title="Edit transaction"
        onClose={close}
      >
        {sheet?.kind === "tx" ? (
          <SheetForm
            submitLabel="Save transaction"
            onSubmit={(f) => {
              const amt = Math.abs(Number(f.get("amount")));
              return done(
                send({
                  action: "upsert",
                  collection: "transactions",
                  item: {
                    id: sheet.item.id,
                    description: f.get("description"),
                    amount: f.get("dir") === "in" ? amt : -amt,
                    category: f.get("category"),
                    date: f.get("date"),
                  },
                }),
              );
            }}
            onDelete={() =>
              done(
                send({
                  action: "delete",
                  collection: "transactions",
                  id: sheet.item.id,
                }),
              )
            }
          >
            <Field label="Description" wide>
              <input
                name="description"
                required
                defaultValue={sheet.item.description}
              />
            </Field>
            <Field label="Direction">
              <select
                name="dir"
                defaultValue={sheet.item.amount >= 0 ? "in" : "out"}
              >
                <option value="out">Money out</option>
                <option value="in">Money in</option>
              </select>
            </Field>
            <Field label="Amount">
              <MoneyInput
                name="amount"
                defaultValue={Math.abs(sheet.item.amount)}
              />
            </Field>
            <Field label="Category">
              <CategorySelect
                name="category"
                defaultValue={sheet.item.category}
                withIncome
              />
            </Field>
            <Field label="Date">
              <input
                name="date"
                type="date"
                required
                defaultValue={sheet.item.date}
              />
            </Field>
          </SheetForm>
        ) : null}
      </Sheet>

      <Sheet
        open={sheet?.kind === "budgets"}
        title="Monthly budgets"
        onClose={close}
      >
        {sheet?.kind === "budgets" ? (
          <SheetForm
            submitLabel="Save budgets"
            onSubmit={(f) => {
              const budgets: Record<string, number> = {};
              for (const c of EXPENSE_CATEGORIES) {
                const v = Number(f.get(c));
                if (v > 0) budgets[c] = v;
              }
              return done(send({ action: "settings", settings: { budgets } }));
            }}
          >
            <p className="sheet-note">
              Leave a category blank to stop tracking it.
            </p>
            {EXPENSE_CATEGORIES.filter((c) => c !== "Savings").map((c) => (
              <Field key={c} label={c}>
                <MoneyInput
                  name={c}
                  required={false}
                  defaultValue={data.settings.budgets[c]}
                />
              </Field>
            ))}
          </SheetForm>
        ) : null}
      </Sheet>
    </div>
  );
}

/* ---------- Hero ---------- */

function MonthHero({
  month,
  isCurrent,
  onShift,
  summary,
  accounts,
}: {
  month: string;
  isCurrent: boolean;
  onShift: (d: number) => void;
  summary: ReturnType<typeof summarizeMonth>;
  accounts: Account[];
}) {
  const nw = netWorth(accounts);
  const change = netWorthChange(accounts);
  const outgoings = summary.spent + summary.saved;
  const total = Math.max(summary.income, outgoings);
  const overspent = outgoings > summary.income;

  const top = summary.byCategory.slice(0, 6);
  const rest = summary.byCategory.slice(6).reduce((s, c) => s + c.amount, 0);
  const segments = [
    ...top.map((c) => ({
      key: c.category,
      label: c.category,
      amount: c.amount,
      cls: categoryClass(c.category),
    })),
    ...(rest
      ? [{ key: "rest", label: "Everything else", amount: rest, cls: "seg-7" }]
      : []),
    ...(summary.saved
      ? [
          {
            key: "saved",
            label: "Saved",
            amount: summary.saved,
            cls: "seg-saved",
          },
        ]
      : []),
    ...(summary.left > 0
      ? [{ key: "left", label: "Left", amount: summary.left, cls: "seg-left" }]
      : []),
  ];

  return (
    <section className="hero" aria-label="Month summary">
      <div className="hero-top">
        <div className="month-nav">
          <button
            type="button"
            className="icon-btn"
            onClick={() => onShift(-1)}
            aria-label="Previous month"
          >
            <Icon name="left" />
          </button>
          <span className="month-name">
            {monthLabel(month, { year: !isCurrent })}
          </span>
          <button
            type="button"
            className="icon-btn"
            onClick={() => onShift(1)}
            disabled={isCurrent}
            aria-label="Next month"
          >
            <Icon name="right" />
          </button>
        </div>
        {accounts.length ? (
          <div className="networth">
            <span className="networth-label">Net worth</span>
            <span className="networth-value">{fmt(nw, { round: true })}</span>
            {change !== null && change !== 0 ? (
              <span className={change > 0 ? "delta up" : "delta down"}>
                {fmt(change, { round: true, sign: true })} since last month
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <p className="hero-line">
        {summary.income || outgoings ? (
          <>
            <span className="fig">{fmt(summary.income, { round: true })}</span>{" "}
            in,{" "}
            <span className="fig">{fmt(summary.spent, { round: true })}</span>{" "}
            spent
            {summary.saved ? (
              <>
                ,{" "}
                <span className="fig fig-leaf">
                  {fmt(summary.saved, { round: true })}
                </span>{" "}
                saved
              </>
            ) : null}
            .{" "}
            {overspent ? (
              <span className="hero-warn">
                {fmt(outgoings - summary.income, { round: true })} over what
                came in.
              </span>
            ) : (
              <span className="hero-quiet">
                {fmt(summary.left, { round: true })} still unspent.
              </span>
            )}
          </>
        ) : (
          <span className="hero-quiet">
            No money in or out logged{" "}
            {isCurrent ? "this month" : "for this month"}.
          </span>
        )}
      </p>

      <div
        className="flow"
        role="img"
        aria-label="Where this month's money went"
      >
        {total > 0 ? (
          segments.map((s) => (
            <span
              key={s.key}
              className={`flow-seg ${s.cls}`}
              style={{ flexGrow: s.amount }}
              title={`${s.label}: ${fmt(s.amount)}`}
            />
          ))
        ) : (
          <span className="flow-seg seg-empty" style={{ flexGrow: 1 }} />
        )}
        {overspent && summary.income > 0 ? (
          <span
            className="flow-income"
            style={{ left: `${(summary.income / total) * 100}%` }}
            title="Income"
          />
        ) : null}
      </div>
      {segments.length ? (
        <ul className="flow-legend">
          {segments.map((s) => (
            <li key={s.key}>
              <span className={`dot ${s.cls}`} />
              {s.label}
              <span className="legend-amt">
                {fmt(s.amount, { round: true })}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/* ---------- Transactions ---------- */

function QuickAdd({ month, send }: { month: string; send: Send }) {
  const [dir, setDir] = useState<"out" | "in">("out");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);
  const defaultDate = month === monthKey() ? today() : `${month}-01`;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const amt = Math.abs(Number(f.get("amount")));
    setBusy(true);
    const err = await send({
      action: "upsert",
      collection: "transactions",
      item: {
        description: f.get("description"),
        amount: dir === "in" ? amt : -amt,
        category: f.get("category"),
        date: f.get("date"),
      },
    });
    setBusy(false);
    setError(err ?? "");
    if (!err) {
      (form.elements.namedItem("amount") as HTMLInputElement).value = "";
      (form.elements.namedItem("description") as HTMLInputElement).value = "";
      amountRef.current?.focus();
    }
  }

  return (
    <form className="quick-add" onSubmit={submit}>
      <div className="seg-toggle" role="radiogroup" aria-label="Direction">
        <button
          type="button"
          role="radio"
          aria-checked={dir === "out"}
          onClick={() => setDir("out")}
        >
          Out
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={dir === "in"}
          onClick={() => setDir("in")}
        >
          In
        </button>
      </div>
      <span className="money-input qa-amount">
        <span aria-hidden>£</span>
        <input
          ref={amountRef}
          name="amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          required
          placeholder="0.00"
          aria-label="Amount"
        />
      </span>
      <input
        className="qa-desc"
        name="description"
        required
        placeholder={dir === "in" ? "Salary, refund…" : "What was it?"}
        aria-label="Description"
      />
      <select
        className="qa-cat"
        name="category"
        key={dir}
        defaultValue={dir === "in" ? "Salary" : "Groceries"}
        aria-label="Category"
      >
        {(dir === "in" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <input
        className="qa-date"
        name="date"
        type="date"
        required
        defaultValue={defaultDate}
        key={month}
        aria-label="Date"
      />
      <button
        type="submit"
        className="btn btn-primary qa-submit"
        disabled={busy}
      >
        Add
      </button>
      {error ? <p className="form-error qa-error">{error}</p> : null}
    </form>
  );
}

function TxList({
  items,
  onEdit,
}: {
  items: Transaction[];
  onEdit: (t: Transaction) => void;
}) {
  const byDay = new Map<string, Transaction[]>();
  for (const t of items) byDay.set(t.date, [...(byDay.get(t.date) ?? []), t]);
  return (
    <div className="tx-days">
      {[...byDay.entries()].map(([day, list]) => (
        <div key={day} className="tx-day">
          <h4 className="tx-date">
            {day === today() ? "Today" : shortDate(day)}
          </h4>
          <ul className="rows">
            {list.map((t) => (
              <li key={t.id}>
                <button type="button" className="row" onClick={() => onEdit(t)}>
                  <span
                    className={`dot ${t.amount >= 0 ? "seg-saved" : categoryClass(t.category)}`}
                  />
                  <span className="row-main">
                    <span className="row-title">{t.description}</span>
                    <span className="row-sub">{t.category}</span>
                  </span>
                  <span className={t.amount >= 0 ? "amt amt-in" : "amt"}>
                    {fmt(t.amount, { sign: true })}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ---------- Side panels ---------- */

function AccountList({
  accounts,
  onEdit,
}: {
  accounts: Account[];
  onEdit: (a: Account) => void;
}) {
  if (!accounts.length)
    return (
      <Empty>
        Add your current account, savings and pension to see your net worth.
      </Empty>
    );
  const sorted = [...accounts].sort(
    (a, b) =>
      ACCOUNT_KINDS.findIndex((k) => k.id === a.kind) -
      ACCOUNT_KINDS.findIndex((k) => k.id === b.kind),
  );
  return (
    <ul className="rows">
      {sorted.map((a) => {
        const stale = daysBetween(a.updatedAt.slice(0, 10), today()) > 35;
        return (
          <li key={a.id}>
            <button type="button" className="row" onClick={() => onEdit(a)}>
              <span className="row-main">
                <span className="row-title">{a.name}</span>
                <span className={stale ? "row-sub stale" : "row-sub"}>
                  {kindLabel(a.kind)}
                  {stale ? ", balance over a month old" : ""}
                </span>
              </span>
              <span className={isLiability(a.kind) ? "amt amt-owed" : "amt"}>
                {isLiability(a.kind)
                  ? fmt(-a.balance, { round: true })
                  : fmt(a.balance, { round: true })}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function BillList({
  bills,
  onEdit,
}: {
  bills: Bill[];
  onEdit: (b: Bill) => void;
}) {
  if (!bills.length)
    return (
      <Empty>
        Add rent, subscriptions and direct debits to see what&apos;s coming out
        next.
      </Empty>
    );
  const withNext = bills
    .map((b) => ({ ...b, next: nextBillDate(b.dayOfMonth) }))
    .sort((a, b) => (a.next < b.next ? -1 : 1));
  const monthly = bills.reduce((s, b) => s + b.amount, 0);
  const stillToGo = withNext
    .filter((b) => b.next.slice(0, 7) === monthKey())
    .reduce((s, b) => s + b.amount, 0);

  return (
    <>
      <p className="panel-summary">
        <span className="fig-sm">{fmt(monthly, { round: true })}</span> a month,{" "}
        <span className="fig-sm">{fmt(stillToGo, { round: true })}</span> still
        to leave this month
      </p>
      <ul className="rows">
        {withNext.map((b) => {
          const soon = daysBetween(today(), b.next) <= 3;
          return (
            <li key={b.id}>
              <button type="button" className="row" onClick={() => onEdit(b)}>
                <span className="row-main">
                  <span className="row-title">{b.name}</span>
                  <span className={soon ? "row-sub soon" : "row-sub"}>
                    {relativeDue(b.next)}, {shortDate(b.next)}
                  </span>
                </span>
                <span className="amt">{fmt(b.amount)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Budgets({
  budgets,
  summary,
  month,
  onSet,
}: {
  budgets: Record<string, number>;
  summary: ReturnType<typeof summarizeMonth>;
  month: string;
  onSet: () => void;
}) {
  const entries = Object.entries(budgets);
  if (!entries.length)
    return (
      <Empty
        action={
          <button type="button" className="btn btn-quiet" onClick={onSet}>
            Set budgets
          </button>
        }
      >
        Set a monthly limit for the categories you want to keep an eye on.
      </Empty>
    );
  const now = new Date();
  const isCurrent = month === monthKey();
  const elapsed = isCurrent
    ? now.getDate() /
      new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    : 1;

  return (
    <ul className="budgets">
      {entries.map(([cat, limit]) => {
        const spent =
          summary.byCategory.find((c) => c.category === cat)?.amount ?? 0;
        const ratio = spent / limit;
        const tone =
          ratio > 1 ? "warn" : ratio > elapsed + 0.1 ? "berry" : "leaf";
        return (
          <li key={cat}>
            <div className="budget-line">
              <span>{cat}</span>
              <span className="budget-nums">
                {fmt(spent, { round: true })}{" "}
                <span className="muted">of {fmt(limit, { round: true })}</span>
              </span>
            </div>
            <Meter
              value={spent}
              max={limit}
              tone={tone}
              marker={isCurrent ? elapsed : undefined}
              label={`${cat} budget`}
            />
          </li>
        );
      })}
    </ul>
  );
}

function GoalList({
  goals,
  onEdit,
}: {
  goals: Goal[];
  onEdit: (g: Goal) => void;
}) {
  if (!goals.length)
    return (
      <Empty>
        Name something you&apos;re saving for and track progress here.
      </Empty>
    );
  return (
    <ul className="rows">
      {goals.map((g) => {
        const pct = Math.round((g.saved / g.target) * 100);
        let perMonth: number | null = null;
        if (g.deadline && g.saved < g.target) {
          const months = Math.max(
            1,
            Math.ceil(daysBetween(today(), g.deadline) / 30.4),
          );
          perMonth = (g.target - g.saved) / months;
        }
        return (
          <li key={g.id}>
            <button
              type="button"
              className="row row-goal"
              onClick={() => onEdit(g)}
            >
              <span className="row-main">
                <span className="row-title">{g.name}</span>
                <span className="row-sub">
                  {fmt(g.saved, { round: true })} of{" "}
                  {fmt(g.target, { round: true })}
                  {perMonth
                    ? `, ${fmt(perMonth, { round: true })}/month to hit ${shortDate(g.deadline!)}`
                    : ""}
                </span>
              </span>
              <span className="amt">{Math.min(100, pct)}%</span>
              <Meter
                value={g.saved}
                max={g.target}
                tone="leaf"
                label={`${g.name} progress`}
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function CategorySelect({
  name,
  defaultValue,
  withIncome,
}: {
  name: string;
  defaultValue: string;
  withIncome?: boolean;
}) {
  return (
    <select name={name} defaultValue={defaultValue}>
      <optgroup label="Spending">
        {EXPENSE_CATEGORIES.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </optgroup>
      {withIncome ? (
        <optgroup label="Income">
          {INCOME_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </optgroup>
      ) : null}
    </select>
  );
}
