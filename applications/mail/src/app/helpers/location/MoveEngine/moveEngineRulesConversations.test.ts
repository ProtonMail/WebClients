import { describe } from '@jest/globals';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Folder, Label } from '@proton/shared/lib/interfaces';
import { type Message } from '@proton/shared/lib/interfaces/mail/Message';

import {
    ERROR_ELEMENT_NOT_CONVERSATION,
    MoveEngineRuleResult,
} from 'proton-mail/helpers/location/MoveEngine/moveEngineInterface';
import {
    conversationAllDraftRules,
    conversationAllMailRules,
    conversationAllSentRules,
    conversationAlmostAllMailRules,
    conversationArchiveRules,
    conversationCategoryRules,
    conversationCustomFolderRules,
    conversationCustomLabelRules,
    conversationDraftRules,
    conversationInboxRules,
    conversationOutboxRules,
    conversationScheduleRules,
    conversationSentRules,
    conversationSnoozedRules,
    conversationSpamRules,
    conversationStarredRules,
    conversationTrashRules,
} from 'proton-mail/helpers/location/MoveEngine/moveEngineRulesConversations';
import { type Conversation } from 'proton-mail/models/conversation';

const customLabels = [
    { ID: 'customLabelID', Name: 'Custom label' },
    { ID: 'customLabelID2', Name: 'Custom label 2' },
] as Label[];

const customFolders = [
    { ID: 'customFolderID', Name: 'Custom folder' },
    { ID: 'customFolderID2', Name: 'Custom folder 2' },
] as Folder[];

describe('moveEngineConversations', () => {
    describe('Conversation type tests', () => {
        it.each([
            conversationAllDraftRules,
            conversationAllSentRules,
            conversationArchiveRules,
            conversationCategoryRules,
            conversationCustomFolderRules,
            conversationCustomLabelRules,
            conversationDraftRules,
            conversationInboxRules,
            conversationScheduleRules,
            conversationSentRules,
            conversationSnoozedRules,
            conversationSpamRules,
            conversationStarredRules,
            conversationTrashRules,
        ])('should throw an error when element is not a conversation', (run) => {
            const message = { ConversationID: 'conversationID' } as Message;

            expect(() =>
                run({ element: message, targetLabelID: MAILBOX_LABEL_IDS.INBOX, labels: [], folders: [] })
            ).toThrow(ERROR_ELEMENT_NOT_CONVERSATION);
        });
    });

    describe('DENIED actions', () => {
        describe('move to SPAM', () => {
            it('should return allowed when all messages are in all sent', () => {
                const result = conversationSpamRules({
                    element: {
                        NumMessages: 3,
                        Labels: [{ ID: MAILBOX_LABEL_IDS.ALL_SENT, ContextNumMessages: 3 }],
                    } as Conversation,
                    targetLabelID: MAILBOX_LABEL_IDS.SPAM,
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.ALLOWED);
            });

            it('should return allowed when all messages are in all drafts', () => {
                const result = conversationSpamRules({
                    element: {
                        NumMessages: 3,
                        Labels: [{ ID: MAILBOX_LABEL_IDS.ALL_DRAFTS, ContextNumMessages: 3 }],
                    } as Conversation,
                    targetLabelID: MAILBOX_LABEL_IDS.SPAM,
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.ALLOWED);
            });
        });

        describe('move to ARCHIVE', () => {
            it('should return denied when all messages are scheduled', () => {
                const result = conversationArchiveRules({
                    element: {
                        NumMessages: 3,
                        Labels: [{ ID: MAILBOX_LABEL_IDS.SCHEDULED, ContextNumMessages: 3 }],
                    } as Conversation,
                    targetLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.DENIED);
            });
        });

        describe('move to OUTBOX', () => {
            it.each([
                { labelID: MAILBOX_LABEL_IDS.INBOX },
                { labelID: MAILBOX_LABEL_IDS.ALL_DRAFTS },
                { labelID: MAILBOX_LABEL_IDS.ALL_SENT },
                { labelID: MAILBOX_LABEL_IDS.TRASH },
                { labelID: MAILBOX_LABEL_IDS.SPAM },
                { labelID: MAILBOX_LABEL_IDS.ALL_MAIL },
                { labelID: MAILBOX_LABEL_IDS.STARRED },
                { labelID: MAILBOX_LABEL_IDS.ARCHIVE },
                { labelID: MAILBOX_LABEL_IDS.SENT },
                { labelID: MAILBOX_LABEL_IDS.DRAFTS },
                { labelID: MAILBOX_LABEL_IDS.OUTBOX },
                { labelID: MAILBOX_LABEL_IDS.SCHEDULED },
                { labelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL },
                { labelID: MAILBOX_LABEL_IDS.SNOOZED },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_UPDATES },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_FORUMS },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS },
                { labelID: 'customFolderID' },
                { labelID: 'customLabelID' },
            ])('should not be possible to move from $labelID to OUTBOX', ({ labelID }) => {
                const result = conversationOutboxRules({
                    element: {
                        NumMessages: 3,
                        Labels: [{ ID: labelID, ContextNumMessages: 3 }],
                    } as Conversation,
                    targetLabelID: MAILBOX_LABEL_IDS.OUTBOX,
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.DENIED);
            });
        });

        describe('move to SCHEDULED', () => {
            it.each([
                { labelID: MAILBOX_LABEL_IDS.INBOX },
                { labelID: MAILBOX_LABEL_IDS.ALL_DRAFTS },
                { labelID: MAILBOX_LABEL_IDS.ALL_SENT },
                { labelID: MAILBOX_LABEL_IDS.TRASH },
                { labelID: MAILBOX_LABEL_IDS.SPAM },
                { labelID: MAILBOX_LABEL_IDS.ALL_MAIL },
                { labelID: MAILBOX_LABEL_IDS.STARRED },
                { labelID: MAILBOX_LABEL_IDS.ARCHIVE },
                { labelID: MAILBOX_LABEL_IDS.SENT },
                { labelID: MAILBOX_LABEL_IDS.DRAFTS },
                { labelID: MAILBOX_LABEL_IDS.OUTBOX },
                { labelID: MAILBOX_LABEL_IDS.SCHEDULED },
                { labelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL },
                { labelID: MAILBOX_LABEL_IDS.SNOOZED },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_UPDATES },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_FORUMS },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS },
                { labelID: 'customFolderID' },
                { labelID: 'customLabelID' },
            ])('should not be possible to move from $labelID to OUTBOX', ({ labelID }) => {
                const result = conversationScheduleRules({
                    element: {
                        NumMessages: 3,
                        Labels: [{ ID: labelID, ContextNumMessages: 3 }],
                    } as Conversation,
                    targetLabelID: MAILBOX_LABEL_IDS.SCHEDULED,
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.DENIED);
            });
        });

        describe('move to SNOOZED', () => {
            it.each([
                { labelID: MAILBOX_LABEL_IDS.INBOX },
                { labelID: MAILBOX_LABEL_IDS.ALL_DRAFTS },
                { labelID: MAILBOX_LABEL_IDS.ALL_SENT },
                { labelID: MAILBOX_LABEL_IDS.TRASH },
                { labelID: MAILBOX_LABEL_IDS.SPAM },
                { labelID: MAILBOX_LABEL_IDS.ALL_MAIL },
                { labelID: MAILBOX_LABEL_IDS.STARRED },
                { labelID: MAILBOX_LABEL_IDS.ARCHIVE },
                { labelID: MAILBOX_LABEL_IDS.SENT },
                { labelID: MAILBOX_LABEL_IDS.DRAFTS },
                { labelID: MAILBOX_LABEL_IDS.OUTBOX },
                { labelID: MAILBOX_LABEL_IDS.SCHEDULED },
                { labelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL },
                { labelID: MAILBOX_LABEL_IDS.SNOOZED },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_UPDATES },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_FORUMS },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS },
                { labelID: 'customFolderID' },
                { labelID: 'customLabelID' },
            ])('should not be possible to move from $labelID to OUTBOX', ({ labelID }) => {
                const result = conversationSnoozedRules({
                    element: {
                        NumMessages: 3,
                        Labels: [{ ID: labelID, ContextNumMessages: 3 }],
                    } as Conversation,
                    targetLabelID: MAILBOX_LABEL_IDS.SNOOZED,
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.DENIED);
            });
        });
    });

    describe('NOT_APPLICABLE actions', () => {
        describe('Conversation with no label', () => {
            it.each([
                conversationArchiveRules,
                conversationCategoryRules,
                conversationCustomFolderRules,
                conversationCustomLabelRules,
                conversationSpamRules,
                conversationStarredRules,
                conversationTrashRules,
            ])('should return not applicable when conversation has no label', (run) => {
                const conversation = {} as Conversation;

                const result = run({
                    element: conversation,
                    targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                    labels: [],
                    folders: [],
                });

                expect(result).toBe(MoveEngineRuleResult.NOT_APPLICABLE);
            });

            it.each([conversationScheduleRules, conversationSnoozedRules])(
                'should return denied when conversation has no label',
                (run) => {
                    const conversation = {} as Conversation;

                    const result = run({
                        element: conversation,
                        targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                        labels: [],
                        folders: [],
                    });

                    expect(result).toBe(MoveEngineRuleResult.DENIED);
                }
            );
        });

        describe('All message from conversation are in target label ID', () => {
            it.each([
                { name: 'conversationTrashRules', run: conversationTrashRules, targetLabelID: MAILBOX_LABEL_IDS.TRASH },
                { name: 'conversationSpamRules', run: conversationSpamRules, targetLabelID: MAILBOX_LABEL_IDS.SPAM },
                { name: 'allMailRules', run: conversationAllMailRules, targetLabelID: MAILBOX_LABEL_IDS.ALL_MAIL },
                {
                    name: 'conversationStarredRules',
                    run: conversationStarredRules,
                    targetLabelID: MAILBOX_LABEL_IDS.STARRED,
                },
                {
                    name: 'conversationArchiveRules',
                    run: conversationArchiveRules,
                    targetLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                },
                {
                    name: 'conversationAlmostAllMailRules',
                    run: conversationAlmostAllMailRules,
                    targetLabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                },
                {
                    name: 'conversationCategoryRules',
                    run: conversationCategoryRules,
                    targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                },
                {
                    name: 'conversationCategoryRules',
                    run: conversationCategoryRules,
                    targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
                },
                {
                    name: 'conversationCategoryRules',
                    run: conversationCategoryRules,
                    targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_UPDATES,
                },
                {
                    name: 'conversationCategoryRules',
                    run: conversationCategoryRules,
                    targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_FORUMS,
                },
                {
                    name: 'conversationCategoryRules',
                    run: conversationCategoryRules,
                    targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
                },
                {
                    name: 'conversationCategoryRules',
                    run: conversationCategoryRules,
                    targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS,
                },
                {
                    name: 'conversationCategoryRules',
                    run: conversationCategoryRules,
                    targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS,
                },
                {
                    name: 'conversationCustomFolderRules',
                    run: conversationCustomFolderRules,
                    targetLabelID: 'customFolderID',
                },
                {
                    name: 'conversationCustomLabelRules',
                    run: conversationCustomLabelRules,
                    targetLabelID: 'customLabelID',
                },
            ])('should return not applicable when all message are in $name', ({ run, targetLabelID }) => {
                const result = run({
                    element: {
                        NumMessages: 3,
                        Labels: [{ ID: targetLabelID, ContextNumMessages: 3 }],
                    } as Conversation,
                    targetLabelID,
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.NOT_APPLICABLE);
            });

            it.each([
                {
                    name: 'conversationOutboxRules',
                    run: conversationOutboxRules,
                    targetLabelID: MAILBOX_LABEL_IDS.OUTBOX,
                },
                { name: 'scheduledRules', run: conversationScheduleRules, targetLabelID: MAILBOX_LABEL_IDS.SCHEDULED },
                {
                    name: 'conversationSnoozedRules',
                    run: conversationSnoozedRules,
                    targetLabelID: MAILBOX_LABEL_IDS.SNOOZED,
                },
            ])('should return denied when all message are in $name', ({ run, targetLabelID }) => {
                const result = run({
                    element: {
                        NumMessages: 3,
                        Labels: [{ ID: targetLabelID, ContextNumMessages: 3 }],
                    } as Conversation,
                    targetLabelID,
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.DENIED);
            });
        });
    });

    describe('ALLOWED actions', () => {
        describe('move to INBOX', () => {
            it.each([
                { labelID: MAILBOX_LABEL_IDS.TRASH },
                { labelID: MAILBOX_LABEL_IDS.SPAM },
                { labelID: MAILBOX_LABEL_IDS.ALL_MAIL },
                { labelID: MAILBOX_LABEL_IDS.STARRED },
                { labelID: MAILBOX_LABEL_IDS.ARCHIVE },
                { labelID: MAILBOX_LABEL_IDS.SENT },
                { labelID: MAILBOX_LABEL_IDS.DRAFTS },
                { labelID: MAILBOX_LABEL_IDS.OUTBOX },
                { labelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL },
                { labelID: MAILBOX_LABEL_IDS.SNOOZED },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_UPDATES },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_FORUMS },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS },
                { labelID: 'customFolderID' },
                { labelID: 'customLabelID' },
            ])('should be possible to move to INBOX from $labelID', ({ labelID }) => {
                const result = conversationInboxRules({
                    element: {
                        NumMessages: 3,
                        Labels: [{ ID: labelID, ContextNumMessages: 3 }],
                    } as Conversation,
                    targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.ALLOWED);
            });

            it('should be possible to move a conversation containing drafts, scheduled, sent and other messages to INBOX', () => {
                const result = conversationInboxRules({
                    element: {
                        NumMessages: 4,
                        Labels: [
                            { ID: MAILBOX_LABEL_IDS.TRASH, ContextNumMessages: 1 },
                            { ID: MAILBOX_LABEL_IDS.SCHEDULED, ContextNumMessages: 1 },
                            { ID: MAILBOX_LABEL_IDS.SENT, ContextNumMessages: 1 },
                            { ID: MAILBOX_LABEL_IDS.ALL_SENT, ContextNumMessages: 1 },
                            { ID: MAILBOX_LABEL_IDS.DRAFTS, ContextNumMessages: 1 },
                            { ID: MAILBOX_LABEL_IDS.ALL_DRAFTS, ContextNumMessages: 1 },
                        ],
                    } as Conversation,
                    targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.ALLOWED);
            });

            it('should be possible to move conversation with when all messages in ALL_SENT to INBOX', () => {
                const result = conversationInboxRules({
                    element: {
                        NumMessages: 3,
                        Labels: [{ ID: MAILBOX_LABEL_IDS.ALL_SENT, ContextNumMessages: 3 }],
                    } as Conversation,
                    targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.ALLOWED);
            });

            it('should be possible to move conversation with when all messages in ALL_DRAFTS to INBOX', () => {
                const result = conversationInboxRules({
                    element: {
                        NumMessages: 3,
                        Labels: [{ ID: MAILBOX_LABEL_IDS.ALL_DRAFTS, ContextNumMessages: 3 }],
                    } as Conversation,
                    targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.ALLOWED);
            });

            it('should be possible to move conversation with when all messages in SCHEDULED to INBOX', () => {
                const result = conversationInboxRules({
                    element: {
                        NumMessages: 3,
                        Labels: [{ ID: MAILBOX_LABEL_IDS.SCHEDULED, ContextNumMessages: 3 }],
                    } as Conversation,
                    targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.ALLOWED);
            });

            it('should be possible to move a conversation with no received messages TO INBOX', () => {
                const result = conversationInboxRules({
                    element: {
                        NumMessages: 3,
                        Labels: [
                            { ID: MAILBOX_LABEL_IDS.ALL_DRAFTS, ContextNumMessages: 1 },
                            { ID: MAILBOX_LABEL_IDS.ALL_SENT, ContextNumMessages: 1 },
                            { ID: MAILBOX_LABEL_IDS.SCHEDULED, ContextNumMessages: 1 },
                        ],
                    } as Conversation,
                    targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.ALLOWED);
            });
        });

        describe('move to ALL_DRAFTS', () => {
            it('should be possible to move to ALL_DRAFTS when drafts from conversation are not in DRAFTS', () => {
                const result = conversationAllDraftRules({
                    element: {
                        NumMessages: 3,
                        Labels: [
                            { ID: MAILBOX_LABEL_IDS.DRAFTS, ContextNumMessages: 1 },
                            { ID: MAILBOX_LABEL_IDS.ALL_DRAFTS, ContextNumMessages: 3 },
                        ],
                    } as Conversation,
                    targetLabelID: MAILBOX_LABEL_IDS.ALL_DRAFTS,
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.ALLOWED);
            });

            it('should return allowed when no message are draft', () => {
                const result = conversationAllDraftRules({
                    element: {
                        NumMessages: 3,
                        Labels: [{ ID: MAILBOX_LABEL_IDS.INBOX, ContextNumMessages: 3 }],
                    } as Conversation,
                    targetLabelID: MAILBOX_LABEL_IDS.ALL_DRAFTS,
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.ALLOWED);
            });
        });

        describe('move to ALL_SENT', () => {
            it('should be possible to move to ALL_SENT when sent from conversation are not in SENT', () => {
                const result = conversationAllSentRules({
                    element: {
                        NumMessages: 3,
                        Labels: [
                            { ID: MAILBOX_LABEL_IDS.SENT, ContextNumMessages: 1 },
                            { ID: MAILBOX_LABEL_IDS.ALL_SENT, ContextNumMessages: 3 },
                        ],
                    } as Conversation,
                    targetLabelID: MAILBOX_LABEL_IDS.ALL_SENT,
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.ALLOWED);
            });

            it('should return allowed when no message are sent', () => {
                const result = conversationAllSentRules({
                    element: {
                        NumMessages: 3,
                        Labels: [{ ID: MAILBOX_LABEL_IDS.INBOX, ContextNumMessages: 3 }],
                    } as Conversation,
                    targetLabelID: MAILBOX_LABEL_IDS.ALL_SENT,
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.ALLOWED);
            });
        });

        describe('move to TRASH', () => {
            it.each([
                { labelID: MAILBOX_LABEL_IDS.INBOX },
                { labelID: MAILBOX_LABEL_IDS.ALL_DRAFTS },
                { labelID: MAILBOX_LABEL_IDS.ALL_SENT },
                { labelID: MAILBOX_LABEL_IDS.SPAM },
                { labelID: MAILBOX_LABEL_IDS.ALL_MAIL },
                { labelID: MAILBOX_LABEL_IDS.STARRED },
                { labelID: MAILBOX_LABEL_IDS.ARCHIVE },
                { labelID: MAILBOX_LABEL_IDS.SENT },
                { labelID: MAILBOX_LABEL_IDS.DRAFTS },
                { labelID: MAILBOX_LABEL_IDS.OUTBOX },
                { labelID: MAILBOX_LABEL_IDS.SCHEDULED },
                { labelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL },
                { labelID: MAILBOX_LABEL_IDS.SNOOZED },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_UPDATES },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_FORUMS },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS },
                { labelID: 'customFolderID' },
                { labelID: 'customLabelID' },
            ])('should be possible to move to TRASH from $labelID', ({ labelID }) => {
                const result = conversationTrashRules({
                    element: {
                        NumMessages: 3,
                        Labels: [{ ID: labelID, ContextNumMessages: 3 }],
                    } as Conversation,
                    targetLabelID: MAILBOX_LABEL_IDS.TRASH,
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.ALLOWED);
            });
        });

        describe('move to SPAM', () => {
            it.each([
                { labelID: MAILBOX_LABEL_IDS.INBOX },
                { labelID: MAILBOX_LABEL_IDS.TRASH },
                { labelID: MAILBOX_LABEL_IDS.ALL_MAIL },
                { labelID: MAILBOX_LABEL_IDS.STARRED },
                { labelID: MAILBOX_LABEL_IDS.ARCHIVE },
                { labelID: MAILBOX_LABEL_IDS.SENT },
                { labelID: MAILBOX_LABEL_IDS.DRAFTS },
                { labelID: MAILBOX_LABEL_IDS.OUTBOX },
                { labelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL },
                { labelID: MAILBOX_LABEL_IDS.SNOOZED },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_UPDATES },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_FORUMS },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS },
                { labelID: 'customFolderID' },
                { labelID: 'customLabelID' },
            ])('should be possible to move to SPAM from $labelID', ({ labelID }) => {
                const result = conversationSpamRules({
                    element: {
                        NumMessages: 3,
                        Labels: [{ ID: labelID, ContextNumMessages: 3 }],
                    } as Conversation,
                    targetLabelID: MAILBOX_LABEL_IDS.SPAM,
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.ALLOWED);
            });

            it('should be possible to move a conversation containing drafts, scheduled, sent and other messages to SPAM', () => {
                const result = conversationSpamRules({
                    element: {
                        NumMessages: 4,
                        Labels: [
                            { ID: MAILBOX_LABEL_IDS.TRASH, ContextNumMessages: 1 },
                            { ID: MAILBOX_LABEL_IDS.SCHEDULED, ContextNumMessages: 1 },
                            { ID: MAILBOX_LABEL_IDS.SENT, ContextNumMessages: 1 },
                            { ID: MAILBOX_LABEL_IDS.ALL_SENT, ContextNumMessages: 1 },
                            { ID: MAILBOX_LABEL_IDS.DRAFTS, ContextNumMessages: 1 },
                            { ID: MAILBOX_LABEL_IDS.ALL_DRAFTS, ContextNumMessages: 1 },
                        ],
                    } as Conversation,
                    targetLabelID: MAILBOX_LABEL_IDS.SPAM,
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.ALLOWED);
            });

            it('should return ALLOWED when message contains only message in INBOX and messages who cannot be moved to INBOX &', () => {
                const result = conversationSpamRules({
                    element: {
                        NumMessages: 4,
                        Labels: [
                            { ID: MAILBOX_LABEL_IDS.SPAM, ContextNumMessages: 1 },
                            { ID: MAILBOX_LABEL_IDS.ALL_DRAFTS, ContextNumMessages: 1 },
                            { ID: MAILBOX_LABEL_IDS.DRAFTS, ContextNumMessages: 1 },
                            { ID: MAILBOX_LABEL_IDS.SENT, ContextNumMessages: 1 },
                            { ID: MAILBOX_LABEL_IDS.ALL_SENT, ContextNumMessages: 1 },
                            { ID: MAILBOX_LABEL_IDS.SCHEDULED, ContextNumMessages: 1 },
                        ],
                    } as Conversation,
                    targetLabelID: MAILBOX_LABEL_IDS.SPAM,
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.ALLOWED);
            });

            it('should return ALLOWED when moving a conversation with all messages in SCHEDULED to SPAM', () => {
                const result = conversationSpamRules({
                    element: {
                        NumMessages: 3,
                        Labels: [{ ID: MAILBOX_LABEL_IDS.SCHEDULED, ContextNumMessages: 3 }],
                    } as Conversation,
                    targetLabelID: MAILBOX_LABEL_IDS.SPAM,
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.ALLOWED);
            });
        });

        describe('move to STARRED', () => {
            it.each([
                { labelID: MAILBOX_LABEL_IDS.INBOX },
                { labelID: MAILBOX_LABEL_IDS.ALL_DRAFTS },
                { labelID: MAILBOX_LABEL_IDS.ALL_SENT },
                { labelID: MAILBOX_LABEL_IDS.TRASH },
                { labelID: MAILBOX_LABEL_IDS.SPAM },
                { labelID: MAILBOX_LABEL_IDS.ALL_MAIL },
                { labelID: MAILBOX_LABEL_IDS.ARCHIVE },
                { labelID: MAILBOX_LABEL_IDS.SENT },
                { labelID: MAILBOX_LABEL_IDS.DRAFTS },
                { labelID: MAILBOX_LABEL_IDS.OUTBOX },
                { labelID: MAILBOX_LABEL_IDS.SCHEDULED },
                { labelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL },
                { labelID: MAILBOX_LABEL_IDS.SNOOZED },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_UPDATES },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_FORUMS },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS },
                { labelID: 'customFolderID' },
                { labelID: 'customLabelID' },
            ])('should be possible to move to INBOX from $labelID', ({ labelID }) => {
                const result = conversationStarredRules({
                    element: {
                        NumMessages: 3,
                        Labels: [{ ID: labelID, ContextNumMessages: 3 }],
                    } as Conversation,
                    targetLabelID: MAILBOX_LABEL_IDS.STARRED,
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.ALLOWED);
            });
        });

        describe('move to ARCHIVE', () => {
            it.each([
                { labelID: MAILBOX_LABEL_IDS.INBOX },
                { labelID: MAILBOX_LABEL_IDS.ALL_DRAFTS },
                { labelID: MAILBOX_LABEL_IDS.ALL_SENT },
                { labelID: MAILBOX_LABEL_IDS.TRASH },
                { labelID: MAILBOX_LABEL_IDS.SPAM },
                { labelID: MAILBOX_LABEL_IDS.ALL_MAIL },
                { labelID: MAILBOX_LABEL_IDS.STARRED },
                { labelID: MAILBOX_LABEL_IDS.SENT },
                { labelID: MAILBOX_LABEL_IDS.DRAFTS },
                { labelID: MAILBOX_LABEL_IDS.OUTBOX },
                { labelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL },
                { labelID: MAILBOX_LABEL_IDS.SNOOZED },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_UPDATES },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_FORUMS },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS },
                { labelID: 'customFolderID' },
                { labelID: 'customLabelID' },
            ])('should be possible to move to INBOX from $labelID', ({ labelID }) => {
                const result = conversationArchiveRules({
                    element: {
                        NumMessages: 3,
                        Labels: [{ ID: labelID, ContextNumMessages: 3 }],
                    } as Conversation,
                    targetLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.ALLOWED);
            });

            it('should be able to move a conversation containing scheduled and other messages to ARCHIVE', () => {
                const result = conversationArchiveRules({
                    element: {
                        NumMessages: 3,
                        Labels: [
                            { ID: MAILBOX_LABEL_IDS.INBOX, ContextNumMessages: 2 },
                            { ID: MAILBOX_LABEL_IDS.SCHEDULED, ContextNumMessages: 1 },
                        ],
                    } as Conversation,
                    targetLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.ALLOWED);
            });
        });

        describe('move to SENT', () => {
            it('should be possible to move to SENT when sent from conversation are not in SENT', () => {
                const result = conversationSentRules({
                    element: {
                        NumMessages: 3,
                        Labels: [
                            { ID: MAILBOX_LABEL_IDS.SENT, ContextNumMessages: 1 },
                            { ID: MAILBOX_LABEL_IDS.ALL_SENT, ContextNumMessages: 3 },
                        ],
                    } as Conversation,
                    targetLabelID: MAILBOX_LABEL_IDS.SENT,
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.ALLOWED);
            });

            it('should return allowed when no message are sent', () => {
                const result = conversationSentRules({
                    element: {
                        NumMessages: 3,
                        Labels: [{ ID: MAILBOX_LABEL_IDS.INBOX, ContextNumMessages: 3 }],
                    } as Conversation,
                    targetLabelID: MAILBOX_LABEL_IDS.SENT,
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.ALLOWED);
            });
        });

        describe('move to DRAFTS', () => {
            it('should be possible to move to DRAFTS when drafts from conversation are not in DRAFTS', () => {
                const result = conversationDraftRules({
                    element: {
                        NumMessages: 3,
                        Labels: [
                            { ID: MAILBOX_LABEL_IDS.DRAFTS, ContextNumMessages: 1 },
                            { ID: MAILBOX_LABEL_IDS.ALL_DRAFTS, ContextNumMessages: 3 },
                        ],
                    } as Conversation,
                    targetLabelID: MAILBOX_LABEL_IDS.DRAFTS,
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.ALLOWED);
            });

            it('should return allowed when no message are draft', () => {
                const result = conversationDraftRules({
                    element: {
                        NumMessages: 3,
                        Labels: [{ ID: MAILBOX_LABEL_IDS.INBOX, ContextNumMessages: 3 }],
                    } as Conversation,
                    targetLabelID: MAILBOX_LABEL_IDS.DRAFTS,
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.ALLOWED);
            });
        });

        describe('move to CATEGORY', () => {
            it.each([
                { labelID: MAILBOX_LABEL_IDS.INBOX },
                { labelID: MAILBOX_LABEL_IDS.TRASH },
                { labelID: MAILBOX_LABEL_IDS.SPAM },
                { labelID: MAILBOX_LABEL_IDS.ALL_MAIL },
                { labelID: MAILBOX_LABEL_IDS.STARRED },
                { labelID: MAILBOX_LABEL_IDS.ARCHIVE },
                { labelID: MAILBOX_LABEL_IDS.OUTBOX },
                { labelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL },
                { labelID: MAILBOX_LABEL_IDS.SNOOZED },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_UPDATES },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_FORUMS },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS },
                { labelID: 'customFolderID' },
                { labelID: 'customLabelID' },
            ])(
                'should be possible to move to a CATEGORY when drafts from conversation are not in DRAFTS',
                ({ labelID }) => {
                    const result = conversationCategoryRules({
                        element: {
                            NumMessages: 3,
                            Labels: [{ ID: labelID, ContextNumMessages: 3 }],
                        } as Conversation,
                        targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                        labels: customLabels,
                        folders: customFolders,
                    });

                    expect(result).toBe(MoveEngineRuleResult.ALLOWED);
                }
            );

            it('should be possible to move a conversation containing drafts, scheduled, sent and other messages to a CATEGORY', () => {
                const result = conversationCategoryRules({
                    element: {
                        NumMessages: 4,
                        Labels: [
                            { ID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS, ContextNumMessages: 1 },
                            { ID: MAILBOX_LABEL_IDS.SCHEDULED, ContextNumMessages: 1 },
                            { ID: MAILBOX_LABEL_IDS.SENT, ContextNumMessages: 1 },
                            { ID: MAILBOX_LABEL_IDS.ALL_SENT, ContextNumMessages: 1 },
                            { ID: MAILBOX_LABEL_IDS.DRAFTS, ContextNumMessages: 1 },
                            { ID: MAILBOX_LABEL_IDS.ALL_DRAFTS, ContextNumMessages: 1 },
                        ],
                    } as Conversation,
                    targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.ALLOWED);
            });

            it.each([
                { category: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL },
                { category: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS },
                { category: MAILBOX_LABEL_IDS.CATEGORY_UPDATES },
                { category: MAILBOX_LABEL_IDS.CATEGORY_FORUMS },
                { category: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT },
                { category: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS },
                { category: MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS },
            ])('should return ALLOWED when all messages are in all sent', ({ category }) => {
                const result = conversationCategoryRules({
                    element: {
                        NumMessages: 3,
                        Labels: [{ ID: MAILBOX_LABEL_IDS.ALL_SENT, ContextNumMessages: 3 }],
                    } as Conversation,
                    targetLabelID: category,
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.ALLOWED);
            });

            it.each([
                { category: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL },
                { category: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS },
                { category: MAILBOX_LABEL_IDS.CATEGORY_UPDATES },
                { category: MAILBOX_LABEL_IDS.CATEGORY_FORUMS },
                { category: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT },
                { category: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS },
                { category: MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS },
            ])('should return ALLOWED when all messages are in all drafts', ({ category }) => {
                const result = conversationCategoryRules({
                    element: {
                        NumMessages: 3,
                        Labels: [{ ID: MAILBOX_LABEL_IDS.ALL_DRAFTS, ContextNumMessages: 3 }],
                    } as Conversation,
                    targetLabelID: category,
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.ALLOWED);
            });

            it.each([
                { category: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL },
                { category: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS },
                { category: MAILBOX_LABEL_IDS.CATEGORY_UPDATES },
                { category: MAILBOX_LABEL_IDS.CATEGORY_FORUMS },
                { category: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT },
                { category: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS },
                { category: MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS },
            ])('should return ALLOWED when all messages are in scheduled', ({ category }) => {
                const result = conversationCategoryRules({
                    element: {
                        NumMessages: 3,
                        Labels: [{ ID: MAILBOX_LABEL_IDS.SCHEDULED, ContextNumMessages: 3 }],
                    } as Conversation,
                    targetLabelID: category,
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.ALLOWED);
            });

            it.each([
                { category: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL },
                { category: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS },
                { category: MAILBOX_LABEL_IDS.CATEGORY_UPDATES },
                { category: MAILBOX_LABEL_IDS.CATEGORY_FORUMS },
                { category: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT },
                { category: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS },
                { category: MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS },
            ])('should return ALLOWED when all messages are not received', ({ category }) => {
                const result = conversationCategoryRules({
                    element: {
                        NumMessages: 3,
                        Labels: [
                            { ID: MAILBOX_LABEL_IDS.ALL_DRAFTS, ContextNumMessages: 1 },
                            { ID: MAILBOX_LABEL_IDS.ALL_SENT, ContextNumMessages: 1 },
                            { ID: MAILBOX_LABEL_IDS.SCHEDULED, ContextNumMessages: 1 },
                        ],
                    } as Conversation,
                    targetLabelID: category,
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.ALLOWED);
            });
        });

        describe('move to CUSTOM FOLDER', () => {
            it.each([
                { labelID: MAILBOX_LABEL_IDS.INBOX },
                { labelID: MAILBOX_LABEL_IDS.ALL_DRAFTS },
                { labelID: MAILBOX_LABEL_IDS.ALL_SENT },
                { labelID: MAILBOX_LABEL_IDS.TRASH },
                { labelID: MAILBOX_LABEL_IDS.SPAM },
                { labelID: MAILBOX_LABEL_IDS.ALL_MAIL },
                { labelID: MAILBOX_LABEL_IDS.STARRED },
                { labelID: MAILBOX_LABEL_IDS.ARCHIVE },
                { labelID: MAILBOX_LABEL_IDS.SENT },
                { labelID: MAILBOX_LABEL_IDS.DRAFTS },
                { labelID: MAILBOX_LABEL_IDS.OUTBOX },
                { labelID: MAILBOX_LABEL_IDS.SCHEDULED },
                { labelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL },
                { labelID: MAILBOX_LABEL_IDS.SNOOZED },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_UPDATES },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_FORUMS },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS },
                { labelID: 'customFolderID' },
                { labelID: 'customLabelID' },
            ])('should be possible to move to a custom folder from $labelID', ({ labelID }) => {
                const result = conversationCustomFolderRules({
                    element: {
                        NumMessages: 3,
                        Labels: [{ ID: labelID, ContextNumMessages: 3 }],
                    } as Conversation,
                    targetLabelID: 'customFolderID2',
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.ALLOWED);
            });
        });

        describe('move to CUSTOM LABEL', () => {
            it.each([
                { labelID: MAILBOX_LABEL_IDS.INBOX },
                { labelID: MAILBOX_LABEL_IDS.ALL_DRAFTS },
                { labelID: MAILBOX_LABEL_IDS.ALL_SENT },
                { labelID: MAILBOX_LABEL_IDS.TRASH },
                { labelID: MAILBOX_LABEL_IDS.SPAM },
                { labelID: MAILBOX_LABEL_IDS.ALL_MAIL },
                { labelID: MAILBOX_LABEL_IDS.STARRED },
                { labelID: MAILBOX_LABEL_IDS.ARCHIVE },
                { labelID: MAILBOX_LABEL_IDS.SENT },
                { labelID: MAILBOX_LABEL_IDS.DRAFTS },
                { labelID: MAILBOX_LABEL_IDS.OUTBOX },
                { labelID: MAILBOX_LABEL_IDS.SCHEDULED },
                { labelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL },
                { labelID: MAILBOX_LABEL_IDS.SNOOZED },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_UPDATES },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_FORUMS },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS },
                { labelID: MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS },
                { labelID: 'customFolderID' },
                { labelID: 'customLabelID' },
            ])('should be possible to move to a custom label from $labelID', ({ labelID }) => {
                const result = conversationCustomLabelRules({
                    element: {
                        NumMessages: 3,
                        Labels: [{ ID: labelID, ContextNumMessages: 3 }],
                    } as Conversation,
                    targetLabelID: 'customLabelID2',
                    labels: customLabels,
                    folders: customFolders,
                });

                expect(result).toBe(MoveEngineRuleResult.ALLOWED);
            });
        });
    });
});
