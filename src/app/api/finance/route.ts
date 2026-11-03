import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getUserData, updateUserData } from "@/lib/db";
import { defaultFinanceItems } from "@/lib/finance";
import { FinanceItemStatus } from "@/lib/types";

export async function GET() {
  try {
    const session = await requireSession();
    let data = await getUserData(session.id);
    if (!data.finance.length) {
      data = await updateUserData(session.id, (d) => ({
        ...d,
        finance: defaultFinanceItems(),
      }));
    }
    return NextResponse.json({ finance: data.finance });
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
      finance: d.finance.map((item) =>
        item.id === id
          ? {
              ...item,
              status: (body.status as FinanceItemStatus) || item.status,
              notes: typeof body.notes === "string" ? body.notes : item.notes,
            }
          : item
      ),
    }));

    return NextResponse.json({ finance: data.finance });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
