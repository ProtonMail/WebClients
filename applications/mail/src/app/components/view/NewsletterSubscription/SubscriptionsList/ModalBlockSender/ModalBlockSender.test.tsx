import { fireEvent, screen } from '@testing-library/react';

import { mailTestRender } from 'proton-mail/helpers/test/render';

import { activeSubscription } from '../../testData';
import { ModalBlockSender } from './ModalBlockSender';

describe('ModalBlockSender', () => {
    it('should render the modal', async () => {
        await mailTestRender(<ModalBlockSender subscription={activeSubscription} open={true} />);

        const title = screen.getByText('Unsubscribe not available for this sender');
        expect(title).toBeInTheDocument();

        const senderAddress = screen.getByText(activeSubscription.SenderAddress);
        expect(senderAddress).toBeInTheDocument();
    });

    it('should not check both trash and archive at the same time', async () => {
        await mailTestRender(<ModalBlockSender subscription={activeSubscription} open={true} />);

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
        await mailTestRender(<ModalBlockSender subscription={activeSubscription} open={true} onClose={onClose} />);

        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);

        expect(onClose).toHaveBeenCalled();
    });
});
