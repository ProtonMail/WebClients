import { c, msgid } from 'ttag';

import type { ToolDefinition, ToolHandler } from '@proton/llm/lib/lumoAgent/contracts/types';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

import { isElementMessage } from 'proton-mail/helpers/elements';
import type { Element } from 'proton-mail/models/element';
import { selectParams } from 'proton-mail/store/elements/elementsSelectors';

import type { MessageBody } from '../../helpers/messages';
import {
    MAX_BODY_CHARS,
    createDecryptDeadline,
    decryptedMessagesFor,
    openInReadingPane,
    toMessageBody,
    truncateBody,
    withStepTimeout,
} from '../../helpers/messages';
import { resolveId } from '../../helpers/references';
import type { MailToolDeps, MailToolModule } from '../../toolModule';

const MAX_THREAD_MESSAGES = 30;

/** Whole-thread ceiling, shared out between the messages read: 30 × a single email's cap would swamp
 *  the context window on its own. */
const MAX_THREAD_CHARS = 24_000;

export interface ReadThreadParams {
    /** Any message in the thread, or null for the OPEN conversation. */
    target: string | null;
}

export interface ReadThreadResult {
    found: boolean;
    subject?: string;
    /** Oldest first, capped to the most recent {@link MAX_THREAD_MESSAGES}. */
    messages: MessageBody[];
    /** Exceeds `messages.length` when messages were dropped as older or unreadable, or never loaded at all. */
    total: number;
}

export const readThreadDefinition: ToolDefinition<ReadThreadParams, ReadThreadResult> = {
    name: 'read_thread',
    kind: 'read',
    toolDescription:
        'Read EVERY message in a whole conversation (thread), decrypting each one, so you can summarise it or catch the user up. Use this — NOT read_email or read_open_email — whenever the user asks about a whole thread or conversation ("summarise this thread", "catch me up on this conversation", "what\'s the latest here"): those other tools read only a SINGLE message, whereas a conversation usually has several. Pass the email-… reference of any message in the thread as `target` to read that conversation; pass null to read the conversation the user currently has OPEN in the reading pane. Reading a thread opens it on screen and may mark its unread messages as read. Returns each message\'s sender, date and body, oldest first. Returns nothing if no conversation is open, in which case find the thread yourself with search or view_emails and pass a `target`; ask the user to open one only if that fails. If it reports the messages could not be read yet, retry once before doing anything else.',
    paramsSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['target'],
        properties: { target: { type: ['string', 'null'] } },
    },
    examples: [
        {
            context:
                'The user has a conversation open in the reading pane and asks you to summarise the whole thread. Read the open conversation (no reference needed).',
            call: { target: null },
        },
        {
            context:
                'A previous search returned the row `email-a1b2c3 | … | Re: Project kickoff` and the user asks you to catch them up on that whole conversation. Read the thread that message belongs to.',
            call: { target: 'email-a1b2c3' },
        },
    ],
    serializeForLumo: (result) => {
        if (!result.found) {
            return 'No conversation is open to read.';
        }
        if (!result.messages.length) {
            return 'The conversation is open but its messages could not be read yet.';
        }
        const shown = result.messages.length;
        const subject = result.subject ?? '';
        const header =
            result.total > shown
                ? `Thread "${subject}" — reading the ${shown} most recent of ${result.total} messages:`
                : `Thread "${subject}" — ${shown} message${shown === 1 ? '' : 's'}:`;
        const perMessage = Math.min(MAX_BODY_CHARS, Math.floor(MAX_THREAD_CHARS / shown));
        const blocks = result.messages.map(
            (message) => `From ${message.from} (${message.date}):\n${truncateBody(message.body, perMessage)}`
        );
        return `${header}\n\n${blocks.join('\n\n---\n\n')}`;
    },
    summarizeChip: (_params, result) => {
        if (!result.found) {
            return { label: c('Info').t`No conversation to read` };
        }
        const count = result.messages.length;
        return {
            label: c('Info').ngettext(
                msgid`Read ${count} message in this thread`,
                `Read ${count} messages in this thread`,
                count
            ),
        };
    },
};

/**
 * Mail only decrypts what is expanded on screen, so the rest of a thread is metadata only. Each message
 * is decrypted through the same initialize path a `MessageView` drives, which is store/api-only and so
 * works unmounted. Side effect: decrypting marks unread messages read.
 */
export const createReadThreadHandler =
    (mail: MailToolDeps): ToolHandler<ReadThreadParams, ReadThreadResult> =>
    async ({ target }, { references }) => {
        const state = () => mail.store.getState();

        // A message element carries its ConversationID; a conversation element (grouped mode) IS the id.
        const resolveConversation = (): { conversationID?: string; targetElement?: Element } => {
            const id = target ? resolveId(target, references) : selectParams(state()).elementID;
            if (!id) {
                return {};
            }

            const element = state().elements.elements[id];
            if (element) {
                return {
                    conversationID: isElementMessage(element) ? element.ConversationID : id,
                    targetElement: target ? element : undefined,
                };
            }

            // With no element there is nothing to read the shape off, and guessing wrong fetches
            // conversations/{messageID} and reports the thread as empty. The message store may still know.
            const knownConversationID = state().messages[id]?.data?.ConversationID;
            if (knownConversationID) {
                return { conversationID: knownConversationID };
            }

            // Only an OPEN element is safe to assume is a conversation, and only when the view groups.
            const grouped = mail.getMailSettings()?.ViewMode === VIEW_MODE.GROUP;
            return !target && grouped ? { conversationID: id } : {};
        };

        const { conversationID, targetElement } = resolveConversation();
        if (!conversationID) {
            return { found: false, messages: [], total: 0 };
        }

        if (targetElement) {
            openInReadingPane(mail, targetElement);
        }

        // The conversation may hold only metadata, or be desynced (NumMessages !== stored Messages).
        const storedMessages = (): Message[] => state().conversations[conversationID]?.Messages ?? [];
        const numMessages = (): number | undefined => state().conversations[conversationID]?.Conversation?.NumMessages;
        const storedCount = storedMessages().length;
        const reportedCount = numMessages();
        if (!storedCount || (reportedCount !== undefined && storedCount !== reportedCount)) {
            try {
                // Bounded: this fetch sits outside the decrypt budget.
                await withStepTimeout(mail.loadConversation(conversationID));
            } catch {
                // Read whatever the store already holds rather than failing the whole thread on a bad fetch.
            }
        }

        const ordered = [...storedMessages()].sort((a, b) => (a.Time ?? 0) - (b.Time ?? 0));
        // The server count wins when the load left the store short, so the header says "the N most recent of M"
        // rather than presenting a partial thread as a complete one.
        const total = Math.max(ordered.length, numMessages() ?? 0);
        if (!ordered.length) {
            return { found: true, messages: [], total };
        }

        // Sequential under a shared budget; one failure is swallowed so the rest of the thread survives.
        // NEWEST first, so a budget that runs out drops the oldest — decrypting oldest-first would leave
        // the payload promising "the N most recent" while in fact holding the N oldest of the window.
        const toDecrypt = ordered.slice(-MAX_THREAD_MESSAGES);
        const { labelID } = selectParams(state());
        const outOfTime = createDecryptDeadline();
        for (const message of [...toDecrypt].reverse()) {
            if (outOfTime()) {
                break;
            }
            if (state().messages[message.ID]?.messageDocument?.initialized === true) {
                continue;
            }
            try {
                await withStepTimeout(mail.initializeMessage(message.ID, labelID));
            } catch {
                // A failed decrypt settles rather than rejects, so the drop happens below, not here.
            }
        }

        const decryptedByID = new Map(
            decryptedMessagesFor(mail.store, conversationID).map((message) => [message.data?.ID, message])
        );
        const readMessages = toDecrypt
            .map((message) => decryptedByID.get(message.ID))
            .filter((message): message is MessageState => !!message);
        const messages = readMessages.map(toMessageBody);

        const newest = readMessages[readMessages.length - 1];
        return { found: true, subject: newest?.data?.Subject || '(no subject)', messages, total };
    };

export const readThreadModule: MailToolModule = {
    definition: readThreadDefinition,
    createHandler: createReadThreadHandler,
};
