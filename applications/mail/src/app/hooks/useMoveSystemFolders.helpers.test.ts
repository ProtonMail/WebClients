import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { SYSTEM_FOLDER_SECTION, SystemFolder } from './useMoveSystemFolders';
import { moveSystemFolders } from './useMoveSystemFolders.helpers';

const INBOX: SystemFolder = {
    labelID: MAILBOX_LABEL_IDS.INBOX,
    display: SYSTEM_FOLDER_SECTION.MAIN,
    order: 1,
    payloadExtras: {
        Color: 'white',
        Name: 'undefined',
    },
    icon: 'alias',
    ID: 'payloadID',
    text: 'text',
    visible: true,
};

const DRAFTS: SystemFolder = {
    labelID: MAILBOX_LABEL_IDS.DRAFTS,
    display: SYSTEM_FOLDER_SECTION.MAIN,
    order: 2,
    payloadExtras: {
        Color: 'white',
        Name: 'undefined',
    },
    icon: 'alias',
    ID: 'payloadID',
    text: 'text',
    visible: true,
};

const SENT: SystemFolder = {
    labelID: MAILBOX_LABEL_IDS.SENT,
    display: SYSTEM_FOLDER_SECTION.MAIN,
    order: 3,
    payloadExtras: {
        Color: 'white',
        Name: 'undefined',
    },
    icon: 'alias',
    ID: 'payloadID',
    text: 'text',
    visible: true,
};

const ALL_SENT: SystemFolder = {
    labelID: MAILBOX_LABEL_IDS.ALL_SENT,
    display: SYSTEM_FOLDER_SECTION.MAIN,
    order: 4,
    payloadExtras: {
        Color: 'white',
        Name: 'undefined',
    },
    icon: 'alias',
    ID: 'payloadID',
    text: 'text',
    visible: false,
};

const SCHEDULED: SystemFolder = {
    labelID: MAILBOX_LABEL_IDS.SCHEDULED,
    display: SYSTEM_FOLDER_SECTION.MAIN,
    order: 4,
    payloadExtras: {
        Color: 'white',
        Name: 'undefined',
    },
    icon: 'alias',
    ID: 'payloadID',
    text: 'text',
    visible: true,
};

const ARCHIVE_MORE: SystemFolder = {
    labelID: MAILBOX_LABEL_IDS.ARCHIVE,
    display: SYSTEM_FOLDER_SECTION.MORE,
    order: 5,
    payloadExtras: {
        Color: 'white',
        Name: 'undefined',
    },
    icon: 'alias',
    ID: 'payloadID',
    text: 'text',
    visible: true,
};

const ALL_MAIL_MORE: SystemFolder = {
    labelID: MAILBOX_LABEL_IDS.ALL_MAIL,
    display: SYSTEM_FOLDER_SECTION.MORE,
    order: 6,
    payloadExtras: {
        Color: 'white',
        Name: 'undefined',
    },
    icon: 'alias',
    ID: 'payloadID',
    text: 'text',
    visible: true,
};

const SPAM_MORE: SystemFolder = {
    labelID: MAILBOX_LABEL_IDS.SPAM,
    display: SYSTEM_FOLDER_SECTION.MORE,
    order: 7,
    payloadExtras: {
        Color: 'white',
        Name: 'undefined',
    },
    icon: 'alias',
    ID: 'payloadID',
    text: 'text',
    visible: true,
};

describe('moveSystemFolders', () => {
    describe('inbox', () => {
        it('Should not move when dragged', () => {
            const navItems: SystemFolder[] = [INBOX, DRAFTS, SENT, SCHEDULED];
            expect(moveSystemFolders(MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.DRAFTS, navItems)).toEqual(navItems);
        });
        it('Should not move when dropped', () => {
            const navItems: SystemFolder[] = [INBOX, DRAFTS, SENT, SCHEDULED];
            expect(moveSystemFolders(MAILBOX_LABEL_IDS.DRAFTS, MAILBOX_LABEL_IDS.INBOX, navItems)).toEqual(navItems);
            expect(moveSystemFolders(MAILBOX_LABEL_IDS.SENT, MAILBOX_LABEL_IDS.INBOX, navItems)).toEqual([
                INBOX,
                { ...SENT, order: 2 },
                { ...DRAFTS, order: 3 },
                SCHEDULED,
            ]);
        });
        it('Should allow drop', () => {
            const navItems: SystemFolder[] = [INBOX, DRAFTS, SCHEDULED, ARCHIVE_MORE, ALL_MAIL_MORE];
            const movedFolders = moveSystemFolders(MAILBOX_LABEL_IDS.ARCHIVE, MAILBOX_LABEL_IDS.INBOX, navItems);

            expect(movedFolders).toEqual([
                INBOX,
                { ...ARCHIVE_MORE, order: 2, display: SYSTEM_FOLDER_SECTION.MAIN },
                { ...DRAFTS, order: 3 },
                { ...SCHEDULED, order: 4 },
                { ...ALL_MAIL_MORE, order: 5 },
            ]);
        });
    });

    describe('item', () => {
        it('Should move withing main section', () => {
            const navItems: SystemFolder[] = [INBOX, DRAFTS, SENT, SCHEDULED];

            // From top to bottom
            expect(moveSystemFolders(MAILBOX_LABEL_IDS.DRAFTS, MAILBOX_LABEL_IDS.SCHEDULED, navItems)).toEqual([
                INBOX,
                { ...SENT, order: 2 },
                { ...SCHEDULED, order: 3 },
                { ...DRAFTS, order: 4 },
            ]);

            // From bottom to top
            expect(moveSystemFolders(MAILBOX_LABEL_IDS.SCHEDULED, MAILBOX_LABEL_IDS.DRAFTS, navItems)).toEqual([
                INBOX,
                { ...SCHEDULED, order: 2 },
                { ...DRAFTS, order: 3 },
                { ...SENT, order: 4 },
            ]);
        });

        it('Should change section (main to more) when dropped over "more" folder', () => {
            const navItems: SystemFolder[] = [INBOX, DRAFTS, SENT, SCHEDULED, ARCHIVE_MORE, ALL_MAIL_MORE, SPAM_MORE];

            expect(moveSystemFolders(MAILBOX_LABEL_IDS.SCHEDULED, 'MORE_FOLDER_ITEM', navItems)).toEqual([
                INBOX,
                DRAFTS,
                SENT,
                { ...ARCHIVE_MORE, order: 4 },
                { ...ALL_MAIL_MORE, order: 5 },
                { ...SPAM_MORE, order: 6 },
                { ...SCHEDULED, order: 7, display: SYSTEM_FOLDER_SECTION.MORE },
            ]);

            expect(moveSystemFolders(MAILBOX_LABEL_IDS.SENT, 'MORE_FOLDER_ITEM', navItems)).toEqual([
                INBOX,
                DRAFTS,
                { ...SCHEDULED, order: 3 },
                { ...ARCHIVE_MORE, order: 4 },
                { ...ALL_MAIL_MORE, order: 5 },
                { ...SPAM_MORE, order: 6 },
                { ...SENT, order: 7, display: SYSTEM_FOLDER_SECTION.MORE },
            ]);

            // Should take the last main element if more section is empty
            const navItemsWithMoreEmpty: SystemFolder[] = [INBOX, DRAFTS, SENT, SCHEDULED];
            expect(moveSystemFolders(MAILBOX_LABEL_IDS.SENT, 'MORE_FOLDER_ITEM', navItemsWithMoreEmpty)).toEqual([
                INBOX,
                DRAFTS,
                { ...SCHEDULED, order: 3 },
                { ...SENT, order: 4, display: SYSTEM_FOLDER_SECTION.MORE },
            ]);
        });

        it('Should stay in "more" section when dropped on first MORE element', () => {
            const navItems: SystemFolder[] = [INBOX, DRAFTS, SENT, SCHEDULED, ARCHIVE_MORE, ALL_MAIL_MORE, SPAM_MORE];

            expect(moveSystemFolders(MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ARCHIVE, navItems)).toEqual([
                INBOX,
                DRAFTS,
                SENT,
                SCHEDULED,
                { ...ALL_MAIL_MORE, order: 5 },
                { ...ARCHIVE_MORE, order: 6 },
                SPAM_MORE,
            ]);
        });

        it('should move linked label such as sent, all sent', () => {
            const navItems: SystemFolder[] = [INBOX, DRAFTS, SENT, ALL_SENT, SCHEDULED];

            expect(moveSystemFolders(MAILBOX_LABEL_IDS.SENT, MAILBOX_LABEL_IDS.INBOX, navItems)).toEqual([
                INBOX,
                { ...ALL_SENT, order: 2 },
                { ...SENT, order: 3 },
                { ...DRAFTS, order: 4 },
                { ...SCHEDULED, order: 5 },
            ]);
        });
    });
});
