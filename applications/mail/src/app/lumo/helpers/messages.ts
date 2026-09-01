import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

import { hasLabel, isElementMessage } from '../../helpers/elements';
import { convertCustomViewLabelsToAlmostAllMail } from '../../helpers/labels';
import { setParamsInLocation } from '../../helpers/mailboxUrl';
import { findMessageToExpand } from '../../helpers/message/messageExpandable';
import type { Element } from '../../models/element';
import { selectParams } from '../../store/elements/elementsSelectors';
import type { MailToolDeps, ToolStore } from '../toolModule';
import { formatSender, formatUnixDate } from './formatting';
import { waitForStoreState, withTimeout } from './storeWait';
import { toVisibleText } from './visibleText';

/** Caps one awaited step: a decrypt, or the conversation fetch. */
const STEP_TIMEOUT = 15_000;

/** Whole-read budget. Checked between steps, so a read can overrun it by one {@link STEP_TIMEOUT}. */
const DECRYPT_BUDGET = 30_000;

export const MAX_BODY_CHARS = 4000;

export const createDecryptDeadline = () => {
    const expiry = Date.now() + DECRYPT_BUDGET;
    return () => Date.now() > expiry;
};

/** Bound one step, so the budget between messages is not the only thing that can end the read. */
export const withStepTimeout = (work: Promise<unknown>): Promise<void> => withTimeout(work, STEP_TIMEOUT);

export interface MessageBody {
    from: string;
    date: string;
    body: string;
}

export interface DecryptedMessage extends MessageBody {
    subject: string;
}

type MessageDeps = Pick<MailToolDeps, 'store' | 'history' | 'getMailSettings'>;

/**
 * Oldest first — the store is keyed by id, so its own order is whenever each message was fetched.
 * `initialized` is the real check: a `messageDocument` appears mid-decrypt and reads as empty text.
 */
export const decryptedMessagesFor = (store: ToolStore, id: string): MessageState[] =>
    Object.values(store.getState().messages)
        .filter(
            (message): message is MessageState =>
                !!message?.data &&
                (message.data.ConversationID === id || message.data.ID === id) &&
                message.messageDocument?.initialized === true
        )
        .sort((a, b) => (a.data?.Time ?? 0) - (b.data?.Time ?? 0));

/**
 * Mirrors `ConversationView`'s default filter: a conversation shows either its trashed messages or its
 * non-trashed ones, never both, so the message it expands is picked from that subset. Its third arm,
 * `isSearchResult`, needs the Encrypted Search context and so cannot be reached from a tool.
 */
const messagesInLocation = (messages: Message[], labelID: string): Message[] => {
    if (labelID === MAILBOX_LABEL_IDS.ALL_MAIL) {
        return messages;
    }

    const inTrash = labelID === MAILBOX_LABEL_IDS.TRASH;
    return messages.filter((message) => inTrash === hasLabel(message, MAILBOX_LABEL_IDS.TRASH));
};

/**
 * Mirrors `ConversationView`: the message a conversation opens on is NOT simply the newest — an older unread
 * one is expanded ahead of it, and drafts are skipped entirely.
 */
const expandedMessageIDFor = (store: ToolStore, conversationID: string): string | undefined => {
    const messages = store.getState().conversations[conversationID]?.Messages;
    if (!messages?.length) {
        return undefined;
    }

    const labelID = convertCustomViewLabelsToAlmostAllMail(selectParams(store.getState()).labelID);

    return findMessageToExpand(
        labelID,
        [...messagesInLocation(messages, labelID)].sort((a, b) => a.Time - b.Time)
    )?.ID;
};

/**
 * The message a read of `id` means, or undefined while that is not yet knowable: `id` itself when it names a
 * message, otherwise whichever message the reading pane expands for that conversation. Accepting any
 * decrypted member of the conversation instead let a sibling left over from an earlier read answer first, so
 * the same call returned a different body depending on session history.
 */
const resolveRead = (store: ToolStore, id: string): MessageState | undefined => {
    const decrypted = decryptedMessagesFor(store, id);
    const exact = decrypted.find((message) => message.data?.ID === id);
    if (exact) {
        return exact;
    }

    const expandedID = expandedMessageIDFor(store, id);
    if (!expandedID) {
        return undefined;
    }

    return decrypted.find((message) => message.data?.ID === expandedID);
};

/** Resolves UNDEFINED on timeout, so the caller reports the email as unreadable rather than hanging. */
export const readDecryptedMessage = (store: ToolStore, id: string): Promise<MessageState | undefined> =>
    waitForStoreState(store, () => resolveRead(store, id), STEP_TIMEOUT);

/**
 * Mirrors `useElementActions.handleElement`: with grouping on, a message must be opened via its
 * conversation + messageID, or the router fetches `conversations/{messageId}` and 422s.
 */
export const openInReadingPane = (deps: MessageDeps, element: Element) => {
    const labelID = convertCustomViewLabelsToAlmostAllMail(selectParams(deps.store.getState()).labelID);
    const grouped = deps.getMailSettings()?.ViewMode === VIEW_MODE.GROUP;
    const openParams =
        grouped && isElementMessage(element)
            ? { labelID, elementID: element.ConversationID, messageID: element.ID }
            : { labelID, elementID: element.ID };
    deps.history.push(setParamsInLocation(deps.history.location, openParams));
};

export const toMessageBody = (message: MessageState): MessageBody => ({
    from: formatSender([message.data?.Sender]),
    date: formatUnixDate(message.data?.Time),
    body: toVisibleText(message),
});

export const toDecryptedMessage = (message: MessageState): DecryptedMessage => ({
    subject: message.data?.Subject || '(no subject)',
    ...toMessageBody(message),
});

export const truncateBody = (text: string, limit = MAX_BODY_CHARS): string =>
    text.length > limit ? `${text.slice(0, limit)}\n… (truncated, ${text.length - limit} more characters)` : text;
