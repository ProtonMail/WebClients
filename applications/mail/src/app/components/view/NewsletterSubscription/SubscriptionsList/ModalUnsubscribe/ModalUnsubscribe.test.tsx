import { fireEvent, screen } from '@testing-library/react';

import { getModelState } from '@proton/account/test';
import { openNewTab } from '@proton/shared/lib/helpers/browser';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { CONFIRM_LINK } from '@proton/shared/lib/mail/mailSettings';

import { mailTestRender } from 'proton-mail/helpers/test/render';

import { activeSubscription } from '../../testData';
import ModalUnsubscribe from './ModalUnsubscribe';

jest.mock('@proton/shared/lib/helpers/browser');
const mockedOpenNewTab = jest.mocked(openNewTab);

describe('ModalUnsubscribe', () => {
    it('should render the modal', async () => {
        await mailTestRender(<ModalUnsubscribe subscription={activeSubscription} open={true} />);

        const title = screen.getByText(`Unsubscribe from ${activeSubscription.Name}?`);
        expect(title).toBeInTheDocument();

        const senderAddress = screen.getByText(activeSubscription.SenderAddress);
        expect(senderAddress).toBeInTheDocument();
    });

    it('should render unsubscribe button', async () => {
        await mailTestRender(<ModalUnsubscribe subscription={activeSubscription} open={true} />);

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

        await mailTestRender(<ModalUnsubscribe subscription={subscription} open={true} />);

        const sendUnsubscribeEmailButton = screen.getByTestId('unsubscribe-button');
        expect(sendUnsubscribeEmailButton).toHaveTextContent('Send unsubscribe email');
    });

    it('should not check both trash and archive at the same time', async () => {
        await mailTestRender(<ModalUnsubscribe subscription={activeSubscription} open={true} />);

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
        await mailTestRender(<ModalUnsubscribe subscription={activeSubscription} open={true} onClose={onClose} />);

        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);

        expect(onClose).toHaveBeenCalled();
    });

    it('should open the link confirmation modal when https method is used and there is no settings', async () => {
        const subscription = {
            ...activeSubscription,
            UnsubscribeMethods: {
                HttpClient: 'https://example.com',
            },
        };

        await mailTestRender(<ModalUnsubscribe subscription={subscription} open={true} />, {
            preloadedState: {
                mailSettings: getModelState({} as MailSettings),
            },
        });

        const title = screen.getByText(`Unsubscribe from ${activeSubscription.Name}?`);
        expect(title).toBeInTheDocument();

        const unsubscribeButton = screen.getByText('Unsubscribe');
        fireEvent.click(unsubscribeButton);

        const linkConfirmationModal = screen.getByText('Link confirmation');
        expect(linkConfirmationModal).toBeInTheDocument();

        expect(mockedOpenNewTab).not.toHaveBeenCalled();
    });

    it('should open the link confirmation modal when https method is used and setting is enabled', async () => {
        const subscription = {
            ...activeSubscription,
            UnsubscribeMethods: {
                HttpClient: 'https://example.com',
            },
        };

        await mailTestRender(<ModalUnsubscribe subscription={subscription} open={true} />, {
            preloadedState: {
                mailSettings: getModelState({
                    ConfirmLink: CONFIRM_LINK.CONFIRM,
                } as MailSettings),
            },
        });

        const title = screen.getByText(`Unsubscribe from ${activeSubscription.Name}?`);
        expect(title).toBeInTheDocument();

        const unsubscribeButton = screen.getByText('Unsubscribe');
        fireEvent.click(unsubscribeButton);

        const linkConfirmationModal = screen.getByText('Link confirmation');
        expect(linkConfirmationModal).toBeInTheDocument();

        expect(mockedOpenNewTab).not.toHaveBeenCalled();
    });

    it('should not open the link confirmation modal when https method is used and setting is disabled', async () => {
        const subscription = {
            ...activeSubscription,
            UnsubscribeMethods: {
                HttpClient: 'https://example.com',
            },
        };

        await mailTestRender(<ModalUnsubscribe subscription={subscription} open={true} />, {
            preloadedState: {
                mailSettings: getModelState({
                    ConfirmLink: CONFIRM_LINK.DISABLED,
                } as MailSettings),
            },
        });

        const title = screen.getByText(`Unsubscribe from ${activeSubscription.Name}?`);
        expect(title).toBeInTheDocument();

        const unsubscribeButton = screen.getByText('Unsubscribe');
        fireEvent.click(unsubscribeButton);

        const linkConfirmationModal = screen.queryByText('Link confirmation');
        expect(linkConfirmationModal).not.toBeInTheDocument();

        expect(mockedOpenNewTab).toHaveBeenCalledWith('https://example.com');
    });
});
