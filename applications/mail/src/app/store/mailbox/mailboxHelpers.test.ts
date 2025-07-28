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
                const result = getNotificationTextMarked(true, 1, MARK_AS_STATUS.READ);
                expect(result).toBe('Message marked as read.');
            });

            it('Should return the correct notification text when marking multiple messages as read', () => {
                const result = getNotificationTextMarked(true, 2, MARK_AS_STATUS.READ);
                expect(result).toBe('2 messages marked as read.');
            });

            it('Should return the correct notification text when marking a single message as unread', () => {
                const result = getNotificationTextMarked(true, 1, MARK_AS_STATUS.UNREAD);
                expect(result).toBe('Message marked as unread.');
            });

            it('Should return the correct notification text when marking multiple messages as unread', () => {
                const result = getNotificationTextMarked(true, 2, MARK_AS_STATUS.UNREAD);
                expect(result).toBe('2 messages marked as unread.');
            });
        });

        describe('conversation case', () => {
            it('Should return the correct notification text when marking a single conversation as read', () => {
                const result = getNotificationTextMarked(false, 1, MARK_AS_STATUS.READ);
                expect(result).toBe('Conversation marked as read.');
            });

            it('Should return the correct notification text when marking multiple conversations as read', () => {
                const result = getNotificationTextMarked(false, 2, MARK_AS_STATUS.READ);
                expect(result).toBe('2 conversations marked as read.');
            });

            it('Should return the correct notification text when marking a single conversation as unread', () => {
                const result = getNotificationTextMarked(false, 1, MARK_AS_STATUS.UNREAD);
                expect(result).toBe('Conversation marked as unread.');
            });

            it('Should return the correct notification text when marking multiple conversations as unread', () => {
                const result = getNotificationTextMarked(false, 2, MARK_AS_STATUS.UNREAD);
                expect(result).toBe('2 conversations marked as unread.');
            });
        });
    });

    describe('getNotificationTextStarred', () => {
        describe('message case', () => {
            it('Should return the correct notification text when starring a single message', () => {
                const result = getNotificationTextStarred(true, 1);
                expect(result).toBe('Message marked as Starred.');
            });

            it('Should return the correct notification text when starring multiple messages', () => {
                const result = getNotificationTextStarred(true, 2);
                expect(result).toBe('2 messages marked as Starred.');
            });
        });

        describe('conversation case', () => {
            it('Should return the correct notification text when starring a single conversation', () => {
                const result = getNotificationTextStarred(false, 1);
                expect(result).toBe('Conversation marked as Starred.');
            });

            it('Should return the correct notification text when starring multiple conversations', () => {
                const result = getNotificationTextStarred(false, 2);
                expect(result).toBe('2 conversations marked as Starred.');
            });
        });
    });

    describe('getNotificationTextUnstarred', () => {
        describe('message case', () => {
            it('Should return the correct notification text when starring a single message', () => {
                const result = getNotificationTextUnstarred(true, 1);
                expect(result).toBe('Message removed from Starred.');
            });

            it('Should return the correct notification text when starring multiple messages', () => {
                const result = getNotificationTextUnstarred(true, 2);
                expect(result).toBe('2 messages removed from Starred.');
            });
        });

        describe('conversation case', () => {
            it('Should return the correct notification text when starring a single conversation', () => {
                const result = getNotificationTextUnstarred(false, 1);
                expect(result).toBe('Conversation removed from Starred.');
            });

            it('Should return the correct notification text when starring multiple conversations', () => {
                const result = getNotificationTextUnstarred(false, 2);
                expect(result).toBe('2 conversations removed from Starred.');
            });
        });
    });

    describe('getNotificationTextLabelRemoved', () => {
        describe('starred case', () => {
            it('should return the correct notification when removing a single message from starred', () => {
                const result = getNotificationTextLabelRemoved(true, 1, MAILBOX_LABEL_IDS.STARRED, [], []);
                expect(result).toBe('Message removed from Starred.');
            });

            it('should return the correct notification when removing multiple messages from starred', () => {
                const result = getNotificationTextLabelRemoved(true, 2, MAILBOX_LABEL_IDS.STARRED, [], []);
                expect(result).toBe('2 messages removed from Starred.');
            });

            it('should return the correct notification when removing a single conversation from starred', () => {
                const result = getNotificationTextLabelRemoved(false, 1, MAILBOX_LABEL_IDS.STARRED, [], []);
                expect(result).toBe('Conversation removed from Starred.');
            });

            it('should return the correct notification when removing multiple conversations from starred', () => {
                const result = getNotificationTextLabelRemoved(false, 2, MAILBOX_LABEL_IDS.STARRED, [], []);
                expect(result).toBe('2 conversations removed from Starred.');
            });
        });

        describe('message case', () => {
            it('should return the correct notification when removing a single message from a system folder', () => {
                const result = getNotificationTextLabelRemoved(true, 1, MAILBOX_LABEL_IDS.ARCHIVE, [], []);
                expect(result).toBe('Message removed from Archive.');
            });

            it('should return the correct notification when removing a single message from a custom folder', () => {
                const result = getNotificationTextLabelRemoved(true, 1, 'customfolder1', [], customFolders);
                expect(result).toBe('Message removed from Custom folder 1.');
            });

            it('should return the correct notification when removing a single messages from a custom label', () => {
                const result = getNotificationTextLabelRemoved(true, 1, 'customlabel1', customLabels, []);
                expect(result).toBe('Message removed from Custom label 1.');
            });

            it('should return the correct notification when removing a multiple messages from a system folder', () => {
                const result = getNotificationTextLabelRemoved(true, 2, MAILBOX_LABEL_IDS.ARCHIVE, [], []);
                expect(result).toBe('2 messages removed from Archive.');
            });

            it('should return the correct notification when removing a multiple messages from a custom folder', () => {
                const result = getNotificationTextLabelRemoved(true, 2, 'customfolder1', [], customFolders);
                expect(result).toBe('2 messages removed from Custom folder 1.');
            });

            it('should return the correct notification when removing multiple messages from a custom label', () => {
                const result = getNotificationTextLabelRemoved(true, 2, 'customlabel1', customLabels, []);
                expect(result).toBe('2 messages removed from Custom label 1.');
            });
        });

        describe('conversation case', () => {
            it('should return the correct notification when removing a single conversation from a system folder', () => {
                const result = getNotificationTextLabelRemoved(false, 1, MAILBOX_LABEL_IDS.ARCHIVE, [], []);
                expect(result).toBe('Conversation removed from Archive.');
            });

            it('should return the correct notification when removing a single conversation from a custom folder', () => {
                const result = getNotificationTextLabelRemoved(false, 1, 'customfolder1', [], customFolders);
                expect(result).toBe('Conversation removed from Custom folder 1.');
            });

            it('should return the correct notification when removing a single conversation from a custom label', () => {
                const result = getNotificationTextLabelRemoved(false, 1, 'customlabel1', customLabels, []);
                expect(result).toBe('Conversation removed from Custom label 1.');
            });

            it('should return the correct notification when removing a multiple conversations from a system folder', () => {
                const result = getNotificationTextLabelRemoved(false, 2, MAILBOX_LABEL_IDS.ARCHIVE, [], []);
                expect(result).toBe('2 conversations removed from Archive.');
            });

            it('should return the correct notification when removing a multiple conversations from a custom folder', () => {
                const result = getNotificationTextLabelRemoved(false, 2, 'customfolder1', [], customFolders);
                expect(result).toBe('2 conversations removed from Custom folder 1.');
            });

            it('should return the correct notification when removing multiple conversations from a custom label', () => {
                const result = getNotificationTextLabelRemoved(false, 2, 'customlabel1', customLabels, []);
                expect(result).toBe('2 conversations removed from Custom label 1.');
            });
        });
    });

    describe('getNotificationTextLabelAdded', () => {
        describe('starred case', () => {
            it('should return the correct notification when adding a single message to starred', () => {
                const result = getNotificationTextLabelAdded(true, 1, MAILBOX_LABEL_IDS.STARRED, [], []);
                expect(result).toBe('Message marked as Starred.');
            });

            it('should return the correct notification when adding multiple messages to starred', () => {
                const result = getNotificationTextLabelAdded(true, 2, MAILBOX_LABEL_IDS.STARRED, [], []);
                expect(result).toBe('2 messages marked as Starred.');
            });

            it('should return the correct notification when adding a single conversation to starred', () => {
                const result = getNotificationTextLabelAdded(false, 1, MAILBOX_LABEL_IDS.STARRED, [], []);
                expect(result).toBe('Conversation marked as Starred.');
            });

            it('should return the correct notification when adding multiple conversations to starred', () => {
                const result = getNotificationTextLabelAdded(false, 2, MAILBOX_LABEL_IDS.STARRED, [], []);
                expect(result).toBe('2 conversations marked as Starred.');
            });
        });

        describe('message case', () => {
            it('should return the correct notification when adding a single message to a system folder', () => {
                const result = getNotificationTextLabelAdded(true, 1, MAILBOX_LABEL_IDS.ARCHIVE, [], []);
                expect(result).toBe('Message added to Archive.');
            });

            it('should return the correct notification when adding a single message to a custom folder', () => {
                const result = getNotificationTextLabelAdded(true, 1, 'customfolder1', [], customFolders);
                expect(result).toBe('Message added to Custom folder 1.');
            });

            it('should return the correct notification when adding a single messages from a custom label', () => {
                const result = getNotificationTextLabelAdded(true, 1, 'customlabel1', customLabels, []);
                expect(result).toBe('Message added to Custom label 1.');
            });

            it('should return the correct notification when adding a multiple messages from a system folder', () => {
                const result = getNotificationTextLabelAdded(true, 2, MAILBOX_LABEL_IDS.ARCHIVE, [], []);
                expect(result).toBe('2 messages added to Archive.');
            });

            it('should return the correct notification when adding a multiple messages from a custom folder', () => {
                const result = getNotificationTextLabelAdded(true, 2, 'customfolder1', [], customFolders);

                expect(result).toBe('2 messages added to Custom folder 1.');
            });

            it('should return the correct notification when adding multiple messages from a custom label', () => {
                const result = getNotificationTextLabelAdded(true, 2, 'customlabel1', customLabels, []);
                expect(result).toBe('2 messages added to Custom label 1.');
            });
        });

        describe('conversation case', () => {
            it('should return the correct notification when adding a single conversation to a system folder', () => {
                const result = getNotificationTextLabelAdded(false, 1, MAILBOX_LABEL_IDS.ARCHIVE, [], []);
                expect(result).toBe('Conversation added to Archive.');
            });

            it('should return the correct notification when adding a single conversation to a custom folder', () => {
                const result = getNotificationTextLabelAdded(false, 1, 'customfolder1', [], customFolders);
                expect(result).toBe('Conversation added to Custom folder 1.');
            });

            it('should return the correct notification when adding a single conversation from a custom label', () => {
                const result = getNotificationTextLabelAdded(false, 1, 'customlabel1', customLabels, []);
                expect(result).toBe('Conversation added to Custom label 1.');
            });

            it('should return the correct notification when adding a multiple conversations from a system folder', () => {
                const result = getNotificationTextLabelAdded(false, 2, MAILBOX_LABEL_IDS.ARCHIVE, [], []);
                expect(result).toBe('2 conversations added to Archive.');
            });

            it('should return the correct notification when adding a multiple conversations from a custom folder', () => {
                const result = getNotificationTextLabelAdded(false, 2, 'customfolder1', [], customFolders);

                expect(result).toBe('2 conversations added to Custom folder 1.');
            });

            it('should return the correct notification when adding multiple conversations from a custom label', () => {
                const result = getNotificationTextLabelAdded(false, 2, 'customlabel1', customLabels, []);
                expect(result).toBe('2 conversations added to Custom label 1.');
            });
        });
    });
});
