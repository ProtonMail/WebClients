import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { isDraft, isReceived, isScheduled, isSent } from '@proton/shared/lib/mail/messages';

import { hasLabel, isMessage } from 'proton-mail/helpers/elements';

import { ERROR_ELEMENT_NOT_MESSAGE, type MoveEngineRule, MoveEngineRuleResult } from './moveEngineInterface';

export const inboxRules: MoveEngineRule = ({ element }) => {
    if (!isMessage(element)) {
        throw new Error(ERROR_ELEMENT_NOT_MESSAGE);
    }

    if (hasLabel(element, MAILBOX_LABEL_IDS.INBOX) || isScheduled(element)) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    if (isSent(element) || isDraft(element)) {
        return MoveEngineRuleResult.DENIED;
    }

    return MoveEngineRuleResult.ALLOWED;
};

export const allDraftRules: MoveEngineRule = ({ element }) => {
    if (!isMessage(element)) {
        throw new Error(ERROR_ELEMENT_NOT_MESSAGE);
    }

    if (hasLabel(element, MAILBOX_LABEL_IDS.ALL_DRAFTS)) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    if (isSent(element) || isReceived(element)) {
        return MoveEngineRuleResult.DENIED;
    }

    return MoveEngineRuleResult.ALLOWED;
};

export const allSentRules: MoveEngineRule = ({ element }) => {
    if (!isMessage(element)) {
        throw new Error(ERROR_ELEMENT_NOT_MESSAGE);
    }

    if (hasLabel(element, MAILBOX_LABEL_IDS.ALL_SENT) || isScheduled(element)) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    if (isDraft(element) || isReceived(element)) {
        return MoveEngineRuleResult.DENIED;
    }

    return MoveEngineRuleResult.ALLOWED;
};

export const trashRules: MoveEngineRule = ({ element }) => {
    if (!isMessage(element)) {
        throw new Error('Element is not a message');
    }

    if (hasLabel(element, MAILBOX_LABEL_IDS.TRASH)) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    return MoveEngineRuleResult.ALLOWED;
};

export const spamRules: MoveEngineRule = ({ element }) => {
    if (!isMessage(element)) {
        throw new Error(ERROR_ELEMENT_NOT_MESSAGE);
    }

    if (hasLabel(element, MAILBOX_LABEL_IDS.SPAM) || isScheduled(element)) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    if (isDraft(element) || isSent(element)) {
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
export const allMailRules: MoveEngineRule = () => {
    return MoveEngineRuleResult.NOT_APPLICABLE;
};

export const starredRules: MoveEngineRule = ({ element }) => {
    if (!isMessage(element)) {
        throw new Error(ERROR_ELEMENT_NOT_MESSAGE);
    }

    if (hasLabel(element, MAILBOX_LABEL_IDS.STARRED)) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    return MoveEngineRuleResult.ALLOWED;
};

export const archiveRules: MoveEngineRule = ({ element }) => {
    if (!isMessage(element)) {
        throw new Error(ERROR_ELEMENT_NOT_MESSAGE);
    }

    if (hasLabel(element, MAILBOX_LABEL_IDS.ARCHIVE) || isScheduled(element)) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    return MoveEngineRuleResult.ALLOWED;
};

export const sentRules: MoveEngineRule = ({ element }) => {
    if (!isMessage(element)) {
        throw new Error(ERROR_ELEMENT_NOT_MESSAGE);
    }

    if (hasLabel(element, MAILBOX_LABEL_IDS.SENT) || isScheduled(element)) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    if (isDraft(element) || isReceived(element)) {
        return MoveEngineRuleResult.DENIED;
    }

    return MoveEngineRuleResult.ALLOWED;
};

export const draftRules: MoveEngineRule = ({ element }) => {
    if (!isMessage(element)) {
        throw new Error(ERROR_ELEMENT_NOT_MESSAGE);
    }

    if (hasLabel(element, MAILBOX_LABEL_IDS.DRAFTS)) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    if (isSent(element) || isReceived(element)) {
        return MoveEngineRuleResult.DENIED;
    }

    return MoveEngineRuleResult.ALLOWED;
};

/**
 * No messages can be moved to the outbox label
 * It's part of `LABELS_UNMODIFIABLE_BY_USER`
 *
 * @returns NOT_APPLICABLE
 */
export const outboxRules: MoveEngineRule = ({}) => {
    return MoveEngineRuleResult.NOT_APPLICABLE;
};

/**
 * No messages can be moved to the schedule label
 * It's part of `LABELS_UNMODIFIABLE_BY_USER`
 *
 * @returns NOT_APPLICABLE
 */
export const scheduleRules: MoveEngineRule = ({ element }) => {
    if (!isMessage(element)) {
        throw new Error(ERROR_ELEMENT_NOT_MESSAGE);
    }

    return MoveEngineRuleResult.NOT_APPLICABLE;
};

/**
 * No messages can be moved to the almost all mail label
 * It's part of `LABELS_UNMODIFIABLE_BY_USER`
 *
 * @returns NOT_APPLICABLE
 */
export const almostAllMailRules: MoveEngineRule = () => {
    return MoveEngineRuleResult.NOT_APPLICABLE;
};

// We can only snooze conversation so it's never applicable here
export const snoozedRules: MoveEngineRule = ({ element }) => {
    if (!isMessage(element)) {
        throw new Error(ERROR_ELEMENT_NOT_MESSAGE);
    }

    return MoveEngineRuleResult.NOT_APPLICABLE;
};

export const categoryRules: MoveEngineRule = ({ element, targetLabelID }) => {
    if (!isMessage(element)) {
        throw new Error(ERROR_ELEMENT_NOT_MESSAGE);
    }

    if (hasLabel(element, targetLabelID) || isScheduled(element)) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    return MoveEngineRuleResult.ALLOWED;
};

export const customFolderRules: MoveEngineRule = ({ element, targetLabelID }) => {
    if (!isMessage(element)) {
        throw new Error(ERROR_ELEMENT_NOT_MESSAGE);
    }

    if (hasLabel(element, targetLabelID) || isScheduled(element)) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    return MoveEngineRuleResult.ALLOWED;
};

// We can move to a custom label but it will be an unlabel
export const customLabelRules: MoveEngineRule = ({ element, targetLabelID }) => {
    if (!isMessage(element)) {
        throw new Error(ERROR_ELEMENT_NOT_MESSAGE);
    }

    if (hasLabel(element, targetLabelID)) {
        return MoveEngineRuleResult.NOT_APPLICABLE;
    }

    return MoveEngineRuleResult.ALLOWED;
};
