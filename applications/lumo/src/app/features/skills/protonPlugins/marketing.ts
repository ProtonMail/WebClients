import { MISSING_IS_NOT_ZERO, OWN_VOICE, UNTRUSTED_CONTENT } from './shared';
import type { ProtonPluginSkill } from './types';

export const MARKETING_SKILLS: ProtonPluginSkill[] = [
    {
        name: 'campaign-plan',
        description:
            'Plan a marketing campaign end to end: goal, audience, message, channels, a content calendar and how to measure it. Use for "plan a launch", "campaign for X", or a seasonal or lead-generation push.',
        instructions: `# Campaign plan

A campaign brief a small team can execute next week.

## Steps

1. **Pin down the basics** with a question card: what's being promoted, the goal (with a number), the audience, budget, dates and the channels the user already has.
2. **Define the audience:** who they are, what they want, what stops them buying, and where they spend time.
3. **Write the message:** one core message in a sentence, three supporting points with proof, and the call to action.
4. **Pick the channels** that fit the audience and budget, and say why each earns its place. Fewer channels done well beat many done badly.
5. **Build the content calendar** as a table: date, channel, content piece, owner and status. Include the run-up, the launch and the follow-up.
6. **Set the measures:** one main metric tied to the goal, two or three supporting metrics, and when to check them.

## Output

A canvas document: goal, audience, message, channels, calendar table, budget split, metrics and risks. Offer to draft the first pieces of content.

## Rules

- Keep the plan within the stated budget and team size.
- Mark assumptions, such as expected conversion rates, as assumptions.`,
    },
    {
        name: 'email-sequence',
        description:
            'Design and write a sequence of marketing emails (welcome, nurture, launch or win-back) with full copy, timing and what each email should achieve. Use for "write a welcome series", "nurture emails", or "re-engage old customers".',
        instructions: `# Email sequence

A sequence where every email has a job.

## Steps

1. **Clarify the sequence:** its type (welcome, nurture, launch, win-back), who receives it, what triggers it, and the one action that counts as success.
2. **Map it out** as a table before writing: email number, send timing (for example day 0, day 2, day 5), its job, and the exit condition (for example "stops when they buy").
3. **Write each email:**
   - A subject line under 50 characters, plus one alternative to test.
   - Preview text that adds to the subject.
   - A body with one idea and one call to action, short paragraphs, and mobile-friendly formatting.
4. **Check the flow:** each email builds on the last, nothing repeats, and the pressure rises gently.

## Output

The sequence map, then each email in full, then what to measure (open rate, click rate, conversion) and what to test first.

## Rules

- Include an unsubscribe reminder and never suggest buying lists or emailing people who didn't opt in.
- No fake urgency or misleading subject lines.
- ${OWN_VOICE}`,
    },
    {
        name: 'seo-audit',
        description:
            'Audit a website for search and AI-answer visibility: on-page issues, content gaps against competitors and a prioritized fix list. Use for "why don\'t we rank?", "SEO audit of our site", or before a content plan.',
        instructions: `# SEO audit

Find what's stopping the right people from finding the site, and fix the biggest things first.

## Steps

1. **Get the site and the goal:** the URL, the main pages that matter, the audience, and the searches they'd want to be found for. Suggest target searches if the user isn't sure.
2. **Check the key pages** by reading them: titles and meta descriptions, one clear H1, heading structure, whether the content answers the search, internal links, image alt text, and obvious speed or mobile issues.
3. **Check AI-answer readiness:** clear, quotable answers to common questions, an FAQ where useful, facts stated plainly, and consistent business details.
4. **Compare with competitors:** search the target terms and look at who ranks. Note what their pages cover that the user's don't.
5. **Find content gaps:** questions the audience asks that no page answers.

## Output

A prioritized fix list as a table (issue, page, why it matters, fix, effort), new content ideas with target searches, and rewritten titles and descriptions for the top pages.

## Rules

- You can read pages but not see rankings data or analytics. Say so, and suggest checking the free tools from the search engines for real numbers.
- ${MISSING_IS_NOT_ZERO}
- ${UNTRUSTED_CONTENT}`,
    },
    {
        name: 'brand-check',
        description:
            'Review a draft against your brand voice and style guide, flag what is off by severity and suggest before-and-after fixes. Use for "does this sound like us?", before publishing, or to create a simple voice guide.',
        instructions: `# Brand check

Make everything sound like it came from the same company.

## Steps

1. **Get the standard:** the user's style guide, or two or three pieces they consider on-brand. With neither, offer to build a short voice guide first: three voice traits with "this, not that" examples, words to use and avoid, and formatting rules.
2. **Review the draft** against it: voice and tone, words to avoid, claims that need proof, consistency in names and capitalization, accessibility (plain language, link text, alt text), and the call to action.
3. **Flag issues** by severity: **Must fix** (off-brand, inaccurate or risky claims), **Should fix** (tone drift) and **Polish**.
4. **Show before and after** for each flag, quoting the original text.

## Output

A one-line verdict, the flagged issues table (quote, issue, severity, suggested rewrite), then the fully revised draft.

## Rules

- Keep the author's meaning. Fix the voice, don't rewrite the message.
- Flag any claim (fastest, best, #1, guaranteed) that needs evidence.`,
    },
];
