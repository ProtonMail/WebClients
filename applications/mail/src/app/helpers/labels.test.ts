import {
    getHumanLabelID,
    getLabelNameAnonymised,
    isCategoryLabel,
    isCustomFolder,
    isCustomLabel,
    isCustomLabelOrFolder,
    isHumalLabelIDKey,
    isHumanCustomViewKey,
    isStringHumanLabelID,
    isSystemFolder,
    isSystemLabel,
    isSystemLocation,
} from '@proton/mail/helpers/location';
import type { MessageWithOptionalBody } from '@proton/mail/store/messages/messagesTypes';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Folder, Label } from '@proton/shared/lib/interfaces';
import { CUSTOM_VIEWS, CUSTOM_VIEWS_LABELS, LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';

import type { Conversation } from '../models/conversation';
import {
    applyLabelChangesOnConversation,
    applyLabelChangesOnMessage,
    applyLabelChangesOnOneMessageOfAConversation,
    canMoveAll,
    convertCategoryLabelToCategoryAndInbox,
    convertCustomViewLabelsToAlmostAllMail,
    getCustomViewFromRoute,
    getFolderName,
    getLabelName,
    getLabelNames,
    getSortedChanges,
    isLabelIDNewsletterSubscription,
    isValidCustomViewLabel,
    shouldDisplayTotal,
} from './labels';

const labelID = 'LabelID';

describe('labels', () => {
    describe('applyLabelChangesOnMessage', () => {
        it('should remove a label from a message', () => {
            const input = {
                LabelIDs: [labelID],
            } as unknown as MessageWithOptionalBody;
            const changes = { [labelID]: false };

            const message = applyLabelChangesOnMessage(input, changes);

            expect(message.LabelIDs?.length).toBe(0);
        });

        it('should add a label for a message', () => {
            const input = {
                LabelIDs: [],
            } as unknown as MessageWithOptionalBody;
            const changes = { [labelID]: true };

            const message = applyLabelChangesOnMessage(input, changes);

            expect(message.LabelIDs?.length).toBe(1);
            expect(message.LabelIDs[0]).toBe(labelID);
        });
    });

    describe('applyLabelChangesOnConversation', () => {
        it('should remove a label from a conversation', () => {
            const input = {
                Labels: [{ ID: labelID, ContextNumMessages: 5 }],
            } as Conversation;
            const changes = { [labelID]: false };

            const conversation = applyLabelChangesOnConversation(input, changes);

            expect(conversation.Labels?.length).toBe(0);
        });

        it('should add a label for a conversation', () => {
            const input = {
                ID: 'conversationID',
                Labels: [],
            } as Conversation;
            const changes = { [labelID]: true };

            const conversation = applyLabelChangesOnConversation(input, changes);

            expect(conversation.Labels?.length).toBe(1);
        });
    });

    describe('applyLabelChangesOnOneMessageOfAConversation', () => {
        it('should remove a label from a conversation when remove the label on the last message having it', () => {
            const input = {
                Labels: [{ ID: labelID, ContextNumMessages: 1 }],
            } as Conversation;
            const changes = { [labelID]: false };

            const { updatedConversation } = applyLabelChangesOnOneMessageOfAConversation(input, changes);

            expect(updatedConversation.Labels?.length).toBe(0);
        });

        it('should keep a label from a conversation when remove the label on a message but not the last having it', () => {
            const numMessages = 3;
            const input = {
                Labels: [{ ID: labelID, ContextNumMessages: numMessages }],
            } as Conversation;
            const changes = { [labelID]: false };

            const { updatedConversation } = applyLabelChangesOnOneMessageOfAConversation(input, changes);

            expect(updatedConversation.Labels?.length).toBe(1);
            expect(updatedConversation.Labels?.[0].ContextNumMessages).toBe(numMessages - 1);
        });

        it('should add a label to a conversation when adding the label to the first message having it', () => {
            const input = {
                ID: 'conversationID',
                Labels: [],
            } as Conversation;
            const changes = { [labelID]: true };

            const { updatedConversation } = applyLabelChangesOnOneMessageOfAConversation(input, changes);

            expect(updatedConversation.Labels?.length).toBe(1);
            expect(updatedConversation.Labels?.[0].ContextNumMessages).toBe(1);
        });

        it('should keep a label to a conversation when adding the label to a message but not the first having it', () => {
            const numMessages = 3;
            const input = {
                Labels: [{ ID: labelID, ContextNumMessages: numMessages }],
            } as Conversation;
            const changes = { [labelID]: true };

            const { updatedConversation } = applyLabelChangesOnOneMessageOfAConversation(input, changes);

            expect(updatedConversation.Labels?.length).toBe(1);
            expect(updatedConversation.Labels?.[0].ContextNumMessages).toBe(numMessages + 1);
        });
    });

    describe('shouldDisplayTotal', () => {
        it.each`
            label                           | expectedShouldDisplayTotal
            ${MAILBOX_LABEL_IDS.SCHEDULED}  | ${true}
            ${MAILBOX_LABEL_IDS.INBOX}      | ${false}
            ${MAILBOX_LABEL_IDS.TRASH}      | ${false}
            ${MAILBOX_LABEL_IDS.SPAM}       | ${false}
            ${MAILBOX_LABEL_IDS.ARCHIVE}    | ${false}
            ${MAILBOX_LABEL_IDS.SENT}       | ${false}
            ${MAILBOX_LABEL_IDS.ALL_SENT}   | ${false}
            ${MAILBOX_LABEL_IDS.DRAFTS}     | ${false}
            ${MAILBOX_LABEL_IDS.ALL_DRAFTS} | ${false}
        `(
            'should display the total: [$expectedShouldDisplayTotal] in [$label]',
            async ({ label, expectedShouldDisplayTotal }) => {
                const needsToDisplayTotal = shouldDisplayTotal(label);

                expect(expectedShouldDisplayTotal).toEqual(needsToDisplayTotal);
            }
        );
    });

    describe('canMoveAll', () => {
        it('should not be possible to move all from some locations', () => {
            const locations = [
                MAILBOX_LABEL_IDS.ALL_MAIL,
                MAILBOX_LABEL_IDS.SCHEDULED,
                MAILBOX_LABEL_IDS.ALL_DRAFTS,
                MAILBOX_LABEL_IDS.ALL_SENT,
            ];

            locations.forEach((location) => {
                expect(canMoveAll(location, MAILBOX_LABEL_IDS.TRASH, ['elementID'], [], false));
            });
        });

        it('should not be possible to move all when no elements in location', () => {
            expect(canMoveAll(MAILBOX_LABEL_IDS.SENT, MAILBOX_LABEL_IDS.TRASH, [], [], false));
        });

        it('should not be possible to move all when some elements are selected', () => {
            expect(canMoveAll(MAILBOX_LABEL_IDS.SENT, MAILBOX_LABEL_IDS.TRASH, ['elementID'], ['elementID'], false));
        });

        it('should be possible to move all', () => {
            expect(canMoveAll(MAILBOX_LABEL_IDS.SENT, MAILBOX_LABEL_IDS.TRASH, ['elementID'], [], false));
        });
    });

    describe('getSortedChanges', () => {
        it('should return the expected changes', () => {
            const label1 = 'label1';
            const label2 = 'label2';
            const label3 = 'label3';

            const changes1 = { [label1]: true };
            const changes2 = { [label2]: false };
            const changes3 = { [label2]: true, [label1]: false, [label3]: true };

            const result1 = getSortedChanges(changes1);
            const result2 = getSortedChanges(changes2);
            const result3 = getSortedChanges(changes3);

            expect(result1.toLabel).toEqual([label1]);
            expect(result1.toUnlabel).toEqual([]);

            expect(result2.toLabel).toEqual([]);
            expect(result2.toUnlabel).toEqual([label2]);

            expect(result3.toLabel).toEqual([label2, label3]);
            expect(result3.toUnlabel).toEqual([label1]);
        });
    });
});

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

    describe('isSystemLabel', () => {
        it('should detect system labels', () => {
            expect(isSystemLabel(MAILBOX_LABEL_IDS.INBOX)).toBeFalsy();
            expect(isSystemLabel(MAILBOX_LABEL_IDS.ALL_DRAFTS)).toBeTruthy();
            expect(isSystemLabel(MAILBOX_LABEL_IDS.ALL_SENT)).toBeTruthy();
            expect(isSystemLabel(MAILBOX_LABEL_IDS.TRASH)).toBeFalsy();
            expect(isSystemLabel(MAILBOX_LABEL_IDS.SPAM)).toBeFalsy();
            expect(isSystemLabel(MAILBOX_LABEL_IDS.ALL_MAIL)).toBeTruthy();
            expect(isSystemLabel(MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL)).toBeTruthy();
            expect(isSystemLabel(MAILBOX_LABEL_IDS.ARCHIVE)).toBeFalsy();
            expect(isSystemLabel(MAILBOX_LABEL_IDS.SENT)).toBeFalsy();
            expect(isSystemLabel(MAILBOX_LABEL_IDS.DRAFTS)).toBeFalsy();
            expect(isSystemLabel(MAILBOX_LABEL_IDS.STARRED)).toBeTruthy();
            expect(isSystemLabel(MAILBOX_LABEL_IDS.OUTBOX)).toBeTruthy();
            expect(isSystemLabel(MAILBOX_LABEL_IDS.SCHEDULED)).toBeTruthy();
            expect(isSystemLabel(MAILBOX_LABEL_IDS.SNOOZED)).toBeTruthy();
            expect(isSystemLabel('MY_CUSTOM_LABEL')).toBeFalsy();
        });
    });

    describe('isSystemFolder', () => {
        it('should detect system folders', () => {
            expect(isSystemFolder(MAILBOX_LABEL_IDS.INBOX)).toBeTruthy();
            expect(isSystemFolder(MAILBOX_LABEL_IDS.ALL_SENT)).toBeFalsy();
            expect(isSystemFolder(MAILBOX_LABEL_IDS.ALL_DRAFTS)).toBeFalsy();
            expect(isSystemFolder(MAILBOX_LABEL_IDS.TRASH)).toBeTruthy();
            expect(isSystemFolder(MAILBOX_LABEL_IDS.SPAM)).toBeTruthy();
            expect(isSystemFolder(MAILBOX_LABEL_IDS.ALL_MAIL)).toBeFalsy();
            expect(isSystemFolder(MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL)).toBeFalsy();
            expect(isSystemFolder(MAILBOX_LABEL_IDS.ARCHIVE)).toBeTruthy();
            expect(isSystemFolder(MAILBOX_LABEL_IDS.SENT)).toBeTruthy();
            expect(isSystemFolder(MAILBOX_LABEL_IDS.DRAFTS)).toBeTruthy();
            expect(isSystemFolder(MAILBOX_LABEL_IDS.STARRED)).toBeFalsy();
            expect(isSystemFolder(MAILBOX_LABEL_IDS.OUTBOX)).toBeFalsy();
            expect(isSystemFolder(MAILBOX_LABEL_IDS.SCHEDULED)).toBeFalsy();
            expect(isSystemFolder(MAILBOX_LABEL_IDS.SNOOZED)).toBeFalsy();
            expect(isSystemFolder('MY_CUSTOM_FOLDER')).toBeFalsy();
        });
    });

    describe('isSystemLocation', () => {
        it('should detect system locations', () => {
            expect(isSystemLocation(MAILBOX_LABEL_IDS.INBOX)).toBeTruthy();
            expect(isSystemLocation('MY_CUSTOM_FOLDER')).toBeFalsy();
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

    describe('convertCategoryLabelToCategoryAndInbox', () => {
        it('should return an array with inbox and the category', () => {
            expect(convertCategoryLabelToCategoryAndInbox(MAILBOX_LABEL_IDS.CATEGORY_FORUMS, [])).toEqual([
                MAILBOX_LABEL_IDS.INBOX,
                MAILBOX_LABEL_IDS.CATEGORY_FORUMS,
            ]);
        });

        it('should return the spam label ID if fetching from there', () => {
            expect(convertCategoryLabelToCategoryAndInbox(MAILBOX_LABEL_IDS.SPAM, [])).toEqual(MAILBOX_LABEL_IDS.SPAM);
        });

        it('should add disabled categories when fetching from primary location', () => {
            expect(
                convertCategoryLabelToCategoryAndInbox(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, [
                    MAILBOX_LABEL_IDS.CATEGORY_FORUMS,
                ])
            ).toEqual([MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, MAILBOX_LABEL_IDS.CATEGORY_FORUMS]);
        });

        it('should not add disabled categories when fetching from social location', () => {
            expect(
                convertCategoryLabelToCategoryAndInbox(MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, [
                    MAILBOX_LABEL_IDS.CATEGORY_FORUMS,
                ])
            ).toEqual([MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.CATEGORY_SOCIAL]);
        });

        it('should return the custom labelID if fetching from there', () => {
            expect(convertCategoryLabelToCategoryAndInbox('customlabel1', [])).toEqual('customlabel1');
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
});
