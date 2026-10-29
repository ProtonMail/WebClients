import type { ProtonPluginSkill } from './types';

export const RESEARCH_SKILLS: ProtonPluginSkill[] = [
    {
        name: 'deep-research',
        description:
            'Research a question across several web sources and write a sourced report. Use for "research…", "what\'s the current state of…", "give me an overview of…", or any question that needs more than one search.',
        instructions: `# Deep research

Answer a substantial question with evidence from several independent sources.

## Steps

1. **Scope it.** Restate the question in one line. If it's broad, pick the two or three angles that matter most, or ask the user to choose with a question card.
2. **Search widely.** Run several web searches with different phrasings. Read the most relevant pages in full rather than relying on snippets. Prefer primary sources: official sites, papers, filings and original reporting.
3. **Cross-check.** Note where sources agree, where they conflict, and how recent each one is.
4. **Write the report**, starting with a short answer, then the findings by theme, then open questions and a list of sources. Put a long report in the canvas as a document.

## Rules

- Cite a source for every non-obvious claim.
- Say clearly when evidence is thin, old or contested. Never fill gaps with guesses.
- If web search is off, say so and offer what you know, with its cutoff, as background only.`,
    },
    {
        name: 'fact-check',
        description:
            'Check whether a claim, quote, statistic or viral post is true, with a verdict and sources. Use when asked "is this true?", "did X really say…", or to check a figure before sharing it.',
        instructions: `# Fact-check

Give a clear verdict on one claim, backed by evidence.

## Steps

1. Pin down the exact claim: who said it, when, and what precisely is being asserted.
2. Search for the original source and for independent confirmation or debunks. Read them; don't rely on headlines.
3. Give one verdict: **True**, **Mostly true**, **Misleading**, **False** or **Unverified**.
4. Explain it in three to five bullets: what's right, what's wrong or missing, and the context that changes the meaning.
5. List the sources you used, most authoritative first.

## Rules

- Judge the claim, not the person sharing it.
- Use Unverified when good sources aren't available. Don't round up to True.
- For fast-moving news, note the time of your check and that details may change.`,
    },
    {
        name: 'compare-options',
        description:
            'Compare products, services, plans or approaches side by side and recommend one. Use for "which should I choose…", "X vs Y", "compare these laptops", or any purchase or decision with several options.',
        instructions: `# Compare options

Help the user make a decision, not just read a spec sheet.

## Steps

1. **Find out what matters.** Ask for the user's priorities and constraints (budget, must-haves, deal-breakers) with a question card, unless they already said.
2. **Gather facts.** Search for current prices, specifications and independent reviews. Note the date of anything that changes often.
3. **Compare in a table** with the user's criteria as rows and the options as columns. Keep cells short.
4. **Recommend.** Name the best option for this user and why, plus the best alternative if their priorities shift.

## Rules

- Cite sources for prices and claims, and say when they were checked.
- Flag sponsored or affiliate-heavy sources and prefer independent testing.
- If options are effectively tied, say so and name the deciding question.`,
    },
    {
        name: 'news-brief',
        description:
            'Summarize the latest news on a topic, company or place into a short dated brief with sources. Use for "what\'s new with…", "catch me up on…", or a morning briefing.',
        instructions: `# News brief

A short, dated catch-up the user can read in a minute.

## Steps

1. Search for recent news on the topic. Default to the last seven days unless the user gave a period.
2. Group stories by development rather than by outlet, and drop duplicates.
3. Write five to eight bullets, newest or most important first. Each bullet gets a date, one sentence of what happened, one of why it matters, and a source.
4. End with what to watch next: upcoming dates, decisions or announcements.
5. If the user may want this regularly, offer to set it up as a scheduled task.

## Rules

- Report; don't editorialize. Attribute opinions to whoever holds them.
- Prefer original reporting over aggregators.
- If there's little news, say so rather than padding the brief with old stories.`,
    },
];
