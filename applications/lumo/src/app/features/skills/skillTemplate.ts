import { c } from 'ttag';

import { LUMO_SHORT_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { buildSkillMarkdown } from './skillMarkdown';

/**
 * The starting body of a SKILL.md written by hand, laid out like the bundled skills: a title, the goal,
 * `## Steps` with bold lead-ins and `## Rules`. Each line says what to write there, so it reads as a template.
 */
export const getSkillInstructionsTemplate = (): string => {
    // translator: Placeholder heading of a new skill's instructions, replaced by the user with the skill's name.
    const title = c('collider_2025:Placeholder').t`Skill name`;
    // translator: Placeholder line in a new skill's instructions, asking the user to describe the skill's goal. ${LUMO_SHORT_APP_NAME} is the assistant's name.
    const goal = c('collider_2025:Placeholder').t`Describe what ${LUMO_SHORT_APP_NAME} should achieve with this skill.`;
    // translator: Section heading in a skill's instructions, followed by a numbered list of steps (noun).
    const stepsHeading = c('collider_2025:Placeholder').t`Steps`;
    // translator: Bold lead-in of the first example step in a new skill's instructions.
    const firstStep = c('collider_2025:Placeholder').t`First step.`;
    // translator: Placeholder text after "First step." in a new skill's instructions. ${LUMO_SHORT_APP_NAME} is the assistant's name.
    const firstStepDetail = c('collider_2025:Placeholder')
        .t`What ${LUMO_SHORT_APP_NAME} does first, and which details to ask for when they are missing.`;
    // translator: Bold lead-in of the second example step in a new skill's instructions.
    const nextStep = c('collider_2025:Placeholder').t`Next step.`;
    // translator: Placeholder text after "Next step." in a new skill's instructions.
    const nextStepDetail = c('collider_2025:Placeholder').t`Add one step per line, in order.`;
    // translator: Bold lead-in of the last example step in a new skill's instructions: the reply the assistant gives (noun).
    const answerStep = c('collider_2025:Placeholder').t`Answer.`;
    // translator: Placeholder text after "Answer." in a new skill's instructions.
    const answerStepDetail = c('collider_2025:Placeholder')
        .t`The format, length and tone of the result, such as a short reply, a table or an email.`;
    // translator: Section heading in a skill's instructions, followed by a list of rules (noun).
    const rulesHeading = c('collider_2025:Placeholder').t`Rules`;
    // translator: Placeholder rule in a new skill's instructions. ${LUMO_SHORT_APP_NAME} is the assistant's name.
    const rule = c('collider_2025:Placeholder')
        .t`Something ${LUMO_SHORT_APP_NAME} should always or never do, such as never inventing facts.`;

    return `# ${title}

${goal}

## ${stepsHeading}

1. **${firstStep}** ${firstStepDetail}
2. **${nextStep}** ${nextStepDetail}
3. **${answerStep}** ${answerStepDetail}

## ${rulesHeading}

- ${rule}
`;
};

/** The SKILL.md of a skill added to a skill set, in `skills/<folder>/`: frontmatter, then the template. */
export const getSubSkillMarkdownTemplate = (folderName: string): string => {
    // translator: Placeholder description of a skill added to a skill set, replaced by the user. Ends with an open example request.
    const description = c('collider_2025:Placeholder').t`What this skill does. Use when asked to …`;
    return buildSkillMarkdown({ name: folderName, description, instructions: getSkillInstructionsTemplate() });
};

/** The README.md of a skill set whose own SKILL.md had nothing of the user's yet. */
export const getSkillSetReadmeTemplate = (name: string, description: string): string => {
    // translator: Placeholder heading of a skill set's README file, used when the skill set has no name yet.
    const fallbackTitle = c('collider_2025:Placeholder').t`Skill set`;
    // translator: Placeholder line of a skill set's README file, asking the user to describe the skill set.
    const fallbackDescription = c('collider_2025:Placeholder')
        .t`What this skill set is for and which skills it includes.`;
    return `# ${name.trim() || fallbackTitle}\n\n${description.trim() || fallbackDescription}\n`;
};

/**
 * A `CONNECTORS.md` in the layout `parseConnectorsMarkdown` reads. The table headers stay in English, since
 * they are how the file is parsed.
 */
export const getConnectorsMarkdownTemplate = (): string => {
    // translator: Heading of a skill set's file listing the kinds of tools (connectors) its skills can use.
    const title = c('collider_2025:Placeholder').t`Connectors`;
    // translator: Intro of a skill set's connectors file. "~~email" is a code placeholder and must stay as is.
    const intro = c('collider_2025:Placeholder')
        .t`Skills refer to kinds of tools by placeholder, such as ~~email in a step. Add one row per kind of tool.`;
    return `# ${title}

${intro}

| Category | Placeholder | Included servers | Other options |
| --- | --- | --- | --- |
| Email | \`~~email\` | ${MAIL_APP_NAME} | |
`;
};
