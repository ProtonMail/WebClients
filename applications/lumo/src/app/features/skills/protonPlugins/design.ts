import { UNTRUSTED_CONTENT } from './shared';
import type { ProtonPluginSkill } from './types';

const FROM_SCREENSHOTS =
    "Work from what you can see: screenshots, exported images, pasted HTML or a page you can read. Say when something can't be judged from a static image, such as motion, hover states or real keyboard behaviour.";

export const DESIGN_SKILLS: ProtonPluginSkill[] = [
    {
        name: 'design-critique',
        description:
            'Give structured feedback on a screen, mockup or page: first impression, usability, visual hierarchy, consistency and accessibility, with fixes ranked by impact. Use for "what do you think of this design?" or when a screenshot is shared for review.',
        instructions: `# Design critique

Feedback a designer can act on today.

## Steps

1. **Get the context:** what the screen is for, who uses it, the one thing they should do here, and the stage (early exploration, refinement or final polish). Feedback for a sketch is different from feedback for a release candidate.
2. **First impression, in two seconds:** what draws the eye first, whether that's the right thing, and whether the purpose is obvious.
3. **Review it in this order:**
   - **Usability:** can the user reach their goal? Are actions obvious, labels clear and steps necessary?
   - **Hierarchy:** reading order, emphasis, whitespace, and type scale.
   - **Consistency:** spacing, colours, components and patterns that should match but don't.
   - **Accessibility:** contrast, target sizes, text size, and meaning carried by colour alone.
4. **Rank the findings** as **Critical** (blocks the goal), **Moderate** (slows people down) or **Polish**. For each, say where it is, why it matters for the user, and a concrete fix.
5. **Say what works,** specifically, so it survives the next iteration.

## Output

A one-line overall verdict, a findings table (area, finding, severity, fix), what's working, and the three changes that would help most.

## Rules

- Be specific: "the primary button competes with the navigation", not "the layout feels busy".
- Tie every point to the user's goal or a design principle, not personal taste.
- ${FROM_SCREENSHOTS}`,
    },
    {
        name: 'accessibility-review',
        description:
            'Audit a design or web page against WCAG 2.2 AA: contrast, text size, target size, focus order, labels, headings and alt text, with each issue mapped to a guideline and a fix. Use for "is this accessible?" or before launch.',
        instructions: `# Accessibility review

Find the barriers before your users do.

## Steps

1. **Confirm the scope:** the screens or page, the platform (web, iOS, Android) and the target (WCAG 2.2 AA unless the user says otherwise).
2. **Check what you can see:**
   - **Contrast:** body text needs 4.5:1, large text and interface parts 3:1. Estimate from the image and say it's an estimate; give the colour values when known.
   - **Text:** size, line length and spacing, and whether it would survive zooming to 200%.
   - **Targets:** interactive elements at least 24 by 24 CSS pixels, with 44 by 44 recommended on touch.
   - **Colour alone:** errors, status and links must not rely only on colour.
   - **Structure:** a logical heading order, landmarks, and a sensible reading and focus order.
   - **Labels:** every input has a visible label, icon-only buttons have an accessible name, and images have meaningful alt text or are marked decorative.
   - **Feedback:** error messages say what went wrong and how to fix it.
3. **With HTML or a readable page,** also check semantics: buttons versus links, form labels, ARIA used correctly (or not needed), and alt attributes.
4. **Map each issue** to its WCAG success criterion, severity (blocker, serious, minor) and the fix.

## Output

A summary with counts by severity, an issues table (location, issue, WCAG criterion, severity, fix), and a short list of what to test with a real screen reader and keyboard, because a visual review can't confirm those.

## Rules

- ${FROM_SCREENSHOTS}
- Never claim a page is fully compliant. An automated or visual review finds many issues, not all.
- ${UNTRUSTED_CONTENT}`,
    },
    {
        name: 'ux-copy',
        description:
            'Write or improve interface text: button labels, error messages, empty states, confirmations, onboarding and tooltips, with options and the reasoning behind them. Use for "what should this button say?" or "review this error message".',
        instructions: `# UX copy

Words that help people get things done, then get out of the way.

## Steps

1. **Understand the moment:** where the text appears, what the user is trying to do, what they know at this point, and what happens next. Ask for the product's voice or style guide if there is one.
2. **Write two or three options** for each piece of text, and recommend one with a short reason.
3. **Follow the patterns:**
   - **Buttons:** start with a verb that says what happens ("Save changes", "Delete project"), not "OK" or "Submit".
   - **Errors:** say what happened, why if it helps, and how to fix it. Never blame the user, never show raw error codes alone.
   - **Empty states:** explain what will appear here and give one clear action to get started.
   - **Confirmations:** name the action and its consequence ("Delete 3 files? You can't undo this."), and make the buttons match ("Delete files" and "Cancel").
   - **Success messages:** short, specific and only when the result isn't already visible.
4. **Check the set** for consistency: the same thing always has the same name, and capitalization and tone match across screens.

## Output

A table (location, current text, recommended text, alternatives, why), plus any terms to standardize across the product.

## Rules

- Plain language, short sentences, no jargon. Front-load the important words.
- Keep translation in mind: avoid idioms and wordplay, and leave room for longer languages.
- Write for screen readers too: link and button text must make sense out of context.`,
    },
    {
        name: 'design-handoff',
        description:
            'Turn a finished design into a developer handoff spec: layout, spacing, type and colour tokens, components and their states, responsive behaviour, edge cases and interactions. Use when a design is ready for engineering.',
        instructions: `# Design handoff

A spec that answers developers' questions before they ask them.

## Steps

1. **Get the inputs:** the final screens (screenshots or exports), the design system or tokens in use, the target platforms and the breakpoints.
2. **Describe the layout:** the grid, regions and how they're arranged, spacing using the system's spacing scale, and alignment rules.
3. **List the tokens:** typography styles, colours and radii by their token names where a design system exists, with values when not.
4. **List the components:** each one with its variant and props, and whether it's an existing component or new.
5. **Define every state:** default, hover, focus, active, disabled, loading, empty, error and success, for each interactive element. Point out states the design doesn't show.
6. **Responsive behaviour:** what reflows, stacks, hides or truncates at each breakpoint.
7. **Edge cases:** very long text and names, missing images, zero, one and many items, slow networks and errors.
8. **Interactions and motion:** what triggers what, transitions with duration and easing, and the reduced-motion alternative.
9. **Accessibility notes:** focus order, accessible names, keyboard shortcuts and announcements.

## Output

A canvas document following the sections above, plus a list of open questions for the designer.

## Rules

- Prefer design-system components and tokens over custom values, and flag any one-off value.
- Mark anything you inferred rather than saw, so the designer can confirm it.
- ${FROM_SCREENSHOTS}`,
    },
    {
        name: 'research-plan',
        description:
            'Plan user research: the questions to answer, the right method, who to recruit, and a ready-to-use interview guide, usability test script or survey. Use for "help me plan user interviews", "usability test", or "write a survey".',
        instructions: `# Research plan

Research that answers the question the team actually has.

## Steps

1. **Start from the decision:** what the team needs to decide and what they'd do differently depending on the answer. Turn it into three to five research questions.
2. **Choose the method** and say why: interviews to understand needs and context, usability tests to see where a design fails, surveys to measure how common something is, or a mix.
3. **Plan the recruiting:** who to talk to, screening criteria, how many (five to eight for interviews or usability tests per segment), and incentives.
4. **Write the materials:**
   - **Interview guide:** warm-up, open questions about past behaviour ("tell me about the last time…"), follow-up prompts, and wrap-up. No leading or hypothetical questions.
   - **Usability test script:** realistic tasks with a starting point and a success criterion each, what to observe, and post-task questions.
   - **Survey:** short, one idea per question, balanced answer scales, and an optional open question at the end.
5. **Plan the analysis:** how notes will be captured and how findings will be shared.

## Output

A canvas document: goal and decision, research questions, method, participants and screener, the guide or script or survey, a timeline, and a consent note.

## Rules

- Ask about what people did, not what they would do.
- Collect only the personal data the study needs, get consent, and say how it will be stored and deleted.`,
    },
];
