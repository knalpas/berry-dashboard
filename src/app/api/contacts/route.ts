import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { requireSession } from "@/lib/auth";
import { getUserData, updateUserData } from "@/lib/db";
import { draftOutreach } from "@/lib/cv";
import { peopleTargets } from "@/lib/jobs";

export async function GET() {
  try {
    const session = await requireSession();
    const data = await getUserData(session.id);
    return NextResponse.json({ contacts: data.contacts });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const company = String(body.company || "");
    const jobTitle = String(body.jobTitle || "open role");
    if (!company) {
      return NextResponse.json({ error: "company required" }, { status: 400 });
    }

    const targets = peopleTargets(company, jobTitle);
    const created = targets.map((t) => ({
      id: uuid(),
      company,
      roleHint: t.roleHint,
      whyInteresting: `${t.whyInteresting} Search: ${t.searchHint}`,
      outreachDraft: draftOutreach(company, t.roleHint, jobTitle),
      status: "to_find" as const,
      createdAt: new Date().toISOString(),
    }));

    const data = await updateUserData(session.id, (d) => ({
      ...d,
      contacts: [...created, ...d.contacts],
    }));

    return NextResponse.json({ contacts: data.contacts, created });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const id = String(body.id || "");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const data = await updateUserData(session.id, (d) => ({
      ...d,
      contacts: d.contacts.map((c) =>
        c.id === id
          ? {
              ...c,
              name: typeof body.name === "string" ? body.name : c.name,
              email: typeof body.email === "string" ? body.email : c.email,
              linkedinUrl:
                typeof body.linkedinUrl === "string" ? body.linkedinUrl : c.linkedinUrl,
              outreachDraft:
                typeof body.outreachDraft === "string"
                  ? body.outreachDraft
                  : c.outreachDraft,
              status: body.status || c.status,
            }
          : c
      ),
    }));

    return NextResponse.json({ contacts: data.contacts });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
