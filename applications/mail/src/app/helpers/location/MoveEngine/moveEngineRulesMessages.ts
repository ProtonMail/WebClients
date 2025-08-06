import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { isDraft, isReceived, isScheduled, isSent } from '@proton/shared/lib/mail/messages';

import { hasLabel, isMessage } from 'proton-mail/helpers/elements';

import { ERROR_ELEMENT_NOT_MESSAGE, type MoveEngineRule, MoveEngineRuleResult } from './moveEngineInterface';

// Sent, drafts and scheduled messages cannot move to INBOX
export const messageInboxRules: MoveEngineRule = ({ element }) => {
    if (!isMessage(element)) {
        throw new Error(ERROR_ELEMENT_NOT_MESSAGE);
    }

    if (hasLabel(element, MAILBOX_LABEL_IDS.INBOX)) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    if (isSent(element) || isDraft(element) || isScheduled(element)) {
        return MoveEngineRuleResult.DENIED;
    }

    return MoveEngineRuleResult.ALLOWED;
};

// Sent and received messages cannot move to ALL_DRAFTS
export const messageAllDraftRules: MoveEngineRule = ({ element }) => {
    if (!isMessage(element)) {
        throw new Error(ERROR_ELEMENT_NOT_MESSAGE);
    }

    if (hasLabel(element, MAILBOX_LABEL_IDS.ALL_DRAFTS)) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    if ((isSent(element) && !isScheduled(element)) || isReceived(element)) {
        return MoveEngineRuleResult.DENIED;
    }

    return MoveEngineRuleResult.ALLOWED;
};

// Drafts and received messages cannot move to ALL_SENT
export const messageAllSentRules: MoveEngineRule = ({ element }) => {
    if (!isMessage(element)) {
        throw new Error(ERROR_ELEMENT_NOT_MESSAGE);
    }

    if (hasLabel(element, MAILBOX_LABEL_IDS.ALL_SENT)) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    if (isDraft(element) || isReceived(element)) {
        return MoveEngineRuleResult.DENIED;
    }

    return MoveEngineRuleResult.ALLOWED;
};

// Any message can move to TRASH
export const messageTrashRules: MoveEngineRule = ({ element }) => {
    if (!isMessage(element)) {
        throw new Error(ERROR_ELEMENT_NOT_MESSAGE);
    }

    if (hasLabel(element, MAILBOX_LABEL_IDS.TRASH)) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    return MoveEngineRuleResult.ALLOWED;
};

// scheduled messages cannot move to SPAM
export const messageSpamRules: MoveEngineRule = ({ element }) => {
    if (!isMessage(element)) {
        throw new Error(ERROR_ELEMENT_NOT_MESSAGE);
    }

    if (hasLabel(element, MAILBOX_LABEL_IDS.SPAM)) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    if (isScheduled(element)) {
        return MoveEngineRuleResult.DENIED;
    }

    return MoveEngineRuleResult.ALLOWED;
};

/**
 * No messages can be moved to the all mail label
 * It's part of `LABELS_UNMODIFIABLE_BY_USER`
 *
 * @returns NOT_APPLICABLE
 */
export const messageAllMailRules: MoveEngineRule = () => {
    return MoveEngineRuleResult.NOT_APPLICABLE;
};

// Any message can move to STARRED
export const messageStarredRules: MoveEngineRule = ({ element }) => {
    if (!isMessage(element)) {
        throw new Error(ERROR_ELEMENT_NOT_MESSAGE);
    }

    if (hasLabel(element, MAILBOX_LABEL_IDS.STARRED)) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    return MoveEngineRuleResult.ALLOWED;
};

// Except SCHEDULED messages, any message can move to ARCHIVE
export const messageArchiveRules: MoveEngineRule = ({ element }) => {
    if (!isMessage(element)) {
        throw new Error(ERROR_ELEMENT_NOT_MESSAGE);
    }

    if (hasLabel(element, MAILBOX_LABEL_IDS.ARCHIVE)) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    if (isScheduled(element)) {
        return MoveEngineRuleResult.DENIED;
    }

    return MoveEngineRuleResult.ALLOWED;
};

// Draft and received messages cannot move to SENT
export const messageSentRules: MoveEngineRule = ({ element }) => {
    if (!isMessage(element)) {
        throw new Error(ERROR_ELEMENT_NOT_MESSAGE);
    }

    if (hasLabel(element, MAILBOX_LABEL_IDS.SENT)) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    if (isDraft(element) || isReceived(element)) {
        return MoveEngineRuleResult.DENIED;
    }

    return MoveEngineRuleResult.ALLOWED;
};

// Sent and received messages cannot move to drafts
export const messageDraftRules: MoveEngineRule = ({ element }) => {
    if (!isMessage(element)) {
        throw new Error(ERROR_ELEMENT_NOT_MESSAGE);
    }

    if (hasLabel(element, MAILBOX_LABEL_IDS.DRAFTS)) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    // Scheduled are sent messages, but we can move them to draft to get canceled
    if ((isSent(element) && !isScheduled(element)) || isReceived(element)) {
        return MoveEngineRuleResult.DENIED;
    }

    return MoveEngineRuleResult.ALLOWED;
};

/**
 * No messages can be moved to the outbox label
 * It's part of `LABELS_UNMODIFIABLE_BY_USER`
 *
 * @returns DENIED
 */
export const messageOutboxRules: MoveEngineRule = ({}) => {
    return MoveEngineRuleResult.DENIED;
};

/**
 * No messages can be moved to the schedule label
 * It's part of `LABELS_UNMODIFIABLE_BY_USER`
 *
 * @returns DENIED
 */
export const messageScheduleRules: MoveEngineRule = ({ element }) => {
    if (!isMessage(element)) {
        throw new Error(ERROR_ELEMENT_NOT_MESSAGE);
    }

    return MoveEngineRuleResult.DENIED;
};

/**
 * No messages can be moved to the almost all mail label
 * It's part of `LABELS_UNMODIFIABLE_BY_USER`
 *
 * @returns NOT_APPLICABLE
 */
export const messageAlmostAllMailRules: MoveEngineRule = () => {
    return MoveEngineRuleResult.NOT_APPLICABLE;
};

/**
 * No messages can be moved to the snoozed label
 *
 * @returns DENIED
 */
export const messageSnoozedRules: MoveEngineRule = ({ element }) => {
    if (!isMessage(element)) {
        throw new Error(ERROR_ELEMENT_NOT_MESSAGE);
    }

    return MoveEngineRuleResult.DENIED;
};

// Sent, drafts and scheduled messages cannot move to a category (which should be a "children of INBOX)
export const messageCategoryRules: MoveEngineRule = ({ element, targetLabelID }) => {
    if (!isMessage(element)) {
        throw new Error(ERROR_ELEMENT_NOT_MESSAGE);
    }

    if (hasLabel(element, targetLabelID)) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    if (isSent(element) || isDraft(element) || isScheduled(element)) {
        return MoveEngineRuleResult.DENIED;
    }

    return MoveEngineRuleResult.ALLOWED;
};

// Any message can move to a custom folder
export const messageCustomFolderRules: MoveEngineRule = ({ element, targetLabelID }) => {
    if (!isMessage(element)) {
        throw new Error(ERROR_ELEMENT_NOT_MESSAGE);
    }

    if (hasLabel(element, targetLabelID)) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    return MoveEngineRuleResult.ALLOWED;
};

// Any message can move to a custom label
export const messageCustomLabelRules: MoveEngineRule = ({ element, targetLabelID }) => {
    if (!isMessage(element)) {
        throw new Error(ERROR_ELEMENT_NOT_MESSAGE);
    }

    if (hasLabel(element, targetLabelID)) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    return MoveEngineRuleResult.ALLOWED;
};
