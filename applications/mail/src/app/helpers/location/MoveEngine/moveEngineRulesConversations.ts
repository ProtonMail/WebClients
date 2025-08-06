import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { isConversation } from 'proton-mail/helpers/elements';
import { type Conversation } from 'proton-mail/models/conversation';

import { ERROR_ELEMENT_NOT_CONVERSATION, type MoveEngineRule, MoveEngineRuleResult } from './moveEngineInterface';

const getContextNumMessages = (conversation: Conversation, labelID: string) => {
    const label = conversation.Labels?.find(({ ID }) => ID === labelID);
    return label?.ContextNumMessages || 0;
};

// Any conversation can move to INBOX
// Sent or drafts messages cannot move to INBOX, but they will be moved to SENT or DRAFTS if they are not already there
export const conversationInboxRules: MoveEngineRule = ({ element }) => {
    if (!isConversation(element)) {
        throw new Error(ERROR_ELEMENT_NOT_CONVERSATION);
    }

    return MoveEngineRuleResult.ALLOWED;
};

// Any conversation can move to ALL_DRAFTS
// Sent or received messages cannot move to ALL_DRAFTS, but they will be moved to SENT or INBOX if they are not already there
export const conversationAllDraftRules: MoveEngineRule = ({ element }) => {
    if (!isConversation(element)) {
        throw new Error(ERROR_ELEMENT_NOT_CONVERSATION);
    }

    return MoveEngineRuleResult.ALLOWED;
};

// Any conversation can move to ALL_SENT
// Received or drafts messages cannot move to ALL_SENT, but they will be moved to INBOX or DRAFTS if they are not already there
export const conversationAllSentRules: MoveEngineRule = ({ element }) => {
    if (!isConversation(element)) {
        throw new Error(ERROR_ELEMENT_NOT_CONVERSATION);
    }

    return MoveEngineRuleResult.ALLOWED;
};

// Any conversation can move to TRASH. If all messages are already in TRASH, do nothing.
export const conversationTrashRules: MoveEngineRule = ({ element }) => {
    if (!isConversation(element)) {
        throw new Error(ERROR_ELEMENT_NOT_CONVERSATION);
    }

    if (!element.Labels) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    const conversationNumMessages = element.NumMessages;

    if (getContextNumMessages(element, MAILBOX_LABEL_IDS.TRASH) === conversationNumMessages) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    return MoveEngineRuleResult.ALLOWED;
};

// Any conversation can move to SPAM. If all messages are already in SPAM, do nothing.
export const conversationSpamRules: MoveEngineRule = ({ element }) => {
    if (!isConversation(element)) {
        throw new Error(ERROR_ELEMENT_NOT_CONVERSATION);
    }

    if (!element.Labels) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    const conversationNumMessages = element.NumMessages || 0;

    if (getContextNumMessages(element, MAILBOX_LABEL_IDS.SPAM) === conversationNumMessages) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    return MoveEngineRuleResult.ALLOWED;
};

/**
 * No messages can be moved to the all mail label
 * It's part of `LABELS_UNMODIFIABLE_BY_USER`
 *
 * @returns NOT_APPLICABLE
 */
export const conversationAllMailRules: MoveEngineRule = () => {
    return MoveEngineRuleResult.NOT_APPLICABLE;
};

// Any conversation can move to STARRED. If all messages are already in STARRED, do nothing.
export const conversationStarredRules: MoveEngineRule = ({ element }) => {
    if (!isConversation(element)) {
        throw new Error(ERROR_ELEMENT_NOT_CONVERSATION);
    }

    if (!element.Labels) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    const conversationNumMessages = element.NumMessages;

    if (getContextNumMessages(element, MAILBOX_LABEL_IDS.STARRED) === conversationNumMessages) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    return MoveEngineRuleResult.ALLOWED;
};

// Any conversation can move to ARCHIVE. If all messages are already in ARCHIVE, do nothing.
export const conversationArchiveRules: MoveEngineRule = ({ element }) => {
    if (!isConversation(element)) {
        throw new Error(ERROR_ELEMENT_NOT_CONVERSATION);
    }

    if (!element.Labels) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    const conversationNumMessages = element.NumMessages;

    if (getContextNumMessages(element, MAILBOX_LABEL_IDS.ARCHIVE) === conversationNumMessages) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    if (getContextNumMessages(element, MAILBOX_LABEL_IDS.SCHEDULED) === conversationNumMessages) {
        return MoveEngineRuleResult.DENIED;
    }

    return MoveEngineRuleResult.ALLOWED;
};

// Any conversation can move to SENT
// Received or drafts messages cannot move to SENT, but they will be moved to INBOX or DRAFTS if they are not already there
export const conversationSentRules: MoveEngineRule = ({ element }) => {
    if (!isConversation(element)) {
        throw new Error(ERROR_ELEMENT_NOT_CONVERSATION);
    }

    return MoveEngineRuleResult.ALLOWED;
};

// Any conversation can move to DRAFTS
// Sent or received messages cannot move to DRAFTS, but they will be moved to SENT or INBOX if they are not already there
export const conversationDraftRules: MoveEngineRule = ({ element }) => {
    if (!isConversation(element)) {
        throw new Error(ERROR_ELEMENT_NOT_CONVERSATION);
    }

    return MoveEngineRuleResult.ALLOWED;
};

/**
 * No messages can be moved to the outbox label
 * It's part of `LABELS_UNMODIFIABLE_BY_USER`
 *
 * @returns DENIED
 */
export const conversationOutboxRules: MoveEngineRule = ({}) => {
    return MoveEngineRuleResult.DENIED;
};

/**
 * No messages can be moved to the scheduled label
 *
 * @returns DENIED
 */
export const conversationScheduleRules: MoveEngineRule = ({ element }) => {
    if (!isConversation(element)) {
        throw new Error(ERROR_ELEMENT_NOT_CONVERSATION);
    }

    return MoveEngineRuleResult.DENIED;
};

/**
 * No messages can be moved to the almost all mail label
 * It's part of `LABELS_UNMODIFIABLE_BY_USER`
 *
 * @returns NOT_APPLICABLE
 */
export const conversationAlmostAllMailRules: MoveEngineRule = () => {
    return MoveEngineRuleResult.NOT_APPLICABLE;
};

/**
 * No messages can be moved to the snooze label
 *
 * @returns DENIED
 */
export const conversationSnoozedRules: MoveEngineRule = ({ element }) => {
    if (!isConversation(element)) {
        throw new Error(ERROR_ELEMENT_NOT_CONVERSATION);
    }

    return MoveEngineRuleResult.DENIED;
};

// Any conversation can move to a category. If all messages are already in the category, do nothing.
export const conversationCategoryRules: MoveEngineRule = ({ element, targetLabelID }) => {
    if (!isConversation(element)) {
        throw new Error(ERROR_ELEMENT_NOT_CONVERSATION);
    }

    if (!element.Labels) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    const conversationNumMessages = element.NumMessages || 0;

    if (getContextNumMessages(element, targetLabelID) === conversationNumMessages) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    return MoveEngineRuleResult.ALLOWED;
};

// Any conversation can move to a custom folder. If all messages are already in the custom folder, do nothing.
export const conversationCustomFolderRules: MoveEngineRule = ({ element, targetLabelID }) => {
    if (!isConversation(element)) {
        throw new Error(ERROR_ELEMENT_NOT_CONVERSATION);
    }

    if (!element.Labels) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    const conversationNumMessages = element.NumMessages || 0;

    if (getContextNumMessages(element, targetLabelID) === conversationNumMessages) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    return MoveEngineRuleResult.ALLOWED;
};

// Any conversation can move to a custom label. If all messages are already in the custom label, do nothing.
export const conversationCustomLabelRules: MoveEngineRule = ({ element, targetLabelID }) => {
    if (!isConversation(element)) {
        throw new Error(ERROR_ELEMENT_NOT_CONVERSATION);
    }

    if (!element.Labels) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    const conversationNumMessages = element.NumMessages || 0;

    if (getContextNumMessages(element, targetLabelID) === conversationNumMessages) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    return MoveEngineRuleResult.ALLOWED;
};
