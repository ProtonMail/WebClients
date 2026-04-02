import { type CategoryLabelID, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { LabelCount } from '@proton/shared/lib/interfaces';

import { getUnreadCountForLabel } from './mailboxPageTitleHelpers';

describe('getUnreadCountForLabel', () => {
    it('should return the unread count for a label', () => {
        const countersByLabelId: { [labelID: string]: LabelCount } = {
            [MAILBOX_LABEL_IDS.INBOX]: { Unread: 10 },
        };
        expect(getUnreadCountForLabel(MAILBOX_LABEL_IDS.INBOX, [], countersByLabelId)).toBe(10);
    });

    it('should return 0 for a label with no unread count', () => {
        const countersByLabelId: { [labelID: string]: LabelCount } = {
            [MAILBOX_LABEL_IDS.INBOX]: { Unread: 0 },
        };
        expect(getUnreadCountForLabel(MAILBOX_LABEL_IDS.INBOX, [], countersByLabelId)).toBe(0);
    });

    it('should return the unread count for a category label', () => {
        const categoryIDs: CategoryLabelID[] = [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT];
        const countersByLabelId: { [labelID: string]: LabelCount } = {
            [MAILBOX_LABEL_IDS.INBOX]: { Unread: 100 },
            [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT]: { Unread: 10 },
        };
        expect(getUnreadCountForLabel(MAILBOX_LABEL_IDS.INBOX, categoryIDs, countersByLabelId)).toBe(10);
    });

    it('should return the primary category count if multiple categories', () => {
        const categoryIDs: CategoryLabelID[] = [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, MAILBOX_LABEL_IDS.CATEGORY_SOCIAL];
        const countersByLabelId: { [labelID: string]: LabelCount } = {
            [MAILBOX_LABEL_IDS.INBOX]: { Unread: 100 },
            [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT]: { Unread: 10 },
            [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL]: { Unread: 5 },
        };
        expect(getUnreadCountForLabel(MAILBOX_LABEL_IDS.INBOX, categoryIDs, countersByLabelId)).toBe(10);
    });

    it('should return the category label count if no inbox counter', () => {
        const categoryIDs: CategoryLabelID[] = [MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS];
        const countersByLabelId: { [labelID: string]: LabelCount } = {
            [MAILBOX_LABEL_IDS.INBOX]: { Unread: 100 },
            [MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS]: { Unread: 10 },
        };
        expect(getUnreadCountForLabel(MAILBOX_LABEL_IDS.INBOX, categoryIDs, countersByLabelId)).toBe(10);
    });
});
