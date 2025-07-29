import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { NotificationsProvider } from '@proton/components';

import { ProtonMeetMeetingDetails } from './ProtonMeetMeetingDetails';
import { ProtonMeetRowContext } from './ProtonMeetRowContext';

describe('ProtonMeetMeetingDetails', () => {
    const defaultProps = {
        passphrase: 'test-passphrase',
        model: {
            conferenceId: 'meeting-123',
            conferenceUrl: 'https://meet.proton.me/meeting-123',
            conferencePassword: 'meeting-pwd',
            conferenceHost: 'test@proton.me',
        },
        savePassphrase: jest.fn(),
        deleteMeeting: jest.fn(),
    };

    const setup = (props = {}) => {
        return render(
            <NotificationsProvider>
                <ProtonMeetRowContext.Provider
                    value={{ passphrase: defaultProps.passphrase, savePassphrase: defaultProps.savePassphrase }}
                >
                    {/* @ts-expect-error - the model only contains the properties we need */}
                    <ProtonMeetMeetingDetails {...defaultProps} {...props} />
                </ProtonMeetRowContext.Provider>
            </NotificationsProvider>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders video conferencing widget with correct meeting data', () => {
        setup();

        expect(screen.getByText(defaultProps.model.conferenceUrl)).toBeInTheDocument();

        expect(screen.getByText('Meeting host:')).toBeInTheDocument();
        expect(screen.getByText(defaultProps.model.conferenceHost)).toBeInTheDocument();
    });

    it('displays existing passphrase and allows updating it', async () => {
        const user = userEvent.setup();
        setup();

        await user.click(screen.getByText('Update secret passphrase'));

        const newPassphrase = 'new-passphrase';

        const textbox = screen.getByLabelText('Passphrase');

        await user.clear(textbox);
        await user.type(textbox, newPassphrase);

        await user.click(screen.getByText('Save'));

        expect(defaultProps.savePassphrase).toHaveBeenCalledWith(newPassphrase);
    });

    it('allows deleting the meeting', async () => {
        const user = userEvent.setup();
        setup();

        const deleteButton = screen.getByRole('button', { name: 'Remove Zoom meeting' });
        await user.click(deleteButton);

        expect(defaultProps.deleteMeeting).toHaveBeenCalled();
    });

    it('renders with empty passphrase and allows adding one', async () => {
        const user = userEvent.setup();
        setup({ passphrase: '' });

        const addButton = screen.getByText('Add secret passphrase');
        expect(addButton).toBeInTheDocument();

        await user.click(addButton);

        const newPassphrase = 'first-passphrase';
        await user.type(screen.getByLabelText('Passphrase'), newPassphrase);

        await user.click(screen.getByText('Save'));

        expect(defaultProps.savePassphrase).toHaveBeenCalledWith(newPassphrase);
    });

    it('verifies video conferencing service is set to PROTON_MEET', () => {
        setup();

        const joinButton = screen.getByRole('link', { name: /join/i });
        expect(joinButton).toHaveAttribute('href', defaultProps.model.conferenceUrl);
    });

    it('handles missing conference details gracefully', () => {
        const incompleteModel = {
            ...defaultProps.model,
            conferenceHost: undefined,
            conferencePassword: undefined,
        };

        setup({ model: incompleteModel });

        expect(screen.getByText(incompleteModel.conferenceUrl)).toBeInTheDocument();

        expect(screen.queryByText('Meeting host:')).not.toBeInTheDocument();
    });
});
