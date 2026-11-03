import { CvProfile, JobListing } from "./types";

const STOP = new Set(
  "a an the and or of to in for with on at by from as is are was were be been being this that these those i me my we our you your they their it its he she his her who whom which what when where why how can could should would will may might must also into over under about across after before during without within using use used based etc etc".split(
    " "
  )
);

const TITLE_HINTS = [
  "engineer",
  "developer",
  "designer",
  "manager",
  "analyst",
  "consultant",
  "director",
  "lead",
  "architect",
  "product",
  "data",
  "scientist",
  "founder",
  "ops",
  "operations",
  "marketing",
  "sales",
  "finance",
  "accountant",
  "lawyer",
  "nurse",
  "teacher",
];

const SKILL_HINTS = [
  "javascript",
  "typescript",
  "python",
  "java",
  "react",
  "next.js",
  "node",
  "sql",
  "aws",
  "azure",
  "gcp",
  "docker",
  "kubernetes",
  "figma",
  "excel",
  "tableau",
  "power bi",
  "salesforce",
  "hubspot",
  "seo",
  "copywriting",
  "project management",
  "agile",
  "scrum",
  "leadership",
  "communication",
  "negotiation",
  "accounting",
  "bookkeeping",
  "payroll",
  "tax",
  "machine learning",
  "llm",
  "ai",
  "nlp",
  "go",
  "rust",
  "c++",
  "swift",
  "kotlin",
  "php",
  "ruby",
  "rails",
  "django",
  "flask",
  "spring",
  "graphql",
  "rest",
  "ci/cd",
  "terraform",
  "linux",
  "git",
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+.#/\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP.has(t));
}

export function parseCvText(rawText: string, fileName?: string): CvProfile {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const lower = rawText.toLowerCase();
  const tokens = tokenize(rawText);

  const skills = SKILL_HINTS.filter((s) => lower.includes(s));
  const titles = TITLE_HINTS.filter((t) => lower.includes(t)).map(
    (t) => t.charAt(0).toUpperCase() + t.slice(1)
  );

  const yearMatches = [...rawText.matchAll(/\b(19|20)\d{2}\b/g)].map((m) =>
    Number(m[0])
  );
  let yearsExperience: number | undefined;
  if (yearMatches.length >= 2) {
    yearsExperience = Math.max(
      0,
      Math.min(40, Math.max(...yearMatches) - Math.min(...yearMatches))
    );
  }
  const expMatch = lower.match(/(\d+)\+?\s+years?/);
  if (expMatch) yearsExperience = Number(expMatch[1]);

  const locations: string[] = [];
  for (const city of [
    "london",
    "manchester",
    "birmingham",
    "edinburgh",
    "bristol",
    "remote",
    "uk",
    "united kingdom",
    "europe",
  ]) {
    if (lower.includes(city)) locations.push(city);
  }

  const keywordFreq = new Map<string, number>();
  for (const t of tokens) {
    if (t.length < 3) continue;
    keywordFreq.set(t, (keywordFreq.get(t) || 0) + 1);
  }
  const keywords = [...keywordFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40)
    .map(([k]) => k);

  return {
    rawText,
    fileName,
    updatedAt: new Date().toISOString(),
    headline: lines[0]?.slice(0, 120),
    summary: lines.slice(0, 6).join(" ").slice(0, 500),
    skills: [...new Set(skills)],
    titles: [...new Set(titles)],
    yearsExperience,
    locations: [...new Set(locations)],
    keywords,
  };
}

export function scoreJob(job: JobListing, cv?: CvProfile): JobListing {
  if (!cv) {
    return { ...job, relevance: 0, matchReasons: ["Upload a CV to rank relevance"] };
  }

  const hay = `${job.title} ${job.company} ${job.location} ${job.description} ${job.tags.join(" ")}`.toLowerCase();
  let score = 0;
  const reasons: string[] = [];

  for (const skill of cv.skills) {
    if (hay.includes(skill)) {
      score += 12;
      reasons.push(`Skill match: ${skill}`);
    }
  }

  for (const title of cv.titles) {
    if (hay.includes(title.toLowerCase())) {
      score += 10;
      reasons.push(`Title signal: ${title}`);
    }
  }

  for (const loc of cv.locations) {
    if (hay.includes(loc)) {
      score += 6;
      reasons.push(`Location: ${loc}`);
    }
  }

  const kwHits = cv.keywords.filter((k) => hay.includes(k)).slice(0, 8);
  score += kwHits.length * 2;
  if (kwHits.length) reasons.push(`Keywords: ${kwHits.slice(0, 4).join(", ")}`);

  if (job.location.toLowerCase().includes("remote") && cv.locations.includes("remote")) {
    score += 5;
  }

  const relevance = Math.min(99, Math.round(score));
  return {
    ...job,
    relevance,
    matchReasons: reasons.slice(0, 6),
  };
}

export function adviseCv(cv: CvProfile, topJobs: JobListing[]): string[] {
  const tips: string[] = [];
  if (cv.skills.length < 6) {
    tips.push(
      "Add a dedicated Skills section with 8–12 concrete tools and methods (not soft skills alone)."
    );
  }
  if (!cv.yearsExperience) {
    tips.push(
      "Make experience dates explicit (e.g. Jan 2021 – Present) so tenure and progression are obvious."
    );
  }
  if (cv.rawText.length < 1200) {
    tips.push(
      "Expand impact bullets: each role should have 3–5 quantified outcomes (%, £, time saved, users)."
    );
  }
  if (!/achiev|led |built |delivered |increased |reduced /i.test(cv.rawText)) {
    tips.push(
      "Lead bullets with strong verbs (Led, Built, Delivered, Increased, Reduced) and measurable results."
    );
  }
  if (!cv.locations.length) {
    tips.push("State preferred location or Remote/Hybrid clearly near the top of the CV.");
  }

  const demand = new Map<string, number>();
  for (const job of topJobs) {
    for (const tag of job.tags) {
      const t = tag.toLowerCase();
      demand.set(t, (demand.get(t) || 0) + 1);
    }
  }
  const missing = [...demand.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => t)
    .filter((t) => !cv.skills.includes(t) && !cv.rawText.toLowerCase().includes(t))
    .slice(0, 5);

  if (missing.length) {
    tips.push(
      `High-demand terms in matched roles that are weak/missing on your CV: ${missing.join(", ")}. Add evidence only if genuine.`
    );
  }

  tips.push(
    "Tailor the top third of the CV to the target role family — recruiters often decide in under 10 seconds."
  );
  tips.push(
    "Keep to two pages max for most UK private-sector roles; put densest signal above the fold."
  );

  return tips.slice(0, 8);
}

export function draftCoverLetter(job: JobListing, cv?: CvProfile): string {
  const name = cv?.headline?.split(/[|,–-]/)[0]?.trim() || "Candidate";
  const skills = cv?.skills.slice(0, 4).join(", ") || "relevant experience";
  return `Dear ${job.company} hiring team,

I am writing to apply for the ${job.title} role. My background spans ${skills}, and I am drawn to ${job.company} because the role aligns with the problems I enjoy solving.

Recent highlights from my experience:
• Delivered outcomes using ${cv?.skills[0] || "core domain skills"} in fast-moving environments
• Collaborated across product, engineering, and stakeholders to ship measurable results
• Continuously improve craft through feedback, ownership, and clear communication

I would welcome a conversation about how I can contribute to your team. Thank you for your time.

Kind regards,
${name}`;
}

export function draftOutreach(company: string, roleHint: string, jobTitle?: string): string {
  return `Hi {{first_name}},

I came across ${company}'s ${jobTitle || "open role"} and wanted to reach out directly. I'm exploring opportunities where ${roleHint.toLowerCase()} work has real impact, and ${company} stands out.

Would you be open to a short chat about the team and what strong candidates look like right now? Happy to share a concise background note first.

Thanks so much,
{{your_name}}`;
}
