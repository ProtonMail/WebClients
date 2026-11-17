import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectSubscriptionStatus } from '@proton/meet/store/slices/userSlice';

import { useMeetCoreClient } from '../../contexts/MeetCoreClientContext';
import { useCaptionsAvailability } from '../../hooks/captions/useCaptionsAvailability';
import { LiveCaptionsHostAvailabilityToggle } from './LiveCaptionsHostAvailabilityToggle';

const createNotification = vi.fn();

vi.mock('@proton/app-context/useNotifications', () => ({ useNotifications: () => ({ createNotification }) }));
vi.mock('@proton/meet/store/hooks', () => ({ useMeetSelector: vi.fn() }));
vi.mock('@proton/meet/telemetry/meetTelemetry', () => ({
    TelemetryMeetActionsEvents: { captions_toggled: 'captions_toggled' },
    sendMeetActionsEvent: vi.fn(),
}));
vi.mock('../../contexts/MeetCoreClientContext', () => ({ useMeetCoreClient: vi.fn() }));
vi.mock('../../hooks/captions/useCaptionsAvailability', () => ({ useCaptionsAvailability: vi.fn() }));

describe('LiveCaptionsHostAvailabilityToggle', () => {
    it('shows the fixed copy, not the error message, when the setting fails to save', async () => {
        vi.mocked(useMeetSelector).mockImplementation((selector) =>
            selector === selectSubscriptionStatus ? { isPaidUser: true } : 'meeting-link'
        );
        vi.mocked(useCaptionsAvailability).mockReturnValue({ isCaptionsDisabled: false });
        vi.mocked(useMeetCoreClient).mockReturnValue({
            setClosedCaptionsAvailabilityAsHost: vi.fn().mockRejectedValue(new Error('Internal server error')),
        } as unknown as ReturnType<typeof useMeetCoreClient>);

        render(<LiveCaptionsHostAvailabilityToggle />);
        fireEvent.click(screen.getByRole('checkbox', { name: 'Allow live captions' }));

        await waitFor(() =>
            expect(createNotification).toHaveBeenCalledWith({ type: 'error', text: 'Setting not saved. Try again.' })
        );
    });
});
