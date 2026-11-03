import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { requireSession } from "@/lib/auth";
import { getUserData, updateUserData } from "@/lib/db";
import { draftCoverLetter } from "@/lib/cv";
import { ApplicationStatus, JobListing } from "@/lib/types";

export async function GET() {
  try {
    const session = await requireSession();
    const data = await getUserData(session.id);
    return NextResponse.json({ applications: data.applications });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const job = body.job as JobListing | undefined;
    if (!job?.id || !job.title || !job.company) {
      return NextResponse.json({ error: "Job required" }, { status: 400 });
    }

    const data = await updateUserData(session.id, (d) => {
      const existing = d.applications.find((a) => a.jobId === job.id);
      if (existing) return d;
      const coverLetter = draftCoverLetter(job, d.cv);
      const app = {
        id: uuid(),
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        url: job.url,
        status: "drafted" as ApplicationStatus,
        coverLetter,
        notes: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return { ...d, applications: [app, ...d.applications] };
    });

    return NextResponse.json({
      applications: data.applications,
      application: data.applications.find((a) => a.jobId === job.id),
    });
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
      applications: d.applications.map((a) =>
        a.id === id
          ? {
              ...a,
              status: (body.status as ApplicationStatus) || a.status,
              coverLetter:
                typeof body.coverLetter === "string" ? body.coverLetter : a.coverLetter,
              notes: typeof body.notes === "string" ? body.notes : a.notes,
              updatedAt: new Date().toISOString(),
            }
          : a
      ),
    }));

    return NextResponse.json({ applications: data.applications });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
