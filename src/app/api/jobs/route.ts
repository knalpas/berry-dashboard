import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getUserData } from "@/lib/db";
import { searchJobs } from "@/lib/jobs";

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || undefined;
    const data = await getUserData(session.id);
    const jobs = await searchJobs({ query, cv: data.cv });
    return NextResponse.json({
      jobs,
      sources: [
        {
          id: "remotive",
          label: "Remotive",
          note: "Public remote jobs API",
        },
        {
          id: "arbeitnow",
          label: "Arbeitnow",
          note: "Public job board API",
        },
        {
          id: "linkedin",
          label: "LinkedIn / Indeed",
          note: "Official partner APIs only — no scraping. Use Apply Assist + external apply links.",
        },
      ],
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
