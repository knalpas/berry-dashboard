import { JobListing, CvProfile } from "./types";
import { scoreJob } from "./cv";

type RemotiveJob = {
  id: number;
  url: string;
  title: string;
  company_name: string;
  candidate_required_location: string;
  description: string;
  job_type: string;
  category: string;
  tags: string[];
  salary: string;
  publication_date: string;
};

type ArbeitnowJob = {
  slug: string;
  url: string;
  title: string;
  company_name: string;
  location: string;
  description: string;
  tags: string[];
  remote: boolean;
  created_at: number;
};

async function fetchRemotive(query?: string): Promise<JobListing[]> {
  const url = query
    ? `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=50`
    : "https://remotive.com/api/remote-jobs?limit=50";
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return [];
  const data = (await res.json()) as { jobs?: RemotiveJob[] };
  return (data.jobs || []).map((j) => ({
    id: `remotive-${j.id}`,
    source: "remotive" as const,
    title: j.title,
    company: j.company_name,
    location: j.candidate_required_location || "Remote",
    url: j.url,
    description: stripHtml(j.description).slice(0, 2000),
    tags: [...(j.tags || []), j.category, j.job_type].filter(Boolean),
    salary: j.salary || undefined,
    postedAt: j.publication_date,
  }));
}

async function fetchArbeitnow(query?: string): Promise<JobListing[]> {
  const res = await fetch("https://www.arbeitnow.com/api/job-board-api", {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { data?: ArbeitnowJob[] };
  let jobs = (data.data || []).map((j) => ({
    id: `arbeitnow-${j.slug}`,
    source: "arbeitnow" as const,
    title: j.title,
    company: j.company_name,
    location: j.remote ? `Remote · ${j.location}` : j.location || "Unknown",
    url: j.url,
    description: stripHtml(j.description || "").slice(0, 2000),
    tags: j.tags || [],
    postedAt: j.created_at ? new Date(j.created_at * 1000).toISOString() : undefined,
  }));
  if (query) {
    const q = query.toLowerCase();
    jobs = jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.tags.some((t) => t.toLowerCase().includes(q)) ||
        j.description.toLowerCase().includes(q)
    );
  }
  return jobs.slice(0, 50);
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export async function searchJobs(opts: {
  query?: string;
  cv?: CvProfile;
}): Promise<JobListing[]> {
  const query =
    opts.query?.trim() ||
    opts.cv?.titles[0] ||
    opts.cv?.skills.slice(0, 2).join(" ") ||
    undefined;

  const results = await Promise.allSettled([
    fetchRemotive(query),
    fetchArbeitnow(query),
  ]);

  const merged: JobListing[] = [];
  const seen = new Set<string>();
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const job of r.value) {
      const key = `${job.company}|${job.title}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(scoreJob(job, opts.cv));
    }
  }

  return merged.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
}

export function peopleTargets(company: string, jobTitle: string) {
  const seniority = /director|head|vp|chief|principal/i.test(jobTitle)
    ? "senior leadership"
    : /senior|lead|staff/i.test(jobTitle)
      ? "hiring manager / team lead"
      : "recruiter or hiring manager";

  return [
    {
      roleHint: "Hiring Manager",
      whyInteresting: `Likely owns the ${jobTitle} brief and can speak to team fit (${seniority}).`,
      searchHint: `site:linkedin.com/in "${company}" "${jobTitle.split(" ")[0]}" OR "hiring" OR "engineering manager"`,
    },
    {
      roleHint: "Talent / Recruiter",
      whyInteresting: "Often the fastest path to interview logistics and status.",
      searchHint: `site:linkedin.com/in "${company}" ("recruiter" OR "talent acquisition" OR "people partner")`,
    },
    {
      roleHint: "Peer on the team",
      whyInteresting: "Gives honest culture signal; useful before applying or after a first screen.",
      searchHint: `site:linkedin.com/in "${company}" "${jobTitle}"`,
    },
  ];
}
