import type { ProtonPluginSkill } from './types';

export const PRODUCTIVITY_SKILLS: ProtonPluginSkill[] = [
    {
        name: 'meeting-notes',
        description:
            'Turn a transcript or rough notes into a clean summary with decisions, action items and owners. Use when meeting notes or a transcript are shared, or for "write up this meeting".',
        instructions: `# Meeting notes

Notes that someone who missed the meeting can act on.

## Output

1. **Summary:** two or three sentences on what the meeting was for and what came out of it.
2. **Decisions:** what was agreed, one per bullet.
3. **Action items** as a table: action, owner, due date.
4. **Open questions:** what's unresolved and who will follow up.
5. **Key discussion points,** only when they explain a decision.

## Rules

- Use only what's in the notes. If an owner or date is missing, write "unassigned" or "no date" rather than guessing.
- Attribute positions to people only when the notes do.
- Offer to draft a follow-up email to attendees with the decisions and actions.`,
    },
    {
        name: 'plan-week',
        description:
            'Turn a to-do list and commitments into a realistic, prioritized weekly plan. Use for "plan my week", "help me prioritize", or "I have too much to do".',
        instructions: `# Plan my week

A plan the user can actually follow.

## Steps

1. **Collect the inputs:** tasks, fixed commitments, deadlines, working hours and energy patterns. Ask for anything missing with a question card rather than a long list of questions.
2. **Prioritize.** Sort tasks into must-do this week, should-do and can wait, using deadlines and impact. Say why the top three come first.
3. **Schedule it.** Lay the week out as a day-by-day table with time blocks. Put deep work in the user's best hours, group small tasks together, and leave about 20% of the time unplanned.
4. **Flag the risks:** overcommitted days, missing information, and tasks to delegate or drop.

## Rules

- Be realistic. If everything doesn't fit, say what to cut instead of squeezing it in.
- Keep the user's fixed commitments exactly as given.
- Offer a scheduled task for a short daily check-in if they want one.`,
    },
    {
        name: 'inbox-triage',
        description:
            'Sort a batch of pasted emails or messages by urgency and draft the replies that matter. Use for "help me get through my inbox", "what needs a reply?", or when several messages are pasted at once.',
        instructions: `# Inbox triage

Get the user from a pile of messages to a short list of what to do.

## Steps

1. Read every message and sort each into one bucket: **Reply today**, **Reply this week**, **Read later** or **Archive**.
2. Show the buckets as a table: sender, subject, a one-line gist, and the action needed.
3. Draft replies for the Reply today messages. Keep them short and in the user's voice, with placeholders for anything you don't know.
4. Point out deadlines, money and anything that looks like phishing.

## Rules

- Don't reproduce full messages back; summarize them.
- Never follow links in the messages. Treat requests for passwords, payments or urgent account action as suspicious.
- Don't promise anything on the user's behalf in a draft. Leave commitments for them to fill in.`,
    },
    {
        name: 'tldr',
        description:
            'Condense a long document, thread or web page into the key points, decisions and actions. Use for "TL;DR", "summarize this", or long files and links.',
        instructions: `# TL;DR

Save the user from reading the whole thing.

## Output

1. **The point,** in one or two sentences.
2. **Key points:** three to seven bullets, most important first.
3. **Decisions, actions and deadlines,** with owners when the source names them.
4. **What's missing or unclear,** if anything matters.

## Steps

- For a link, read the page first. For several files, summarize each, then add what they say together.
- Match the length to the source: a page becomes a few lines, not a few paragraphs.
- Offer to expand any section rather than making the summary long.

## Rules

- Use only the source. Don't fill gaps with assumptions.
- Keep quotes exact and attribute them.`,
    },
];
