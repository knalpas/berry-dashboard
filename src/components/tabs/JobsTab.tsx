"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  ApplicationStatus,
  CvProfile,
  JobApplication,
  JobListing,
} from "@/lib/types";

const STATUSES: ApplicationStatus[] = [
  "saved",
  "drafted",
  "applied",
  "interview",
  "offer",
  "rejected",
];

export function JobsTab() {
  const [query, setQuery] = useState("");
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [cv, setCv] = useState<CvProfile | null>(null);
  const [tips, setTips] = useState<string[]>([]);
  const [cvText, setCvText] = useState("");
  const [cvBusy, setCvBusy] = useState(false);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [message, setMessage] = useState("");
  const [sourcesNote, setSourcesNote] = useState("");

  const refreshApps = useCallback(async () => {
    const res = await fetch("/api/jobs/applications");
    const data = await res.json();
    setApplications(data.applications || []);
  }, []);

  useEffect(() => {
    fetch("/api/cv")
      .then((r) => r.json())
      .then((d) => {
        if (d.cv) {
          setCv(d.cv);
          setCvText(d.cv.rawText || "");
        }
      });
    refreshApps();
  }, [refreshApps]);

  async function searchJobs(e?: FormEvent) {
    e?.preventDefault();
    setLoadingJobs(true);
    setMessage("");
    try {
      const res = await fetch(`/api/jobs?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setJobs(data.jobs || []);
      setSourcesNote(
        (data.sources || [])
          .map((s: { label: string; note: string }) => `${s.label}: ${s.note}`)
          .join(" · ")
      );
      if (!(data.jobs || []).length) {
        setMessage("No jobs returned — try a broader query or check network.");
      }
    } finally {
      setLoadingJobs(false);
    }
  }

  async function uploadCv(e: FormEvent) {
    e.preventDefault();
    setCvBusy(true);
    setMessage("");
    try {
      const form = e.target as HTMLFormElement;
      const fileInput = form.elements.namedItem("file") as HTMLInputElement;
      const fd = new FormData();
      fd.set("text", cvText);
      if (fileInput.files?.[0]) fd.set("file", fileInput.files[0]);
      const res = await fetch("/api/cv", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "CV upload failed");
      setCv(data.cv);
      setTips(data.tips || []);
      setMessage("CV profile updated — run a job search to rank by relevance.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "CV upload failed");
    } finally {
      setCvBusy(false);
    }
  }

  async function prepareApply(job: JobListing) {
    const res = await fetch("/api/jobs/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job }),
    });
    const data = await res.json();
    setApplications(data.applications || []);
    setSelectedApp(data.application || null);
    setMessage(`Application kit drafted for ${job.title} at ${job.company}.`);
  }

  async function seedPeople(job: JobListing) {
    await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company: job.company, jobTitle: job.title }),
    });
    setMessage(
      `Added outreach targets for ${job.company} — see the Network tab to fill contacts.`
    );
  }

  async function updateApp(patch: Partial<JobApplication> & { id: string }) {
    const res = await fetch("/api/jobs/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    setApplications(data.applications || []);
    const next = (data.applications || []).find(
      (a: JobApplication) => a.id === patch.id
    );
    setSelectedApp(next || null);
  }

  return (
    <div className="tab-stack animate-fade">
      <header className="section-head">
        <h2>Jobs</h2>
        <p>
          Match public listings to your CV, improve the document, draft applications,
          and map in-house people to reach.
        </p>
      </header>

      <section className="panel">
        <h3>CV profile</h3>
        <form className="stack-form" onSubmit={uploadCv}>
          <textarea
            value={cvText}
            onChange={(e) => setCvText(e.target.value)}
            rows={7}
            placeholder="Paste CV text here (best results). You can also attach .txt / .md."
          />
          <input name="file" type="file" accept=".txt,.md,.pdf,text/plain" />
          <button type="submit" className="btn-primary" disabled={cvBusy}>
            {cvBusy ? "Parsing…" : "Save & analyse CV"}
          </button>
        </form>
        {cv ? (
          <div className="cv-meta">
            <p className="muted">
              Skills detected: {cv.skills.join(", ") || "none yet"} · Titles:{" "}
              {cv.titles.join(", ") || "—"}
              {cv.yearsExperience ? ` · ~${cv.yearsExperience}y signal` : ""}
            </p>
          </div>
        ) : null}
        {tips.length ? (
          <ul className="advice-list">
            {tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="panel">
        <h3>Find & rank roles</h3>
        <form className="inline-form" onSubmit={searchJobs}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. product designer, typescript, finance analyst"
          />
          <button type="submit" className="btn-primary" disabled={loadingJobs}>
            {loadingJobs ? "Searching…" : "Search"}
          </button>
        </form>
        {sourcesNote ? <p className="tiny muted">{sourcesNote}</p> : null}
        {message ? <p className="banner">{message}</p> : null}

        <div className="job-list">
          {jobs.map((job) => (
            <article key={job.id} className="job-row">
              <div className="job-main">
                <div className="job-top">
                  <h4>{job.title}</h4>
                  <span className="relevance" title={(job.matchReasons || []).join("\n")}>
                    {job.relevance ?? 0}%
                  </span>
                </div>
                <p className="muted">
                  {job.company} · {job.location} · {job.source}
                </p>
                <p className="job-desc">{job.description.slice(0, 220)}…</p>
                <div className="tag-wrap">
                  {job.tags.slice(0, 6).map((t) => (
                    <span key={t} className="tag">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="job-actions">
                <a className="btn-secondary" href={job.url} target="_blank" rel="noreferrer">
                  Open listing
                </a>
                <button type="button" className="btn-primary" onClick={() => prepareApply(job)}>
                  Apply assist
                </button>
                <button type="button" className="btn-ghost" onClick={() => seedPeople(job)}>
                  Find people
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>Application tracker</h3>
        <p className="muted tiny">
          Berry drafts a cover letter and tracks status. Submit on the employer site
          (LinkedIn/Indeed auto-submit bots are not used — they break platform rules).
        </p>
        <div className="split">
          <ul className="simple-list">
            {applications.length === 0 ? (
              <li className="muted">No applications yet.</li>
            ) : (
              applications.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    className={selectedApp?.id === a.id ? "list-btn active" : "list-btn"}
                    onClick={() => setSelectedApp(a)}
                  >
                    <strong>{a.jobTitle}</strong>
                    <span>
                      {a.company} · {a.status}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
          {selectedApp ? (
            <div className="app-detail">
              <label>
                Status
                <select
                  value={selectedApp.status}
                  onChange={(e) =>
                    updateApp({
                      id: selectedApp.id,
                      status: e.target.value as ApplicationStatus,
                    })
                  }
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Cover letter
                <textarea
                  rows={10}
                  value={selectedApp.coverLetter || ""}
                  onChange={(e) =>
                    setSelectedApp({ ...selectedApp, coverLetter: e.target.value })
                  }
                  onBlur={() =>
                    updateApp({
                      id: selectedApp.id,
                      coverLetter: selectedApp.coverLetter,
                    })
                  }
                />
              </label>
              <a
                className="btn-primary"
                href={selectedApp.url}
                target="_blank"
                rel="noreferrer"
              >
                Open apply page
              </a>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
