import { promises as fs } from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { Database } from "../src/lib/types";
import { emptyUserData } from "../src/lib/db";

function password(): string {
  return randomBytes(9).toString("base64url");
}

async function main() {
  const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
  await fs.mkdir(dataDir, { recursive: true });

  const adminPass = process.env.BERRY_ADMIN_PASSWORD || password();
  const agentPass = process.env.BERRY_AGENT_PASSWORD || password();

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
      [adminId]: emptyUserData(adminId),
      [agentId]: emptyUserData(agentId),
    },
  };

  await fs.writeFile(
    path.join(dataDir, "store.json"),
    JSON.stringify(db, null, 2),
    "utf8",
  );

  const creds = `# Berry Dashboard credentials
Generated: ${new Date().toISOString()}

## Admin (you — full admin rights)
Email: karl@berry.local
Password: ${adminPass}

## Agent account (separate personal data)
Email: berry@agent.local
Password: ${agentPass}

Each account has its own accounts, transactions, bills, goals and admin tasks.
Change passwords after first login by re-seeding or editing data/store.json hashes.
`;

  await fs.writeFile(path.join(dataDir, "CREDENTIALS.txt"), creds, "utf8");
  console.log(creds);
  console.log(`Data directory: ${dataDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
