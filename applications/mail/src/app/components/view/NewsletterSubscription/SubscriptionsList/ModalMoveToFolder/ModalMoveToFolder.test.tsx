import { fireEvent, screen } from '@testing-library/react';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { render } from 'proton-mail/helpers/test/render';

import { activeSubscription } from '../../testData';
import { ModalMoveToFolder } from './ModalMoveToFolder';

describe('ModalBlockSender', () => {
    it('should render the modal', async () => {
        await render(
            <ModalMoveToFolder subscription={activeSubscription} handleUpsellModalDisplay={jest.fn} open={true} />
        );

        const title = screen.getByText('Move messages to');
        expect(title).toBeInTheDocument();
    });

    it('should contain a button to create custom folder from the modal', async () => {
        await render(
            <ModalMoveToFolder subscription={activeSubscription} handleUpsellModalDisplay={jest.fn} open={true} />
        );

        const createFolderButton = screen.getByTestId('create-folder-button');
        expect(createFolderButton).toBeInTheDocument();
        expect(createFolderButton).toHaveTextContent(`Create folder ${activeSubscription.Name}`);
    });

    it('should disable the move button if no folder is selected', async () => {
        await render(
            <ModalMoveToFolder subscription={activeSubscription} handleUpsellModalDisplay={jest.fn} open={true} />
        );

        const moveButton = screen.getByTestId('move-button');
        expect(moveButton).toBeDisabled();
    });

    it('should enable the button after selecting a folder', async () => {
        await render(
            <ModalMoveToFolder subscription={activeSubscription} handleUpsellModalDisplay={jest.fn} open={true} />
        );

        const moveButton = screen.getByTestId('move-button');
        expect(moveButton).toBeDisabled();

        const folder = screen.getByTestId(`button-folder-${MAILBOX_LABEL_IDS.INBOX}`);
        fireEvent.click(folder);

        expect(moveButton).toBeEnabled();
    });

    it('should filter the list of folders when the search input is used', async () => {
        await render(
            <ModalMoveToFolder subscription={activeSubscription} handleUpsellModalDisplay={jest.fn} open={true} />
        );

        const searchInput = screen.getByPlaceholderText('Filter folders');
        fireEvent.change(searchInput, { target: { value: 'Inbox' } });

        const inboxFolder = screen.getByTestId(`button-folder-${MAILBOX_LABEL_IDS.INBOX}`);
        expect(inboxFolder).toBeInTheDocument();

        const sentFolder = screen.queryByTestId(`button-folder-${MAILBOX_LABEL_IDS.SENT}`);
        expect(sentFolder).not.toBeInTheDocument();
    });
});
