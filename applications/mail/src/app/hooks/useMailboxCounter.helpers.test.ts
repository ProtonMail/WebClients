import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

import { getCounterMap, getLocationCount } from './useMailboxCounter.helpers';

describe('useMailboxCounter helpers', () => {
    describe('getCounterMap', () => {
        const conversationsCounts = [
            { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 5, Total: 20 },
            { LabelID: MAILBOX_LABEL_IDS.SENT, Unread: 7, Total: 13 },
        ];

        const messagesCounts = [
            { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 15, Total: 30 },
            { LabelID: MAILBOX_LABEL_IDS.SENT, Unread: 10, Total: 30 },
        ];

        it('should return default value if the label is not present', () => {
            const result = getCounterMap([], conversationsCounts, messagesCounts, {} as MailSettings);

            expect(result[MAILBOX_LABEL_IDS.STARRED]).toStrictEqual({
                LabelID: MAILBOX_LABEL_IDS.STARRED,
                Total: 0,
                Unread: 0,
            });
        });

        it('should return the message count if the labelID is in isAlwaysMessageLabels', () => {
            const result = getCounterMap([], conversationsCounts, messagesCounts, {} as MailSettings);

            expect(result[MAILBOX_LABEL_IDS.SENT]).toStrictEqual({
                LabelID: MAILBOX_LABEL_IDS.SENT,
                Total: 30,
                Unread: 10,
            });
        });

        it('should return the conversation count if the labelID is not in isAlwaysMessageLabels', () => {
            const result = getCounterMap([], conversationsCounts, messagesCounts, {} as MailSettings);

            expect(result[MAILBOX_LABEL_IDS.INBOX]).toStrictEqual({
                LabelID: MAILBOX_LABEL_IDS.INBOX,
                Total: 20,
                Unread: 5,
            });
        });

        it('should return the message count if the labelID is not in isAlwaysMessageLabels but message grouping is disabled', () => {
            const result = getCounterMap([], conversationsCounts, messagesCounts, {
                ViewMode: VIEW_MODE.SINGLE,
            } as MailSettings);

            expect(result[MAILBOX_LABEL_IDS.INBOX]).toStrictEqual({
                LabelID: MAILBOX_LABEL_IDS.INBOX,
                Total: 30,
                Unread: 15,
            });
        });
    });

    describe('getLocationCount', () => {
        it('should return default values if record is empty', () => {
            const result = getLocationCount({}, MAILBOX_LABEL_IDS.INBOX);
            expect(result).toStrictEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Total: 0, Unread: 0 });
        });

        it('should return default value if labelID not present in record', () => {
            const result = getLocationCount(
                {
                    [MAILBOX_LABEL_IDS.ARCHIVE]: {
                        LabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        Total: 10,
                        Unread: 2,
                    },
                },
                MAILBOX_LABEL_IDS.INBOX
            );
            expect(result).toStrictEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Total: 0, Unread: 0 });
        });

        it('should return the label value if present in record', () => {
            const result = getLocationCount(
                {
                    [MAILBOX_LABEL_IDS.INBOX]: {
                        LabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        Total: 10,
                        Unread: 2,
                    },
                    [MAILBOX_LABEL_IDS.ARCHIVE]: {
                        LabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                        Total: 10,
                        Unread: 2,
                    },
                },
                MAILBOX_LABEL_IDS.INBOX
            );
            expect(result).toStrictEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Total: 10, Unread: 2 });
        });
    });
});
