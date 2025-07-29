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
    allDraftRules,
    allMailRules,
    allSentRules,
    almostAllMailRules,
    archiveRules,
    categoryRules,
    customFolderRules,
    customLabelRules,
    draftRules,
    inboxRules,
    outboxRules,
    scheduleRules,
    sentRules,
    snoozedRules,
    spamRules,
    starredRules,
    trashRules,
} from './moveEngineRulesMessages';

const element = {
    ConversationID: '123',
} as Element;

describe('moveEngineRulesMessages', () => {
    describe('message type tests', () => {
        it.each([
            allDraftRules,
            allSentRules,
            archiveRules,
            categoryRules,
            customFolderRules,
            customLabelRules,
            draftRules,
            inboxRules,
            scheduleRules,
            sentRules,
            snoozedRules,
            spamRules,
            starredRules,
            trashRules,
        ])('should throw an error when element is not a message', (run) => {
            const conversation = {} as Conversation;

            expect(() =>
                run({ element: conversation, targetLabelID: MAILBOX_LABEL_IDS.INBOX, labels: [], folders: [] })
            ).toThrow(ERROR_ELEMENT_NOT_MESSAGE);
        });

        it.each([allMailRules, almostAllMailRules, outboxRules])(
            'should not have throw an error when element is a not a message',
            (run) => {
                const conversation = {} as Conversation;

                expect(() =>
                    run({ element: conversation, targetLabelID: MAILBOX_LABEL_IDS.INBOX, labels: [], folders: [] })
                ).not.toThrow();
            }
        );
    });

    describe('elements.LabelIDs tests', () => {
        describe('deny move when LabelIDs contain labelID', () => {
            it.each([
                {
                    name: 'inboxRules',
                    run: inboxRules,
                    targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                    LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
                },
                {
                    name: 'allDraftRules',
                    run: allDraftRules,
                    targetLabelID: MAILBOX_LABEL_IDS.ALL_DRAFTS,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_DRAFTS],
                },
                {
                    name: 'allSentRules',
                    run: allSentRules,
                    targetLabelID: MAILBOX_LABEL_IDS.ALL_SENT,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_SENT],
                },
                {
                    name: 'trashRules',
                    run: trashRules,
                    targetLabelID: MAILBOX_LABEL_IDS.TRASH,
                    LabelIDs: [MAILBOX_LABEL_IDS.TRASH],
                },
                {
                    name: 'spamRules',
                    run: spamRules,
                    targetLabelID: MAILBOX_LABEL_IDS.SPAM,
                    LabelIDs: [MAILBOX_LABEL_IDS.SPAM],
                },
                {
                    name: 'starredRules',
                    run: starredRules,
                    targetLabelID: MAILBOX_LABEL_IDS.STARRED,
                    LabelIDs: [MAILBOX_LABEL_IDS.STARRED],
                },
                {
                    name: 'archiveRules',
                    run: archiveRules,
                    targetLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    LabelIDs: [MAILBOX_LABEL_IDS.ARCHIVE],
                },
                {
                    name: 'sentRules',
                    run: sentRules,
                    targetLabelID: MAILBOX_LABEL_IDS.SENT,
                    LabelIDs: [MAILBOX_LABEL_IDS.SENT],
                },
                {
                    name: 'draftRules',
                    run: draftRules,
                    targetLabelID: MAILBOX_LABEL_IDS.DRAFTS,
                    LabelIDs: [MAILBOX_LABEL_IDS.DRAFTS],
                },
                {
                    name: 'catRule, default',
                    run: categoryRules,
                    targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
                    LabelIDs: [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT],
                },
                {
                    name: 'catRule, forums',
                    run: categoryRules,
                    targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_FORUMS,
                    LabelIDs: [MAILBOX_LABEL_IDS.CATEGORY_FORUMS],
                },
                {
                    name: 'catRule, social',
                    run: categoryRules,
                    targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                    LabelIDs: [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL],
                },
                {
                    name: 'catRule, newsletters',
                    run: categoryRules,
                    targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS,
                    LabelIDs: [MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS],
                },
                {
                    name: 'catRule, promotions',
                    run: categoryRules,
                    targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
                    LabelIDs: [MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS],
                },
                {
                    name: 'catRule trans',
                    run: categoryRules,
                    targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS,
                    LabelIDs: [MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS],
                },
                {
                    name: 'catRule, updates',
                    run: categoryRules,
                    targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_UPDATES,
                    LabelIDs: [MAILBOX_LABEL_IDS.CATEGORY_UPDATES],
                },
                {
                    name: 'customFolderRules',
                    run: customFolderRules,
                    targetLabelID: CUSTOM_FOLDER_KEY,
                    LabelIDs: [CUSTOM_FOLDER_KEY],
                },
                {
                    name: 'customLabelRules',
                    run: customLabelRules,
                    targetLabelID: CUSTOM_LABEL_KEY,
                    LabelIDs: [CUSTOM_LABEL_KEY],
                },
            ])(
                'should return not applicable if the element is in the label, $name',
                ({ run, LabelIDs, targetLabelID }) => {
                    const result = run({
                        element: {
                            ...element,
                            LabelIDs,
                        },
                        targetLabelID,
                        labels: [],
                        folders: [],
                    });

                    expect(result).toBe(MoveEngineRuleResult.NOT_APPLICABLE);
                }
            );
        });

        describe('allow when LabelIDs empty', () => {
            it.each([
                { name: 'inboxRules', run: inboxRules, targetLabelID: MAILBOX_LABEL_IDS.INBOX },
                { name: 'allDraftRules', run: allDraftRules, targetLabelID: MAILBOX_LABEL_IDS.ALL_DRAFTS },
                { name: 'allSentRules', run: allSentRules, targetLabelID: MAILBOX_LABEL_IDS.ALL_SENT },
                { name: 'trashRules', run: trashRules, targetLabelID: MAILBOX_LABEL_IDS.TRASH },
                { name: 'spamRules', run: spamRules, targetLabelID: MAILBOX_LABEL_IDS.SPAM },
                { name: 'starredRules', run: starredRules, targetLabelID: MAILBOX_LABEL_IDS.STARRED },
                { name: 'archiveRules', run: archiveRules, targetLabelID: MAILBOX_LABEL_IDS.ARCHIVE },
                { name: 'sentRules', run: sentRules, targetLabelID: MAILBOX_LABEL_IDS.SENT },
                { name: 'draftRules', run: draftRules, targetLabelID: MAILBOX_LABEL_IDS.DRAFTS },
                {
                    name: 'catRule, default',
                    run: categoryRules,
                    targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
                },
                {
                    name: 'catRule, forum',
                    run: categoryRules,
                    targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_FORUMS,
                },
                {
                    name: 'catRule, newsletter',
                    run: categoryRules,
                    targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS,
                },
                {
                    name: 'catRule, promotion',
                    run: categoryRules,
                    targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
                },
                {
                    name: 'catRule, social',
                    run: categoryRules,
                    targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                },
                {
                    name: 'catRule, transaction',
                    run: categoryRules,
                    targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS,
                },
                {
                    name: 'catRule, update',
                    run: categoryRules,
                    targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_UPDATES,
                },
            ])('should return allow when LabelIDs are empty, $name', ({ run, targetLabelID }) => {
                const result = run({
                    element: {
                        ...element,
                        LabelIDs: [],
                    },
                    targetLabelID,
                    labels: [],
                    folders: [],
                });

                expect(result).toBe(MoveEngineRuleResult.ALLOWED);
            });
        });

        describe('allow differnt LabelIDs config', () => {
            it.each([
                {
                    name: 'inboxRules',
                    run: inboxRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_SENT],
                    targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                },
                {
                    name: 'allDraftRules',
                    run: allDraftRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_SENT],
                    targetLabelID: MAILBOX_LABEL_IDS.ALL_DRAFTS,
                },
                {
                    name: 'allSentRules',
                    run: allSentRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_DRAFTS],
                    targetLabelID: MAILBOX_LABEL_IDS.ALL_SENT,
                },
                {
                    name: 'trashRules',
                    run: trashRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_DRAFTS],
                    targetLabelID: MAILBOX_LABEL_IDS.TRASH,
                },
                {
                    name: 'spamRules',
                    run: spamRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_DRAFTS],
                    targetLabelID: MAILBOX_LABEL_IDS.SPAM,
                },
                {
                    name: 'starredRules',
                    run: starredRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_DRAFTS],
                    targetLabelID: MAILBOX_LABEL_IDS.STARRED,
                },
                {
                    name: 'archiveRules',
                    run: archiveRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_DRAFTS],
                    targetLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                },
                {
                    name: 'sentRules',
                    run: sentRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_DRAFTS],
                    targetLabelID: MAILBOX_LABEL_IDS.SENT,
                },
                {
                    name: 'draftRules',
                    run: draftRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_DRAFTS],
                    targetLabelID: MAILBOX_LABEL_IDS.DRAFTS,
                },
                {
                    name: 'draftRules',
                    run: draftRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_SENT],
                    targetLabelID: MAILBOX_LABEL_IDS.DRAFTS,
                },
                {
                    name: 'catRule, default',
                    run: categoryRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_DRAFTS],
                    targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
                },
                {
                    name: 'catRule, forum',
                    run: categoryRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_DRAFTS],
                    targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_FORUMS,
                },
                {
                    name: 'catRule, newsletter',
                    run: categoryRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_DRAFTS],
                    targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS,
                },
                {
                    name: 'catRule, promotion',
                    run: categoryRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_DRAFTS],
                    targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
                },
                {
                    name: 'catRule, social',
                    run: categoryRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_DRAFTS],
                    targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                },
                {
                    name: 'catRule, transaction',
                    run: categoryRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_DRAFTS],
                    targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS,
                },
                {
                    name: 'catRule, update',
                    run: categoryRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_DRAFTS],
                    targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_UPDATES,
                },
                {
                    name: 'customFolderRules',
                    run: customFolderRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_DRAFTS],
                    targetLabelID: CUSTOM_FOLDER_KEY,
                },
                {
                    name: 'customLabelRules',
                    run: customLabelRules,
                    LabelIDs: [MAILBOX_LABEL_IDS.ALL_DRAFTS],
                    targetLabelID: CUSTOM_LABEL_KEY,
                },
            ])('should return allow with LabelIDs config, $name', ({ run, LabelIDs, targetLabelID }) => {
                const result = run({
                    element: {
                        ...element,
                        LabelIDs,
                    },
                    targetLabelID,
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
                name: 'inbox, sent flag',
                run: inboxRules,
                targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                Flags: MESSAGE_FLAGS.FLAG_SENT,
            },
            {
                name: 'inbox, draft flag',
                run: inboxRules,
                targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                Flags: MESSAGE_FLAGS.FLAG_INTERNAL,
            },
            {
                name: 'all draft, sent flag',
                run: allDraftRules,
                targetLabelID: MAILBOX_LABEL_IDS.ALL_DRAFTS,
                Flags: MESSAGE_FLAGS.FLAG_SENT,
            },
            {
                name: 'all draft, received flag',
                run: allDraftRules,
                targetLabelID: MAILBOX_LABEL_IDS.ALL_DRAFTS,
                Flags: MESSAGE_FLAGS.FLAG_RECEIVED,
            },
            {
                name: 'all sent rules, draft flag',
                run: allSentRules,
                targetLabelID: MAILBOX_LABEL_IDS.ALL_SENT,
                Flags: MESSAGE_FLAGS.FLAG_INTERNAL,
            },
            {
                name: 'all sent rules, received flag',
                run: allSentRules,
                targetLabelID: MAILBOX_LABEL_IDS.ALL_SENT,
                Flags: MESSAGE_FLAGS.FLAG_RECEIVED,
            },
            {
                name: 'smap rules, draft flag',
                run: spamRules,
                targetLabelID: MAILBOX_LABEL_IDS.SPAM,
                Flags: MESSAGE_FLAGS.FLAG_INTERNAL,
            },
            {
                name: 'smap rules, sent flag',
                run: spamRules,
                targetLabelID: MAILBOX_LABEL_IDS.SPAM,
                Flags: MESSAGE_FLAGS.FLAG_SENT,
            },
            {
                name: 'sent rules, draft flag',
                run: sentRules,
                targetLabelID: MAILBOX_LABEL_IDS.SENT,
                Flags: MESSAGE_FLAGS.FLAG_INTERNAL,
            },
            {
                name: 'sent rules, received flag',
                run: sentRules,
                targetLabelID: MAILBOX_LABEL_IDS.SENT,
                Flags: MESSAGE_FLAGS.FLAG_RECEIVED,
            },
            {
                name: 'draft rules, sent flag',
                run: draftRules,
                targetLabelID: MAILBOX_LABEL_IDS.DRAFTS,
                Flags: MESSAGE_FLAGS.FLAG_SENT,
            },
            {
                name: 'draft rules, received flag',
                run: draftRules,
                targetLabelID: MAILBOX_LABEL_IDS.DRAFTS,
                Flags: MESSAGE_FLAGS.FLAG_RECEIVED,
            },
        ])('should return deny if the element has the flag $name', ({ run, targetLabelID, Flags }) => {
            const result = run({
                element: {
                    ...element,
                    LabelIDs: [],
                    Flags,
                },
                targetLabelID,
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
                run: allMailRules,
                LabelIDs: [MAILBOX_LABEL_IDS.ALL_MAIL],
                targetLabelID: MAILBOX_LABEL_IDS.ALL_MAIL,
            },
            {
                name: 'allMailRules, inbox',
                run: allMailRules,
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
                targetLabelID: MAILBOX_LABEL_IDS.ALL_MAIL,
            },

            {
                name: 'outboxRules, outbox',
                run: outboxRules,
                LabelIDs: [MAILBOX_LABEL_IDS.OUTBOX],
                targetLabelID: MAILBOX_LABEL_IDS.OUTBOX,
            },
            {
                name: 'outboxRules, inbox',
                run: outboxRules,
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
                targetLabelID: MAILBOX_LABEL_IDS.OUTBOX,
            },
            {
                name: 'scheduleRules, scheduled',
                run: scheduleRules,
                LabelIDs: [MAILBOX_LABEL_IDS.SCHEDULED],
                targetLabelID: MAILBOX_LABEL_IDS.SCHEDULED,
            },
            {
                name: 'scheduleRules, inbox',
                run: scheduleRules,
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
                targetLabelID: MAILBOX_LABEL_IDS.SCHEDULED,
            },
            {
                name: 'almostAllMailRules, almost all mail',
                run: almostAllMailRules,
                LabelIDs: [MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
                targetLabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
            },
            {
                name: 'almostAllMailRules, inbox',
                run: almostAllMailRules,
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
                targetLabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
            },
            {
                name: 'snoozedRules, snoozed',
                run: snoozedRules,
                LabelIDs: [MAILBOX_LABEL_IDS.SNOOZED],
                targetLabelID: MAILBOX_LABEL_IDS.SNOOZED,
            },
            {
                name: 'snoozedRules, inbox',
                run: snoozedRules,
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX],
                targetLabelID: MAILBOX_LABEL_IDS.SNOOZED,
            },
        ])('should return not applicable if the element is in the label, $name', ({ run, LabelIDs, targetLabelID }) => {
            const result = run({
                element: {
                    ...element,
                    LabelIDs,
                },
                targetLabelID,
                labels: [],
                folders: [],
            });

            expect(result).toBe(MoveEngineRuleResult.NOT_APPLICABLE);
        });
    });

    describe('scheduled message rules', () => {
        describe('should return not applicable if the element is scheduled', () => {
            it.each([
                {
                    name: 'inboxRules, scheduled',
                    run: inboxRules,
                    targetLabelID: MAILBOX_LABEL_IDS.INBOX,
                },

                {
                    name: 'allSentRules, scheduled',
                    run: allSentRules,
                    targetLabelID: MAILBOX_LABEL_IDS.ALL_SENT,
                },
                {
                    name: 'spamRules, scheduled',
                    run: spamRules,
                    targetLabelID: MAILBOX_LABEL_IDS.SPAM,
                },
                {
                    name: 'allMailRules, scheduled',
                    run: allMailRules,
                    targetLabelID: MAILBOX_LABEL_IDS.ALL_MAIL,
                },
                {
                    name: 'archiveRules, scheduled',
                    run: archiveRules,
                    targetLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                },
                {
                    name: 'sentRules, scheduled',
                    run: sentRules,
                    targetLabelID: MAILBOX_LABEL_IDS.SENT,
                },

                {
                    name: 'outboxRules, scheduled',
                    run: outboxRules,
                    targetLabelID: MAILBOX_LABEL_IDS.OUTBOX,
                },
                {
                    name: 'scheduleRules, scheduled',
                    run: scheduleRules,
                    targetLabelID: MAILBOX_LABEL_IDS.SCHEDULED,
                },
                {
                    name: 'almostAllMailRules, scheduled',
                    run: almostAllMailRules,
                    targetLabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                },
                {
                    name: 'snoozedRules, scheduled',
                    run: snoozedRules,
                    targetLabelID: MAILBOX_LABEL_IDS.SNOOZED,
                },
                {
                    name: 'categoryRules, scheduled',
                    run: categoryRules,
                    targetLabelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
                },
                {
                    name: 'customFolderRules, scheduled',
                    run: customFolderRules,
                    targetLabelID: CUSTOM_FOLDER_KEY,
                },
            ])('should return not applicable if the element is scheduled, $name', ({ run, targetLabelID }) => {
                const result = run({
                    element: {
                        ...element,
                        LabelIDs: [MAILBOX_LABEL_IDS.SCHEDULED],
                    },
                    targetLabelID,
                    labels: [],
                    folders: [],
                });

                expect(result).toBe(MoveEngineRuleResult.NOT_APPLICABLE);
            });
        });

        describe('should return allowed if the element is scheduled', () => {
            it.each([
                {
                    name: 'allDraftRules, scheduled',
                    run: allDraftRules,
                    targetLabelID: MAILBOX_LABEL_IDS.ALL_DRAFTS,
                },
                {
                    name: 'trashRules, scheduled',
                    run: trashRules,
                    targetLabelID: MAILBOX_LABEL_IDS.TRASH,
                },
                {
                    name: 'starredRules, scheduled',
                    run: starredRules,
                    targetLabelID: MAILBOX_LABEL_IDS.STARRED,
                },
                {
                    name: 'customLabelRules, scheduled',
                    run: customLabelRules,
                    targetLabelID: CUSTOM_LABEL_KEY,
                },
                {
                    name: 'draftRules, scheduled',
                    run: draftRules,
                    targetLabelID: MAILBOX_LABEL_IDS.DRAFTS,
                },
            ])('should return allowed if the element is scheduled, $name', ({ run, targetLabelID }) => {
                const result = run({
                    element: {
                        ...element,
                        LabelIDs: [MAILBOX_LABEL_IDS.SCHEDULED],
                    },
                    targetLabelID,
                    labels: [],
                    folders: [],
                });

                expect(result).toBe(MoveEngineRuleResult.ALLOWED);
            });
        });
    });
});
