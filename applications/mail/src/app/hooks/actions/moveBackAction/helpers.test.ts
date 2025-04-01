import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Folder, Label } from '@proton/shared/lib/interfaces';

import type { Element } from 'proton-mail/models/element';
import type { ConversationState } from 'proton-mail/store/conversations/conversationsTypes';

import {
    getOpenedElementUpdated,
    hasRemainingItemAfterAction,
    moveOutApplyLabelAction,
    moveOutMoveAction,
    moveOutStarAction,
} from './helpers';

/**
 * Missing tests:
 * MAILBOX_LABEL_IDS.SCHEDULED
 * MAILBOX_LABEL_IDS.SNOOZED
 */

describe('Move back action helpers tests', () => {
    const onBack = jest.fn();

    const labels = [{ ID: 'LABEL_ID' } as Label, { ID: 'LABEL_ID_2' } as Label];
    const folders = [{ ID: 'FOLDER_ID' } as Folder, { ID: 'FOLDER_ID_2' } as Folder];

    beforeEach(() => {
        onBack.mockClear();
    });

    describe('moveOutApplyLabelAction', () => {
        it('should move back if the we remove the label', () => {
            moveOutApplyLabelAction('10', { '10': false }, onBack);
            expect(onBack).toHaveBeenCalled();
        });
        it('should not move back if the we add the label', () => {
            moveOutApplyLabelAction('10', { '10': true }, onBack);
            expect(onBack).not.toHaveBeenCalled();
        });
        it('should not move back since changing another label', () => {
            moveOutApplyLabelAction('10', { '11': false, '12': true }, onBack);
            expect(onBack).not.toHaveBeenCalled();
        });
    });

    describe('moveOutStarAction', () => {
        it('should not move back if source is not star', () => {
            moveOutStarAction('10', false, onBack);
            expect(onBack).not.toHaveBeenCalled();
        });
        it('should not move back if adding a star', () => {
            moveOutStarAction(MAILBOX_LABEL_IDS.STARRED, false, onBack);
            expect(onBack).not.toHaveBeenCalled();
        });
        it('should move back if removing a star', () => {
            moveOutStarAction(MAILBOX_LABEL_IDS.STARRED, true, onBack);
            expect(onBack).toHaveBeenCalled();
        });
    });

    describe('moveOutMoveAction', () => {
        it.each([
            ['10', '10'],
            ['ID', 'LABEL_ID'],
            ['10', MAILBOX_LABEL_IDS.STARRED],
            ['10', MAILBOX_LABEL_IDS.ALL_MAIL],
            ['10', MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
        ])('should return early', (source, destination) => {
            moveOutMoveAction(source, destination, onBack, labels, folders);
            expect(onBack).not.toHaveBeenCalled();
        });

        it.each([
            { destination: MAILBOX_LABEL_IDS.INBOX, expected: false },
            { destination: MAILBOX_LABEL_IDS.ALL_DRAFTS, expected: false },
            { destination: MAILBOX_LABEL_IDS.ALL_SENT, expected: false },
            { destination: MAILBOX_LABEL_IDS.TRASH, expected: true },
            { destination: MAILBOX_LABEL_IDS.SPAM, expected: false },
            { destination: MAILBOX_LABEL_IDS.ALL_MAIL, expected: false },
            { destination: MAILBOX_LABEL_IDS.STARRED, expected: false },
            { destination: MAILBOX_LABEL_IDS.ARCHIVE, expected: true },
            { destination: MAILBOX_LABEL_IDS.SENT, expected: false },
            { destination: MAILBOX_LABEL_IDS.DRAFTS, expected: false },
            { destination: MAILBOX_LABEL_IDS.OUTBOX, expected: true },
            { destination: MAILBOX_LABEL_IDS.SCHEDULED, expected: true },
            { destination: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, expected: false },
            { destination: MAILBOX_LABEL_IDS.SNOOZED, expected: true },
            { destination: 'FOLDER_ID', expected: true },
            { destination: 'LABEL_ID', expected: false },
        ])('should validate DRAFTS logic  $destination', ({ destination, expected }) => {
            moveOutMoveAction(MAILBOX_LABEL_IDS.DRAFTS, destination, onBack, labels, folders);

            if (expected) {
                expect(onBack).toHaveBeenCalled();
            } else {
                expect(onBack).not.toHaveBeenCalled();
            }
        });

        it.each([
            { destination: MAILBOX_LABEL_IDS.INBOX, expected: false },
            { destination: MAILBOX_LABEL_IDS.ALL_DRAFTS, expected: false },
            { destination: MAILBOX_LABEL_IDS.ALL_SENT, expected: false },
            { destination: MAILBOX_LABEL_IDS.TRASH, expected: false },
            { destination: MAILBOX_LABEL_IDS.SPAM, expected: false },
            { destination: MAILBOX_LABEL_IDS.ALL_MAIL, expected: false },
            { destination: MAILBOX_LABEL_IDS.STARRED, expected: false },
            { destination: MAILBOX_LABEL_IDS.ARCHIVE, expected: false },
            { destination: MAILBOX_LABEL_IDS.SENT, expected: false },
            { destination: MAILBOX_LABEL_IDS.DRAFTS, expected: false },
            { destination: MAILBOX_LABEL_IDS.OUTBOX, expected: true },
            { destination: MAILBOX_LABEL_IDS.SCHEDULED, expected: true },
            { destination: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, expected: false },
            { destination: MAILBOX_LABEL_IDS.SNOOZED, expected: true },
            { destination: 'FOLDER_ID', expected: false },
            { destination: 'LABEL_ID', expected: false },
        ])('should validate ALL_DRAFTS logic  $destination', ({ destination, expected }) => {
            moveOutMoveAction(MAILBOX_LABEL_IDS.ALL_DRAFTS, destination, onBack, labels, folders);

            if (expected) {
                expect(onBack).toHaveBeenCalled();
            } else {
                expect(onBack).not.toHaveBeenCalled();
            }
        });

        it.each([
            { destination: MAILBOX_LABEL_IDS.INBOX, expected: false },
            { destination: MAILBOX_LABEL_IDS.ALL_DRAFTS, expected: false },
            { destination: MAILBOX_LABEL_IDS.ALL_SENT, expected: false },
            { destination: MAILBOX_LABEL_IDS.TRASH, expected: true },
            { destination: MAILBOX_LABEL_IDS.SPAM, expected: false },
            { destination: MAILBOX_LABEL_IDS.ALL_MAIL, expected: false },
            { destination: MAILBOX_LABEL_IDS.STARRED, expected: false },
            { destination: MAILBOX_LABEL_IDS.ARCHIVE, expected: true },
            { destination: MAILBOX_LABEL_IDS.SENT, expected: false },
            { destination: MAILBOX_LABEL_IDS.DRAFTS, expected: false },
            { destination: MAILBOX_LABEL_IDS.OUTBOX, expected: true },
            { destination: MAILBOX_LABEL_IDS.SCHEDULED, expected: true },
            { destination: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, expected: false },
            { destination: MAILBOX_LABEL_IDS.SNOOZED, expected: true },
            { destination: 'FOLDER_ID', expected: true },
            { destination: 'LABEL_ID', expected: false },
        ])('should validate SENT logic  $destination', ({ destination, expected }) => {
            moveOutMoveAction(MAILBOX_LABEL_IDS.SENT, destination, onBack, labels, folders);

            if (expected) {
                expect(onBack).toHaveBeenCalled();
            } else {
                expect(onBack).not.toHaveBeenCalled();
            }
        });

        it.each([
            { destination: MAILBOX_LABEL_IDS.INBOX, expected: false },
            { destination: MAILBOX_LABEL_IDS.ALL_DRAFTS, expected: false },
            { destination: MAILBOX_LABEL_IDS.ALL_SENT, expected: false },
            { destination: MAILBOX_LABEL_IDS.TRASH, expected: false },
            { destination: MAILBOX_LABEL_IDS.SPAM, expected: false },
            { destination: MAILBOX_LABEL_IDS.ALL_MAIL, expected: false },
            { destination: MAILBOX_LABEL_IDS.STARRED, expected: false },
            { destination: MAILBOX_LABEL_IDS.ARCHIVE, expected: false },
            { destination: MAILBOX_LABEL_IDS.SENT, expected: false },
            { destination: MAILBOX_LABEL_IDS.DRAFTS, expected: false },
            { destination: MAILBOX_LABEL_IDS.OUTBOX, expected: true },
            { destination: MAILBOX_LABEL_IDS.SCHEDULED, expected: true },
            { destination: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, expected: false },
            { destination: MAILBOX_LABEL_IDS.SNOOZED, expected: true },
            { destination: 'FOLDER_ID', expected: false },
            { destination: 'LABEL_ID', expected: false },
        ])('should validate ALL_SENT logic  $destination', ({ destination, expected }) => {
            moveOutMoveAction(MAILBOX_LABEL_IDS.ALL_SENT, destination, onBack, labels, folders);

            if (expected) {
                expect(onBack).toHaveBeenCalled();
            } else {
                expect(onBack).not.toHaveBeenCalled();
            }
        });

        it.each([
            { destination: MAILBOX_LABEL_IDS.INBOX, expected: false },
            { destination: MAILBOX_LABEL_IDS.ALL_DRAFTS, expected: false },
            { destination: MAILBOX_LABEL_IDS.ALL_SENT, expected: false },
            { destination: MAILBOX_LABEL_IDS.TRASH, expected: true },
            { destination: MAILBOX_LABEL_IDS.SPAM, expected: true },
            { destination: MAILBOX_LABEL_IDS.ALL_MAIL, expected: false },
            { destination: MAILBOX_LABEL_IDS.STARRED, expected: false },
            { destination: MAILBOX_LABEL_IDS.ARCHIVE, expected: false },
            { destination: MAILBOX_LABEL_IDS.SENT, expected: false },
            { destination: MAILBOX_LABEL_IDS.DRAFTS, expected: false },
            { destination: MAILBOX_LABEL_IDS.OUTBOX, expected: false },
            { destination: MAILBOX_LABEL_IDS.SCHEDULED, expected: false },
            { destination: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, expected: false },
            { destination: MAILBOX_LABEL_IDS.SNOOZED, expected: false },
            { destination: 'FOLDER_ID', expected: false },
            { destination: 'LABEL_ID', expected: false },
        ])('should validate STARRED logic  $destination', ({ destination, expected }) => {
            moveOutMoveAction(MAILBOX_LABEL_IDS.STARRED, destination, onBack, labels, folders);

            if (expected) {
                expect(onBack).toHaveBeenCalled();
            } else {
                expect(onBack).not.toHaveBeenCalled();
            }
        });

        it.each([
            { destination: MAILBOX_LABEL_IDS.INBOX, expected: false },
            { destination: MAILBOX_LABEL_IDS.ALL_DRAFTS, expected: false },
            { destination: MAILBOX_LABEL_IDS.ALL_SENT, expected: false },
            { destination: MAILBOX_LABEL_IDS.TRASH, expected: true },
            { destination: MAILBOX_LABEL_IDS.SPAM, expected: true },
            { destination: MAILBOX_LABEL_IDS.ALL_MAIL, expected: false },
            { destination: MAILBOX_LABEL_IDS.STARRED, expected: false },
            { destination: MAILBOX_LABEL_IDS.ARCHIVE, expected: false },
            { destination: MAILBOX_LABEL_IDS.SENT, expected: false },
            { destination: MAILBOX_LABEL_IDS.DRAFTS, expected: false },
            { destination: MAILBOX_LABEL_IDS.OUTBOX, expected: false },
            { destination: MAILBOX_LABEL_IDS.SCHEDULED, expected: false },
            { destination: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, expected: false },
            { destination: MAILBOX_LABEL_IDS.SNOOZED, expected: false },
            { destination: 'FOLDER_ID', expected: false },
            { destination: 'LABEL_ID', expected: false },
        ])('should validate ALMOST_ALL_MAIL logic  $destination', ({ destination, expected }) => {
            moveOutMoveAction(MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, destination, onBack, labels, folders);

            if (expected) {
                expect(onBack).toHaveBeenCalled();
            } else {
                expect(onBack).not.toHaveBeenCalled();
            }
        });

        it.each([
            { destination: MAILBOX_LABEL_IDS.INBOX, expected: false },
            { destination: MAILBOX_LABEL_IDS.ALL_DRAFTS, expected: false },
            { destination: MAILBOX_LABEL_IDS.ALL_SENT, expected: false },
            { destination: MAILBOX_LABEL_IDS.TRASH, expected: false },
            { destination: MAILBOX_LABEL_IDS.SPAM, expected: false },
            { destination: MAILBOX_LABEL_IDS.ALL_MAIL, expected: false },
            { destination: MAILBOX_LABEL_IDS.STARRED, expected: false },
            { destination: MAILBOX_LABEL_IDS.ARCHIVE, expected: false },
            { destination: MAILBOX_LABEL_IDS.SENT, expected: false },
            { destination: MAILBOX_LABEL_IDS.DRAFTS, expected: false },
            { destination: MAILBOX_LABEL_IDS.OUTBOX, expected: false },
            { destination: MAILBOX_LABEL_IDS.SCHEDULED, expected: false },
            { destination: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, expected: false },
            { destination: MAILBOX_LABEL_IDS.SNOOZED, expected: false },
            { destination: 'FOLDER_ID', expected: false },
            { destination: 'LABEL_ID', expected: false },
        ])('should validate ALL_MAIL logic  $destination', ({ destination, expected }) => {
            moveOutMoveAction(MAILBOX_LABEL_IDS.ALL_MAIL, destination, onBack, labels, folders);

            if (expected) {
                expect(onBack).toHaveBeenCalled();
            } else {
                expect(onBack).not.toHaveBeenCalled();
            }
        });

        it.each([
            { destination: MAILBOX_LABEL_IDS.INBOX, expected: true },
            { destination: MAILBOX_LABEL_IDS.ALL_DRAFTS, expected: true },
            { destination: MAILBOX_LABEL_IDS.ALL_SENT, expected: true },
            { destination: MAILBOX_LABEL_IDS.TRASH, expected: true },
            { destination: MAILBOX_LABEL_IDS.SPAM, expected: false },
            { destination: MAILBOX_LABEL_IDS.ALL_MAIL, expected: false },
            { destination: MAILBOX_LABEL_IDS.STARRED, expected: false },
            { destination: MAILBOX_LABEL_IDS.ARCHIVE, expected: true },
            { destination: MAILBOX_LABEL_IDS.SENT, expected: true },
            { destination: MAILBOX_LABEL_IDS.DRAFTS, expected: true },
            { destination: MAILBOX_LABEL_IDS.OUTBOX, expected: true },
            { destination: MAILBOX_LABEL_IDS.SCHEDULED, expected: true },
            { destination: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, expected: false },
            { destination: MAILBOX_LABEL_IDS.SNOOZED, expected: true },
            { destination: 'FOLDER_ID', expected: true },
            { destination: 'LABEL_ID', expected: false },
        ])('should validate SPAM logic  $destination', ({ destination, expected }) => {
            moveOutMoveAction(MAILBOX_LABEL_IDS.SPAM, destination, onBack, labels, folders);

            if (expected) {
                expect(onBack).toHaveBeenCalled();
            } else {
                expect(onBack).not.toHaveBeenCalled();
            }
        });

        it.each([
            { destination: MAILBOX_LABEL_IDS.INBOX, expected: true },
            { destination: MAILBOX_LABEL_IDS.ALL_DRAFTS, expected: true },
            { destination: MAILBOX_LABEL_IDS.ALL_SENT, expected: true },
            { destination: MAILBOX_LABEL_IDS.TRASH, expected: false },
            { destination: MAILBOX_LABEL_IDS.SPAM, expected: true },
            { destination: MAILBOX_LABEL_IDS.ALL_MAIL, expected: false },
            { destination: MAILBOX_LABEL_IDS.STARRED, expected: false },
            { destination: MAILBOX_LABEL_IDS.ARCHIVE, expected: true },
            { destination: MAILBOX_LABEL_IDS.SENT, expected: true },
            { destination: MAILBOX_LABEL_IDS.DRAFTS, expected: true },
            { destination: MAILBOX_LABEL_IDS.OUTBOX, expected: true },
            { destination: MAILBOX_LABEL_IDS.SCHEDULED, expected: true },
            { destination: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, expected: false },
            { destination: MAILBOX_LABEL_IDS.SNOOZED, expected: true },
            { destination: 'FOLDER_ID', expected: true },
            { destination: 'LABEL_ID', expected: false },
        ])('should validate TRASH logic  $destination', ({ destination, expected }) => {
            moveOutMoveAction(MAILBOX_LABEL_IDS.TRASH, destination, onBack, labels, folders);

            if (expected) {
                expect(onBack).toHaveBeenCalled();
            } else {
                expect(onBack).not.toHaveBeenCalled();
            }
        });

        it.each([
            { destination: MAILBOX_LABEL_IDS.INBOX, expected: false },
            { destination: MAILBOX_LABEL_IDS.TRASH, expected: true },
            { destination: MAILBOX_LABEL_IDS.SPAM, expected: true },
            { destination: MAILBOX_LABEL_IDS.ALL_MAIL, expected: false },
            { destination: MAILBOX_LABEL_IDS.STARRED, expected: false },
            { destination: MAILBOX_LABEL_IDS.ARCHIVE, expected: true },
            { destination: MAILBOX_LABEL_IDS.OUTBOX, expected: true },
            { destination: MAILBOX_LABEL_IDS.SCHEDULED, expected: true },
            { destination: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, expected: false },
            { destination: MAILBOX_LABEL_IDS.SNOOZED, expected: true },
            // TODO we think those folders should reuturn false but they are currently returning true.
            // This should be fixed after making sure that the behavior is correct.
            { destination: MAILBOX_LABEL_IDS.DRAFTS, expected: true },
            { destination: MAILBOX_LABEL_IDS.ALL_DRAFTS, expected: true },
            { destination: MAILBOX_LABEL_IDS.ALL_SENT, expected: true },
            { destination: MAILBOX_LABEL_IDS.SENT, expected: true },
            { destination: 'FOLDER_ID', expected: true },
            { destination: 'LABEL_ID', expected: false },
        ])('should validate INBOX logic  $destination', ({ destination, expected }) => {
            moveOutMoveAction(MAILBOX_LABEL_IDS.INBOX, destination, onBack, labels, folders);

            if (expected) {
                expect(onBack).toHaveBeenCalled();
            } else {
                expect(onBack).not.toHaveBeenCalled();
            }
        });

        it.each([
            { destination: MAILBOX_LABEL_IDS.INBOX, expected: true },
            { destination: MAILBOX_LABEL_IDS.ALL_DRAFTS, expected: true },
            { destination: MAILBOX_LABEL_IDS.ALL_SENT, expected: true },
            { destination: MAILBOX_LABEL_IDS.TRASH, expected: true },
            { destination: MAILBOX_LABEL_IDS.SPAM, expected: true },
            { destination: MAILBOX_LABEL_IDS.ALL_MAIL, expected: false },
            { destination: MAILBOX_LABEL_IDS.STARRED, expected: false },
            { destination: MAILBOX_LABEL_IDS.ARCHIVE, expected: false },
            { destination: MAILBOX_LABEL_IDS.SENT, expected: true },
            { destination: MAILBOX_LABEL_IDS.DRAFTS, expected: true },
            { destination: MAILBOX_LABEL_IDS.OUTBOX, expected: true },
            { destination: MAILBOX_LABEL_IDS.SCHEDULED, expected: true },
            { destination: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, expected: false },
            { destination: MAILBOX_LABEL_IDS.SNOOZED, expected: true },
            { destination: 'FOLDER_ID', expected: true },
            { destination: 'LABEL_ID', expected: false },
        ])('should validate ARCHIVE logic  $destination', ({ destination, expected }) => {
            moveOutMoveAction(MAILBOX_LABEL_IDS.ARCHIVE, destination, onBack, labels, folders);

            if (expected) {
                expect(onBack).toHaveBeenCalled();
            } else {
                expect(onBack).not.toHaveBeenCalled();
            }
        });

        it.each([
            { destination: MAILBOX_LABEL_IDS.INBOX, expected: true },
            { destination: MAILBOX_LABEL_IDS.ALL_DRAFTS, expected: true },
            { destination: MAILBOX_LABEL_IDS.ALL_SENT, expected: true },
            { destination: MAILBOX_LABEL_IDS.TRASH, expected: true },
            { destination: MAILBOX_LABEL_IDS.SPAM, expected: true },
            { destination: MAILBOX_LABEL_IDS.ALL_MAIL, expected: false },
            { destination: MAILBOX_LABEL_IDS.STARRED, expected: false },
            { destination: MAILBOX_LABEL_IDS.ARCHIVE, expected: true },
            { destination: MAILBOX_LABEL_IDS.SENT, expected: true },
            { destination: MAILBOX_LABEL_IDS.DRAFTS, expected: true },
            { destination: MAILBOX_LABEL_IDS.OUTBOX, expected: true },
            { destination: MAILBOX_LABEL_IDS.SCHEDULED, expected: true },
            { destination: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, expected: false },
            { destination: MAILBOX_LABEL_IDS.SNOOZED, expected: true },
            { destination: 'FOLDER_ID', expected: false },
            { destination: 'FOLDER_ID_2', expected: true },
            { destination: 'LABEL_ID', expected: false },
        ])('should validate custom_folder logic  $destination', ({ destination, expected }) => {
            moveOutMoveAction('FOLDER_ID', destination, onBack, labels, folders);

            if (expected) {
                expect(onBack).toHaveBeenCalled();
            } else {
                expect(onBack).not.toHaveBeenCalled();
            }
        });

        it.each([
            { destination: MAILBOX_LABEL_IDS.INBOX, expected: false },
            { destination: MAILBOX_LABEL_IDS.ALL_DRAFTS, expected: false },
            { destination: MAILBOX_LABEL_IDS.ALL_SENT, expected: false },
            { destination: MAILBOX_LABEL_IDS.TRASH, expected: true },
            { destination: MAILBOX_LABEL_IDS.SPAM, expected: true },
            { destination: MAILBOX_LABEL_IDS.ALL_MAIL, expected: false },
            { destination: MAILBOX_LABEL_IDS.STARRED, expected: false },
            { destination: MAILBOX_LABEL_IDS.ARCHIVE, expected: false },
            { destination: MAILBOX_LABEL_IDS.SENT, expected: false },
            { destination: MAILBOX_LABEL_IDS.DRAFTS, expected: false },
            { destination: MAILBOX_LABEL_IDS.OUTBOX, expected: false },
            { destination: MAILBOX_LABEL_IDS.SCHEDULED, expected: false },
            { destination: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, expected: false },
            { destination: MAILBOX_LABEL_IDS.SNOOZED, expected: false },
            { destination: 'FOLDER_ID', expected: false },
            { destination: 'LABEL_ID', expected: false },
            { destination: 'LABEL_ID_2', expected: false },
        ])('should validate custom_label logic  $destination', ({ destination, expected }) => {
            moveOutMoveAction('LABEL_ID', destination, onBack, labels, folders);

            if (expected) {
                expect(onBack).toHaveBeenCalled();
            } else {
                expect(onBack).not.toHaveBeenCalled();
            }
        });
    });

    describe('getOpenedElementUpdated', () => {
        const message = {
            ID: 'ID',
            ConversationID: 'convID',
        } as Element;

        const message2 = {
            ID: 'ID-2',
            ConversationID: 'convID',
        } as Element;

        const conversation = {
            ID: 'ID',
        } as Element;

        const conversation2 = {
            ID: 'ID-2',
        } as Element;

        it('should return undefined if message in message mode is not open', () => {
            expect(getOpenedElementUpdated([message], false, '10')).toBeUndefined();
        });

        it('should return message if message in message mode is open', () => {
            expect(getOpenedElementUpdated([message, message2], false, 'ID')).toStrictEqual(message);
        });

        it('should return undefined if message in conv mode is not open', () => {
            expect(getOpenedElementUpdated([message], true, '10')).toBeUndefined();
        });

        it('should return message if message in conv mode is open', () => {
            expect(getOpenedElementUpdated([message, message2], true, 'convID')).toStrictEqual(message);
        });

        it('should return undefined if conversation in conv mode is not open', () => {
            expect(getOpenedElementUpdated([conversation], true, '10')).toBeUndefined();
        });

        it('should return message if conversation in conv mode is open', () => {
            expect(getOpenedElementUpdated([conversation, conversation2], true, 'ID')).toStrictEqual(conversation);
        });
    });

    describe('hasRemainingItemAfterAction', () => {
        it('should return true if more than 1 elements remain in the conversation', () => {
            expect(
                hasRemainingItemAfterAction('ID', {
                    Conversation: {
                        Labels: [
                            {
                                ID: 'ID',
                                ContextNumMessages: 2,
                            },
                        ],
                    },
                } as ConversationState)
            ).toBeTruthy();
        });

        it('should return false if less or 1 elements remain in the conversation', () => {
            expect(
                hasRemainingItemAfterAction('ID', {
                    Conversation: {
                        Labels: [
                            {
                                ID: 'ID',
                                ContextNumMessages: 1,
                            },
                        ],
                    },
                } as ConversationState)
            ).toBeFalsy();
        });

        it('should return false if no ContextNumMessagesin the conversation', () => {
            expect(
                hasRemainingItemAfterAction('ID', {
                    Conversation: {
                        Labels: [
                            {
                                ID: 'ID',
                            },
                        ],
                    },
                } as ConversationState)
            ).toBeFalsy();
        });

        it('should return false if no conversation state', () => {
            expect(hasRemainingItemAfterAction('ID', undefined)).toBeFalsy();
        });
    });
});
