import type { ProtonPluginSkill } from './types';

export const PRESENTATIONS_SKILLS: ProtonPluginSkill[] = [
    {
        name: 'slide-deck',
        description:
            'Build a presentation slide by slide, from an outline or a document, with a clear story and charts where they help. Use for "make slides", "turn this into a deck", or "I need to present…".',
        instructions: `# Slide deck

A deck with a story, not a document chopped into slides.

## Steps

1. **Agree the brief:** audience, goal, length and the one thing people should remember. Ask with a question card if unclear.
2. **Propose an outline** of slide titles that read as a story when read alone. Wait for the user's go-ahead before building, unless they asked for the deck straight away.
3. **Build the deck in the canvas as a presentation.** One idea per slide, the headline as a full sentence, three to five short bullets at most, and a chart where numbers are involved.
4. **Write speaker notes** inline after the deck if the user wants them.

## Rules

- Open with the conclusion or the ask, then support it.
- Use the user's numbers and facts only. Mark anything that needs checking.
- If the canvas isn't available, give the slide-by-slide outline as text instead.`,
    },
    {
        name: 'one-pager',
        description:
            'Write a polished one-page brief, proposal or summary that someone can read in two minutes. Use for "write a one-pager", "make a brief for…", or "summarize this for leadership".',
        instructions: `# One-pager

Everything a busy reader needs, on one page.

## Structure

1. **Title and a one-sentence summary.**
2. **Context:** why this matters now, in two or three sentences.
3. **The proposal or key findings,** in three to five bullets.
4. **Impact and cost:** numbers where you have them.
5. **Risks and open questions.**
6. **The ask or next steps,** with owners and dates.

## Steps

- Put the finished page in the canvas as a document.
- Keep it to about 400 words. If the material doesn't fit, move the detail to an appendix section rather than cutting the key points.

## Rules

- Lead with the conclusion. Use plain language and no jargon the reader wouldn't use.
- Use only facts the user provided or you can cite.`,
    },
    {
        name: 'interactive-explainer',
        description:
            'Explain a concept, process or idea with an interactive web page, using sliders, animations or a small simulation. Use for "show me how… works", "make this interactive", or teaching something visual.',
        instructions: `# Interactive explainer

Let the user play with an idea until it clicks.

## Steps

1. Identify the core mechanism and the one or two variables worth controlling, such as an interest rate, a speed or a sample size.
2. **Build it in the canvas as a web page:** a short explanation at the top, the interactive part in the middle (sliders, buttons, a step-through animation), and a note on what to try.
3. Keep it to one self-contained HTML file with inline CSS and JavaScript and no external resources or network requests.
4. After building it, suggest two or three things to try and what they show.

## Rules

- Get the model right before making it pretty. Use correct formulas and label units.
- Make it work with keyboard and mouse, and keep the text readable.
- Keep it focused: one concept per explainer.`,
    },
    {
        name: 'illustrate',
        description:
            'Create an image, illustration or visual concept for a slide, post or idea, and refine it. Use for "make an image of…", "illustrate this", or "I need a header image".',
        instructions: `# Illustrate

Get to the image the user has in mind in as few rounds as possible.

## Steps

1. **Pin down the brief:** subject, purpose (slide, social post, header), style (photo, flat illustration, sketch, 3D), mood, colors and aspect ratio. Ask with a question card if the request is vague.
2. **Generate the image** from a specific, detailed description of subject, composition, lighting and style.
3. **Refine on request.** When the user asks for changes, edit the existing image rather than starting over, and change one thing at a time.

## Rules

- Don't create images of real people in misleading or compromising situations, or anything that imitates a living artist's signature style.
- Avoid text inside images unless asked; it often renders badly. Suggest adding it afterwards instead.
- If image generation isn't available, write a detailed prompt the user can use elsewhere.`,
    },
];
