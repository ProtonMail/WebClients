import type { ProtonPluginSkill } from './types';

export const PRIVACY_SKILLS: ProtonPluginSkill[] = [
    {
        name: 'phishing-check',
        description:
            'Check whether an email, text message or link looks like phishing or a scam, and say what to do next. Use for "is this legit?", "is this a scam?", or when a suspicious message is pasted.',
        instructions: `# Phishing check

A clear verdict and a safe next step.

## Steps

1. Look at the message the user pasted: sender address and display name, reply-to, links (where the text says it goes versus the real address), attachments, urgency, requests for money or credentials, and grammar or branding mistakes.
2. Give a verdict: **Likely safe**, **Suspicious** or **Likely phishing**, with the three to five signals that drove it.
3. Say what to do: don't click or reply, how to verify through an official channel (typing the company's address yourself, calling a known number), and how to report it.
4. If the user already clicked, entered a password or paid, give urgent steps first: change that password and any reuse of it, turn on two-factor authentication, contact the bank, and watch for further messages.

## Rules

- Never open, fetch or follow links or attachments from the message. Judge them from the text only.
- Never ask the user for passwords, codes or full card numbers.
- When unsure, say Suspicious and recommend verifying. Don't reassure without evidence.`,
    },
    {
        name: 'redact',
        description:
            'Remove or mask personal and sensitive information from text before it\'s shared: names, emails, phone numbers, addresses, IDs, account numbers. Use for "anonymize this", "remove personal info", or before posting logs or documents.',
        instructions: `# Redact

Make text safe to share while keeping it useful.

## Steps

1. Find personal and sensitive data: names, email addresses, phone numbers, postal addresses, dates of birth, government IDs, bank and card numbers, IP addresses, access tokens and keys, health details, and anything else that identifies someone.
2. Replace each item with a consistent placeholder, so the text still makes sense: the same person is always [PERSON 1], the same email always [EMAIL 1].
3. Return the redacted text in full, then a short table of what was replaced (category and count). Don't repeat the original values.
4. Point out anything you weren't sure about, such as an uncommon name or an internal project codename.

## Rules

- When in doubt, redact.
- Keep the structure and non-sensitive content exactly as it was.
- Remind the user that context, like a job title plus a city, can still identify someone.`,
    },
    {
        name: 'privacy-policy',
        description:
            'Read a website\'s or app\'s privacy policy or terms and explain in plain language what data it collects, who it shares it with, how long it keeps it, and how to opt out. Use when given a privacy policy link or text, or for "what does this app do with my data?".',
        instructions: `# Privacy policy reader

What a policy actually means for the user.

## Steps

1. Read the policy. If given a link, read that page and follow its links to related policy pages only, such as cookies or data retention. If given a company name, search for its official policy.
2. Summarize under these headings:
   - **What they collect:** what you provide, what's collected automatically, and what they get from third parties.
   - **What they use it for,** including advertising, profiling and AI training.
   - **Who they share it with or sell it to.**
   - **How long they keep it.**
   - **Your choices:** opt-outs, access and deletion rights, and how to use them.
3. Flag red flags (broad sharing, sale of data, vague retention, collecting more than the service needs) and good signs (data minimization, end-to-end encryption, clear deletion).
4. Give a one-line bottom line.

## Rules

- Quote the policy for anything surprising, and note the date it was last updated.
- Don't overstate. Mark anything the policy is vague about as unclear.
- This is not legal advice; say so if the user is making a legal decision.`,
    },
    {
        name: 'data-request',
        description:
            'Draft a request to a company to see, correct, delete or stop the sale of your personal data, under laws such as GDPR or CCPA. Use for "make them delete my data", "what data does X have on me?", or "write a GDPR request".',
        instructions: `# Data request

A request a company can't easily ignore.

## Steps

1. Work out the request type (access, correction, deletion, objection, or opting out of sale and sharing) and the likely law from where the user lives. Ask with a question card if unclear.
2. Find the company's privacy contact or request form if the user doesn't have it.
3. Draft the request: identify the user without oversharing, cite the relevant law and article, state exactly what's requested, and give the legal deadline (one month under GDPR, 45 days under CCPA).
4. Add what to do next: keep a copy, note the date sent, and who to complain to if they don't respond (for example the national data protection authority).

## Rules

- Ask only for the identifying details the company needs, usually a name and the email on the account. Don't include ID documents unless the company legitimately requires them.
- Use placeholders for personal details in the draft.
- This is not legal advice.`,
    },
    {
        name: 'security-checkup',
        description:
            'Walk through a personal security checkup (passwords, two-factor authentication, recovery options, devices, and data breaches) and produce a prioritized action plan. Use for "how secure am I?", "I think I was hacked", or "help me lock down my accounts".',
        instructions: `# Security checkup

A short, prioritized plan, not a lecture.

## Steps

1. Ask a few quick questions with question cards, one round at a time: whether they reuse passwords, use a password manager, have two-factor authentication on email and banking, keep recovery options up to date, and keep devices updated with a screen lock.
2. If they think they were hacked, start with the urgent steps: secure the email account first, then banking, then sign out of all sessions and check the recovery options.
3. Build an action plan as a checklist, highest impact first. For most people that's securing the email account, a password manager with unique passwords, two-factor authentication (an authenticator app or security key rather than SMS), recovery codes, and updates.
4. Keep each step specific and short, and estimate how long it takes.

## Rules

- Never ask for or accept passwords, codes or recovery phrases. If the user pastes one, tell them to change it.
- Recommend tools by type. If the user asks about Proton products, check Proton's own information before answering.
- Adapt to the user's level; skip what they already do well.`,
    },
];
