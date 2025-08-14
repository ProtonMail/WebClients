import type { Draft } from '@reduxjs/toolkit';

import type { ModelState } from '@proton/account/interface';
import { labelMessages } from '@proton/mail/store/counts/messageCountsReducers';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { LabelCount } from '@proton/shared/lib/interfaces';

import {
    CUSTOM_LABEL_ID1,
    checkUpdatedCounters,
    createDefaultCounters,
    customFolders,
    customLabels,
} from '../counts.test.helpers';

describe('message counts - label messages', () => {
    let state: Draft<ModelState<LabelCount[]>>;

    beforeEach(() => {
        state = {
            value: createDefaultCounters(),
            error: null,
            meta: {
                fetchedAt: 0,
                fetchedEphemeral: false,
            },
        };
    });

    describe('Move to TRASH or SPAM', () => {
        it('should decrease ALMOST_ALL_MAIL counters when moving to TRASH, and mark messages as read', () => {
            const message1 = {
                ID: 'message1',
                Unread: 1,
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
            };

            const message2 = {
                ID: 'message2',
                Unread: 0,
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
            };

            labelMessages(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    elements: [message1, message2],
                    sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                    destinationLabelID: MAILBOX_LABEL_IDS.TRASH,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 8 });

            const trashCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.TRASH);
            expect(trashCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.TRASH, Unread: 1, Total: 7 });

            const allMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALL_MAIL);
            expect(allMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Unread: 11, Total: 34 });

            const almostAllMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);
            expect(almostAllMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 9, Total: 22 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.TRASH,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                ],
            });
        });

        it('should decrease STARRED counters when moving to TRASH, and mark messages as read', () => {
            const message1 = {
                ID: 'message1',
                Unread: 1,
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
            };

            const message2 = {
                ID: 'message2',
                Unread: 0,
                LabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.STARRED,
                ],
            };

            labelMessages(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    elements: [message1, message2],
                    sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                    destinationLabelID: MAILBOX_LABEL_IDS.TRASH,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 8 });

            const trashCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.TRASH);
            expect(trashCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.TRASH, Unread: 1, Total: 7 });

            const allMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALL_MAIL);
            expect(allMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Unread: 11, Total: 34 });

            const almostAllMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);
            expect(almostAllMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 9, Total: 22 });

            const starredCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.STARRED);
            expect(starredCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.STARRED, Unread: 1, Total: 1 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.TRASH,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.STARRED,
                ],
            });
        });

        it('should decrease Custom labels counters when moving to TRASH, and mark messages as read', () => {
            const message1 = {
                ID: 'message1',
                Unread: 1,
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
            };

            const message2 = {
                ID: 'message2',
                Unread: 0,
                LabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    CUSTOM_LABEL_ID1,
                ],
            };

            labelMessages(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    elements: [message1, message2],
                    sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                    destinationLabelID: MAILBOX_LABEL_IDS.TRASH,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 8 });

            const trashCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.TRASH);
            expect(trashCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.TRASH, Unread: 1, Total: 7 });

            const allMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALL_MAIL);
            expect(allMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Unread: 11, Total: 34 });

            const almostAllMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);
            expect(almostAllMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 9, Total: 22 });

            const customLabelCount = updatedCounters.find((c) => c.LabelID === CUSTOM_LABEL_ID1);
            expect(customLabelCount).toEqual({ LabelID: CUSTOM_LABEL_ID1, Unread: 1, Total: 1 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.TRASH,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    CUSTOM_LABEL_ID1,
                ],
            });
        });

        it('should decrease ALMOST_ALL_MAIL counters when moving to SPAM', () => {
            const message1 = {
                ID: 'message1',
                Unread: 1,
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
            };

            const message2 = {
                ID: 'message2',
                Unread: 0,
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
            };

            labelMessages(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    elements: [message1, message2],
                    sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                    destinationLabelID: MAILBOX_LABEL_IDS.SPAM,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 8 });

            const spamCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.SPAM);
            expect(spamCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.SPAM, Unread: 1, Total: 7 });

            const allMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALL_MAIL);
            expect(allMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Unread: 12, Total: 34 });

            const almostAllMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);
            expect(almostAllMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 9, Total: 22 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.SPAM,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                ],
            });
        });

        it('should decrease STARRED counters when moving to SPAM', () => {
            const message1 = {
                ID: 'message1',
                Unread: 1,
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
            };

            const message2 = {
                ID: 'message2',
                Unread: 0,
                LabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.STARRED,
                ],
            };

            labelMessages(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    elements: [message1, message2],
                    sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                    destinationLabelID: MAILBOX_LABEL_IDS.SPAM,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 8 });

            const spamCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.SPAM);
            expect(spamCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.SPAM, Unread: 1, Total: 7 });

            const allMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALL_MAIL);
            expect(allMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Unread: 12, Total: 34 });

            const almostAllMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);
            expect(almostAllMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 9, Total: 22 });

            const starredCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.STARRED);
            expect(starredCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.STARRED, Unread: 1, Total: 1 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.SPAM,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.STARRED,
                ],
            });
        });

        it('should decrease Custom labels counters when moving to SPAM', () => {
            const message1 = {
                ID: 'message1',
                Unread: 1,
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
            };

            const message2 = {
                ID: 'message2',
                Unread: 0,
                LabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    CUSTOM_LABEL_ID1,
                ],
            };

            labelMessages(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    elements: [message1, message2],
                    sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                    destinationLabelID: MAILBOX_LABEL_IDS.SPAM,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 8 });

            const spamCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.SPAM);
            expect(spamCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.SPAM, Unread: 1, Total: 7 });

            const allMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALL_MAIL);
            expect(allMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALL_MAIL, Unread: 12, Total: 34 });

            const almostAllMailCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);
            expect(almostAllMailCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL, Unread: 9, Total: 22 });

            const customLabelCount = updatedCounters.find((c) => c.LabelID === CUSTOM_LABEL_ID1);
            expect(customLabelCount).toEqual({ LabelID: CUSTOM_LABEL_ID1, Unread: 1, Total: 1 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.SPAM,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    CUSTOM_LABEL_ID1,
                ],
            });
        });
    });

    describe('Move to STARRED or custom label', () => {
        it('should increase STARRED counters and not update other counters', () => {
            const message1 = {
                ID: 'message1',
                Unread: 1,
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
            };

            const message2 = {
                ID: 'message2',
                Unread: 0,
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
            };

            labelMessages(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    elements: [message1, message2],
                    sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                    destinationLabelID: MAILBOX_LABEL_IDS.STARRED,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const starredCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.STARRED);
            expect(starredCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.STARRED, Unread: 2, Total: 4 });

            checkUpdatedCounters({ updatedCounters, skippedLabelIDs: [MAILBOX_LABEL_IDS.STARRED] });
        });

        it('should increase custom label counters and not update other counters', () => {
            const message1 = {
                ID: 'message1',
                Unread: 1,
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
            };

            const message2 = {
                ID: 'message2',
                Unread: 0,
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
            };

            labelMessages(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    elements: [message1, message2],
                    sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                    destinationLabelID: CUSTOM_LABEL_ID1,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const customLabelCount = updatedCounters.find((c) => c.LabelID === CUSTOM_LABEL_ID1);
            expect(customLabelCount).toEqual({ LabelID: CUSTOM_LABEL_ID1, Unread: 2, Total: 4 });

            checkUpdatedCounters({ updatedCounters, skippedLabelIDs: [CUSTOM_LABEL_ID1] });
        });
    });

    describe('Move to a category', () => {
        it('should increase new category counters, decrease old category counters and not update other counters', () => {
            const message1 = {
                ID: 'message1',
                Unread: 1,
                LabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                ],
            };

            const message2 = {
                ID: 'message2',
                Unread: 0,
                LabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                ],
            };

            labelMessages(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    elements: [message1, message2],
                    sourceLabelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                    destinationLabelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const socialCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.CATEGORY_SOCIAL);
            expect(socialCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, Unread: 0, Total: 0 });

            const promotionsCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS);
            expect(promotionsCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS, Unread: 1, Total: 2 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS],
            });
        });
    });

    describe('Default scenario', () => {
        it('should increase new folder counters, decrease old folder counters', () => {
            const message1 = {
                ID: 'message1',
                Unread: 1,
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
            };

            const message2 = {
                ID: 'message2',
                Unread: 0,
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
            };

            labelMessages(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    elements: [message1, message2],
                    sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                    destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 8 });

            const archiveCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ARCHIVE);
            expect(archiveCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ARCHIVE, Unread: 2, Total: 4 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ARCHIVE],
            });
        });

        it('should not decrease STARRED counters', () => {
            const message1 = {
                ID: 'message1',
                Unread: 1,
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
            };

            const message2 = {
                ID: 'message2',
                Unread: 0,
                LabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.STARRED,
                ],
            };

            labelMessages(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    elements: [message1, message2],
                    sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                    destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 8 });

            const archiveCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ARCHIVE);
            expect(archiveCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ARCHIVE, Unread: 2, Total: 4 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ARCHIVE],
            });
        });

        it('should not decrease Custom label counters', () => {
            const message1 = {
                ID: 'message1',
                Unread: 1,
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
            };

            const message2 = {
                ID: 'message2',
                Unread: 0,
                LabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    CUSTOM_LABEL_ID1,
                ],
            };

            labelMessages(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    elements: [message1, message2],
                    sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                    destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 8 });

            const archiveCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ARCHIVE);
            expect(archiveCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ARCHIVE, Unread: 2, Total: 4 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ARCHIVE],
            });
        });

        it('should not decrease Category counters', () => {
            const message1 = {
                ID: 'message1',
                Unread: 1,
                LabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
            };

            const message2 = {
                ID: 'message2',
                Unread: 0,
                LabelIDs: [
                    MAILBOX_LABEL_IDS.INBOX,
                    MAILBOX_LABEL_IDS.ALL_MAIL,
                    MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL,
                    MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                ],
            };

            labelMessages(state, {
                type: 'mailbox/labelMessages',
                payload: {
                    elements: [message1, message2],
                    sourceLabelID: MAILBOX_LABEL_IDS.INBOX,
                    destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    labels: customLabels,
                    folders: customFolders,
                },
            });

            const updatedCounters = state.value as LabelCount[];

            const inboxCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.INBOX);
            expect(inboxCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 4, Total: 8 });

            const archiveCount = updatedCounters.find((c) => c.LabelID === MAILBOX_LABEL_IDS.ARCHIVE);
            expect(archiveCount).toEqual({ LabelID: MAILBOX_LABEL_IDS.ARCHIVE, Unread: 2, Total: 4 });

            checkUpdatedCounters({
                updatedCounters,
                skippedLabelIDs: [MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ARCHIVE],
            });
        });
    });
});
