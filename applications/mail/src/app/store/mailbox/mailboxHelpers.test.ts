import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Folder, Label } from '@proton/shared/lib/interfaces';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';

import {
    getNotificationTextLabelAdded,
    getNotificationTextLabelRemoved,
    getNotificationTextMarked,
    getNotificationTextStarred,
    getNotificationTextUnstarred,
} from './mailboxHelpers';

const customLabels = [
    {
        ID: 'customlabel1',
        Name: 'Custom label 1',
    } as Label,
];

const customFolders = [
    {
        ID: 'customfolder1',
        Name: 'Custom folder 1',
    } as Folder,
];

describe('mailboxHelpers', () => {
    describe('getNotificationTextMarked', () => {
        describe('message case', () => {
            it('Should return the correct notification text when marking a single message as read', () => {
                const result = getNotificationTextMarked({
                    isMessage: true,
                    elementsCount: 1,
                    status: MARK_AS_STATUS.READ,
                });
                expect(result).toBe('Message marked as read.');
            });

            it('Should return the correct notification text when marking multiple messages as read', () => {
                const result = getNotificationTextMarked({
                    isMessage: true,
                    elementsCount: 2,
                    status: MARK_AS_STATUS.READ,
                });
                expect(result).toBe('2 messages marked as read.');
            });

            it('Should return the correct notification text when marking a single message as unread', () => {
                const result = getNotificationTextMarked({
                    isMessage: true,
                    elementsCount: 1,
                    status: MARK_AS_STATUS.UNREAD,
                });
                expect(result).toBe('Message marked as unread.');
            });

            it('Should return the correct notification text when marking multiple messages as unread', () => {
                const result = getNotificationTextMarked({
                    isMessage: true,
                    elementsCount: 2,
                    status: MARK_AS_STATUS.UNREAD,
                });
                expect(result).toBe('2 messages marked as unread.');
            });
        });

        describe('conversation case', () => {
            it('Should return the correct notification text when marking a single conversation as read', () => {
                const result = getNotificationTextMarked({
                    isMessage: false,
                    elementsCount: 1,
                    status: MARK_AS_STATUS.READ,
                });
                expect(result).toBe('Conversation marked as read.');
            });

            it('Should return the correct notification text when marking multiple conversations as read', () => {
                const result = getNotificationTextMarked({
                    isMessage: false,
                    elementsCount: 2,
                    status: MARK_AS_STATUS.READ,
                });
                expect(result).toBe('2 conversations marked as read.');
            });

            it('Should return the correct notification text when marking a single conversation as unread', () => {
                const result = getNotificationTextMarked({
                    isMessage: false,
                    elementsCount: 1,
                    status: MARK_AS_STATUS.UNREAD,
                });
                expect(result).toBe('Conversation marked as unread.');
            });

            it('Should return the correct notification text when marking multiple conversations as unread', () => {
                const result = getNotificationTextMarked({
                    isMessage: false,
                    elementsCount: 2,
                    status: MARK_AS_STATUS.UNREAD,
                });
                expect(result).toBe('2 conversations marked as unread.');
            });
        });
    });

    describe('getNotificationTextStarred', () => {
        describe('message case', () => {
            it('Should return the correct notification text when starring a single message', () => {
                const result = getNotificationTextStarred({ isMessage: true, elementsCount: 1 });
                expect(result).toBe('Message marked as Starred.');
            });

            it('Should return the correct notification text when starring multiple messages', () => {
                const result = getNotificationTextStarred({ isMessage: true, elementsCount: 2 });
                expect(result).toBe('2 messages marked as Starred.');
            });
        });

        describe('conversation case', () => {
            it('Should return the correct notification text when starring a single conversation', () => {
                const result = getNotificationTextStarred({ isMessage: false, elementsCount: 1 });
                expect(result).toBe('Conversation marked as Starred.');
            });

            it('Should return the correct notification text when starring multiple conversations', () => {
                const result = getNotificationTextStarred({ isMessage: false, elementsCount: 2 });
                expect(result).toBe('2 conversations marked as Starred.');
            });
        });
    });

    describe('getNotificationTextUnstarred', () => {
        describe('message case', () => {
            it('Should return the correct notification text when starring a single message', () => {
                const result = getNotificationTextUnstarred({ isMessage: true, elementsCount: 1 });
                expect(result).toBe('Message removed from Starred.');
            });

            it('Should return the correct notification text when starring multiple messages', () => {
                const result = getNotificationTextUnstarred({ isMessage: true, elementsCount: 2 });
                expect(result).toBe('2 messages removed from Starred.');
            });
        });

        describe('conversation case', () => {
            it('Should return the correct notification text when starring a single conversation', () => {
                const result = getNotificationTextUnstarred({ isMessage: false, elementsCount: 1 });
                expect(result).toBe('Conversation removed from Starred.');
            });

            it('Should return the correct notification text when starring multiple conversations', () => {
                const result = getNotificationTextUnstarred({ isMessage: false, elementsCount: 2 });
                expect(result).toBe('2 conversations removed from Starred.');
            });
        });
    });

    describe('getNotificationTextLabelRemoved', () => {
        describe('starred case', () => {
            it('should return the correct notification when removing a single message from starred', () => {
                const result = getNotificationTextLabelRemoved({
                    isMessage: true,
                    elementsCount: 1,
                    destinationLabelID: MAILBOX_LABEL_IDS.STARRED,
                    folders: [],
                    labels: [],
                });
                expect(result).toBe('Message removed from Starred.');
            });

            it('should return the correct notification when removing multiple messages from starred', () => {
                const result = getNotificationTextLabelRemoved({
                    isMessage: true,
                    elementsCount: 2,
                    destinationLabelID: MAILBOX_LABEL_IDS.STARRED,
                    folders: [],
                    labels: [],
                });
                expect(result).toBe('2 messages removed from Starred.');
            });

            it('should return the correct notification when removing a single conversation from starred', () => {
                const result = getNotificationTextLabelRemoved({
                    isMessage: false,
                    elementsCount: 1,
                    destinationLabelID: MAILBOX_LABEL_IDS.STARRED,
                    folders: [],
                    labels: [],
                });
                expect(result).toBe('Conversation removed from Starred.');
            });

            it('should return the correct notification when removing multiple conversations from starred', () => {
                const result = getNotificationTextLabelRemoved({
                    isMessage: false,
                    elementsCount: 2,
                    destinationLabelID: MAILBOX_LABEL_IDS.STARRED,
                    folders: [],
                    labels: [],
                });
                expect(result).toBe('2 conversations removed from Starred.');
            });
        });

        describe('message case', () => {
            it('should return the correct notification when removing a single message from a system folder', () => {
                const result = getNotificationTextLabelRemoved({
                    isMessage: true,
                    elementsCount: 1,
                    destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    folders: [],
                    labels: [],
                });
                expect(result).toBe('Message removed from Archive.');
            });

            it('should return the correct notification when removing a single message from a custom folder', () => {
                const result = getNotificationTextLabelRemoved({
                    isMessage: true,
                    elementsCount: 1,
                    destinationLabelID: 'customfolder1',
                    folders: customFolders,
                    labels: [],
                });
                expect(result).toBe('Message removed from Custom folder 1.');
            });

            it('should return the correct notification when removing a single messages from a custom label', () => {
                const result = getNotificationTextLabelRemoved({
                    isMessage: true,
                    elementsCount: 1,
                    destinationLabelID: 'customlabel1',
                    folders: [],
                    labels: customLabels,
                });
                expect(result).toBe('Message removed from Custom label 1.');
            });

            it('should return the correct notification when removing a multiple messages from a system folder', () => {
                const result = getNotificationTextLabelRemoved({
                    isMessage: true,
                    elementsCount: 2,
                    destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    folders: [],
                    labels: [],
                });
                expect(result).toBe('2 messages removed from Archive.');
            });

            it('should return the correct notification when removing a multiple messages from a custom folder', () => {
                const result = getNotificationTextLabelRemoved({
                    isMessage: true,
                    elementsCount: 2,
                    destinationLabelID: 'customfolder1',
                    folders: customFolders,
                    labels: [],
                });
                expect(result).toBe('2 messages removed from Custom folder 1.');
            });

            it('should return the correct notification when removing multiple messages from a custom label', () => {
                const result = getNotificationTextLabelRemoved({
                    isMessage: true,
                    elementsCount: 2,
                    destinationLabelID: 'customlabel1',
                    folders: [],
                    labels: customLabels,
                });
                expect(result).toBe('2 messages removed from Custom label 1.');
            });
        });

        describe('conversation case', () => {
            it('should return the correct notification when removing a single conversation from a system folder', () => {
                const result = getNotificationTextLabelRemoved({
                    isMessage: false,
                    elementsCount: 1,
                    destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    folders: [],
                    labels: [],
                });
                expect(result).toBe('Conversation removed from Archive.');
            });

            it('should return the correct notification when removing a single conversation from a custom folder', () => {
                const result = getNotificationTextLabelRemoved({
                    isMessage: false,
                    elementsCount: 1,
                    destinationLabelID: 'customfolder1',
                    folders: customFolders,
                    labels: [],
                });
                expect(result).toBe('Conversation removed from Custom folder 1.');
            });

            it('should return the correct notification when removing a single conversation from a custom label', () => {
                const result = getNotificationTextLabelRemoved({
                    isMessage: false,
                    elementsCount: 1,
                    destinationLabelID: 'customlabel1',
                    folders: [],
                    labels: customLabels,
                });
                expect(result).toBe('Conversation removed from Custom label 1.');
            });

            it('should return the correct notification when removing a multiple conversations from a system folder', () => {
                const result = getNotificationTextLabelRemoved({
                    isMessage: false,
                    elementsCount: 2,
                    destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    folders: [],
                    labels: [],
                });
                expect(result).toBe('2 conversations removed from Archive.');
            });

            it('should return the correct notification when removing a multiple conversations from a custom folder', () => {
                const result = getNotificationTextLabelRemoved({
                    isMessage: false,
                    elementsCount: 2,
                    destinationLabelID: 'customfolder1',
                    folders: customFolders,
                    labels: [],
                });
                expect(result).toBe('2 conversations removed from Custom folder 1.');
            });

            it('should return the correct notification when removing multiple conversations from a custom label', () => {
                const result = getNotificationTextLabelRemoved({
                    isMessage: false,
                    elementsCount: 2,
                    destinationLabelID: 'customlabel1',
                    folders: [],
                    labels: customLabels,
                });
                expect(result).toBe('2 conversations removed from Custom label 1.');
            });
        });
    });

    describe('getNotificationTextLabelAdded', () => {
        describe('starred case', () => {
            it('should return the correct notification when adding a single message to starred', () => {
                const result = getNotificationTextLabelAdded({
                    isMessage: true,
                    elementsCount: 1,
                    destinationLabelID: MAILBOX_LABEL_IDS.STARRED,
                    labels: [],
                    folders: [],
                });
                expect(result).toBe('Message marked as Starred.');
            });

            it('should return the correct notification when adding multiple messages to starred', () => {
                const result = getNotificationTextLabelAdded({
                    isMessage: true,
                    elementsCount: 2,
                    destinationLabelID: MAILBOX_LABEL_IDS.STARRED,
                    labels: [],
                    folders: [],
                });
                expect(result).toBe('2 messages marked as Starred.');
            });

            it('should return the correct notification when adding a single conversation to starred', () => {
                const result = getNotificationTextLabelAdded({
                    isMessage: false,
                    elementsCount: 1,
                    destinationLabelID: MAILBOX_LABEL_IDS.STARRED,
                    labels: [],
                    folders: [],
                });
                expect(result).toBe('Conversation marked as Starred.');
            });

            it('should return the correct notification when adding multiple conversations to starred', () => {
                const result = getNotificationTextLabelAdded({
                    isMessage: false,
                    elementsCount: 2,
                    destinationLabelID: MAILBOX_LABEL_IDS.STARRED,
                    labels: [],
                    folders: [],
                });
                expect(result).toBe('2 conversations marked as Starred.');
            });
        });

        describe('message case', () => {
            it('should return the correct notification when adding a single message to a system folder', () => {
                const result = getNotificationTextLabelAdded({
                    isMessage: true,
                    elementsCount: 1,
                    destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    labels: [],
                    folders: [],
                });
                expect(result).toBe('Message moved to Archive.');
            });

            it('should return the correct notification when adding a single message to a custom folder', () => {
                const result = getNotificationTextLabelAdded({
                    isMessage: true,
                    elementsCount: 1,
                    destinationLabelID: 'customfolder1',
                    labels: [],
                    folders: customFolders,
                });
                expect(result).toBe('Message moved to Custom folder 1.');
            });

            it('should return the correct notification when adding a single messages from a custom label', () => {
                const result = getNotificationTextLabelAdded({
                    isMessage: true,
                    elementsCount: 1,
                    destinationLabelID: 'customlabel1',
                    labels: customLabels,
                    folders: [],
                });
                expect(result).toBe('Message moved to Custom label 1.');
            });

            it('should return the correct notification when adding a multiple messages from a system folder', () => {
                const result = getNotificationTextLabelAdded({
                    isMessage: true,
                    elementsCount: 2,
                    destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    labels: [],
                    folders: [],
                });
                expect(result).toBe('2 messages moved to Archive.');
            });

            it('should return the correct notification when adding a multiple messages from a custom folder', () => {
                const result = getNotificationTextLabelAdded({
                    isMessage: true,
                    elementsCount: 2,
                    destinationLabelID: 'customfolder1',
                    labels: [],
                    folders: customFolders,
                });
                expect(result).toBe('2 messages moved to Custom folder 1.');
            });

            it('should return the correct notification when adding multiple messages from a custom label', () => {
                const result = getNotificationTextLabelAdded({
                    isMessage: true,
                    elementsCount: 2,
                    destinationLabelID: 'customlabel1',
                    labels: customLabels,
                    folders: [],
                });
                expect(result).toBe('2 messages moved to Custom label 1.');
            });
        });

        describe('conversation case', () => {
            it('should return the correct notification when adding a single conversation to a system folder', () => {
                const result = getNotificationTextLabelAdded({
                    isMessage: false,
                    elementsCount: 1,
                    destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    labels: [],
                    folders: [],
                });
                expect(result).toBe('Conversation moved to Archive.');
            });

            it('should return the correct notification when adding a single conversation to a custom folder', () => {
                const result = getNotificationTextLabelAdded({
                    isMessage: false,
                    elementsCount: 1,
                    destinationLabelID: 'customfolder1',
                    labels: [],
                    folders: customFolders,
                });
                expect(result).toBe('Conversation moved to Custom folder 1.');
            });

            it('should return the correct notification when adding a single conversation from a custom label', () => {
                const result = getNotificationTextLabelAdded({
                    isMessage: false,
                    elementsCount: 1,
                    destinationLabelID: 'customlabel1',
                    labels: customLabels,
                    folders: [],
                });
                expect(result).toBe('Conversation moved to Custom label 1.');
            });

            it('should return the correct notification when adding a multiple conversations from a system folder', () => {
                const result = getNotificationTextLabelAdded({
                    isMessage: false,
                    elementsCount: 2,
                    destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
                    labels: [],
                    folders: [],
                });
                expect(result).toBe('2 conversations moved to Archive.');
            });

            it('should return the correct notification when adding a multiple conversations from a custom folder', () => {
                const result = getNotificationTextLabelAdded({
                    isMessage: false,
                    elementsCount: 2,
                    destinationLabelID: 'customfolder1',
                    labels: [],
                    folders: customFolders,
                });
                expect(result).toBe('2 conversations moved to Custom folder 1.');
            });

            it('should return the correct notification when adding multiple conversations from a custom label', () => {
                const result = getNotificationTextLabelAdded({
                    isMessage: false,
                    elementsCount: 2,
                    destinationLabelID: 'customlabel1',
                    labels: customLabels,
                    folders: [],
                });
                expect(result).toBe('2 conversations moved to Custom label 1.');
            });
        });

        describe('spam cases', () => {
            it('should return the correct notification when moving one message to spam', () => {
                const result = getNotificationTextLabelAdded({
                    isMessage: true,
                    elementsCount: 1,
                    destinationLabelID: MAILBOX_LABEL_IDS.SPAM,
                    labels: [],
                    folders: [],
                });
                expect(result).toBe('Message moved to spam and sender added to your spam list.');
            });

            it('should return the correct notification when moving multiple messages to spam', () => {
                const result = getNotificationTextLabelAdded({
                    isMessage: true,
                    elementsCount: 2,
                    destinationLabelID: MAILBOX_LABEL_IDS.SPAM,
                    labels: [],
                    folders: [],
                });
                expect(result).toBe('2 messages moved to spam and senders added to your spam list.');
            });

            it('should return the correct notification when moving one conversation to spam', () => {
                const result = getNotificationTextLabelAdded({
                    isMessage: false,
                    elementsCount: 1,
                    destinationLabelID: MAILBOX_LABEL_IDS.SPAM,
                    labels: [],
                    folders: [],
                });
                expect(result).toBe('Conversation moved to spam and sender added to your spam list.');
            });

            it('should return the correct notification when moving multiple conversations to spam', () => {
                const result = getNotificationTextLabelAdded({
                    isMessage: false,
                    elementsCount: 2,
                    destinationLabelID: MAILBOX_LABEL_IDS.SPAM,
                    labels: [],
                    folders: [],
                });
                expect(result).toBe('2 conversations moved to spam and senders added to your spam list.');
            });
        });
    });
});
