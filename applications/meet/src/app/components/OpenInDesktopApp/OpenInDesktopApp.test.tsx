import { fireEvent, render, screen } from '@testing-library/react';
import type { Mock } from 'vitest';

import { selectMeetingLink } from '@proton/meet/store/slices/currentMeeting';
import { selectIsGuest, selectUserId } from '@proton/meet/store/slices/userSlice';
import { TelemetryMeetActionsEvents, sendMeetActionsEvent } from '@proton/meet/telemetry/meetTelemetry';
import { useFlag } from '@proton/unleash/useFlag';

import { getDesktopAppPreference, saveDesktopAppPreference, tryOpenInDesktopApp } from '../../utils/desktopAppDetector';
import { OpenInDesktopApp } from './OpenInDesktopApp';

const MEETING_LINK = 'https://meet.proton.me/join/id-meeting-abc#pwd-password-abc';
const JOIN_FROM_APP = 'Join from Proton Meet app';
const HINT_TITLE = "App didn't open?";

vi.mock('@proton/meet/store/hooks', () => ({
    useMeetSelector: (selector: unknown) => {
        const values = new Map<unknown, unknown>([
            [selectMeetingLink, MEETING_LINK],
            [selectIsGuest, false],
            [selectUserId, 'user-1'],
        ]);
        return values.get(selector);
    },
}));

vi.mock('@proton/meet/telemetry/meetTelemetry', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    sendMeetActionsEvent: vi.fn(),
}));

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: vi.fn(),
}));

vi.mock('../../utils/desktopAppDetector', () => ({
    getDesktopAppPreference: vi.fn(),
    saveDesktopAppPreference: vi.fn(),
    tryOpenInDesktopApp: vi.fn(),
}));

const useFlagMock = useFlag as unknown as Mock;
const getDesktopAppPreferenceMock = getDesktopAppPreference as unknown as Mock;

describe('OpenInDesktopApp', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useFlagMock.mockReturnValue(true);
        getDesktopAppPreferenceMock.mockReturnValue(false);
    });

    it('reports that the button was shown once', () => {
        const { rerender } = render(<OpenInDesktopApp />);
        rerender(<OpenInDesktopApp />);

        expect(sendMeetActionsEvent).toHaveBeenCalledTimes(1);
        expect(sendMeetActionsEvent).toHaveBeenCalledWith(TelemetryMeetActionsEvents.desktop_app_banner_shown);
    });

    it('waits for a click before opening the app when the choice was never made', () => {
        render(<OpenInDesktopApp />);

        expect(tryOpenInDesktopApp).not.toHaveBeenCalled();
        expect(screen.queryByText(HINT_TITLE)).not.toBeInTheDocument();
    });

    it('opens the meeting in the desktop app, remembers the choice and shows the hint', () => {
        render(<OpenInDesktopApp />);

        fireEvent.click(screen.getByRole('button', { name: JOIN_FROM_APP }));

        expect(tryOpenInDesktopApp).toHaveBeenCalledWith(MEETING_LINK);
        expect(saveDesktopAppPreference).toHaveBeenCalledTimes(1);
        expect(saveDesktopAppPreference).toHaveBeenCalledWith('openInDesktopApp.user.user-1');
        expect(screen.getByText(HINT_TITLE)).toBeInTheDocument();
        expect(sendMeetActionsEvent).toHaveBeenCalledWith(TelemetryMeetActionsEvents.desktop_app_banner_clicked, {
            action: 'open_app',
        });
    });

    it('opens the app again when the button is clicked again', () => {
        render(<OpenInDesktopApp />);

        fireEvent.click(screen.getByRole('button', { name: JOIN_FROM_APP }));
        fireEvent.click(screen.getByRole('button', { name: JOIN_FROM_APP }));

        expect(tryOpenInDesktopApp).toHaveBeenCalledTimes(2);
        expect(tryOpenInDesktopApp).toHaveBeenNthCalledWith(2, MEETING_LINK);
    });

    it('closes the hint', () => {
        render(<OpenInDesktopApp />);

        fireEvent.click(screen.getByRole('button', { name: JOIN_FROM_APP }));
        fireEvent.click(screen.getByRole('button', { name: 'Close' }));

        expect(screen.queryByText(HINT_TITLE)).not.toBeInTheDocument();
    });

    it('links to the download page in a new tab', () => {
        render(<OpenInDesktopApp />);

        fireEvent.click(screen.getByRole('button', { name: JOIN_FROM_APP }));
        const downloadLink = screen.getByRole('link', { name: /download/ });
        fireEvent.click(downloadLink);

        expect(downloadLink).toHaveAttribute('href', 'https://proton.me/meet/download');
        expect(downloadLink).toHaveAttribute('target', '_blank');
        expect(sendMeetActionsEvent).toHaveBeenCalledWith(TelemetryMeetActionsEvents.desktop_app_banner_clicked, {
            action: 'download',
        });
    });

    it('opens the app on load and shows the hint when the choice was remembered', () => {
        getDesktopAppPreferenceMock.mockReturnValue(true);

        render(<OpenInDesktopApp />);

        expect(getDesktopAppPreferenceMock).toHaveBeenCalledWith('openInDesktopApp.user.user-1');
        expect(tryOpenInDesktopApp).toHaveBeenCalledTimes(1);
        expect(tryOpenInDesktopApp).toHaveBeenCalledWith(MEETING_LINK);
        expect(screen.getByText(HINT_TITLE)).toBeInTheDocument();
    });

    it('opens the app on load only once across re-renders', () => {
        getDesktopAppPreferenceMock.mockReturnValue(true);

        const { rerender } = render(<OpenInDesktopApp />);
        rerender(<OpenInDesktopApp />);

        expect(tryOpenInDesktopApp).toHaveBeenCalledTimes(1);
    });

    it('waits for a click when the flag is off, even with a remembered choice', () => {
        getDesktopAppPreferenceMock.mockReturnValue(true);
        useFlagMock.mockReturnValue(false);

        render(<OpenInDesktopApp />);

        expect(tryOpenInDesktopApp).not.toHaveBeenCalled();
        expect(screen.queryByText(HINT_TITLE)).not.toBeInTheDocument();
    });
});
