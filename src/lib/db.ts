import { promises as fs } from "fs";
import path from "path";
import { Database, Settings, UserData } from "./types";
import { defaultAdminTasks } from "./admin-defaults";

const DATA_DIR =
  process.env.DATA_DIR ||
  (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
    ? path.join("/tmp", "berry-data")
    : path.join(process.cwd(), "data"));
const DB_PATH = path.join(DATA_DIR, "store.json");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readDb(): Promise<Database> {
  await ensureDir();
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    return JSON.parse(raw) as Database;
  } catch {
    return { users: [], userData: {} };
  }
}

// Serialise writes so two quick edits can't clobber each other.
let queue: Promise<unknown> = Promise.resolve();

export async function writeDb(db: Database): Promise<void> {
  await ensureDir();
  const tmp = `${DB_PATH}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, DB_PATH);
}

export function defaultSettings(): Settings {
  return { budgets: {}, isaUsed: 0, pensionUsed: 0, notes: "" };
}

export function emptyUserData(userId: string): UserData {
  return {
    userId,
    accounts: [],
    transactions: [],
    bills: [],
    goals: [],
    tasks: defaultAdminTasks(),
    settings: defaultSettings(),
    updatedAt: new Date().toISOString(),
  };
}

/** Upgrade data written by the old five-tab version (finance checklist, notes, jobs…). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(userId: string, raw: any): UserData {
  if (!raw) return emptyUserData(userId);
  const base = emptyUserData(userId);
  const out: UserData = {
    ...raw,
    userId,
    accounts: raw.accounts ?? [],
    transactions: raw.transactions ?? [],
    bills: raw.bills ?? [],
    goals: raw.goals ?? [],
    tasks: raw.tasks ?? base.tasks,
    settings: { ...defaultSettings(), ...(raw.settings ?? {}) },
    updatedAt: raw.updatedAt ?? base.updatedAt,
  };
  if (!raw.settings && typeof raw.notes === "string")
    out.settings.notes = raw.notes;
  // Carry over progress from the old checklist: anything marked done there is done here.
  if (!raw.tasks && Array.isArray(raw.finance)) {
    const legacy = raw.finance as { title?: unknown; status?: unknown }[];
    const doneTitles = new Set<string>(
      legacy
        .filter((f) => f.status === "done")
        .map((f) => String(f.title).toLowerCase()),
    );
    out.tasks = out.tasks.map((t) =>
      [...doneTitles].some(
        (d) => d.slice(0, 18) === t.title.toLowerCase().slice(0, 18),
      )
        ? {
            ...t,
            done: t.repeat === "none",
            lastDoneAt: new Date().toISOString(),
          }
        : t,
    );
  }
  return out;
}

export async function getUserData(userId: string): Promise<UserData> {
  const db = await readDb();
  const raw = db.userData[userId];
  // First visit (or old-format data): persist the normalized shape so generated
  // task ids stay stable between requests.
  if (!raw || !raw.tasks || !raw.settings)
    return updateUserData(userId, (d) => d);
  return normalize(userId, raw);
}

export function updateUserData(
  userId: string,
  updater: (data: UserData) => UserData,
): Promise<UserData> {
  const run = queue.then(async () => {
    const db = await readDb();
    const next = updater(normalize(userId, db.userData[userId]));
    next.updatedAt = new Date().toISOString();
    db.userData[userId] = next;
    await writeDb(db);
    return next;
  });
  queue = run.catch(() => undefined);
  return run;
}
