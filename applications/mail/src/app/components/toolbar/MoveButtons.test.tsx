import { screen } from '@testing-library/react';

import { getModelState } from '@proton/account/test';
import { LABEL_TYPE, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Label } from '@proton/shared/lib/interfaces';

import { clearAll, mailTestRender, minimalCache } from '../../helpers/test/helper';
import MoveButtons from './MoveButtons';

const labelID = 'labelID';
const folderID = 'folderID';

const labels: Label[] = [
    { ID: labelID, Type: LABEL_TYPE.MESSAGE_LABEL } as Label,
    { ID: folderID, Type: LABEL_TYPE.MESSAGE_FOLDER } as Label,
];
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
    afterEach(clearAll);

    it.each`
        labelID                       | label
        ${MAILBOX_LABEL_IDS.INBOX}    | ${'Inbox'}
        ${MAILBOX_LABEL_IDS.STARRED}  | ${'Starred'}
        ${MAILBOX_LABEL_IDS.ALL_MAIL} | ${'All Mail'}
        ${folderID}                   | ${'Custom folders'}
        ${labelID}                    | ${'Custom labels'}
    `('should display trash, archive and spam actions in $label', async ({ labelID }) => {
        const props = getProps(labelID);
        minimalCache();

        await mailTestRender(<MoveButtons {...props} />, {
            preloadedState: {
                categories: getModelState(labels),
            },
        });

        // Actions displayed
        screen.getByText('Move to trash');
        screen.getByText('Move to archive');
        screen.getByText('Move to spam');

        // Actions not displayed
        expect(screen.queryByText('Move to inbox')).toBeNull();
        expect(screen.queryByText('Move to inbox (not spam)')).toBeNull();
        expect(screen.queryByText('Delete permanently')).toBeNull();
    });

    it.each`
        labelID                         | label
        ${MAILBOX_LABEL_IDS.DRAFTS}     | ${'Drafts'}
        ${MAILBOX_LABEL_IDS.ALL_DRAFTS} | ${'All Drafts'}
        ${MAILBOX_LABEL_IDS.SENT}       | ${'Sent'}
        ${MAILBOX_LABEL_IDS.ALL_SENT}   | ${'All Sent'}
    `(`should display trash, archive and delete actions in $label`, async ({ labelID }) => {
        const props = getProps(labelID);
        await mailTestRender(<MoveButtons {...props} />);

        // Actions displayed
        screen.getByText('Move to trash');
        screen.getByText('Move to archive');
        screen.getByText('Delete permanently');

        // Actions not displayed
        expect(screen.queryByText('Move to inbox')).toBeNull();
        expect(screen.queryByText('Move to inbox (not spam)')).toBeNull();
        expect(screen.queryByText('Move to spam')).toBeNull();
    });

    it('should display trash and archive actions in Scheduled', async () => {
        const props = getProps(MAILBOX_LABEL_IDS.SCHEDULED);
        await mailTestRender(<MoveButtons {...props} />);

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
        await mailTestRender(<MoveButtons {...props} />);

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
        await mailTestRender(<MoveButtons {...props} />);

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
        await mailTestRender(<MoveButtons {...props} />);

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
