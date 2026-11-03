import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getUserData, updateUserData } from "@/lib/db";
import { adviseCv, parseCvText } from "@/lib/cv";
import { searchJobs } from "@/lib/jobs";

export async function GET() {
  try {
    const session = await requireSession();
    const data = await getUserData(session.id);
    return NextResponse.json({ cv: data.cv || null });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const contentType = req.headers.get("content-type") || "";
    let rawText = "";
    let fileName: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      const textField = form.get("text");
      if (typeof textField === "string" && textField.trim()) {
        rawText = textField;
      }
      if (file && typeof file === "object" && "arrayBuffer" in file) {
        const f = file as File;
        fileName = f.name;
        const buf = Buffer.from(await f.arrayBuffer());
        if (f.name.toLowerCase().endsWith(".pdf")) {
          rawText =
            rawText ||
            buf
              .toString("utf8")
              .replace(/[^\x09\x0A\x0D\x20-\x7E\n\r]/g, " ")
              .replace(/\s+/g, " ")
              .trim();
          if (rawText.length < 80) {
            return NextResponse.json(
              {
                error:
                  "PDF text extraction is limited here — paste CV text, or upload .txt/.md for best results.",
              },
              { status: 400 }
            );
          }
        } else {
          rawText = rawText || buf.toString("utf8");
        }
      }
    } else {
      const body = await req.json();
      rawText = String(body.text || "");
      fileName = body.fileName ? String(body.fileName) : undefined;
    }

    if (!rawText || rawText.trim().length < 40) {
      return NextResponse.json(
        { error: "Please provide more CV text (paste or upload)." },
        { status: 400 }
      );
    }

    const cv = parseCvText(rawText, fileName);
    const data = await updateUserData(session.id, (d) => ({ ...d, cv }));

    let tips: string[] = [];
    try {
      const jobs = await searchJobs({ cv, query: cv.titles[0] });
      tips = adviseCv(cv, jobs.slice(0, 15));
    } catch {
      tips = adviseCv(cv, []);
    }

    return NextResponse.json({ cv: data.cv, tips });
  } catch (e) {
    const msg = e instanceof Error && e.message === "UNAUTHORIZED" ? "Unauthorized" : "Failed";
    return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 500 });
  }
}
