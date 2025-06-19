import { fireEvent, screen } from '@testing-library/react';

import { render } from 'proton-mail/helpers/test/render';

import { activeSubscription } from '../../testData';
import ModalUnsubscribe from './ModalUnsubscribe';

describe('ModalUnsubscribe', () => {
    it('should render the modal', async () => {
        await render(<ModalUnsubscribe subscription={activeSubscription} open={true} />);

        const title = screen.getByText(`Unsubscribe from ${activeSubscription.Name}?`);
        expect(title).toBeInTheDocument();

        const senderAddress = screen.getByText(activeSubscription.SenderAddress);
        expect(senderAddress).toBeInTheDocument();
    });

    it('should render unsubscribe button', async () => {
        await render(<ModalUnsubscribe subscription={activeSubscription} open={true} />);

        const unsubscribeButton = screen.getByTestId('unsubscribe-button');
        expect(unsubscribeButton).toHaveTextContent('Unsubscribe');
    });

    it('should render send unsubscribe email button', async () => {
        const subscription = {
            ...activeSubscription,
            UnsubscribeMethods: {
                Mailto: {
                    Subject: 'Test Subject',
                    Body: 'Test Body',
                    ToList: ['test@proton.me'],
                },
            },
        };

        await render(<ModalUnsubscribe subscription={subscription} open={true} />);

        const sendUnsubscribeEmailButton = screen.getByTestId('unsubscribe-button');
        expect(sendUnsubscribeEmailButton).toHaveTextContent('Send unsubscribe email');
    });

    it('should not check both trash and archive at the same time', async () => {
        await render(<ModalUnsubscribe subscription={activeSubscription} open={true} />);

        const trashCheckbox = screen.getByTestId('trash-checkbox');
        const archiveCheckbox = screen.getByTestId('archive-checkbox');

        fireEvent.click(trashCheckbox);
        expect(trashCheckbox).toBeChecked();
        expect(archiveCheckbox).not.toBeChecked();

        fireEvent.click(archiveCheckbox);
        expect(trashCheckbox).not.toBeChecked();
        expect(archiveCheckbox).toBeChecked();
    });

    it('should close the modal when the cancel button is clicked', async () => {
        const onClose = jest.fn();
        await render(<ModalUnsubscribe subscription={activeSubscription} open={true} onClose={onClose} />);

        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);

        expect(onClose).toHaveBeenCalled();
    });
});
