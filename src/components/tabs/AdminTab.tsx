"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AdminArea, AdminTask, Workspace } from "@/lib/types";
import {
  daysBetween,
  relativeDue,
  shortDate,
  today,
  ukTaxYear,
} from "@/lib/dates";
import { fmt } from "@/lib/money";
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

const AREAS: AdminArea[] = [
  "Tax",
  "Pension",
  "Investments",
  "Insurance",
  "Home",
  "Documents",
  "Health",
  "Other",
];
const ISA_ALLOWANCE = 20_000;
const PENSION_ALLOWANCE = 60_000;

type Group = { id: string; title: string; tasks: AdminTask[] };

function groupTasks(tasks: AdminTask[]): Group[] {
  const t = today();
  const open = tasks.filter((x) => !x.done);
  const dated = open
    .filter((x) => x.dueDate)
    .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1));
  const groups: Group[] = [
    {
      id: "overdue",
      title: "Overdue",
      tasks: dated.filter((x) => x.dueDate! < t),
    },
    {
      id: "soon",
      title: "Next 30 days",
      tasks: dated.filter(
        (x) => x.dueDate! >= t && daysBetween(t, x.dueDate!) <= 30,
      ),
    },
    {
      id: "later",
      title: "Later",
      tasks: dated.filter((x) => daysBetween(t, x.dueDate!) > 30),
    },
    {
      id: "someday",
      title: "No date yet",
      tasks: open.filter((x) => !x.dueDate),
    },
  ];
  return groups.filter((g) => g.tasks.length);
}

export function AdminTab({ data, send }: { data: Workspace; send: Send }) {
  const [area, setArea] = useState<AdminArea | "All">("All");
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminTask | "new" | null>(null);
  const [allowances, setAllowances] = useState(false);
  const [showDone, setShowDone] = useState(false);

  const filtered = data.tasks.filter((t) => area === "All" || t.area === area);
  const groups = useMemo(() => groupTasks(filtered), [filtered]);
  const doneTasks = filtered.filter((t) => t.done);
  const usedAreas = AREAS.filter((a) => data.tasks.some((t) => t.area === a));

  const all = groupTasks(data.tasks);
  const overdue = all.find((g) => g.id === "overdue")?.tasks.length ?? 0;
  const soon = all.find((g) => g.id === "soon")?.tasks.length ?? 0;
  const next = all.flatMap((g) => g.tasks).find((t) => t.dueDate);

  const ty = ukTaxYear();
  const close = () => setEditing(null);
  const done = async (p: Promise<string | null>) => {
    const err = await p;
    if (!err) close();
    return err;
  };

  return (
    <div className="tab">
      <section className="hero hero-admin" aria-label="What's due">
        <p className="hero-line">
          {overdue ? (
            <>
              <span className="fig fig-warn">{overdue}</span> overdue
              {soon ? (
                <>
                  , <span className="fig">{soon}</span> due in the next 30 days.
                </>
              ) : (
                "."
              )}
            </>
          ) : soon ? (
            <>
              <span className="fig">{soon}</span>{" "}
              {soon === 1 ? "thing" : "things"} due in the next 30 days.
            </>
          ) : (
            <>Nothing due in the next 30 days.</>
          )}{" "}
          {next ? (
            <span className="hero-quiet">
              Next up: {next.title.toLowerCase()},{" "}
              {relativeDue(next.dueDate!).toLowerCase()}.
            </span>
          ) : null}
        </p>

        <div className="taxyear">
          <div className="ty-head">
            <span className="ty-title">Tax year {ty.label}</span>
            <span className="ty-days">{ty.daysLeft} days until 5 April</span>
            <button
              type="button"
              className="link-btn"
              onClick={() => setAllowances(true)}
            >
              Update
            </button>
          </div>
          <div className="ty-grid">
            <Allowance
              label="ISA allowance"
              used={data.settings.isaUsed}
              max={ISA_ALLOWANCE}
              elapsed={ty.elapsed}
            />
            <Allowance
              label="Pension annual allowance"
              used={data.settings.pensionUsed}
              max={PENSION_ALLOWANCE}
              elapsed={ty.elapsed}
            />
          </div>
        </div>
      </section>

      <div className="grid-main">
        <Panel
          title="Admin to-do"
          className="panel-tasks"
          action={
            <AddButton label="Add task" onClick={() => setEditing("new")} />
          }
        >
          <div className="chips" role="tablist" aria-label="Filter by area">
            {(["All", ...usedAreas] as const).map((a) => (
              <button
                key={a}
                type="button"
                role="tab"
                aria-selected={area === a}
                className="chip"
                onClick={() => setArea(a)}
              >
                {a}
              </button>
            ))}
          </div>

          {groups.length ? (
            groups.map((g) => (
              <div key={g.id} className={`task-group group-${g.id}`}>
                <h4 className="group-title">
                  {g.title} <span className="count">{g.tasks.length}</span>
                </h4>
                <ul className="tasks">
                  {g.tasks.map((t) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      open={openId === t.id}
                      onToggle={() => setOpenId(openId === t.id ? null : t.id)}
                      onComplete={() => send({ action: "complete", id: t.id })}
                      onEdit={() => setEditing(t)}
                      send={send}
                    />
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <Empty
              action={
                <button
                  type="button"
                  className="btn btn-quiet"
                  onClick={() => setEditing("new")}
                >
                  Add a task
                </button>
              }
            >
              {area === "All"
                ? "Everything's done."
                : `Nothing open under ${area}.`}
            </Empty>
          )}

          {doneTasks.length ? (
            <div className="task-group group-done">
              <button
                type="button"
                className="group-title as-btn"
                onClick={() => setShowDone((v) => !v)}
              >
                Done <span className="count">{doneTasks.length}</span>
                <span className="muted">{showDone ? "Hide" : "Show"}</span>
              </button>
              {showDone ? (
                <ul className="tasks">
                  {doneTasks.map((t) => (
                    <li key={t.id} className="task is-done">
                      <div className="task-line">
                        <button
                          type="button"
                          className="check checked"
                          aria-label={`Reopen ${t.title}`}
                          onClick={() => send({ action: "reopen", id: t.id })}
                        >
                          <Icon name="check" size={14} />
                        </button>
                        <span className="task-title">{t.title}</span>
                        <span className="task-meta">{t.area}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </Panel>

        <div className="stack">
          <Notes value={data.settings.notes} send={send} />
          <Panel title="Rhythm">
            <ul className="rhythm">
              <li>
                <strong>Weekly</strong> Log spending, check bills due in the
                next 7 days.
              </li>
              <li>
                <strong>Monthly</strong> Update account balances so net worth
                stays honest.
              </li>
              <li>
                <strong>Yearly</strong> Before 5 April, top up the ISA and
                review pension contributions.
              </li>
            </ul>
          </Panel>
        </div>
      </div>

      <Sheet
        open={editing !== null}
        title={editing === "new" ? "Add task" : "Edit task"}
        onClose={close}
      >
        {editing !== null ? (
          <SheetForm
            submitLabel={editing === "new" ? "Add task" : "Save task"}
            onSubmit={(f) =>
              done(
                send({
                  action: "upsert",
                  collection: "tasks",
                  item: {
                    id: editing === "new" ? undefined : editing.id,
                    title: f.get("title"),
                    area: f.get("area"),
                    dueDate: f.get("dueDate"),
                    repeat: f.get("repeat"),
                    notes: f.get("notes") || undefined,
                  },
                }),
              )
            }
            onDelete={
              editing !== "new"
                ? () =>
                    done(
                      send({
                        action: "delete",
                        collection: "tasks",
                        id: editing.id,
                      }),
                    )
                : undefined
            }
          >
            <Field label="Task" wide>
              <input
                name="title"
                required
                defaultValue={editing === "new" ? "" : editing.title}
                placeholder="Renew car insurance…"
              />
            </Field>
            <Field label="Area">
              <select
                name="area"
                defaultValue={
                  editing === "new"
                    ? area === "All"
                      ? "Other"
                      : area
                    : editing.area
                }
              >
                {AREAS.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </Field>
            <Field label="Due">
              <input
                name="dueDate"
                type="date"
                defaultValue={editing === "new" ? "" : editing.dueDate}
              />
            </Field>
            <Field
              label="Repeats"
              hint="Repeating tasks move to their next date when you tick them off."
              wide
            >
              <select
                name="repeat"
                defaultValue={editing === "new" ? "none" : editing.repeat}
              >
                <option value="none">Doesn&apos;t repeat</option>
                <option value="monthly">Every month</option>
                <option value="yearly">Every year</option>
              </select>
            </Field>
            <Field label="Notes" wide>
              <textarea
                name="notes"
                rows={3}
                defaultValue={editing === "new" ? "" : editing.notes}
              />
            </Field>
          </SheetForm>
        ) : null}
      </Sheet>

      <Sheet
        open={allowances}
        title={`Tax year ${ty.label}`}
        onClose={() => setAllowances(false)}
      >
        {allowances ? (
          <SheetForm
            submitLabel="Save allowances"
            onSubmit={async (f) => {
              const err = await send({
                action: "settings",
                settings: {
                  isaUsed: Number(f.get("isa") || 0),
                  pensionUsed: Number(f.get("pension") || 0),
                },
              });
              if (!err) setAllowances(false);
              return err;
            }}
          >
            <Field
              label="Paid into ISAs since 6 April"
              hint={`Allowance ${fmt(ISA_ALLOWANCE, { round: true })}`}
            >
              <MoneyInput name="isa" defaultValue={data.settings.isaUsed} />
            </Field>
            <Field
              label="Pension contributions since 6 April"
              hint={`Yours plus employer's. Allowance ${fmt(PENSION_ALLOWANCE, { round: true })}, lower for very high earners.`}
            >
              <MoneyInput
                name="pension"
                defaultValue={data.settings.pensionUsed}
              />
            </Field>
          </SheetForm>
        ) : null}
      </Sheet>
    </div>
  );
}

function Allowance({
  label,
  used,
  max,
  elapsed,
}: {
  label: string;
  used: number;
  max: number;
  elapsed: number;
}) {
  return (
    <div className="allowance">
      <div className="budget-line">
        <span>{label}</span>
        <span className="budget-nums">
          {fmt(used, { round: true })}{" "}
          <span className="muted">of {fmt(max, { round: true })}</span>
        </span>
      </div>
      <Meter
        value={used}
        max={max}
        tone="leaf"
        marker={elapsed}
        label={label}
      />
      <span className="field-hint">
        {fmt(Math.max(0, max - used), { round: true })} left to use
      </span>
    </div>
  );
}

function TaskRow({
  task,
  open,
  onToggle,
  onComplete,
  onEdit,
  send,
}: {
  task: AdminTask;
  open: boolean;
  onToggle: () => void;
  onComplete: () => void;
  onEdit: () => void;
  send: Send;
}) {
  const [ticking, setTicking] = useState(false);
  const overdue = task.dueDate && task.dueDate < today();
  return (
    <li
      className={`task${open ? " is-open" : ""}${ticking ? " is-ticking" : ""}`}
    >
      <div className="task-line">
        <button
          type="button"
          className="check"
          aria-label={
            task.repeat === "none"
              ? `Mark ${task.title} done`
              : `Done for now: ${task.title}`
          }
          onClick={async () => {
            setTicking(true);
            await onComplete();
            setTicking(false);
          }}
        >
          <Icon name="check" size={14} />
        </button>
        <button
          type="button"
          className="task-toggle"
          onClick={onToggle}
          aria-expanded={open}
        >
          <span className="task-title">{task.title}</span>
          <span className="task-meta">
            <span className="area-tag">{task.area}</span>
            {task.dueDate ? (
              <span className={overdue ? "due overdue" : "due"}>
                {relativeDue(task.dueDate)}
                <span className="muted">, {shortDate(task.dueDate)}</span>
              </span>
            ) : null}
            {task.repeat !== "none" ? (
              <span
                className="repeat"
                title={
                  task.repeat === "monthly"
                    ? "Repeats monthly"
                    : "Repeats yearly"
                }
              >
                <Icon name="repeat" size={13} />
                {task.repeat === "monthly" ? "Monthly" : "Yearly"}
              </span>
            ) : null}
          </span>
        </button>
      </div>
      {open ? (
        <div className="task-detail">
          {task.advice ? <p>{task.advice}</p> : null}
          {task.references?.length ? (
            <ul className="refs">
              {task.references.map((r) => (
                <li key={r.url}>
                  <a href={r.url} target="_blank" rel="noreferrer">
                    {r.label}
                    <Icon name="link" size={13} />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
          <TaskNotes task={task} send={send} />
          <button type="button" className="btn btn-quiet" onClick={onEdit}>
            <Icon name="pencil" size={15} /> Edit task
          </button>
        </div>
      ) : null}
    </li>
  );
}

function TaskNotes({ task, send }: { task: AdminTask; send: Send }) {
  const [value, setValue] = useState(task.notes ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  return (
    <label className="field wide">
      <span className="field-label">
        Your notes{" "}
        {state === "saving" ? (
          <span className="muted">Saving…</span>
        ) : state === "saved" ? (
          <span className="muted">Saved</span>
        ) : null}
      </span>
      <textarea
        rows={2}
        value={value}
        placeholder="Reference numbers, who you spoke to…"
        onChange={(e) => setValue(e.target.value)}
        onBlur={async () => {
          if (value === (task.notes ?? "")) return;
          setState("saving");
          const err = await send({
            action: "upsert",
            collection: "tasks",
            item: {
              id: task.id,
              title: task.title,
              area: task.area,
              repeat: task.repeat,
              dueDate: task.dueDate ?? "",
              notes: value,
            },
          });
          setState(err ? "idle" : "saved");
        }}
      />
    </label>
  );
}

function Notes({ value, send }: { value: string; send: Send }) {
  const [text, setText] = useState(value);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function schedule(next: string) {
    setText(next);
    setState("idle");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setState("saving");
      const err = await send({ action: "settings", settings: { notes: next } });
      setState(err ? "idle" : "saved");
    }, 700);
  }

  return (
    <Panel
      title="Notes"
      action={
        <span className="save-state">
          {state === "saving" ? "Saving…" : state === "saved" ? "Saved" : ""}
        </span>
      }
    >
      <textarea
        className="notes"
        rows={7}
        value={text}
        onChange={(e) => schedule(e.target.value)}
        placeholder="Policy numbers, HMRC reference, things to remember…"
        aria-label="Notes"
      />
    </Panel>
  );
}
