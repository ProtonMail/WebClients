import { isCustomFolder, isCustomLabel } from '@proton/mail/labels/helpers';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Folder, Label } from '@proton/shared/lib/interfaces';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { isMessage } from 'proton-mail/helpers/elements';
import type { Conversation } from 'proton-mail/models/conversation';
import type { ConversationState } from 'proton-mail/store/conversations/conversationsTypes';

import type { Element } from '../../../models/element';

const folderConditions = {
    [MAILBOX_LABEL_IDS.DRAFTS]: [
        MAILBOX_LABEL_IDS.INBOX,
        MAILBOX_LABEL_IDS.SENT,
        MAILBOX_LABEL_IDS.ALL_SENT,
        MAILBOX_LABEL_IDS.ALL_DRAFTS,
        MAILBOX_LABEL_IDS.SPAM,
    ],
    [MAILBOX_LABEL_IDS.ALL_DRAFTS]: [
        MAILBOX_LABEL_IDS.TRASH,
        MAILBOX_LABEL_IDS.ARCHIVE,
        MAILBOX_LABEL_IDS.INBOX,
        MAILBOX_LABEL_IDS.SENT,
        MAILBOX_LABEL_IDS.ALL_SENT,
        MAILBOX_LABEL_IDS.DRAFTS,
        MAILBOX_LABEL_IDS.SPAM,
    ],
    [MAILBOX_LABEL_IDS.SENT]: [
        MAILBOX_LABEL_IDS.INBOX,
        MAILBOX_LABEL_IDS.DRAFTS,
        MAILBOX_LABEL_IDS.ALL_DRAFTS,
        MAILBOX_LABEL_IDS.ALL_SENT,
        MAILBOX_LABEL_IDS.SPAM,
    ],
    [MAILBOX_LABEL_IDS.ALL_SENT]: [
        MAILBOX_LABEL_IDS.TRASH,
        MAILBOX_LABEL_IDS.ARCHIVE,
        MAILBOX_LABEL_IDS.INBOX,
        MAILBOX_LABEL_IDS.DRAFTS,
        MAILBOX_LABEL_IDS.ALL_DRAFTS,
        MAILBOX_LABEL_IDS.SENT,
        MAILBOX_LABEL_IDS.SPAM,
    ],
    [MAILBOX_LABEL_IDS.STARRED]: [MAILBOX_LABEL_IDS.TRASH, MAILBOX_LABEL_IDS.SPAM],
    [MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL]: [MAILBOX_LABEL_IDS.TRASH, MAILBOX_LABEL_IDS.SPAM],
};

const shouldMoveOutAfterFolderMove = (
    sourceLabelID: string,
    destinationLabelID: string,
    labels?: Label[],
    folders?: Folder[]
) => {
    const isNotMoving = sourceLabelID === destinationLabelID;
    const isDestinationCustomLabel = isCustomLabel(destinationLabelID, labels);
    const isDestinationStar = destinationLabelID === MAILBOX_LABEL_IDS.STARRED;
    const isSourceAllMail = sourceLabelID === MAILBOX_LABEL_IDS.ALL_MAIL;
    const isDestinationAllMail = destinationLabelID === MAILBOX_LABEL_IDS.ALL_MAIL;
    const isDestinationAlmostAllMail = destinationLabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL;

    if (
        isNotMoving ||
        isDestinationCustomLabel ||
        isDestinationStar ||
        isSourceAllMail ||
        isDestinationAllMail ||
        isDestinationAlmostAllMail
    ) {
        return false;
    }

    // TODO: add conditions for SNOOZE and SCHEDULED
    switch (sourceLabelID) {
        case MAILBOX_LABEL_IDS.DRAFTS:
            return !folderConditions[MAILBOX_LABEL_IDS.DRAFTS].includes(destinationLabelID as MAILBOX_LABEL_IDS);
        case MAILBOX_LABEL_IDS.ALL_DRAFTS:
            return (
                !folderConditions[MAILBOX_LABEL_IDS.ALL_DRAFTS].includes(destinationLabelID as MAILBOX_LABEL_IDS) &&
                !isCustomFolder(destinationLabelID, folders)
            );
        case MAILBOX_LABEL_IDS.SENT:
            return !folderConditions[MAILBOX_LABEL_IDS.SENT].includes(destinationLabelID as MAILBOX_LABEL_IDS);
        case MAILBOX_LABEL_IDS.ALL_SENT:
            return (
                !folderConditions[MAILBOX_LABEL_IDS.ALL_SENT].includes(destinationLabelID as MAILBOX_LABEL_IDS) &&
                !isCustomFolder(destinationLabelID, folders)
            );
        case MAILBOX_LABEL_IDS.STARRED:
            return folderConditions[MAILBOX_LABEL_IDS.STARRED].includes(destinationLabelID as MAILBOX_LABEL_IDS);
        case MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL:
            return folderConditions[MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL].includes(
                destinationLabelID as MAILBOX_LABEL_IDS
            );
    }

    const isSourceCustomFolder = isCustomFolder(sourceLabelID, folders);
    if (isSourceCustomFolder) {
        return !(isDestinationCustomLabel || MAILBOX_LABEL_IDS.STARRED === (destinationLabelID as MAILBOX_LABEL_IDS));
    }

    const isSourceCustomLabel = isCustomLabel(sourceLabelID, labels);
    if (isSourceCustomLabel) {
        return [MAILBOX_LABEL_IDS.TRASH, MAILBOX_LABEL_IDS.SPAM].includes(destinationLabelID as MAILBOX_LABEL_IDS);
    }

    return true;
};

// From a source and destination label, trigger a onBack when necessary
export const moveOutMoveAction = (
    sourceLabelID: string,
    destinationLabelID: string,
    onBack: () => void,
    labels?: Label[],
    folders?: Folder[]
) => {
    const shouldMoveOut = shouldMoveOutAfterFolderMove(sourceLabelID, destinationLabelID, labels, folders);

    if (shouldMoveOut) {
        onBack();
    }
};

export const moveOutStarAction = (sourceLabelID: string, isLosingStar: boolean, onBack: () => void) => {
    if (sourceLabelID === MAILBOX_LABEL_IDS.STARRED && isLosingStar) {
        onBack();
    }
};

export const moveOutPermanentDeleteAction = (onBack: () => void) => {
    onBack();
};

export const moveOutApplyLabelAction = (
    sourceLabelID: string,
    changes: { [labelID: string]: boolean },
    onBack: () => void
) => {
    if (changes.hasOwnProperty(sourceLabelID) && !changes[sourceLabelID]) {
        onBack();
    }
};

// Check if one of the updated element is opened (if not no need to move out)
export const getOpenedElementUpdated = (elements: Element[], conversationMode: boolean, openedElementID: string) => {
    if (conversationMode) {
        if (isMessage(elements[0])) {
            // Check if a message.ConversationID is opened conversation (Check params)
            return elements.find((element) => {
                return (element as Message).ConversationID === openedElementID;
            });
        } else {
            // Check if a conversation.ID is opened conversation (Check params)
            return elements.find((element) => {
                return (element as Conversation).ID === openedElementID;
            });
        }
    } else {
        // Check if a message.ID is opened message (Check params)
        return elements.find((element) => {
            return (element as Message).ID === openedElementID;
        });
    }
};

export const hasRemainingItemAfterAction = (
    sourceLabelID: string,
    conversationFromState: ConversationState | undefined
) => {
    if (!conversationFromState) {
        return;
    }

    const matchingLabelNumMessage =
        conversationFromState?.Conversation.Labels?.find((label) => label.ID === sourceLabelID)?.ContextNumMessages ||
        0;

    return matchingLabelNumMessage > 1;
};
