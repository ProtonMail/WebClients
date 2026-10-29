import { MISSING_IS_NOT_ZERO, UNTRUSTED_CONTENT } from './shared';
import type { ProtonPluginSkill } from './types';

const NOT_ADVICE =
    'This is bookkeeping and analysis help, not tax, legal or investment advice. Flag judgement calls for the user or their accountant to decide.';

export const FINANCE_SKILLS: ProtonPluginSkill[] = [
    {
        name: 'variance-analysis',
        description:
            'Explain budget against actual, or this period against last, by breaking each variance into its drivers with a waterfall chart and a short narrative. Use for "why are we over budget?", monthly reviews or board commentary.',
        instructions: `# Variance analysis

Explain why the numbers moved, in words a manager can repeat.

## Steps

1. **Load the data:** budget and actual, or two periods, by account or category. Confirm the period, currency and whether figures are cumulative or monthly.
2. **Calculate variances** in money and percent for every line. Mark each as favourable or unfavourable (higher revenue is favourable, higher costs unfavourable).
3. **Pick the lines that matter:** anything over a threshold the user sets, or by default over 10% and over 5% of the total.
4. **Break down the drivers** for each material line: volume, price or rate, mix, timing (it will reverse) and one-offs. Ask the user for context you can't see in the data.
5. **Chart it:** a Vega-Lite waterfall from budget (or last period) to actual, one bar per driver.
6. **Write the narrative:** three to five sentences per material variance, saying what happened, why, and whether it will continue.

## Output

A summary paragraph, the waterfall chart, a variance table (line, budget, actual, variance, %, driver), then the commentary.

## Rules

- ${MISSING_IS_NOT_ZERO}
- Check the totals add up before explaining anything. If they don't, say so first.
- Separate timing differences from real changes; they need different decisions.
- ${NOT_ADVICE}`,
    },
    {
        name: 'financial-statements',
        description:
            'Build an income statement, balance sheet and cash flow summary from a trial balance or transaction export, compared with the previous period. Use for "prepare our P&L", monthly or quarterly reporting, or closing the books.',
        instructions: `# Financial statements

Clean, comparable statements from raw accounting data.

## Steps

1. **Load the data:** a trial balance, a general ledger export or categorized transactions, for this period and the comparison period. Confirm the currency and the accounting basis (cash or accrual).
2. **Map the accounts** into statement lines: revenue, cost of sales, operating expenses, other income and costs, tax; assets, liabilities and equity. Show the mapping so the user can correct it.
3. **Build the statements:**
   - Income statement with gross margin and operating margin.
   - Balance sheet, checking that assets equal liabilities plus equity.
   - A cash flow summary (operating, investing, financing) when the data allows.
4. **Compare periods** with change in money and percent, and flag large movements.
5. **Write a short commentary:** what drove profit, the cash position and anything unusual.

## Output

Each statement as a table, the account mapping, the checks (with pass or fail), and the commentary. Offer a spreadsheet-ready version.

## Rules

- If the balance sheet doesn't balance or the trial balance doesn't net to zero, stop and show the difference before going further.
- ${MISSING_IS_NOT_ZERO}
- ${NOT_ADVICE}`,
    },
    {
        name: 'reconciliation',
        description:
            'Reconcile a bank statement or payment processor export against your books, match the transactions and list what does not match with the likely reason. Use for "reconcile this account", month-end checks or missing payments.',
        instructions: `# Reconciliation

Make the books and the bank agree, and explain every difference.

## Steps

1. **Load both sides:** the bank or processor statement and the ledger for the same account and dates. Confirm the opening and closing balances on each side.
2. **Match the transactions:** exact amount and date first, then the same amount within a few days, then many-to-one matches (several sales in one payout, after fees).
3. **List what's left** on each side, with the likely reason: timing (in transit), bank fees or interest not recorded, duplicates, wrong amounts, or missing entries.
4. **Build the reconciliation:** ledger balance, plus and minus each reconciling item, equals the bank balance. Show any unexplained difference clearly.
5. **Suggest fixes:** the entries to book, and the items to investigate with who to ask.

## Output

A summary (matched count, unmatched count, unexplained difference), the reconciliation statement, then the unmatched items table (date, description, amount, side, likely reason, action).

## Rules

- ${MISSING_IS_NOT_ZERO}
- Flag possible duplicates and payments to unfamiliar payees rather than assuming they're fine.
- ${UNTRUSTED_CONTENT}`,
    },
    {
        name: 'journal-entry',
        description:
            'Prepare journal entries with debits, credits and a clear description for accruals, prepayments, depreciation, payroll or corrections. Use for "book this accrual", "what is the entry for X?", or month-end adjustments.',
        instructions: `# Journal entry

Entries an accountant can post without rework.

## Steps

1. **Understand the event:** what happened, the amounts, dates, and the accounts the user's chart of accounts uses. Ask for the chart of accounts if the account names matter.
2. **Choose the treatment:** accrual, prepayment release, depreciation, payroll, revenue recognition or a correction. Explain it in one sentence.
3. **Write the entry** as a table: date, account, debit, credit, and a description that says what and why. Debits must equal credits.
4. **Show the workings** for calculated amounts, such as monthly depreciation or a pro-rated accrual.
5. **Note the follow-up:** a reversing entry next period, or a recurring schedule.

## Rules

- Never post anything; the user books the entry in their own system.
- State any assumption about accounting policy and ask the user to confirm it.
- ${NOT_ADVICE}`,
    },
];
