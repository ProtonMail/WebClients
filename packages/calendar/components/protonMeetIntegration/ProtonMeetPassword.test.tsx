import '@testing-library/jest-dom';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { NotificationsProvider } from '@proton/components';

import { ProtonMeetPassword } from './ProtonMeetPassword';
import { ProtonMeetRowContext } from './ProtonMeetRowContext';

const setup = (passphrase = '', savePassphrase = jest.fn()) => {
    return render(
        <ProtonMeetRowContext.Provider value={{ passphrase, savePassphrase }}>
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
        setup(existingPassphrase);

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
        setup(existingPassphrase);

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
        setup('', savePassphrase);

        await user.click(screen.getByText('Add secret passphrase'));

        const newPassphrase = 'new-test-passphrase';
        await user.type(screen.getByLabelText('Passphrase'), newPassphrase);

        await user.click(screen.getByText('Save'));

        expect(savePassphrase).toHaveBeenCalledWith(newPassphrase);
    });
});
