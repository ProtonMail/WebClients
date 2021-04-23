import { MAILBOX_LABEL_IDS, VIEW_MODE } from 'proton-shared/lib/constants';
import { isConversationMode } from './mailSettings';

describe('mailSettings', () => {
    describe('isConversationMode', () => {
        const emptyLocation = { pathname: '', search: '', state: {}, hash: '' };
        const locationWithParameters = { pathname: '', search: '', state: {}, hash: '#keyword=panda' };

        it('should be false if labelID is single only', () => {
            expect(isConversationMode(MAILBOX_LABEL_IDS.ALL_DRAFTS, { ViewMode: VIEW_MODE.GROUP }, emptyLocation)).toBe(
                false
            );
        });

        it('should be false if mail settings is single', () => {
            expect(
                isConversationMode(MAILBOX_LABEL_IDS.ALL_DRAFTS, { ViewMode: VIEW_MODE.SINGLE }, emptyLocation)
            ).toBe(false);
        });

        it('should be true if mail settings is group and label is not single only', () => {
            expect(isConversationMode(MAILBOX_LABEL_IDS.INBOX, { ViewMode: VIEW_MODE.GROUP }, emptyLocation)).toBe(
                true
            );
        });

        it('should be false if search parameters are defined', () => {
            expect(
                isConversationMode(MAILBOX_LABEL_IDS.INBOX, { ViewMode: VIEW_MODE.GROUP }, locationWithParameters)
            ).toBe(false);
        });
    });
});
