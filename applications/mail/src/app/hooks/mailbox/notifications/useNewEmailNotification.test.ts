import { EVENT_ACTIONS, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import type { MessageEvent } from '../../../models/event';
import { messageFilter } from './useNewEmailNotification';

const createMessageEvent = (labelIDs: string[]): MessageEvent => ({
    ID: '1',
    Action: EVENT_ACTIONS.CREATE,
    Message: {
        LabelIDs: labelIDs,
        Unread: 1,
        Flags: 0,
    } as unknown as Message,
});

describe('messageFilter', () => {
    const notifier = [MAILBOX_LABEL_IDS.STARRED, MAILBOX_LABEL_IDS.CATEGORY_DEFAULT];

    it('should not notify for a message with a notifying category label but without Inbox', () => {
        const event = createMessageEvent([
            MAILBOX_LABEL_IDS.SPAM,
            MAILBOX_LABEL_IDS.ALL_MAIL,
            MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
        ]);

        expect(messageFilter(event, notifier)).toBe(false);
    });

    it('should notify for a message with a notifying category label and Inbox', () => {
        const event = createMessageEvent([
            MAILBOX_LABEL_IDS.INBOX,
            MAILBOX_LABEL_IDS.ALL_MAIL,
            MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
        ]);

        expect(messageFilter(event, notifier)).toBe(true);
    });
});
