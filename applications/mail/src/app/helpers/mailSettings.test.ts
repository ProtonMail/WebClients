import { isConversationMode } from './mailSettings';
import { MAILBOX_LABEL_IDS, VIEW_MODE } from 'proton-shared/lib/constants';

describe('mailSettings', () => {
    describe('isConversationMode', () => {
        it('should be false if labelID is single only', () => {
            expect(isConversationMode(MAILBOX_LABEL_IDS.ALL_DRAFTS, { ViewMode: VIEW_MODE.GROUP })).toBe(false);
        });

        it('should be false if mail settings is single', () => {
            expect(isConversationMode(MAILBOX_LABEL_IDS.ALL_DRAFTS, { ViewMode: VIEW_MODE.SINGLE })).toBe(false);
        });

        it('should be true if mail settings is group and label is not single only', () => {
            expect(isConversationMode(MAILBOX_LABEL_IDS.INBOX, { ViewMode: VIEW_MODE.GROUP })).toBe(true);
        });
    });
});
