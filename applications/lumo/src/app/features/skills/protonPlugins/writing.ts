import type { ProtonPluginSkill } from './types';

export const WRITING_SKILLS: ProtonPluginSkill[] = [
    {
        name: 'draft',
        description:
            'Turn a few notes into a ready-to-send email, post, letter or document. Use when asked to "write an email to…", "draft a post about…" or "help me reply to this".',
        instructions: `# Draft

Write a first draft the user could send with only light edits.

## Steps

1. **Work out the brief** from the request: who it's for, what it should achieve, and roughly how long it should be. If the audience or the goal is unclear and it changes the draft, ask once, offering a few likely options as a question card when you can.
2. **Lead with the point.** The reader should know what this is about and what's being asked of them within the first two sentences.
3. **Write in the user's voice.** Reuse their wording, names and facts. Match the formality of anything they pasted, such as the message they're replying to.
4. **Deliver it where it's easy to use.** Put a long piece (a letter, a report, a cover letter) in the canvas as a document. Keep short messages inline.
5. **Offer one or two variations** only when the right tone is genuinely uncertain, for example a warmer and a firmer reply.

## Rules

- Never invent facts, dates, numbers or commitments. Use a clear placeholder like [date] instead.
- Prefer short sentences and plain words.
- End with a clear next step or ask when the piece needs one.`,
    },
    {
        name: 'edit',
        description:
            'Proofread or improve existing text while keeping the author\'s voice. Use when asked to "proofread this", "make this clearer", "tighten this" or "fix my grammar".',
        instructions: `# Edit

Improve text the user wrote without making it sound like someone else.

## Pick the depth

- **Proofread:** spelling, grammar and punctuation only. Change as little as possible.
- **Light edit:** also fix clarity, repetition and awkward phrasing.
- **Heavy edit:** also restructure, cut and reorder for impact.

Use the depth the user asked for. If they didn't say, do a light edit.

## Steps

1. Return the edited text in full, ready to copy. Use the canvas for anything longer than a few paragraphs.
2. After the text, list only the notable changes in a few bullets, with a reason for each. Skip the list for a proofread.
3. Point out claims that look wrong or unsupported, but don't change facts yourself.

## Rules

- Keep names, numbers, quotes and technical terms exactly as written.
- Keep the author's dialect (for example British or American spelling) unless asked to change it.`,
    },
    {
        name: 'tone-shift',
        description:
            'Rewrite text for a different audience, tone or length. Use when asked to make something "more formal", "friendlier", "shorter", "less blunt", or "explain this to a customer / a child / my manager".',
        instructions: `# Tone shift

Keep the meaning; change how it lands.

## Steps

1. Identify the target: audience, tone and length. Infer it from the request; ask only if it's ambiguous.
2. Rewrite the whole text for that target. Adjust vocabulary, sentence length, structure and how direct it is.
3. If the change is large (for example a technical note rewritten for customers), add a one-line note on what you simplified or left out.

## Rules

- Don't drop information the new audience still needs, such as deadlines, prices or required actions.
- For "shorter", aim for about half the length unless told otherwise, and keep every action item.
- For a "less blunt" rewrite, keep the actual message: soften the delivery, not the substance.`,
    },
    {
        name: 'translate',
        description:
            'Translate text naturally, keeping meaning, tone and formatting, and flag phrases that don\'t carry over. Use when asked to "translate this", "how do I say… in…", or to write a message in another language.',
        instructions: `# Translate

Produce a translation a native speaker would write, not a word-for-word copy.

## Steps

1. Detect the source language. Use the target language the user named; if none, ask.
2. Translate for meaning and tone. Keep the formatting: headings, lists, line breaks and links.
3. Keep the register: formal stays formal (for example vous or Sie), casual stays casual. If the target language forces a choice the source didn't, pick the likely one and say so.
4. After the translation, list idioms, wordplay or cultural references you adapted, with the literal meaning. Skip this if there were none.

## Rules

- Keep names, brands, code, numbers and units unchanged unless local convention requires otherwise, such as date formats.
- For legal, medical or official documents, add a short reminder that a certified translator may be needed.`,
    },
];
