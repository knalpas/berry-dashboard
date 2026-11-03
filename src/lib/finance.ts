import { FinanceItem } from "./types";
import { v4 as uuid } from "uuid";

export function defaultFinanceItems(): FinanceItem[] {
  const now = () => uuid();
  return [
    {
      id: now(),
      category: "Tax",
      title: "Register for Self Assessment (if needed)",
      description:
        "Check whether HMRC expects a Self Assessment return (side income, contractor, dividends, high income, etc.).",
      advice:
        "If you are employed only on PAYE with simple affairs you may not need SA. Contractors, landlords, and people with untaxed income usually do. Register well before the October deadline for paper / online setup lag.",
      references: [
        { label: "HMRC Self Assessment", url: "https://www.gov.uk/self-assessment-tax-returns" },
        { label: "Check if you need to send a return", url: "https://www.gov.uk/check-if-you-need-tax-return" },
      ],
      status: "todo",
      dueHint: "Register by ~5 Oct for that tax year",
    },
    {
      id: now(),
      category: "Tax",
      title: "File Self Assessment & pay balancing payment",
      description: "Online filing deadline 31 January; keep records of income, expenses, and payments on account.",
      advice:
        "Use software or an accountant if your affairs are non-trivial. Set calendar reminders for 31 Jan and 31 Jul payments on account. Keep invoices and bank exports for 5+ years.",
      references: [
        { label: "Deadlines", url: "https://www.gov.uk/self-assessment-tax-returns/deadlines" },
        { label: "Payments on account", url: "https://www.gov.uk/understand-self-assessment-bill/payments-on-account" },
      ],
      status: "todo",
      dueHint: "31 Jan (file + pay)",
    },
    {
      id: now(),
      category: "Health",
      title: "Review private health insurance",
      description: "Compare individual vs employer scheme; check excess, outpatient cover, and mental health.",
      advice:
        "If your employer offers PMI, check whether it’s P11D taxable and whether you can add family. For individual policies, compare Bupa, Aviva, Vitality, AXA on underwriting (moratorium vs full medical). Don’t cancel an existing policy before a new underwriting decision.",
      references: [
        { label: "MoneyHelper health insurance", url: "https://www.moneyhelper.org.uk/en/healthcare/health-insurance" },
      ],
      status: "todo",
    },
    {
      id: now(),
      category: "Pension",
      title: "Check workplace pension & contribution rate",
      description: "Confirm enrolment, employee/employer %, and whether salary sacrifice is available.",
      advice:
        "Aim for total contributions well above the legal minimum when cashflow allows. Capture full employer match first — that is a guaranteed return. Review fund choice (target-date vs global equity) and charges.",
      references: [
        { label: "Workplace pensions overview", url: "https://www.moneyhelper.org.uk/en/pensions-and-retirement/building-your-retirement-pot" },
        { label: "Pension Annual Allowance", url: "https://www.gov.uk/tax-on-your-private-pension/annual-allowance" },
      ],
      status: "todo",
    },
    {
      id: now(),
      category: "Pension",
      title: "Consolidate old pots / find lost pensions",
      description: "Track previous workplace schemes and consider consolidation carefully.",
      advice:
        "Use the government’s pension tracing service. Before consolidating, check exit fees, guaranteed annuity rates, and employer contributions you might lose. A flat-fee SIPP can help once pots are larger.",
      references: [
        { label: "Find pension contact details", url: "https://www.gov.uk/find-pension-contact-details" },
      ],
      status: "todo",
    },
    {
      id: now(),
      category: "Investments",
      title: "Maximise ISA allowance",
      description: "Use the annual ISA allowance for tax-efficient investing or cash.",
      advice:
        "Stocks & Shares ISA suits long-term investing; Cash ISA for emergency buffers in higher-rate environments. Don’t panic-trade. Prefer broad global index funds unless you have a researched reason not to.",
      references: [
        { label: "ISA overview (GOV.UK)", url: "https://www.gov.uk/individual-savings-accounts" },
        { label: "MoneyHelper investing", url: "https://www.moneyhelper.org.uk/en/savings/investing" },
      ],
      status: "todo",
      dueHint: "Use allowance before 5 April",
    },
    {
      id: now(),
      category: "Investments",
      title: "Emergency fund & high-interest cash",
      description: "3–6 months of essential expenses in easy-access or short notice cash.",
      advice:
        "Keep this separate from speculative investing. Ladder notice accounts if you can tolerate less liquidity. Revisit rate after teaser periods end.",
      references: [
        { label: "Emergency savings guidance", url: "https://www.moneyhelper.org.uk/en/savings/how-to-save/emergency-savings" },
      ],
      status: "todo",
    },
    {
      id: now(),
      category: "Insurance",
      title: "Life / income protection check",
      description: "Especially important with dependents or mortgage liabilities.",
      advice:
        "Employer death-in-service is not a full plan. Compare life cover and income protection; prefer insurers with strong claims histories. Review beneficiaries after life events.",
      references: [
        { label: "Income protection", url: "https://www.moneyhelper.org.uk/en/everyday-money/insurance/income-protection-insurance" },
      ],
      status: "todo",
    },
    {
      id: now(),
      category: "Admin",
      title: "Personal document vault",
      description: "Passport, NI number, P60s, pension statements, insurance docs, share grants.",
      advice:
        "Keep a single encrypted folder or password manager secure notes index. Photograph physical docs. Name files YYYY-MM-description for sorting.",
      references: [
        { label: "National Insurance number", url: "https://www.gov.uk/national-insurance" },
      ],
      status: "todo",
    },
    {
      id: now(),
      category: "Admin",
      title: "Will & lasting power of attorney",
      description: "Basic estate planning once you have assets or dependents.",
      advice:
        "A simple will is inexpensive relative to intestacy mess. Consider LPA for health and property. Review after marriage, divorce, or children.",
      references: [
        { label: "Make a will", url: "https://www.gov.uk/make-will" },
        { label: "LPA overview", url: "https://www.gov.uk/power-of-attorney" },
      ],
      status: "todo",
    },
  ];
}
