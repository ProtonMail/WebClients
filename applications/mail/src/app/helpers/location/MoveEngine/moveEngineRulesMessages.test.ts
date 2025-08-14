import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';

import type { Conversation } from 'proton-mail/models/conversation';
import type { Element } from 'proton-mail/models/element';

import {
    CUSTOM_FOLDER_KEY,
    CUSTOM_LABEL_KEY,
    ERROR_ELEMENT_NOT_MESSAGE,
    MoveEngineRuleResult,
} from './moveEngineInterface';
import {
    messageAllDraftRules,
    messageAllMailRules,
    messageAllSentRules,
    messageAlmostAllMailRules,
    messageArchiveRules,
    messageCategoryRules,
    messageCustomFolderRules,
    messageCustomLabelRules,
    messageDraftRules,
    messageInboxRules,
    messageOutboxRules,
    messageScheduleRules,
    messageSentRules,
    messageSnoozedRules,
    messageSpamRules,
    messageStarredRules,
    messageTrashRules,
} from './moveEngineRulesMessages';

const element = {
    ConversationID: '123',
} as Element;

describe('moveEngineRulesMessages', () => {
    describe('message type tests', () => {
        it.each([
            messageAllDraftRules,
            messageAllSentRules,
            messageArchiveRules,
            messageCategoryRules,
            messageCustomFolderRules,
            messageCustomLabelRules,
            messageDraftRules,
            messageInboxRules,
            messageScheduleRules,
            messageSentRules,
            messageSnoozedRules,
            messageSpamRules,
            messageStarredRules,
            messageTrashRules,
        ])('should throw an error when element is not a message', (run) => {
            const conversation = {} as Conversation;

            expect(() =>
                run({ element: conversation, destinationLabelID: MAILBOX_LABEL_IDS.INBOX, labels: [], folders: [] })
            ).toThrow(ERROR_ELEMENT_NOT_MESSAGE);
        });

        it.each([messageAllMailRules, messageAlmostAllMailRules, messageOutboxRules])(
            'should not have throw an error when element is a not a message',
            (run) => {
                const conversation = {} as Conversation;

                expect(() =>
                    run({ element: conversation, destinationLabelID: MAILBOX_LABEL_IDS.INBOX, labels: [], folders: [] })
                ).not.toThrow();
            }
        );
    });

    describe('elements.LabelIDs tests', () => {
        describe('deny move when LabelIDs contain labelID', () => {
            it.each([
                {
                    name: 'inboxRules',
                    run: messageInboxRules,
                    destinationLabelID: MAILBOX_LABEL_IDS.INBOX,
                    LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
                },
                {
                    name: 'allDraftRules',
                    run: messageAllDraftRules,
                    destinationLabelID: MAILBOX_LABEL_IDS.ALL_DRAFTS,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_DRAFTS],
                },
                {
                    name: 'allSentRules',
                    run: messageAllSentRules,
                    destinationLabelID: MAILBOX_LABEL_IDS.ALL_SENT,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_SENT],
                },
                {
                    name: 'trashRules',
                    run: messageTrashRules,
                    destinationLabelID: MAILBOX_LABEL_IDS.TRASH,
                    LabelIDs: [MAILBOX_LABEL_IDS.TRASH],
                },
                {
                    name: 'spamRules',
                    run: messageSpamRules,
                    destinationLabelID: MAILBOX_LABEL_IDS.SPAM,
                    LabelIDs: [MAILBOX_LABEL_IDS.SPAM],
                },
                {
                    name: 'starredRules',
                    run: messageStarredRules,
                    destinationLabelID: MAILBOX_LABEL_IDS.STARRED,
                    LabelIDs: [MAILBOX_LABEL_IDS.STARRED],
                },
                {
                    name: 'archiveRules',
                    run: messageArchiveRules,
                    destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    LabelIDs: [MAILBOX_LABEL_IDS.ARCHIVE],
                },
                {
                    name: 'sentRules',
                    run: messageSentRules,
                    destinationLabelID: MAILBOX_LABEL_IDS.SENT,
                    LabelIDs: [MAILBOX_LABEL_IDS.SENT],
                },
                {
                    name: 'draftRules',
                    run: messageDraftRules,
                    destinationLabelID: MAILBOX_LABEL_IDS.DRAFTS,
                    LabelIDs: [MAILBOX_LABEL_IDS.DRAFTS],
                },
                {
                    name: 'catRule, default',
                    run: messageCategoryRules,
                    destinationLabelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
                    LabelIDs: [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT],
                },
                {
                    name: 'catRule, forums',
                    run: messageCategoryRules,
                    destinationLabelID: MAILBOX_LABEL_IDS.CATEGORY_FORUMS,
                    LabelIDs: [MAILBOX_LABEL_IDS.CATEGORY_FORUMS],
                },
                {
                    name: 'catRule, social',
                    run: messageCategoryRules,
                    destinationLabelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                    LabelIDs: [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL],
                },
                {
                    name: 'catRule, newsletters',
                    run: messageCategoryRules,
                    destinationLabelID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS,
                    LabelIDs: [MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS],
                },
                {
                    name: 'catRule, promotions',
                    run: messageCategoryRules,
                    destinationLabelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
                    LabelIDs: [MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS],
                },
                {
                    name: 'catRule trans',
                    run: messageCategoryRules,
                    destinationLabelID: MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS,
                    LabelIDs: [MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS],
                },
                {
                    name: 'catRule, updates',
                    run: messageCategoryRules,
                    destinationLabelID: MAILBOX_LABEL_IDS.CATEGORY_UPDATES,
                    LabelIDs: [MAILBOX_LABEL_IDS.CATEGORY_UPDATES],
                },
                {
                    name: 'customFolderRules',
                    run: messageCustomFolderRules,
                    destinationLabelID: CUSTOM_FOLDER_KEY,
                    LabelIDs: [CUSTOM_FOLDER_KEY],
                },
                {
                    name: 'customLabelRules',
                    run: messageCustomLabelRules,
                    destinationLabelID: CUSTOM_LABEL_KEY,
                    LabelIDs: [CUSTOM_LABEL_KEY],
                },
            ])(
                'should return not applicable if the element is in the label, $name',
                ({ run, LabelIDs, destinationLabelID }) => {
                    const result = run({
                        element: {
                            ...element,
                            LabelIDs,
                        },
                        destinationLabelID,
                        labels: [],
                        folders: [],
                    });

                    expect(result).toBe(MoveEngineRuleResult.NOT_APPLICABLE);
                }
            );
        });

        describe('allow when LabelIDs empty', () => {
            it.each([
                { name: 'inboxRules', run: messageInboxRules, destinationLabelID: MAILBOX_LABEL_IDS.INBOX },
                { name: 'allDraftRules', run: messageAllDraftRules, destinationLabelID: MAILBOX_LABEL_IDS.ALL_DRAFTS },
                { name: 'allSentRules', run: messageAllSentRules, destinationLabelID: MAILBOX_LABEL_IDS.ALL_SENT },
                { name: 'trashRules', run: messageTrashRules, destinationLabelID: MAILBOX_LABEL_IDS.TRASH },
                { name: 'spamRules', run: messageSpamRules, destinationLabelID: MAILBOX_LABEL_IDS.SPAM },
                { name: 'starredRules', run: messageStarredRules, destinationLabelID: MAILBOX_LABEL_IDS.STARRED },
                { name: 'archiveRules', run: messageArchiveRules, destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE },
                { name: 'sentRules', run: messageSentRules, destinationLabelID: MAILBOX_LABEL_IDS.SENT },
                { name: 'draftRules', run: messageDraftRules, destinationLabelID: MAILBOX_LABEL_IDS.DRAFTS },
                {
                    name: 'catRule, default',
                    run: messageCategoryRules,
                    destinationLabelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
                },
                {
                    name: 'catRule, forum',
                    run: messageCategoryRules,
                    destinationLabelID: MAILBOX_LABEL_IDS.CATEGORY_FORUMS,
                },
                {
                    name: 'catRule, newsletter',
                    run: messageCategoryRules,
                    destinationLabelID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS,
                },
                {
                    name: 'catRule, promotion',
                    run: messageCategoryRules,
                    destinationLabelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
                },
                {
                    name: 'catRule, social',
                    run: messageCategoryRules,
                    destinationLabelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                },
                {
                    name: 'catRule, transaction',
                    run: messageCategoryRules,
                    destinationLabelID: MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS,
                },
                {
                    name: 'catRule, update',
                    run: messageCategoryRules,
                    destinationLabelID: MAILBOX_LABEL_IDS.CATEGORY_UPDATES,
                },
            ])('should return allow when LabelIDs are empty, $name', ({ run, destinationLabelID }) => {
                const result = run({
                    element: {
                        ...element,
                        LabelIDs: [],
                    },
                    destinationLabelID,
                    labels: [],
                    folders: [],
                });

                expect(result).toBe(MoveEngineRuleResult.ALLOWED);
            });
        });

        describe('allow different LabelIDs config', () => {
            it.each([
                {
                    name: 'inboxRules',
                    run: messageInboxRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_SENT],
                    destinationLabelID: MAILBOX_LABEL_IDS.INBOX,
                },
                {
                    name: 'allDraftRules',
                    run: messageAllDraftRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_SENT],
                    destinationLabelID: MAILBOX_LABEL_IDS.ALL_DRAFTS,
                },
                {
                    name: 'allSentRules',
                    run: messageAllSentRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_DRAFTS],
                    destinationLabelID: MAILBOX_LABEL_IDS.ALL_SENT,
                },
                {
                    name: 'trashRules',
                    run: messageTrashRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_DRAFTS],
                    destinationLabelID: MAILBOX_LABEL_IDS.TRASH,
                },
                {
                    name: 'spamRules',
                    run: messageSpamRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_DRAFTS],
                    destinationLabelID: MAILBOX_LABEL_IDS.SPAM,
                },
                {
                    name: 'starredRules',
                    run: messageStarredRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_DRAFTS],
                    destinationLabelID: MAILBOX_LABEL_IDS.STARRED,
                },
                {
                    name: 'archiveRules',
                    run: messageArchiveRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_DRAFTS],
                    destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                },
                {
                    name: 'sentRules',
                    run: messageSentRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_DRAFTS],
                    destinationLabelID: MAILBOX_LABEL_IDS.SENT,
                },
                {
                    name: 'draftRules',
                    run: messageDraftRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_DRAFTS],
                    destinationLabelID: MAILBOX_LABEL_IDS.DRAFTS,
                },
                {
                    name: 'draftRules',
                    run: messageDraftRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_SENT],
                    destinationLabelID: MAILBOX_LABEL_IDS.DRAFTS,
                },
                {
                    name: 'catRule, default',
                    run: messageCategoryRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_DRAFTS],
                    destinationLabelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
                },
                {
                    name: 'catRule, forum',
                    run: messageCategoryRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_DRAFTS],
                    destinationLabelID: MAILBOX_LABEL_IDS.CATEGORY_FORUMS,
                },
                {
                    name: 'catRule, newsletter',
                    run: messageCategoryRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_DRAFTS],
                    destinationLabelID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS,
                },
                {
                    name: 'catRule, promotion',
                    run: messageCategoryRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_DRAFTS],
                    destinationLabelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
                },
                {
                    name: 'catRule, social',
                    run: messageCategoryRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_DRAFTS],
                    destinationLabelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                },
                {
                    name: 'catRule, transaction',
                    run: messageCategoryRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_DRAFTS],
                    destinationLabelID: MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS,
                },
                {
                    name: 'catRule, update',
                    run: messageCategoryRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_DRAFTS],
                    destinationLabelID: MAILBOX_LABEL_IDS.CATEGORY_UPDATES,
                },
                {
                    name: 'customFolderRules',
                    run: messageCustomFolderRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_DRAFTS],
                    destinationLabelID: CUSTOM_FOLDER_KEY,
                },
                {
                    name: 'customLabelRules',
                    run: messageCustomLabelRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_DRAFTS],
                    destinationLabelID: CUSTOM_LABEL_KEY,
                },
            ])('should return allow with LabelIDs config, $name', ({ run, LabelIDs, destinationLabelID }) => {
                const result = run({
                    element: {
                        ...element,
                        LabelIDs,
                    },
                    destinationLabelID,
                    labels: [],
                    folders: [],
                });

                expect(result).toBe(MoveEngineRuleResult.ALLOWED);
            });
        });
    });

    describe('flag rules', () => {
        it.each([
            {
                name: 'spam rules, draft flag',
                run: messageSpamRules,
                destinationLabelID: MAILBOX_LABEL_IDS.SPAM,
                Flags: MESSAGE_FLAGS.FLAG_INTERNAL,
            },
            {
                name: 'spam rules, sent flag',
                run: messageSpamRules,
                destinationLabelID: MAILBOX_LABEL_IDS.SPAM,
                Flags: MESSAGE_FLAGS.FLAG_SENT,
            },
        ])('should return allowed if the element has the flag $name', ({ run, destinationLabelID, Flags }) => {
            const result = run({
                element: {
                    ...element,
                    LabelIDs: [],
                    Flags,
                },
                destinationLabelID,
                labels: [],
                folders: [],
            });

            expect(result).toBe(MoveEngineRuleResult.ALLOWED);
        });

        it.each([
            {
                name: 'inbox, sent flag',
                run: messageInboxRules,
                destinationLabelID: MAILBOX_LABEL_IDS.INBOX,
                Flags: MESSAGE_FLAGS.FLAG_SENT,
            },
            {
                name: 'inbox, draft flag',
                run: messageInboxRules,
                destinationLabelID: MAILBOX_LABEL_IDS.INBOX,
                Flags: MESSAGE_FLAGS.FLAG_INTERNAL,
            },
            {
                name: 'all draft, sent flag',
                run: messageAllDraftRules,
                destinationLabelID: MAILBOX_LABEL_IDS.ALL_DRAFTS,
                Flags: MESSAGE_FLAGS.FLAG_SENT,
            },
            {
                name: 'all draft, received flag',
                run: messageAllDraftRules,
                destinationLabelID: MAILBOX_LABEL_IDS.ALL_DRAFTS,
                Flags: MESSAGE_FLAGS.FLAG_RECEIVED,
            },
            {
                name: 'all sent rules, draft flag',
                run: messageAllSentRules,
                destinationLabelID: MAILBOX_LABEL_IDS.ALL_SENT,
                Flags: MESSAGE_FLAGS.FLAG_INTERNAL,
            },
            {
                name: 'all sent rules, received flag',
                run: messageAllSentRules,
                destinationLabelID: MAILBOX_LABEL_IDS.ALL_SENT,
                Flags: MESSAGE_FLAGS.FLAG_RECEIVED,
            },
            {
                name: 'sent rules, draft flag',
                run: messageSentRules,
                destinationLabelID: MAILBOX_LABEL_IDS.SENT,
                Flags: MESSAGE_FLAGS.FLAG_INTERNAL,
            },
            {
                name: 'sent rules, received flag',
                run: messageSentRules,
                destinationLabelID: MAILBOX_LABEL_IDS.SENT,
                Flags: MESSAGE_FLAGS.FLAG_RECEIVED,
            },
            {
                name: 'draft rules, sent flag',
                run: messageDraftRules,
                destinationLabelID: MAILBOX_LABEL_IDS.DRAFTS,
                Flags: MESSAGE_FLAGS.FLAG_SENT,
            },
            {
                name: 'draft rules, received flag',
                run: messageDraftRules,
                destinationLabelID: MAILBOX_LABEL_IDS.DRAFTS,
                Flags: MESSAGE_FLAGS.FLAG_RECEIVED,
            },
        ])('should return deny if the element has the flag $name', ({ run, destinationLabelID, Flags }) => {
            const result = run({
                element: {
                    ...element,
                    LabelIDs: [],
                    Flags,
                },
                destinationLabelID,
                labels: [],
                folders: [],
            });

            expect(result).toBe(MoveEngineRuleResult.DENIED);
        });
    });

    describe('unmodifiable folders rules', () => {
        it.each([
            {
                name: 'allMailRules, all mail',
                run: messageAllMailRules,
                LabelIDs: [MAILBOX_LABEL_IDS.ALL_MAIL],
                destinationLabelID: MAILBOX_LABEL_IDS.ALL_MAIL,
            },
            {
                name: 'allMailRules, inbox',
                run: messageAllMailRules,
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
                destinationLabelID: MAILBOX_LABEL_IDS.ALL_MAIL,
            },
            {
                name: 'almostAllMailRules, almost all mail',
                run: messageAlmostAllMailRules,
                LabelIDs: [MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
                destinationLabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
            },
            {
                name: 'almostAllMailRules, inbox',
                run: messageAlmostAllMailRules,
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
                destinationLabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
            },
        ])(
            'should return not applicable if the element is in the label, $name',
            ({ run, LabelIDs, destinationLabelID }) => {
                const result = run({
                    element: {
                        ...element,
                        LabelIDs,
                    },
                    destinationLabelID,
                    labels: [],
                    folders: [],
                });

                expect(result).toBe(MoveEngineRuleResult.NOT_APPLICABLE);
            }
        );

        it.each([
            {
                name: 'outboxRules, outbox',
                run: messageOutboxRules,
                LabelIDs: [MAILBOX_LABEL_IDS.OUTBOX],
                destinationLabelID: MAILBOX_LABEL_IDS.OUTBOX,
            },
            {
                name: 'outboxRules, inbox',
                run: messageOutboxRules,
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
                destinationLabelID: MAILBOX_LABEL_IDS.OUTBOX,
            },
            {
                name: 'scheduleRules, scheduled',
                run: messageScheduleRules,
                LabelIDs: [MAILBOX_LABEL_IDS.SCHEDULED],
                destinationLabelID: MAILBOX_LABEL_IDS.SCHEDULED,
            },
            {
                name: 'scheduleRules, inbox',
                run: messageScheduleRules,
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
                destinationLabelID: MAILBOX_LABEL_IDS.SCHEDULED,
            },
            {
                name: 'snoozedRules, snoozed',
                run: messageSnoozedRules,
                LabelIDs: [MAILBOX_LABEL_IDS.SNOOZED],
                destinationLabelID: MAILBOX_LABEL_IDS.SNOOZED,
            },
            {
                name: 'snoozedRules, inbox',
                run: messageSnoozedRules,
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
                destinationLabelID: MAILBOX_LABEL_IDS.SNOOZED,
            },
        ])('should return denied if the element is in the label, $name', ({ run, LabelIDs, destinationLabelID }) => {
            const result = run({
                element: {
                    ...element,
                    LabelIDs,
                },
                destinationLabelID,
                labels: [],
                folders: [],
            });

            expect(result).toBe(MoveEngineRuleResult.DENIED);
        });
    });

    describe('scheduled message rules', () => {
        it.each([
            {
                name: 'inboxRules, scheduled',
                run: messageInboxRules,
                destinationLabelID: MAILBOX_LABEL_IDS.INBOX,
            },
            {
                name: 'spamRules, scheduled',
                run: messageSpamRules,
                destinationLabelID: MAILBOX_LABEL_IDS.SPAM,
            },
            {
                name: 'archiveRules, scheduled',
                run: messageArchiveRules,
                destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
            },
            {
                name: 'outboxRules, scheduled',
                run: messageOutboxRules,
                destinationLabelID: MAILBOX_LABEL_IDS.OUTBOX,
            },
            {
                name: 'scheduleRules, scheduled',
                run: messageScheduleRules,
                destinationLabelID: MAILBOX_LABEL_IDS.SCHEDULED,
            },
            {
                name: 'snoozedRules, scheduled',
                run: messageSnoozedRules,
                destinationLabelID: MAILBOX_LABEL_IDS.SNOOZED,
            },
            {
                name: 'categoryRules, scheduled',
                run: messageCategoryRules,
                destinationLabelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
            },
        ])('should return denied if the element is scheduled, $name', ({ run, destinationLabelID }) => {
            const result = run({
                element: {
                    ...element,
                    LabelIDs: [MAILBOX_LABEL_IDS.SCHEDULED],
                },
                destinationLabelID,
                labels: [],
                folders: [],
            });

            expect(result).toBe(MoveEngineRuleResult.DENIED);
        });

        it.each([
            {
                name: 'allMailRules, scheduled',
                run: messageAllMailRules,
                destinationLabelID: MAILBOX_LABEL_IDS.ALL_MAIL,
            },
            {
                name: 'almostAllMailRules, scheduled',
                run: messageAlmostAllMailRules,
                destinationLabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
            },
        ])('should return not applicable if the element is scheduled, $name', ({ run, destinationLabelID }) => {
            const result = run({
                element: {
                    ...element,
                    LabelIDs: [MAILBOX_LABEL_IDS.SCHEDULED],
                },
                destinationLabelID,
                labels: [],
                folders: [],
            });

            expect(result).toBe(MoveEngineRuleResult.NOT_APPLICABLE);
        });

        it.each([
            {
                name: 'allSentRules, scheduled',
                run: messageAllSentRules,
                destinationLabelID: MAILBOX_LABEL_IDS.ALL_SENT,
            },
            {
                name: 'allDraftRules, scheduled',
                run: messageAllDraftRules,
                destinationLabelID: MAILBOX_LABEL_IDS.ALL_DRAFTS,
            },
            {
                name: 'trashRules, scheduled',
                run: messageTrashRules,
                destinationLabelID: MAILBOX_LABEL_IDS.TRASH,
            },
            {
                name: 'starredRules, scheduled',
                run: messageStarredRules,
                destinationLabelID: MAILBOX_LABEL_IDS.STARRED,
            },
            {
                name: 'customLabelRules, scheduled',
                run: messageCustomLabelRules,
                destinationLabelID: CUSTOM_LABEL_KEY,
            },
            {
                name: 'sentRules, scheduled',
                run: messageSentRules,
                destinationLabelID: MAILBOX_LABEL_IDS.SENT,
            },
            {
                name: 'draftRules, scheduled',
                run: messageDraftRules,
                destinationLabelID: MAILBOX_LABEL_IDS.DRAFTS,
            },
            {
                name: 'customFolderRules, scheduled',
                run: messageCustomFolderRules,
                destinationLabelID: CUSTOM_FOLDER_KEY,
            },
        ])('should return allowed if the element is scheduled, $name', ({ run, destinationLabelID }) => {
            const result = run({
                element: {
                    ...element,
                    LabelIDs: [MAILBOX_LABEL_IDS.SCHEDULED],
                },
                destinationLabelID,
                labels: [],
                folders: [],
            });

            expect(result).toBe(MoveEngineRuleResult.ALLOWED);
        });
    });
});
