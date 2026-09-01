import { c } from 'ttag';

import type { ToolDefinition, ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';

import { selectParams } from '../../../store/elements/elementsSelectors';

import type { DecryptedMessage } from '../../helpers/messages';
import { readDecryptedMessage, toDecryptedMessage, truncateBody } from '../../helpers/messages';
import type { MailToolDeps, MailToolModule } from '../../toolModule';

export interface ReadOpenEmailResult {
    isOpen: boolean;
    /** Absent when nothing is open, or when it has not decrypted yet. */
    email?: DecryptedMessage & { reference: string };
}

export const readOpenEmailDefinition: ToolDefinition<Record<string, never>, ReadOpenEmailResult> = {
    name: 'read_open_email',
    kind: 'read',
    toolDescription:
        'Read the decrypted body of the email the user currently has OPEN in the reading pane — no reference needed. This is the right tool whenever the user refers to "this email" / "the email I have open" / "tell me about this" / "should I reply?" without having listed or searched emails first. Prefer it over read_email when the reference is to the currently-open message. Returns nothing if no email is open, in which case find the email yourself with view_emails or search; ask the user to open one only if that fails. If it reports the body could not be read yet, retry once before doing anything else.',
    paramsSchema: { type: 'object', additionalProperties: false, required: [], properties: {} },
    serializeForLumo: (result) => {
        if (!result.isOpen) {
            return 'No email is currently open on screen.';
        }
        if (!result.email) {
            return 'An email is open but its body could not be read yet.';
        }
        const { reference, subject, from, date, body } = result.email;
        return `Open email ${reference} — "${subject}" from ${from} (${date}):\n${truncateBody(body)}`;
    },
    summarizeChip: (_params, result) => {
        if (!result.isOpen) {
            return { label: c('Info').t`No email open` };
        }
        const subject = result.email?.subject || '';
        return { label: c('Info').t`Read open email “${subject}”` };
    },
};

/**
 * Reads from the routing params rather than the list, so it still works when the mailbox behind it has
 * not loaded (e.g. a deep-link open), where view_emails would report nothing. `messageID` first: with
 * grouping on, the open element is the whole CONVERSATION, and "this email" means the expanded message.
 */
export const createReadOpenEmailHandler =
    (mail: MailToolDeps): ToolHandler<Record<string, never>, ReadOpenEmailResult> =>
    async (_params, { references }) => {
        const { elementID, messageID } = selectParams(mail.store.getState());
        const id = messageID || elementID;
        if (!id) {
            return { isOpen: false };
        }

        const decrypted = await readDecryptedMessage(mail.store, id);
        if (!decrypted) {
            return { isOpen: true };
        }

        const email = toDecryptedMessage(decrypted);
        return {
            isOpen: true,
            email: { reference: references.referenceFor('email', id, { title: email.subject }), ...email },
        };
    };

export const readOpenEmailModule: MailToolModule = {
    definition: readOpenEmailDefinition,
    createHandler: createReadOpenEmailHandler,
};
