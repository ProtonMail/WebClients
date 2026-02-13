import { fireEvent, screen } from '@testing-library/react';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { mailTestRender } from 'proton-mail/helpers/test/render';

import { activeSubscription } from '../../testData';
import { ModalMoveToFolder } from './ModalMoveToFolder';

jest.mock('@proton/mail/store/labels/hooks', () => ({
    useFolders: jest.fn(),
}));

const mockUseFolders = jest.requireMock('@proton/mail/store/labels/hooks').useFolders;

describe('ModalBlockSender', () => {
    beforeEach(() => {
        mockUseFolders.mockReturnValue([[], false]);
    });

    it('should render the modal', async () => {
        await mailTestRender(
            <ModalMoveToFolder subscription={activeSubscription} handleUpsellModalDisplay={jest.fn} open={true} />
        );

        const title = screen.getByText('Move messages to');
        expect(title).toBeInTheDocument();
    });

    it('should contain a button to create custom folder from the modal', async () => {
        await mailTestRender(
            <ModalMoveToFolder subscription={activeSubscription} handleUpsellModalDisplay={jest.fn} open={true} />
        );

        const createFolderButton = screen.getByTestId('create-folder-button');
        expect(createFolderButton).toBeInTheDocument();
        expect(createFolderButton).toHaveTextContent(`Create folder ${activeSubscription.Name}`);
    });

    it('should disable the move button if no folder is selected', async () => {
        await mailTestRender(
            <ModalMoveToFolder subscription={activeSubscription} handleUpsellModalDisplay={jest.fn} open={true} />
        );

        const moveButton = screen.getByTestId('move-button');
        expect(moveButton).toBeDisabled();
    });

    it('should enable the button after selecting a folder', async () => {
        await mailTestRender(
            <ModalMoveToFolder subscription={activeSubscription} handleUpsellModalDisplay={jest.fn} open={true} />
        );

        const moveButton = screen.getByTestId('move-button');
        expect(moveButton).toBeDisabled();

        const folder = screen.getByTestId(`button-folder-${MAILBOX_LABEL_IDS.INBOX}`);
        fireEvent.click(folder);

        expect(moveButton).toBeEnabled();
    });

    it('should filter the list of folders when the search input is used', async () => {
        await mailTestRender(
            <ModalMoveToFolder subscription={activeSubscription} handleUpsellModalDisplay={jest.fn} open={true} />
        );

        const searchInput = screen.getByPlaceholderText('Filter folders');
        fireEvent.change(searchInput, { target: { value: 'Inbox' } });

        const inboxFolder = screen.getByTestId(`button-folder-${MAILBOX_LABEL_IDS.INBOX}`);
        expect(inboxFolder).toBeInTheDocument();

        const spamFolder = screen.queryByTestId(`move-to-button-Spam`);
        expect(spamFolder).not.toBeInTheDocument();
        const sentFolder = screen.queryByTestId(`button-folder-${MAILBOX_LABEL_IDS.SENT}`);
        expect(sentFolder).not.toBeInTheDocument();
    });

    it('should hide the create folder button if a folder with the same name exists', async () => {
        mockUseFolders.mockReturnValue([
            [
                {
                    ID: 'folder-1',
                    Name: 'Active Subscription',
                    Color: '#000000',
                    Path: '/',
                    Expanded: 1,
                    Type: 1,
                    Order: 1,
                    Notify: 0,
                },
            ],
            false,
        ]);

        await mailTestRender(
            <ModalMoveToFolder subscription={activeSubscription} handleUpsellModalDisplay={jest.fn} open={true} />
        );

        const createFolderButton = screen.queryByTestId('create-folder-button');
        expect(createFolderButton).not.toBeInTheDocument();
    });
});
