import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { Label } from '@proton/shared/lib/interfaces';
import { Folder } from '@proton/shared/lib/interfaces/Folder';

import { MessageWithOptionalBody } from '../logic/messages/messagesTypes';
import { Conversation } from '../models/conversation';
import {
    applyLabelChangesOnConversation,
    applyLabelChangesOnMessage,
    applyLabelChangesOnOneMessageOfAConversation,
    canMoveAll,
    getLabelNames,
    getSortedChanges,
    shouldDisplayTotal,
} from './labels';

const { INBOX, TRASH, SPAM, ARCHIVE, SENT, ALL_SENT, DRAFTS, ALL_DRAFTS, SCHEDULED, ALL_MAIL } = MAILBOX_LABEL_IDS;

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
            label         | expectedShouldDisplayTotal
            ${SCHEDULED}  | ${true}
            ${INBOX}      | ${false}
            ${TRASH}      | ${false}
            ${SPAM}       | ${false}
            ${ARCHIVE}    | ${false}
            ${SENT}       | ${false}
            ${ALL_SENT}   | ${false}
            ${DRAFTS}     | ${false}
            ${ALL_DRAFTS} | ${false}
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
            const locations = [ALL_MAIL, SCHEDULED, ALL_DRAFTS, ALL_SENT];

            locations.forEach((location) => {
                expect(canMoveAll(location, TRASH, ['elementID'], [], false));
            });
        });

        it('should not be possible to move all when no elements in location', () => {
            expect(canMoveAll(SENT, TRASH, [], [], false));
        });

        it('should not be possible to move all when some elements are selected', () => {
            expect(canMoveAll(SENT, TRASH, ['elementID'], ['elementID'], false));
        });

        it('should be possible to move all', () => {
            expect(canMoveAll(SENT, TRASH, ['elementID'], [], false));
        });
    });

    describe('getLabelNames', () => {
        const folders: Folder[] = [
            { ID: 'folder1', Name: 'Folder 1' } as Folder,
            { ID: 'folder2', Name: 'Folder 2' } as Folder,
        ];

        const labels: Label[] = [
            { ID: 'label1', Name: 'Label 1' } as Label,
            { ID: 'label2', Name: 'Label 2' } as Label,
        ];

        it('should return undefined when no changes', () => {
            expect(getLabelNames([], labels, folders)).toBeUndefined();
        });

        it('should return the expected name', () => {
            expect(getLabelNames(['folder1'], labels, folders)).toEqual(['Folder 1']);
            expect(getLabelNames(['label2'], labels, folders)).toEqual(['Label 2']);
            expect(getLabelNames(['label2', 'label1'], labels, folders)).toEqual(['Label 2', 'Label 1']);
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
