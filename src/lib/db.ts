import { promises as fs } from "fs";
import path from "path";
import { Database, UserData } from "./types";

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

export async function writeDb(db: Database): Promise<void> {
  await ensureDir();
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

export function emptyUserData(userId: string): UserData {
  return {
    userId,
    applications: [],
    contacts: [],
    finance: [],
    savedJobIds: [],
    notes: "",
    updatedAt: new Date().toISOString(),
  };
}

export async function getUserData(userId: string): Promise<UserData> {
  const db = await readDb();
  if (!db.userData[userId]) {
    db.userData[userId] = emptyUserData(userId);
    await writeDb(db);
  }
  return db.userData[userId];
}

export async function updateUserData(
  userId: string,
  updater: (data: UserData) => UserData
): Promise<UserData> {
  const db = await readDb();
  const current = db.userData[userId] ?? emptyUserData(userId);
  const next = updater(current);
  next.updatedAt = new Date().toISOString();
  db.userData[userId] = next;
  await writeDb(db);
  return next;
}
