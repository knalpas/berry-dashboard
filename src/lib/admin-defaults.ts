import { v4 as uuid } from "uuid";
import { AdminTask } from "./types";
import { nextAnnual, today, addMonths } from "./dates";

/** Starter UK life-admin tasks, each with a real next due date. */
export function defaultAdminTasks(from: string = today()): AdminTask[] {
  const t = (task: Omit<AdminTask, "id" | "done">): AdminTask => ({
    id: uuid(),
    done: false,
    ...task,
  });

  return [
    t({
      title: "Register for Self Assessment, if you need to",
      area: "Tax",
      dueDate: nextAnnual(10, 5, from),
      repeat: "none",
      advice:
        "PAYE-only with simple affairs usually means no return. Side income, contracting, rental income, dividends over the allowance or income over £150k usually do. Register by 5 October after the tax year the income falls in.",
      references: [
        {
          label: "Check if you need a return",
          url: "https://www.gov.uk/check-if-you-need-tax-return",
        },
        {
          label: "Register for Self Assessment",
          url: "https://www.gov.uk/register-for-self-assessment",
        },
      ],
    }),
    t({
      title: "File Self Assessment and pay the balancing payment",
      area: "Tax",
      dueDate: nextAnnual(1, 31, from),
      repeat: "yearly",
      advice:
        "Online filing and payment are both due 31 January. Keep invoices, P60s and bank exports for at least 5 years after the deadline.",
      references: [
        {
          label: "Deadlines",
          url: "https://www.gov.uk/self-assessment-tax-returns/deadlines",
        },
        {
          label: "Payments on account",
          url: "https://www.gov.uk/understand-self-assessment-bill/payments-on-account",
        },
      ],
    }),
    t({
      title: "Second payment on account",
      area: "Tax",
      dueDate: nextAnnual(7, 31, from),
      repeat: "yearly",
      advice:
        "Only applies if your last bill was over £1,000 and less than 80% was collected through PAYE.",
      references: [
        {
          label: "Payments on account",
          url: "https://www.gov.uk/understand-self-assessment-bill/payments-on-account",
        },
      ],
    }),
    t({
      title: "Use this year's ISA allowance",
      area: "Investments",
      dueDate: nextAnnual(4, 5, from),
      repeat: "yearly",
      advice:
        "£20,000 per tax year across all your ISAs. A Stocks & Shares ISA suits long-term money; keep the emergency fund in cash. Unused allowance doesn't roll over.",
      references: [
        {
          label: "ISAs on GOV.UK",
          url: "https://www.gov.uk/individual-savings-accounts",
        },
        {
          label: "MoneyHelper: investing",
          url: "https://www.moneyhelper.org.uk/en/savings/investing",
        },
      ],
    }),
    t({
      title: "Check workplace pension contribution rate",
      area: "Pension",
      dueDate: addMonths(from, 1),
      repeat: "yearly",
      advice:
        "Take the full employer match first — it's a guaranteed return. Ask whether salary sacrifice is offered, and check fund choice and charges.",
      references: [
        {
          label: "MoneyHelper: building a pension",
          url: "https://www.moneyhelper.org.uk/en/pensions-and-retirement/building-your-retirement-pot",
        },
        {
          label: "Annual allowance",
          url: "https://www.gov.uk/tax-on-your-private-pension/annual-allowance",
        },
      ],
    }),
    t({
      title: "Trace old workplace pensions",
      area: "Pension",
      repeat: "none",
      advice:
        "Use the Pension Tracing Service. Before consolidating, check exit fees, guaranteed annuity rates and any benefits you'd lose.",
      references: [
        {
          label: "Find pension contact details",
          url: "https://www.gov.uk/find-pension-contact-details",
        },
      ],
    }),
    t({
      title: "Review health insurance cover",
      area: "Insurance",
      repeat: "yearly",
      advice:
        "If your employer provides it, it's usually a taxable benefit on your P11D. For individual policies compare underwriting (moratorium vs full medical). Don't cancel an existing policy before a new one is confirmed.",
      references: [
        {
          label: "MoneyHelper: health insurance",
          url: "https://www.moneyhelper.org.uk/en/everyday-money/insurance/private-medical-insurance",
        },
      ],
    }),
    t({
      title: "Check life cover and income protection",
      area: "Insurance",
      repeat: "none",
      advice:
        "Death-in-service from an employer stops when you leave. Matters most with dependants or a mortgage. Review beneficiaries after life events.",
      references: [
        {
          label: "MoneyHelper: income protection",
          url: "https://www.moneyhelper.org.uk/en/everyday-money/insurance/income-protection-insurance",
        },
      ],
    }),
    t({
      title: "Build a personal document vault",
      area: "Documents",
      repeat: "none",
      advice:
        "One encrypted folder for passport, NI number, P60s, pension statements, policies and share grants. Name files YYYY-MM-description.",
      references: [
        {
          label: "National Insurance number",
          url: "https://www.gov.uk/lost-national-insurance-number",
        },
      ],
    }),
    t({
      title: "Write a will and lasting power of attorney",
      area: "Documents",
      repeat: "none",
      advice:
        "Inexpensive compared with sorting out intestacy. Review after marriage, divorce or children.",
      references: [
        { label: "Make a will", url: "https://www.gov.uk/make-will" },
        {
          label: "Lasting power of attorney",
          url: "https://www.gov.uk/power-of-attorney",
        },
      ],
    }),
  ];
}
