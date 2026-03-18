import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import {
    getNotificationTextUnauthorized,
} from '../helpers/moveToFolder';

describe('moveToFolder', () => {
    describe('getNotificationTextUnauthorized', () => {
        it.each`
            folderID                   | fromLabelID                     | expectedText
            ${MAILBOX_LABEL_IDS.INBOX} | ${MAILBOX_LABEL_IDS.SENT}       | ${`Sent messages cannot be moved to Inbox`}
            ${MAILBOX_LABEL_IDS.INBOX} | ${MAILBOX_LABEL_IDS.ALL_SENT}   | ${`Sent messages cannot be moved to Inbox`}
            ${MAILBOX_LABEL_IDS.SPAM}  | ${MAILBOX_LABEL_IDS.SENT}       | ${`Sent messages cannot be moved to Spam`}
            ${MAILBOX_LABEL_IDS.SPAM}  | ${MAILBOX_LABEL_IDS.ALL_SENT}   | ${`Sent messages cannot be moved to Spam`}
            ${MAILBOX_LABEL_IDS.INBOX} | ${MAILBOX_LABEL_IDS.DRAFTS}     | ${`Drafts cannot be moved to Inbox`}
            ${MAILBOX_LABEL_IDS.INBOX} | ${MAILBOX_LABEL_IDS.ALL_DRAFTS} | ${`Drafts cannot be moved to Inbox`}
            ${MAILBOX_LABEL_IDS.SPAM}  | ${MAILBOX_LABEL_IDS.DRAFTS}     | ${`Drafts cannot be moved to Spam`}
            ${MAILBOX_LABEL_IDS.SPAM}  | ${MAILBOX_LABEL_IDS.ALL_DRAFTS} | ${`Drafts cannot be moved to Spam`}
        `(`should return expected text [$expectedText]} `, ({ folderID, fromLabelID, expectedText }) => {
            expect(getNotificationTextUnauthorized(folderID, fromLabelID)).toEqual(expectedText);
        });
    });
});
