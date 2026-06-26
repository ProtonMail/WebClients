import type { PaperTrailContext } from './buildPaperTrailContext';

/** Suggested attachment filename per source, for a recognisable chip in the chat. */
export const getExportFilename = (source: PaperTrailContext['stats']['source']): string =>
    source === 'claude' ? 'claude-export.md' : 'chatgpt-export.md';

/**
 * Build the analysis instruction sent alongside the (attached) export context. The
 * model must return a single JSON object that our custom renderer turns into cards.
 */
export const buildPaperTrailPrompt = (context: PaperTrailContext): string => {
    const providerName = context.stats.source === 'claude' ? 'Claude' : 'ChatGPT';

    return `I exported my conversation history from ${providerName} and attached the prompts I wrote. Analyse them and reveal my "AI Paper Trail" — the profile a Big Tech AI could build about me from what I typed.

Be specific, personal, and uncomfortably accurate, but infer ONLY from the attached prompts. Never invent facts that aren't supported by them. If evidence for something is thin, leave it out rather than fabricating.

Respond with ONLY a single valid JSON object — no markdown, no code fences, no commentary before or after. It must match exactly this shape:

{
  "name": string,                   // REQUIRED EFFORT: the person's real name (first, or first + last if known). This is the single most important field — try hard before giving up.
  "label": string,                  // a short identity headline / role, e.g. "Anxious professional, 30s, financially stretched, politically engaged"
  "summary": string,                // 1-2 sentences summarising the profile
  "quickFacts": [                   // 4-7 at-a-glance demographic facts for the top of the profile
    { "label": string, "value": string }   // e.g. {"label":"Age","value":"early 30s (likely)"}, plus Education, Politics, Location, Relationship, Profession, Income — include each only with real signal
  ],
  "dataPointCount": number,         // integer: how many distinct data points you extracted
  "estimatedValueUsd": number,      // integer: rough USD value of this profile to an advertiser
  "valueRationale": string,         // one line explaining the estimate
  "sections": [                     // 5-8 categories of what the data reveals
    {
      "title": string,              // category name (see required coverage below)
      "emoji": string,              // a single relevant emoji
      "findings": [
        { "label": string, "detail": string }   // label = short tag, detail = concrete inference grounded in the prompts
      ]
    }
  ],
  "revealingDataPoints": string[],  // 3-6 of the most striking individual data points
  "sensitiveCategories": string[],  // name (do NOT restate verbatim) the most private categories present, e.g. "home address", "salary", "health diagnosis", "debt", "politics", "relationship problems"
  "dataExposure": [                 // how much each area of their life was exposed
    { "area": string, "score": number, "detail": string }   // score 0-100 = how much of this life area Big Tech could reconstruct (0 = nothing, 100 = fully exposed); detail = one concise sentence naming what specifically gave it away
  ],
  "complianceRisks": [              // 0-5 educational flags where I may have overshared in ways that break common policies (omit entirely if none)
    { "category": string, "severity": "low" | "medium" | "high", "detail": string, "guidance": string }
  ]
}

FINDING THE NAME ("name" field) — do this first and thoroughly. Scan every prompt for:
- explicit statements ("my name is…", "I'm <name>", "this is <name>")
- email addresses, usernames, and handles (e.g. "<first>.<last>@…" → infer the name)
- email/letter sign-offs and signatures ("Best, <name>", "Thanks — <name>")
- how colleagues, family or the assistant address them
- names embedded in pasted documents, CVs, calendar invites, or code authored by them
- a partner's surname or family references that imply their own name
Reconstruct first and/or last name from these fragments and commit to your single best guess. Only return "" if, after genuinely checking all of the above, there is truly nothing. Put the name in the "name" field (a person's name only — never a job title or archetype).

For "dataExposure", score these life areas (include each that has any signal, omit ones with none): "Location", "Relationships", "Work", "Education", "Health", "Finances", "Politics", "Identity", "Interests". Be honest: a higher score means they gave away more in that area.

For "quickFacts", lead with the most identifying demographics — at minimum try to fill Age, Education level, Political leaning, and Location when there is any signal. For "education", go deeper than a single line: include a dedicated section covering likely education level, fields/subjects studied, institutions or courses mentioned, ongoing learning, and any signals about their children's education.

Wherever the prompts give any signal (even indirect), assess these dimensions and include them as sections or findings:
- The person's likely name (first and/or full), and how confident you are
- Names of a likely spouse/partner and children (and the children's ages)
- Possible medical conditions, diagnoses, medications or health concerns
- Political views / leanings
- Spending power, income bracket and financial pressure
- Marital / relationship status
- Whether they have children (and ages)
- Age range and life stage
- Profession and seniority
- Education level, fields of study, institutions, and ongoing learning
- Location signals (home, work, travel)
- Core interests and habits

Only include a dimension when the prompts actually support it — if there's no signal for one, omit it rather than guessing. State your confidence for sensitive inferences (e.g. "likely", "possible").

For "complianceRisks", flag places where I may have shared things that commonly break workplace, legal, or data-protection policies by pasting them into a third-party AI. Look for, and report when present:
- Personal data of OTHER people (colleagues, customers, family) — names tied to emails, health, performance, salaries, addresses (PII / GDPR-type exposure)
- Confidential or proprietary company information — internal strategy, unreleased products, roadmaps, financials, source code, credentials, security architecture, internal incident details
- Regulated or legally sensitive data — health records, legal matters under privilege, contracts under NDA, financial/customer records
- Secrets and credentials — API keys, passwords, tokens, private keys
For each, set "category" (e.g. "Colleague PII", "Company confidential", "Source code / IP", "Credentials", "Regulated data"), a "severity", a "detail" that describes WHAT TYPE of thing was shared WITHOUT restating the actual secret/value, and "guidance" with a short, constructive, non-judgemental tip on how to handle it safely next time. The goal is to educate and protect me, never to shame me. If nothing qualifies, return an empty array.

Put concrete identifiers (names, conditions) only in section findings. In "sensitiveCategories" name the category (e.g. "full name", "children's names", "medical condition") rather than the actual value, since that list is used on a publicly shareable card.

Keep the tone direct and a little unsettling, but factual. Output the JSON object and nothing else.`;
};
