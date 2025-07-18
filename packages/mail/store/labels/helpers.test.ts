import {
    convertCustomViewLabelsToAlmostAllMail,
    getCustomViewFromRoute,
    getFolderName,
    getHumanLabelID,
    getLabelName,
    getLabelNameAnonymised,
    getLabelNames,
    isCategoryLabel,
    isCustomFolder,
    isCustomLabel,
    isCustomLabelOrFolder,
    isHumalLabelIDKey,
    isHumanCustomViewKey,
    isLabelIDNewsletterSubscription,
    isStringHumanLabelID,
    isValidCustomViewLabel,
} from '@proton/mail/store/labels/helpers';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Folder, Label } from '@proton/shared/lib/interfaces';
import { CUSTOM_VIEWS, CUSTOM_VIEWS_LABELS, LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';

const customFolders = [
    { ID: 'customfolder1', Name: 'Custom folder 1' } as Folder,
    { ID: 'customfolder2', Name: 'Custom folder 2' } as Folder,
];
const customLabels = [
    { ID: 'customlabel1', Name: 'Custom label 1' } as Label,
    { ID: 'customlabel2', Name: 'Custom label 2' } as Label,
];

describe('label', () => {
    describe('isCustomLabel', () => {
        it('should detect custom labels', () => {
            expect(isCustomLabel('customlabel1', customLabels)).toBeTruthy();
            expect(isCustomLabel(MAILBOX_LABEL_IDS.INBOX, customLabels)).toBeFalsy();
        });
    });

    describe('isCustomFolder', () => {
        it('should detect custom folders', () => {
            expect(isCustomFolder('customfolder1', customFolders)).toBeTruthy();
            expect(isCustomFolder(MAILBOX_LABEL_IDS.INBOX, customFolders)).toBeFalsy();
        });
    });

    describe('isCustomLabelOrFolder', () => {
        it('should detect custom labels or folders', () => {
            expect(isCustomLabelOrFolder('custom')).toBeTruthy();
            expect(isCustomLabelOrFolder(MAILBOX_LABEL_IDS.INBOX)).toBeFalsy();
        });
    });

    describe('getHumanLabelID', () => {
        it('should return human label ids', () => {
            expect(getHumanLabelID(MAILBOX_LABEL_IDS.INBOX)).toEqual('inbox');
            expect(getHumanLabelID(MAILBOX_LABEL_IDS.ALL_DRAFTS)).toEqual('all-drafts');
            expect(getHumanLabelID(MAILBOX_LABEL_IDS.ALL_SENT)).toEqual('all-sent');
            expect(getHumanLabelID(MAILBOX_LABEL_IDS.TRASH)).toEqual('trash');
            expect(getHumanLabelID(MAILBOX_LABEL_IDS.SPAM)).toEqual('spam');
            expect(getHumanLabelID(MAILBOX_LABEL_IDS.ALL_MAIL)).toEqual('all-mail');
            expect(getHumanLabelID(MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL)).toEqual('almost-all-mail');
            expect(getHumanLabelID(MAILBOX_LABEL_IDS.ARCHIVE)).toEqual('archive');
            expect(getHumanLabelID(MAILBOX_LABEL_IDS.SENT)).toEqual('sent');
            expect(getHumanLabelID(MAILBOX_LABEL_IDS.DRAFTS)).toEqual('drafts');
            expect(getHumanLabelID(MAILBOX_LABEL_IDS.STARRED)).toEqual('starred');
            expect(getHumanLabelID(MAILBOX_LABEL_IDS.OUTBOX)).toEqual('outbox');
            expect(getHumanLabelID(MAILBOX_LABEL_IDS.SCHEDULED)).toEqual('scheduled');
            expect(getHumanLabelID(MAILBOX_LABEL_IDS.SNOOZED)).toEqual('snoozed');

            expect(getHumanLabelID('custom')).toEqual('custom');
        });
    });

    describe('isStringHumanLabelID', () => {
        it('should detect if human label ID', () => {
            expect(isStringHumanLabelID(LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.INBOX])).toBeTruthy();

            expect(isStringHumanLabelID('custom')).toBeFalsy();
        });
    });

    describe('getLabelName', () => {
        it('should return label name', () => {
            expect(getLabelName(MAILBOX_LABEL_IDS.INBOX, customLabels, customFolders)).toEqual('Inbox');
            expect(getLabelName('customlabel1', customLabels, customFolders)).toEqual('Custom label 1');
            expect(getLabelName('customfolder1', customLabels, customFolders)).toEqual('Custom folder 1');
        });
    });

    describe('getLabelNames', () => {
        it('should return undefined when no changes', () => {
            expect(getLabelNames([], customLabels, customFolders)).toBeUndefined();
        });

        it('should return the expected name', () => {
            expect(getLabelNames(['customfolder1'], customLabels, customFolders)).toEqual(['Custom folder 1']);
            expect(getLabelNames(['customlabel2'], customLabels, customFolders)).toEqual(['Custom label 2']);
            expect(getLabelNames(['customlabel2', 'customlabel1'], customLabels, customFolders)).toEqual([
                'Custom label 2',
                'Custom label 1',
            ]);
        });
    });

    describe('getLabelNameAnonymised', () => {
        it('should return anonymised label name for custom folders and labels', () => {
            expect(getLabelNameAnonymised('customLabelID')).toEqual('custom');
        });

        it('should return expected label name for standard folders and labels', () => {
            expect(getLabelNameAnonymised(MAILBOX_LABEL_IDS.INBOX)).toEqual(
                LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.INBOX]
            );
        });
    });

    describe('getFolderName', () => {
        it('should return expected folder name', () => {
            expect(getFolderName(MAILBOX_LABEL_IDS.INBOX, customFolders)).toEqual('Inbox');
            expect(getFolderName('customfolder1', customFolders)).toEqual('Custom folder 1');
        });
    });

    describe('isValidCustomViewLabel', () => {
        it('Should validate custom views from labels', () => {
            expect(isValidCustomViewLabel(CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS)).toBeTruthy();
            expect(isValidCustomViewLabel('not-existing')).toBeFalsy();
        });
    });

    describe('convertCustomLabelsToAlmostAllMail', () => {
        it('should convert custom view labels to ALMOST_ALL_MAIL', () => {
            expect(convertCustomViewLabelsToAlmostAllMail(CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS)).toEqual(
                MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL
            );
        });

        it('should return the original label for non-custom view labels', () => {
            expect(convertCustomViewLabelsToAlmostAllMail('customlabel1')).toEqual('customlabel1');
            expect(convertCustomViewLabelsToAlmostAllMail(MAILBOX_LABEL_IDS.INBOX)).toEqual(MAILBOX_LABEL_IDS.INBOX);
        });
    });

    describe('isNewsletterSubscriptionView', () => {
        it('should detect newsletter subscription view', () => {
            expect(isLabelIDNewsletterSubscription(CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS)).toBeTruthy();
            expect(isLabelIDNewsletterSubscription('not-existing')).toBeFalsy();
        });
    });

    describe('getCustomViewFromRoute', () => {
        it('Should validate custom views from labels', () => {
            expect(
                getCustomViewFromRoute(CUSTOM_VIEWS[CUSTOM_VIEWS_LABELS.NEWSLETTER_SUBSCRIPTIONS].route)
            ).toBeTruthy();
            expect(getCustomViewFromRoute('not-existing')).toBeFalsy();
        });
    });

    describe('isLabelIdKey', () => {
        it('should return true if value is a label ID key', () => {
            const val = isHumalLabelIDKey('0');
            expect(val).toBeTruthy();
        });

        it('should return false if the value is custom folder ID', () => {
            const val = isHumalLabelIDKey('CUSTOM_FOLDER');
            expect(val).toBeFalsy();
        });
    });

    describe('isCustomViewKey', () => {
        it('should return true if the value is the custom newsletter view', () => {
            const val = isHumanCustomViewKey('views/newsletters');
            expect(val).toBeTruthy();
        });

        it('should return false if the value is custom folder ID', () => {
            const val = isHumanCustomViewKey('CUSTOM_FOLDER');
            expect(val).toBeFalsy();
        });
    });

    describe('isCategoryLabel', () => {
        it('should return true if the value is a category label', () => {
            expect(isCategoryLabel(MAILBOX_LABEL_IDS.CATEGORY_SOCIAL)).toBeTruthy();
            expect(isCategoryLabel(MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS)).toBeTruthy();
            expect(isCategoryLabel(MAILBOX_LABEL_IDS.CATEGORY_UPDATES)).toBeTruthy();
        });

        it('should return false if the value is not a category label', () => {
            expect(isCategoryLabel(MAILBOX_LABEL_IDS.INBOX)).toBeFalsy();
            expect(isCategoryLabel(MAILBOX_LABEL_IDS.ALL_DRAFTS)).toBeFalsy();
            expect(isCategoryLabel(MAILBOX_LABEL_IDS.ALL_SENT)).toBeFalsy();
            expect(isCategoryLabel(MAILBOX_LABEL_IDS.TRASH)).toBeFalsy();
            expect(isCategoryLabel(MAILBOX_LABEL_IDS.SPAM)).toBeFalsy();
        });
    });
});
