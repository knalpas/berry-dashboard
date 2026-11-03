import { promises as fs } from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { defaultFinanceItems } from "../src/lib/finance";
import { Database } from "../src/lib/types";

function password(): string {
  return randomBytes(9).toString("base64url");
}

async function main() {
  const dataDir = path.join(process.cwd(), "data");
  await fs.mkdir(dataDir, { recursive: true });

  const adminPass = password();
  const agentPass = password();

  const adminId = "user-admin-karl";
  const agentId = "user-agent-berry";

  const db: Database = {
    users: [
      {
        id: adminId,
        email: "karl@berry.local",
        name: "Karl Nalpas",
        role: "admin",
        passwordHash: await bcrypt.hash(adminPass, 10),
        createdAt: new Date().toISOString(),
      },
      {
        id: agentId,
        email: "berry@agent.local",
        name: "Berry Agent",
        role: "user",
        passwordHash: await bcrypt.hash(agentPass, 10),
        createdAt: new Date().toISOString(),
      },
    ],
    userData: {
      [adminId]: {
        userId: adminId,
        applications: [],
        contacts: [],
        finance: defaultFinanceItems(),
        savedJobIds: [],
        notes: "Welcome to Berry Dashboard — your personal admin workspace.",
        updatedAt: new Date().toISOString(),
      },
      [agentId]: {
        userId: agentId,
        applications: [],
        contacts: [],
        finance: defaultFinanceItems(),
        savedJobIds: [],
        notes: "Agent workspace (separate data from admin).",
        updatedAt: new Date().toISOString(),
      },
    },
  };

  await fs.writeFile(
    path.join(dataDir, "store.json"),
    JSON.stringify(db, null, 2),
    "utf8"
  );

  const creds = `# Berry Dashboard credentials
Generated: ${new Date().toISOString()}

## Admin (you — full admin rights)
Email: karl@berry.local
Password: ${adminPass}

## Agent account (separate personal data)
Email: berry@agent.local
Password: ${agentPass}

Each account has isolated CV, jobs, applications, contacts, and finance lists.
Change passwords after first login by re-seeding or editing data/store.json hashes.
`;

  await fs.writeFile(path.join(dataDir, "CREDENTIALS.txt"), creds, "utf8");
  console.log(creds);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
