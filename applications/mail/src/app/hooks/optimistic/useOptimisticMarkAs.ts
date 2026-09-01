import { isSystemLocation } from '@proton/mail/helpers/location';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';

import type { Conversation } from '../../models/conversation';

export type MarkAsChanges = { status: MARK_AS_STATUS; displaySnoozedReminder?: boolean };

export const applyMarkAsChangesOnConversation = (
    conversation: Conversation,
    labelID: string,
    { status, displaySnoozedReminder }: MarkAsChanges
) => {
    const { NumUnread = 0, Labels = [] } = conversation;
    const { ContextNumUnread = 0 } = Labels.find(({ ID }) => ID === labelID) || {};
    const updatedNumUnread =
        status === MARK_AS_STATUS.UNREAD ? NumUnread + 1 : Math.max(NumUnread - ContextNumUnread, 0);
    const updatedContextNumUnread = status === MARK_AS_STATUS.UNREAD ? ContextNumUnread + 1 : 0;
    const updatedLabels = Labels.map((label) =>
        label.ID === labelID || isSystemLocation(label.ID)
            ? {
                  ...label,
                  ContextNumUnread: updatedContextNumUnread,
              }
            : label
    );

    return {
        ...conversation,
        DisplaySnoozedReminder: displaySnoozedReminder,
        NumUnread: updatedNumUnread,
        ContextNumUnread: updatedContextNumUnread,
        Labels: updatedLabels,
    };
};
