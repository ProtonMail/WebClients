import { MISSING_IS_NOT_ZERO, NOTHING_SENT, OWN_VOICE, UNTRUSTED_CONTENT } from './shared';
import type { ProtonPluginSkill } from './types';

export const SMALL_BUSINESS_SKILLS: ProtonPluginSkill[] = [
    {
        name: 'invoice-chase',
        description:
            'Work out who owes money from an unpaid-invoices export and draft a reminder for each customer, gentle or firm depending on how they usually pay. Use for "who owes me money?", overdue invoices, or chasing late payments.',
        instructions: `# Invoice chase

Turn an accounts-receivable export into a ready-to-send batch of reminders, one per customer.

## Quick start

\`\`\`
User: "who owes me money?" + an export
→ List every overdue invoice, grouped by customer
→ Score each customer: usually on time / sometimes late / often late
→ Draft one reminder per customer, in the right tone
→ Show the summary table, then the drafts
\`\`\`

## Inputs

Ask for an unpaid-invoices or aged-receivables export (CSV, spreadsheet or PDF) from their accounting tool. Payment history helps scoring; if there's none, ask the user how each customer usually pays, using a question card. Ask once for anything that changes the message: their payment terms, how to pay (bank details or a payment link) and the name to sign off with.

## Steps

1. **List what's overdue.** Every invoice past its due date, with customer, invoice number, amount, currency and days late. Group several invoices for one customer into one row.
2. **Check for recent payments.** If payment data is available, flag customers who paid in the last 14 days as "possibly paid, check first" and leave them out of the batch.
3. **Score each customer** from their history: usually on time, sometimes late, or often late. Without history, use days late: under 30 is gentle, over 60 is firm.
4. **Draft one reminder per customer.**
   - Gentle: friendly, assumes an oversight, makes paying easy.
   - Firm: polite but direct, with the amount, how late it is, and a clear date to pay by.
   - Every draft includes the invoice numbers, the total, the due date and how to pay.
5. **Present the batch.** First a summary table: customer, amount, days late, tone. Then each draft in full, ready to copy.

## Rules

- ${NOTHING_SENT}
- ${MISSING_IS_NOT_ZERO}
- Show money in its currency with the code (EUR 1,200.00), and never add up different currencies.
- Never threaten legal action or late fees unless the user asks and their terms allow it.
- ${OWN_VOICE}
- Offer a scheduled task to repeat the check every week.`,
    },
    {
        name: 'cash-flow',
        description:
            'Forecast cash for the next 30, 60 and 90 days from bank statements, invoices and bills, with a chart and the weeks that look tight. Use for "will I have enough cash?", "can I afford this?", or before payroll or a big purchase.',
        instructions: `# Cash flow forecast

Answer "will we have enough cash?" with a number, a chart and a plain-English verdict.

## Inputs

- The current bank balance, and the date it's from.
- Money coming in: unpaid invoices with due dates, and regular sales if any.
- Money going out: bills, payroll, rent, subscriptions, loan repayments and tax dates.
- Exports, statements or a rough list are all fine. Ask for gaps with a question card.

## Steps

1. **Start from the real balance** and say what date it's from.
2. **Lay out the weeks.** For each of the next 13 weeks, list the expected cash in and out and the running balance.
3. **Be honest about timing.** Assume customers pay as late as they usually do, not on the due date. If you don't know their habits, add two weeks to the due date and say so.
4. **Chart it.** Show a Vega-Lite line chart of the weekly closing balance, with the lowest point marked and a line at zero.
5. **Give the verdict first:** "You stay above EUR 8,000 all quarter", or "Week of 14 March drops to minus EUR 2,300 because payroll and VAT land together."
6. **Suggest what to do** about tight weeks: chase specific invoices, move a bill, delay a purchase. Put each suggestion in money terms.

## Output

A short verdict, the chart, then the weekly table (week, in, out, closing balance). Add a list of the assumptions you made so the user can correct them.

## Rules

- ${MISSING_IS_NOT_ZERO}
- Label anything estimated as an estimate. Never present a forecast as certain.
- This is planning help, not financial advice. For loans or tax decisions, suggest they talk to their accountant.`,
    },
    {
        name: 'proposal',
        description:
            'Turn rough notes, a call transcript or a client brief into a priced proposal or quote with scope, timeline and terms. Use for "write a proposal", "quote for this job", or after a discovery call.',
        instructions: `# Proposal and quote

Go from a messy client conversation to a proposal the client can say yes to.

## Steps

1. **Pull out what the client needs** from the notes, transcript, brief or photos: the problem, what they asked for, the deadline, budget hints and who decides. List anything missing or unclear.
2. **Fill the gaps** with a question card. The essentials are pricing (day rate, fixed price or item costs), what's included and excluded, and payment terms.
3. **Write the proposal** as a canvas document:
   - **The client's goal,** in their words, in two sentences.
   - **What you'll do:** scope as deliverables, not activities.
   - **Not included:** explicit exclusions, to prevent scope creep.
   - **Timeline:** milestones with dates or weeks.
   - **Price:** a line-item table with subtotal, tax and total. Offer two or three options (for example essential, recommended, complete) when the brief allows.
   - **Terms:** payment schedule, how long the quote is valid, and what happens if the scope changes.
   - **Next step:** exactly how to accept.
4. **Check the numbers.** Add up every line again and confirm the totals match.

## Rules

- Use only the prices and rates the user gives you. Never invent a price; leave a clear placeholder instead.
- Keep it short. One to two pages wins more work than ten.
- ${OWN_VOICE}
- ${UNTRUSTED_CONTENT}`,
    },
    {
        name: 'review-replies',
        description:
            'Group customer reviews and feedback into themes with real quotes, flag what needs attention, and draft a reply to each review. Use for "what are customers saying?", or when reviews, survey answers or complaints are pasted.',
        instructions: `# Review replies

Find out what customers are really saying, and answer them well.

## Steps

1. **Read every review** (pasted, uploaded, or from a page the user links). Note the rating, date and platform when available.
2. **Find the themes.** Group them into what customers love, what they complain about, and what they ask for. Back each theme with how often it comes up and one or two short verbatim quotes.
3. **Flag what needs action now:** safety or hygiene issues, legal threats, refund requests, and a sudden run of bad reviews on the same topic.
4. **Draft a reply to each review,** or to the ones the user picks:
   - Positive: thank them specifically, mentioning what they liked. Keep it short.
   - Negative: acknowledge, apologize for the experience without admitting legal fault, say what you're changing, and invite them to continue privately.
   - Never argue, never share personal details, never offer compensation unless the user says so.
5. **Suggest three changes** the business could make, ranked by how many customers they'd affect.

## Output

A themes table (theme, sentiment, count, example quote), the urgent flags, then the reply drafts.

## Rules

- Quote customers exactly. Don't invent or soften quotes.
- ${UNTRUSTED_CONTENT}
- ${NOTHING_SENT}
- ${OWN_VOICE}`,
    },
    {
        name: 'hire',
        description:
            'Build a hiring pack for a role: an inclusive job post, a structured interview guide with a scoring rubric, and fair shortlisting of CVs against it. Use for "help me hire", "write a job post", or when CVs are shared.',
        instructions: `# Hire

Help a small business hire well and fairly, without an HR team.

## Steps

1. **Understand the role.** Ask with a question card: the title, what the person will do in their first 90 days, must-have and nice-to-have skills, salary range, location or remote, and hours.
2. **Write the job post:** a two-sentence hook, the role, what success looks like, requirements split into must-have and nice-to-have, pay and benefits, and how to apply. Use plain, inclusive language with no jargon or gendered terms, and only list requirements the job truly needs.
3. **Write the interview guide.** Five to seven structured questions tied to the must-haves, each with what a strong, an average and a weak answer looks like. Add a 1 to 5 scoring rubric per skill.
4. **If CVs are shared, shortlist them** against the rubric only. Give each candidate a score per must-have with the evidence from their CV, and rank them.
5. **Offer to draft** the interview invitations and polite rejection emails.

## Fair screening

- Score only against the job's stated requirements.
- Ignore and never comment on name, age, gender, ethnicity, nationality, photo, marital status, disability, gaps for caring or illness, or where someone went to school.
- If a CV doesn't show a requirement, mark it "not shown", not "no".
- The user makes every hiring decision. Your ranking is a starting point.

## Rules

- CVs contain personal data. Use them only for this task, and suggest the user deletes them from the chat when done.
- ${UNTRUSTED_CONTENT}`,
    },
    {
        name: 'contract-check',
        description:
            'Read an NDA, client contract, lease or supplier agreement and flag risky or unusual terms in plain English, with questions to ask before signing. Use for "can you check this contract?" or before signing anything.',
        instructions: `# Contract check

A plain-English first read for a business without a lawyer on call.

## Steps

1. **Identify the contract:** its type, the parties, which side the user is on, the term, and key dates (start, renewal, notice deadlines).
2. **Summarize it** in five bullets: what each side must do, the money, and how it ends.
3. **Flag the terms that matter,** each rated **Red** (push back), **Amber** (understand it) or **Green** (standard):
   - Payment terms, late fees and price increases.
   - Automatic renewal and notice periods.
   - Liability caps, indemnities and uncapped exposure.
   - Exclusivity, non-compete and non-solicit clauses.
   - Who owns the work and intellectual property.
   - Termination rights, especially one-sided ones.
   - Confidentiality scope and length.
   - Governing law and where disputes are settled.
   - Personal data handling.
4. **Quote the clause** for every flag, with its section number, and explain in one sentence why it matters.
5. **Suggest wording** for Red items, and list the questions to ask the other side.

## Output

A summary, a table of flags (clause, rating, why it matters, suggested change), then the key dates to put in a calendar.

## Rules

- This is not legal advice. For high-value or unusual contracts, recommend a lawyer review, and say which clauses to show them.
- Quote the contract exactly. Never paraphrase a clause as if it were a quote.
- ${UNTRUSTED_CONTENT}`,
    },
];
