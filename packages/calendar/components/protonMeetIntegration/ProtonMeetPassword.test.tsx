import '@testing-library/jest-dom';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { NotificationsProvider } from '@proton/components';

import { ProtonMeetPassword } from './ProtonMeetPassword';
import { ProtonMeetRowContext } from './ProtonMeetRowContext';

const setup = (params?: {
    passphrase?: string;
    savePassphrase?: (passphrase: string) => Promise<void>;
    fetchingDetailsFailed?: boolean;
    refetchMeeting?: () => Promise<void>;
    hidePassphrase?: boolean;
}) => {
    const {
        passphrase = '',
        savePassphrase = jest.fn(),
        fetchingDetailsFailed = false,
        refetchMeeting = jest.fn(),
        hidePassphrase = false,
    } = params ?? {};

    return render(
        <ProtonMeetRowContext.Provider
            value={{ passphrase, savePassphrase, fetchingDetailsFailed, refetchMeeting, hidePassphrase }}
        >
            <NotificationsProvider>
                <ProtonMeetPassword />
            </NotificationsProvider>
        </ProtonMeetRowContext.Provider>
    );
};

describe('ProtonMeetPassword', () => {
    it('renders "Add secret passphrase" button when no passphrase exists', () => {
        setup();
        expect(screen.getByText('Add secret passphrase')).toBeInTheDocument();
    });

    it('renders existing passphrase and update button when passphrase exists', () => {
        const existingPassphrase = 'test-passphrase';
        setup({ passphrase: existingPassphrase });

        expect(screen.getByText('Passphrase:')).toBeInTheDocument();
        expect(screen.getByText(existingPassphrase)).toBeInTheDocument();
        expect(screen.getByText('Update secret passphrase')).toBeInTheDocument();
    });

    it('opens modal when "Add secret passphrase" button is clicked', async () => {
        const user = userEvent.setup();
        setup();

        await user.click(screen.getByText('Add secret passphrase'));

        await waitFor(() => {
            expect(
                within(screen.getByTestId('proton-meet-password-modal')).getByText('Add secret passphrase')
            ).toBeInTheDocument();
            expect(
                within(screen.getByTestId('proton-meet-password-modal')).getByLabelText('Passphrase')
            ).toBeInTheDocument();
        });
    });

    it('opens modal with existing passphrase when "Update secret passphrase" is clicked', async () => {
        const user = userEvent.setup();
        const existingPassphrase = 'test-passphrase';
        setup({ passphrase: existingPassphrase });

        await user.click(screen.getByText('Update secret passphrase'));

        await waitFor(() => {
            expect(
                within(screen.getByTestId('proton-meet-password-modal')).getByText('Update secret passphrase')
            ).toBeInTheDocument();
            expect(within(screen.getByTestId('proton-meet-password-modal')).getByLabelText('Passphrase')).toHaveValue(
                existingPassphrase
            );
        });
    });

    it('calls savePassphrase with new passphrase when Save is clicked', async () => {
        const user = userEvent.setup();
        const savePassphrase = jest.fn();
        setup({ savePassphrase });

        await user.click(screen.getByText('Add secret passphrase'));

        const newPassphrase = 'new-test-passphrase';
        await user.type(screen.getByLabelText('Passphrase'), newPassphrase);

        await user.click(screen.getByText('Save'));

        expect(savePassphrase).toHaveBeenCalledWith(newPassphrase);
    });

    it('should allow for handling passphrase retrieval failure', async () => {
        const user = userEvent.setup();

        const refetchMeeting = jest.fn();
        setup({ fetchingDetailsFailed: true, refetchMeeting });

        expect(screen.queryByText('Add secret passphrase')).not.toBeInTheDocument();
        expect(screen.getByText('Passphrase unavailable')).toBeInTheDocument();

        await user.click(screen.getByText('Retry'));

        expect(refetchMeeting).toHaveBeenCalled();
    });

    it('does not render the passphrase input if hidePassphrase is true', () => {
        setup({ hidePassphrase: true });

        expect(screen.queryByText('Passphrase')).not.toBeInTheDocument();
    });
});
