import { OWN_VOICE, UNTRUSTED_CONTENT } from './shared';
import type { ProtonPluginSkill } from './types';

const PEOPLE_DATA =
    'People data is sensitive. Use it only for this task, never repeat more personal detail than needed, and suggest removing names when sharing outputs widely.';

const NOT_LEGAL =
    'Employment law differs by country and region. Flag anything with legal risk (dismissal, discrimination, contracts, leave entitlements) for the user to check with a qualified adviser.';

export const HUMAN_RESOURCES_SKILLS: ProtonPluginSkill[] = [
    {
        name: 'onboarding-plan',
        description:
            'Create an onboarding plan for a new hire: what to set up before they start, a first-day and first-week schedule, and goals for 30, 60 and 90 days. Use when someone has a start date coming up.',
        instructions: `# Onboarding plan

A first week that makes a new hire glad they joined.

## Steps

1. **Get the details:** role, team, manager, start date, remote or on site, and anything the company already does for onboarding.
2. **Before day one:** a checklist with owners: contract and paperwork, equipment, accounts and access, a buddy, a welcome message, and a calendar of first-week meetings.
3. **Day one:** an hour-by-hour plan that is welcoming and light: introductions, setup, a team lunch or call, and one small, real first task.
4. **First week:** meetings with key people, the context to read, the tools to learn, and a check-in with the manager at the end.
5. **30, 60 and 90 days:** two or three goals for each stage, moving from learning to contributing to owning something.

## Output

A canvas document with the pre-start checklist (task, owner, due date), the day-one and week-one schedules, the 30-60-90 goals, and a draft welcome message.

## Rules

- Keep the first week realistic; leave room to absorb things.
- ${OWN_VOICE}`,
    },
    {
        name: 'performance-review',
        description:
            'Write a fair, specific performance review from notes, goals and feedback, or create self-assessment and manager templates for review season. Use for "help me write a review", "self-assessment", or calibration prep.',
        instructions: `# Performance review

Reviews that are specific, balanced and useful to the person reading them.

## Steps

1. **Ask what's needed:** a manager review for one person, a self-assessment, or templates for the whole team.
2. **For a review, collect the evidence:** goals for the period, results, examples, peer feedback and the company's rating scale.
3. **Write each section with evidence:**
   - **Impact:** what they achieved against their goals, with concrete examples and outcomes.
   - **Strengths:** two or three, each with an example.
   - **Growth areas:** one or two, framed as behaviour with an example and a clear next step.
   - **Goals for next period:** specific and measurable.
4. **Suggest a rating** only if the user asks, and say which evidence supports it.
5. **Check for bias:** flag vague praise or criticism, personality labels ("abrasive", "not a culture fit"), and feedback that refers to anything other than the work.

## Output

The review text, ready to paste, plus a short list of evidence gaps the manager should fill.

## Rules

- Base everything on the evidence given. Never invent examples.
- Describe behaviour and impact, never personality.
- ${PEOPLE_DATA}
- ${NOT_LEGAL}`,
    },
    {
        name: 'policy-answer',
        description:
            'Answer questions about company policies (time off, remote work, expenses, benefits) in plain language from an uploaded handbook, quoting the source. Use for "what is our parental leave policy?" or any policy question.',
        instructions: `# Policy answer

A straight answer to a policy question, backed by the handbook.

## Steps

1. **Find the source.** Ask for the employee handbook or policy document if it isn't already in the chat or project.
2. **Answer the question first,** in one or two plain sentences.
3. **Quote the relevant section** exactly, with its title or page number.
4. **Explain the details** that matter for the person's situation: eligibility, how to request it, deadlines and who approves.
5. **Say what the policy doesn't cover,** and who to ask (HR, their manager) for anything ambiguous.

## Rules

- Answer only from the policy documents provided. If the answer isn't in them, say so instead of guessing what's typical.
- Quote exactly. Never paraphrase as if quoting.
- ${UNTRUSTED_CONTENT}
- ${NOT_LEGAL}`,
    },
    {
        name: 'offer-letter',
        description:
            'Draft an offer letter with role, pay, benefits, start date and conditions, plus a friendly email to send with it. Use when a candidate is ready for an offer, or to put together a total pay package.',
        instructions: `# Offer letter

A clear, warm offer that leaves no surprises.

## Steps

1. **Collect the terms** with a question card: candidate name, job title, manager, start date, salary and pay frequency, bonus or equity, benefits, hours, location or remote, probation period, conditions (references, right to work) and the offer deadline.
2. **Draft the letter:** a warm opening, the role and who they report to, pay and benefits in a clear table, start date and location, conditions, how to accept, and the deadline.
3. **Draft the covering email:** short and personal, highlighting what excited the team about them.
4. **Check consistency:** numbers match everywhere, and the dates and deadline make sense.

## Rules

- Use only the terms the user gives. Leave a clear placeholder for anything missing; never invent pay or benefits.
- Use the company's own template and legal wording if the user has one.
- ${NOT_LEGAL}
- ${OWN_VOICE}`,
    },
];
