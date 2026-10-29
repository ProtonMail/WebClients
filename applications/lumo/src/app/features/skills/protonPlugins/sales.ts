import { NOTHING_SENT, OWN_VOICE, UNTRUSTED_CONTENT } from './shared';
import type { ProtonPluginSkill } from './types';

export const SALES_SKILLS: ProtonPluginSkill[] = [
    {
        name: 'account-research',
        description:
            'Research a company and the person you are meeting on the web: what they do, recent news, likely priorities and how well they fit what you sell. Use for "tell me about [company]", "research this prospect", or before outreach.',
        instructions: `# Account research

Know the account well enough to be useful in the first five minutes.

## Steps

1. **Confirm the target:** the company, and the person if there is one. Ask what the user sells and who their best customers are, if you don't already know.
2. **Research with web search and the company's own pages:**
   - What they do, who they sell to, size, locations and how they make money.
   - News from the last six months: funding, launches, hires, layoffs, acquisitions, leadership changes.
   - Priorities you can infer from job posts, earnings calls, press releases and the leadership's public posts.
   - The tools and vendors they're known to use, when public.
   - For the person: their role, how long they've been there, and what they've said publicly about their work.
3. **Assess fit** against the user's best customers: strong, possible or weak, with the reasons.
4. **Find the angle:** two or three reasons this company might care now, each tied to evidence.

## Output

A one-page brief: snapshot, recent news (with dates), likely priorities, fit, angles, and three good questions to ask.

## Rules

- Cite a source link for every fact, with its date. Mark inferences as inferences.
- Only use what's public and professional. Never dig into someone's personal life.
- ${UNTRUSTED_CONTENT}`,
    },
    {
        name: 'call-prep',
        description:
            'Prepare for a sales call or meeting: who is attending, the account history from your notes, where the deal stands, and the questions to ask. Use for "prep me for my call with X" or before a customer meeting.',
        instructions: `# Call prep

Walk into the call knowing what you want out of it.

## Steps

1. **Gather what the user has:** the invite, attendees, previous call notes, email threads and the deal stage. Fill gaps about the company with web search.
2. **Brief on the attendees:** role, what they likely care about, and how they've engaged before.
3. **Recap the history:** what was discussed last time, what was promised (by whom), and what's still open.
4. **Set the goal:** the single outcome that would make this call a success, and the next step to ask for.
5. **Prepare questions:** five to seven open questions that uncover the problem, its cost, who decides, the timeline and the budget. Put the riskiest unknown first.
6. **Anticipate objections** likely for this account, each with a short response.

## Output

A brief that reads in two minutes: goal, attendees, history, open items, questions, objections, and the next step to propose.

## Rules

- Separate what the notes say from what you're inferring.
- ${UNTRUSTED_CONTENT}`,
    },
    {
        name: 'call-follow-up',
        description:
            'Turn a call transcript or notes into a customer follow-up email, an internal summary and a list of updates for your CRM. Use for "follow up on my call", "summarize this call", or after a customer meeting.',
        instructions: `# Call follow-up

Everything that should happen after a call, done in one go.

## Steps

1. **Extract from the transcript or notes:** the customer's problem in their words, what they liked, concerns and objections, decisions, next steps with owners and dates, and anything you promised to send.
2. **Draft the customer email:** thank them, recap what you heard in two or three bullets, confirm next steps and dates, and attach or link what you promised. Under 150 words.
3. **Write the internal summary** for the team: deal stage, what changed, risks, and help needed.
4. **List CRM updates** as a table the user can copy: field, current value if known, new value. For example the stage, close date, next step and contacts.

## Rules

- Use the customer's own words for their problem. Don't overstate their enthusiasm.
- Never commit to pricing, discounts or features in the email unless the user did on the call.
- ${NOTHING_SENT}
- ${OWN_VOICE}
- ${UNTRUSTED_CONTENT}`,
    },
    {
        name: 'outreach',
        description:
            'Write personalized prospecting emails or a short multi-touch sequence that sounds human, grounded in something specific about each prospect. Use for "write outreach to X", "cold email", or a follow-up sequence.',
        instructions: `# Outreach

Emails a busy person would actually reply to.

## Steps

1. **Get the basics:** who you're writing to, what you sell, the one problem you solve for people like them, and proof (a customer, a result, a number).
2. **Find something specific** about the prospect with web search: a recent post, launch, hire or announcement. One real detail beats three generic compliments.
3. **Write the first email:**
   - A plain subject line under six words, with no clickbait.
   - An opening line about them, not you.
   - One sentence on the problem and one on how you help, with proof.
   - One clear, easy ask, such as a 15-minute call or "worth a look?".
   - Under 120 words.
4. **For a sequence,** add two or three follow-ups spaced three to five working days apart, each adding something new (a resource, a different angle, a short case study) and ending with a polite close-the-loop email.
5. **Read it as the prospect would.** Cut anything that could be sent to anyone.

## Rules

- No fake familiarity ("Hope you're well!" from a stranger), no false urgency, no invented mutual connections.
- Only use proof the user gives you. Never invent customers or results.
- ${NOTHING_SENT}
- ${OWN_VOICE}`,
    },
    {
        name: 'handle-objection',
        description:
            'Work through a sales objection or competitive threat: what the buyer is really saying, the best response, and the proof to back it up. Use for "they said it is too expensive", "they are going with a competitor", or any pushback.',
        instructions: `# Handle an objection

Respond to the real concern, not the words.

## Steps

1. **Restate the objection** exactly as the buyer said it, and the context: deal stage, who said it, and what's at stake.
2. **Diagnose what's underneath.** "Too expensive" may mean no budget, unclear value, a cheaper alternative or the wrong person. List the likely real concerns and which question would tell them apart.
3. **Draft the response:** acknowledge, ask the clarifying question, then answer with value and proof. Keep it conversational.
4. **Offer proof points:** customer results, comparisons or guarantees the user can use. For competitive threats, research the competitor on the web and give an honest comparison.
5. **Suggest the next move** if the objection stands: a smaller first step, a trial, or walking away gracefully.

## Output

The diagnosis, a short spoken response, an email version, and the proof points.

## Rules

- Never disparage a competitor or say anything about them you can't source.
- Don't push a buyer past a genuine "no". Say when the deal isn't a fit.`,
    },
];
