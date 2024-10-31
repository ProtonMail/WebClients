import { danger, fail, markdown, warn } from 'danger';

const matchWhitespaceAtStartOfLine = /^\s+/gm;

const inboxFilesTouched = danger.git.fileMatch(
    'applications/mail',
    'applications/calendar',
    'packages/activation',
    'packages/mail-store',
    'packages/calendar-store',
    'packages/ai-assistant',
    'packages/llm'
);

const driveFilesMatch = danger.git.fileMatch('applications/drive', 'packages/drive-store');
const driveFilesTouched =
    driveFilesMatch.created || driveFilesMatch.edited || driveFilesMatch.deleted || driveFilesMatch.modified;

/**
 * Fails if no assignee is provided.
 *
 * @param {Object} options - The options object.
 * @param {boolean} [options.disabled=false] - Indicates whether the check is disabled.
 * @returns {void}
 */
const failIfNoAssignees = ({ disabled = false }) => {
    if (disabled) return;

    if (!danger.gitlab.mr.assignees?.length) {
        fail('This pull request needs an assignee, and optionally include any reviewers.');
    }
};

/**
 * Fails if no description is provided.
 *
 * @param {Object} options - The options object.
 * @param {boolean} [options.disabled=false] - Indicates whether the check is disabled.
 * @returns {void}
 */
const failIfNoDescription = ({ disabled = false }) => {
    if (disabled) return;

    if (!danger.gitlab.mr.description) {
        fail('Merge request description is missing');
        markdown(
            `
            ## 🟠 Add an MR description

            Please consider adding a more [meaningful description](https://confluence.protontech.ch/display/~glinford/Writing+Meaningful+Merge+Request+Descriptions).
        `.replace(matchWhitespaceAtStartOfLine, '')
        );
    }
};

if (driveFilesTouched) {
    const expectedSection = [];

    if (!danger.gitlab.mr.description.includes('# Notes')) {
        expectedSection.push('`# Notes`');
    }

    if (!danger.gitlab.mr.description.includes('# Tests')) {
        expectedSection.push('`# Tests`');
    }

    if (!danger.gitlab.mr.description.includes('# Screenshots')) {
        expectedSection.push('`# Screenshots`');
    }

    if (expectedSection.length) {
        fail('Merge request description is missing required sections');
        markdown(`## 🔴 Merge request description is missing required sections`);
        markdown(`When modifying files in a 'drive' folder, the description must include:`);

        for (let i = 0; i < expectedSection.length; i++) {
            const section = expectedSection[i];
            markdown(section);
        }
    }
}

failIfNoDescription({ disabled: inboxFilesTouched || driveFilesTouched });
failIfNoAssignees({ disabled: inboxFilesTouched });

if (danger.gitlab.mr.title.includes('WIP') || danger.gitlab.mr.title.startsWith('Draft:')) {
    warn('PR is considered WIP');
}

if (danger.gitlab.mr.squash) {
    warn('Commits will be squashed');
}

const fileThresholdForLargePR = 200;
if (
    danger.git.created_files.length + danger.git.modified_files.length + danger.git.deleted_files.length >
    fileThresholdForLargePR
) {
    warn(
        'Merge Request size is pretty large. Consider splitting into separate MRs to enable a faster and easier review.'
    );
}
