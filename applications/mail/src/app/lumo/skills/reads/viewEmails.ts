import { c, msgid } from 'ttag';

import type { ToolDefinition, ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';

import type { MailToolDeps, MailToolModule } from '../../toolModule';
import type { AgentEmailPage } from './rows';
import { BULK_ACTION_NOTE, buildAgentEmailRows, formatAgentEmailRows } from './rows';

export const viewEmailsDefinition: ToolDefinition<Record<string, never>, AgentEmailPage> = {
    name: 'view_emails',
    kind: 'read',
    toolDescription:
        'List the emails currently visible on the user\'s screen — metadata only (email-… reference, sender, subject, date, read/unread, folder, labels, attachment flag), never message bodies. Use when the user refers to what they can see ("these emails", "the ones on screen") or to triage the current view. To read an email\'s contents, call read_email with a reference instead. Returns the on-screen rows and a total count.',
    paramsSchema: { type: 'object', additionalProperties: false, required: [], properties: {} },
    serializeForLumo: (result) =>
        formatAgentEmailRows(result.rows, result.total) ||
        (result.bulkActionRunning ? BULK_ACTION_NOTE : 'No emails are currently shown on screen.'),
    summarizeChip: (_params, result) => {
        const count = result.rows.length;
        return {
            label: c('Info').ngettext(msgid`Read ${count} email on screen`, `Read ${count} emails on screen`, count),
        };
    },
};

/** Never navigates: what the model reads is what the user is already looking at. */
export const createViewEmailsHandler =
    (mail: MailToolDeps): ToolHandler<Record<string, never>, AgentEmailPage> =>
    async (_params, { references }) =>
        buildAgentEmailRows(mail, references);

export const viewEmailsModule: MailToolModule = {
    definition: viewEmailsDefinition,
    createHandler: createViewEmailsHandler,
};
