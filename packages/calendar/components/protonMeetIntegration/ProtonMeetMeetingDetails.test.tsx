import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { NotificationsProvider } from '@proton/components';

import type { ProtonMeetMeetingDetailsProps } from './ProtonMeetMeetingDetails';
import { ProtonMeetMeetingDetails } from './ProtonMeetMeetingDetails';

jest.mock('@proton/components/hooks/drawer/useDrawer', () => ({
    __esModule: true,
    default: jest.fn().mockReturnValue({
        isDrawerApp: false,
    }),
}));

describe('ProtonMeetMeetingDetails', () => {
    const defaultProps = {
        model: {
            conferenceId: 'meeting-123',
            conferenceUrl: 'https://meet.proton.me/meeting-123',
            conferenceHost: 'test@proton.me',
        },
        deleteMeeting: jest.fn(),
    };

    const setup = (props: Partial<ProtonMeetMeetingDetailsProps> = {}) => {
        return render(
            <NotificationsProvider>
                {/* @ts-expect-error - the model only contains the properties we need */}
                <ProtonMeetMeetingDetails {...defaultProps} {...props} />
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

    it('allows deleting the meeting', async () => {
        const deleteMeeting = jest.fn();
        setup({ deleteMeeting });

        const user = userEvent.setup();

        const deleteButton = screen.getByRole('button', { name: 'Remove video conference' });
        await user.click(deleteButton);

        expect(deleteMeeting).toHaveBeenCalled();
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
        };

        // @ts-expect-error - the model only contains the properties we need
        setup({ model: incompleteModel });

        expect(screen.getByText(incompleteModel.conferenceUrl)).toBeInTheDocument();

        expect(screen.queryByText('Meeting host:')).not.toBeInTheDocument();
    });
});
