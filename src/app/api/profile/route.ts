import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getUserData, updateUserData } from "@/lib/db";
import { adviseCv } from "@/lib/cv";

export async function GET() {
  try {
    const session = await requireSession();
    const data = await getUserData(session.id);
    const tips = data.cv ? adviseCv(data.cv, []) : [];
    return NextResponse.json({
      user: session,
      notes: data.notes,
      cv: data.cv || null,
      tips,
      stats: {
        applications: data.applications.length,
        contacts: data.contacts.length,
        financeOpen: data.finance.filter((f) => f.status === "todo" || f.status === "doing")
          .length,
        hasCv: Boolean(data.cv),
      },
      applications: data.applications.slice(0, 5),
      contacts: data.contacts.slice(0, 5),
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const data = await updateUserData(session.id, (d) => ({
      ...d,
      notes: typeof body.notes === "string" ? body.notes : d.notes,
    }));
    return NextResponse.json({ notes: data.notes });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
