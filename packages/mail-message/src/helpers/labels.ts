import { omit } from '@proton/shared/lib/helpers/object';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import diff from '@proton/utils/diff';
import unique from '@proton/utils/unique';

import type { LabelIDsChanges } from '../models/event';
import type { MessageWithOptionalBody } from '../store/messages/messagesTypes';

export type LabelChanges = { [labelID: string]: boolean };

export interface UnreadStatus {
    id: string;
    unread: number;
}

/**
 * Elements without a ConversationID are treated as conversations by the app's element helpers,
 * and conversations don't carry LabelIDs.
 */
const isMessageElement = (message: Partial<Message> | undefined): message is Partial<Message> =>
    typeof message?.ConversationID === 'string';

export const hasMessageLabel = (message: Partial<Message> | undefined, labelID: string) =>
    isMessageElement(message) && !!message.LabelIDs?.includes(labelID);

export const parseMessageLabelIDsInEvent = <T extends Partial<Message>>(
    message: T,
    changes: Partial<Message> & LabelIDsChanges
): T => {
    const omitted = omit(changes, ['LabelIDsRemoved', 'LabelIDsAdded']);
    if (!isMessageElement(message) || omitted?.LabelIDs) {
        return { ...message, ...omitted };
    }
    const LabelIDs = unique(
        diff(message.LabelIDs || [], changes.LabelIDsRemoved || []).concat(changes.LabelIDsAdded || [])
    );
    return { ...message, ...omitted, LabelIDs };
};

export const applyLabelChangesOnMessage = <T>(
    message: MessageWithOptionalBody & T,
    changes: LabelChanges,
    unreadStatuses?: UnreadStatus[]
): MessageWithOptionalBody & T => {
    const { LabelIDs: inputLabelIDs } = message;
    const LabelIDs = [...inputLabelIDs];

    Object.keys(changes).forEach((labelID) => {
        const index = LabelIDs.findIndex((existingLabelID) => existingLabelID === labelID);
        if (changes[labelID]) {
            if (index === -1) {
                LabelIDs.push(labelID);
            }
        } else if (index >= 0) {
            LabelIDs.splice(index, 1);
        }
    });

    if (unreadStatuses) {
        const elementUnreadStatus = unreadStatuses.find((element) => element.id === message.ID)?.unread;
        if (elementUnreadStatus) {
            return { ...message, LabelIDs, Unread: elementUnreadStatus };
        }
    }

    return { ...message, LabelIDs };
};
