import { render, screen } from '@testing-library/react';

import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { LABEL_TYPE, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Label } from '@proton/shared/lib/interfaces';
import { DEFAULT_MAIL_SETTINGS } from '@proton/shared/lib/mail/mailSettings';

import { useMailSelector } from 'proton-mail/store/hooks';

import MoveButtons from './MoveButtons';

const labelID = 'labelID';
const folderID = 'folderID';

jest.mock('@proton/mail/store/mailSettings/hooks');
jest.mocked(useMailSettings).mockReturnValue([DEFAULT_MAIL_SETTINGS, false]);

jest.mock('@proton/mail/store/labels/hooks');
jest.mocked(useFolders).mockReturnValue([[], false]);
jest.mocked(useLabels).mockReturnValue([[], false]);

jest.mock('proton-mail/store/hooks');
const mockUseMailSelector = jest.mocked(useMailSelector);

const getProps = (labelID: string) => {
    return {
        labelID,
        isExtraTiny: false,
        isNarrow: false,
        isTiny: false,
        selectedIDs: ['randomID'],
        onMove: jest.fn(),
        onDelete: jest.fn(),
    };
};

describe('MoveButtons', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    const assertTrashArchiveSpam = () => {
        screen.getByText('Move to trash');
        screen.getByText('Move to archive');
        screen.getByText('Move to spam');

        expect(screen.queryByText('Move to inbox')).toBeNull();
        expect(screen.queryByText('Move to inbox (not spam)')).toBeNull();
        expect(screen.queryByText('Delete permanently')).toBeNull();
    };

    it('should display trash, archive and spam actions in Inbox', () => {
        mockUseMailSelector.mockReturnValue(MAILBOX_LABEL_IDS.INBOX);
        render(<MoveButtons {...getProps(MAILBOX_LABEL_IDS.INBOX)} />);

        assertTrashArchiveSpam();
    });

    it('should display trash, archive and spam actions in Starred', () => {
        mockUseMailSelector.mockReturnValue(MAILBOX_LABEL_IDS.STARRED);
        render(<MoveButtons {...getProps(MAILBOX_LABEL_IDS.STARRED)} />);

        assertTrashArchiveSpam();
    });

    it('should display trash, archive and spam actions in All Mail', () => {
        mockUseMailSelector.mockReturnValue(MAILBOX_LABEL_IDS.ALL_MAIL);
        render(<MoveButtons {...getProps(MAILBOX_LABEL_IDS.ALL_MAIL)} />);

        assertTrashArchiveSpam();
    });

    it('should display trash, archive and spam actions in a custom folder', () => {
        mockUseMailSelector.mockReturnValue(folderID);
        jest.mocked(useLabels).mockReturnValue([[{ ID: folderID, Type: LABEL_TYPE.MESSAGE_FOLDER } as Label], false]);
        render(<MoveButtons {...getProps(folderID)} />);

        assertTrashArchiveSpam();
    });

    it('should display trash, archive and spam actions in a custom label', () => {
        mockUseMailSelector.mockReturnValue(labelID);
        jest.mocked(useLabels).mockReturnValue([[{ ID: labelID, Type: LABEL_TYPE.MESSAGE_LABEL } as Label], false]);
        render(<MoveButtons {...getProps(labelID)} />);

        assertTrashArchiveSpam();
    });

    const assertTrashArchiveDelete = (labelID: string) => {
        mockUseMailSelector.mockReturnValue(labelID);
        render(<MoveButtons {...getProps(labelID)} />);

        screen.getByText('Move to trash');
        screen.getByText('Move to archive');
        screen.getByText('Delete permanently');

        expect(screen.queryByText('Move to inbox')).toBeNull();
        expect(screen.queryByText('Move to inbox (not spam)')).toBeNull();
        expect(screen.queryByText('Move to spam')).toBeNull();
    };

    it('should display trash, archive and delete actions in Drafts', () => {
        assertTrashArchiveDelete(MAILBOX_LABEL_IDS.DRAFTS);
    });

    it('should display trash, archive and delete actions in All Drafts', () => {
        assertTrashArchiveDelete(MAILBOX_LABEL_IDS.ALL_DRAFTS);
    });

    it('should display trash, archive and delete actions in Sent', () => {
        assertTrashArchiveDelete(MAILBOX_LABEL_IDS.SENT);
    });

    it('should display trash, archive and delete actions in All Sent', () => {
        assertTrashArchiveDelete(MAILBOX_LABEL_IDS.ALL_SENT);
    });

    it('should display trash and archive actions in Scheduled', async () => {
        const props = getProps(MAILBOX_LABEL_IDS.SCHEDULED);
        render(<MoveButtons {...props} />);

        // Actions displayed
        screen.getByText('Move to trash');
        screen.getByText('Move to archive');

        // Actions not displayed
        expect(screen.queryByText('Move to inbox')).toBeNull();
        expect(screen.queryByText('Move to inbox (not spam)')).toBeNull();
        expect(screen.queryByText('Delete permanently')).toBeNull();
        expect(screen.queryByText('Move to spam')).toBeNull();
    });

    it('should display trash, inbox and spam actions in Archive', async () => {
        const props = getProps(MAILBOX_LABEL_IDS.ARCHIVE);
        render(<MoveButtons {...props} />);

        // Actions displayed
        screen.getByText('Move to trash');
        screen.getByText('Move to inbox');
        screen.getByText('Move to spam');

        // Actions not displayed
        expect(screen.queryByText('Move to archive')).toBeNull();
        expect(screen.queryByText('Move to inbox (not spam)')).toBeNull();
        expect(screen.queryByText('Delete permanently')).toBeNull();
    });

    it('should display trash, nospam and delete actions in Spam', async () => {
        const props = getProps(MAILBOX_LABEL_IDS.SPAM);
        render(<MoveButtons {...props} />);

        // Actions displayed
        screen.getByText('Move to trash');
        screen.getByText('Move to inbox (not spam)');
        screen.getByText('Delete permanently');

        // Actions not displayed
        expect(screen.queryByText('Move to inbox')).toBeNull();
        expect(screen.queryByText('Move to archive')).toBeNull();
        expect(screen.queryByText('Move to spam')).toBeNull();
    });

    it('should display inbox, archive and delete actions in Trash', async () => {
        const props = getProps(MAILBOX_LABEL_IDS.TRASH);
        render(<MoveButtons {...props} />);

        // Actions displayed
        screen.getByText('Move to inbox');
        screen.getByText('Move to archive');
        screen.getByText('Delete permanently');

        // Actions not displayed
        expect(screen.queryByText('Move to trash')).toBeNull();
        expect(screen.queryByText('Move to inbox (not spam)')).toBeNull();
        expect(screen.queryByText('Move to spam')).toBeNull();
    });
});
