import { getContextNumMessages } from '@proton/mail/helpers/conversation';
import { isCustomFolder, isSystemFolder } from '@proton/mail/helpers/location';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Folder, MailSettings } from '@proton/shared/lib/interfaces';
import { isUnsubscribable } from '@proton/shared/lib/mail/messages';

import { ModalType } from 'proton-mail/containers/globalModals/inteface';
import { hasLabel } from 'proton-mail/helpers/elements';
import type { Element } from 'proton-mail/models/element';
import type { ConversationState } from 'proton-mail/store/conversations/conversationsTypes';

interface ShouldOpenConfirmationModalMessageParams {
    elements: Element[];
    targetLabelID: string;
    mailSettings: MailSettings;
}

export const scheduleTargetWithWarning = new Set<string>([
    MAILBOX_LABEL_IDS.ALL_DRAFTS,
    MAILBOX_LABEL_IDS.DRAFTS,
    MAILBOX_LABEL_IDS.TRASH,
]);

/**
 * Test if we should open the schedule or the unsubscribe modal to confirm the user action.
 * The snooze modal is not visible for messages.
 *
 * @param elements - The list of elements to move
 * @param targetLabelID - The target where the elements are moved
 * @params mailSettings - The user settings used for the unsubscribe modal
 * @returns The modal to open or null if no modal is needed
 */
export const shouldOpenConfirmationModalForMessages = ({
    elements,
    targetLabelID,
    mailSettings,
}: ShouldOpenConfirmationModalMessageParams): ModalType | null => {
    if (scheduleTargetWithWarning.has(targetLabelID)) {
        const hasSomeElementsInSchedule = elements.some((element) => hasLabel(element, MAILBOX_LABEL_IDS.SCHEDULED));
        if (hasSomeElementsInSchedule) {
            return ModalType.Schedule;
        }
    }

    if (targetLabelID === MAILBOX_LABEL_IDS.SPAM) {
        if (mailSettings?.SpamAction === null) {
            const canBeUnsubscribed = elements.some((message) => isUnsubscribable(message));
            if (canBeUnsubscribed) {
                return ModalType.Unsubscribe;
            }
        }
    }

    return null;
};

interface ShouldOpenConfirmationModalConversationParams {
    elements: Element[];
    targetLabelID: string;
    folders: Folder[];
    mailSettings: MailSettings;
    conversationsFromState: (ConversationState | undefined)[];
}

/**
 * Test if we should open the schedule or the unsubscribe modal to confirm the user action.
 *
 * @param elements - The list of elements to move
 * @param targetLabelID - The target where the elements are moved
 * @params folders - The custom folders of the user, used for the snooze modal
 * @params mailSettings - The user settings used for the unsubscribe modal
 * @params conversationsFromState - The conversation state of the elements to move, used for the unusbscibe modal
 * @returns The modal to open or null if no modal is needed
 */
export const shouldOpenConfirmationModalForConverversation = ({
    elements,
    targetLabelID,
    folders,
    mailSettings,
    conversationsFromState,
}: ShouldOpenConfirmationModalConversationParams): ModalType | null => {
    if (scheduleTargetWithWarning.has(targetLabelID)) {
        const hasSomeElementsInSchedule = elements.some(
            (element) => getContextNumMessages(element, MAILBOX_LABEL_IDS.SCHEDULED) > 0
        );

        if (hasSomeElementsInSchedule) {
            return ModalType.Schedule;
        }
    }

    if (isCustomFolder(targetLabelID, folders || []) || isSystemFolder(targetLabelID)) {
        const hasSomeElementsInSnooze = elements.some(
            (element) => getContextNumMessages(element, MAILBOX_LABEL_IDS.SNOOZED) > 0
        );

        if (hasSomeElementsInSnooze) {
            return ModalType.Snooze;
        }
    }

    if (targetLabelID === MAILBOX_LABEL_IDS.SPAM) {
        if (mailSettings?.SpamAction === null) {
            const canBeUnsubscribed = conversationsFromState.some((conversation) =>
                conversation?.Messages?.some((message) => isUnsubscribable(message))
            );
            if (canBeUnsubscribed) {
                return ModalType.Unsubscribe;
            }
        }
    }

    return null;
};
