import { fireEvent, render, screen } from '@testing-library/react';

import { selectMeetingLink } from '@proton/meet/store/slices/currentMeeting';
import { selectIsGuest, selectUserId } from '@proton/meet/store/slices/userSlice';
import { TelemetryMeetActionsEvents, sendMeetActionsEvent } from '@proton/meet/telemetry/meetTelemetry';

import { saveDesktopAppPreference, tryOpenInDesktopApp } from '../../utils/desktopAppDetector';
import { openDesktopAppOnPreJoin } from '../../utils/openDesktopAppOnLoad';
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

const mocks = vi.hoisted(() => ({ isOpenDesktopAppOnLoadEnabled: false }));

vi.mock('@proton/unleash/useFlag', () => ({
    useFlag: () => mocks.isOpenDesktopAppOnLoadEnabled,
}));

vi.mock('../../utils/desktopAppDetector', () => ({
    saveDesktopAppPreference: vi.fn(),
    tryOpenInDesktopApp: vi.fn(),
}));

vi.mock('../../utils/openDesktopAppOnLoad', () => ({
    openDesktopAppOnPreJoin: vi.fn(),
}));

describe('OpenInDesktopApp', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.isOpenDesktopAppOnLoadEnabled = false;
    });

    it('reports that the button was shown once', () => {
        const { rerender } = render(<OpenInDesktopApp />);
        rerender(<OpenInDesktopApp />);

        expect(sendMeetActionsEvent).toHaveBeenCalledTimes(1);
        expect(sendMeetActionsEvent).toHaveBeenCalledWith(TelemetryMeetActionsEvents.desktop_app_banner_shown);
    });

    it("hands the account's choice and the flag to the pre-join attempt, and opens the app only on a click", () => {
        render(<OpenInDesktopApp />);

        expect(openDesktopAppOnPreJoin).toHaveBeenCalledTimes(1);
        expect(openDesktopAppOnPreJoin).toHaveBeenCalledWith({
            isOpenDesktopAppOnLoadEnabled: false,
            desktopAppPreferenceStorageKey: 'openInDesktopApp.user.user-1',
        });
        expect(tryOpenInDesktopApp).not.toHaveBeenCalled();
        expect(screen.queryByText(HINT_TITLE)).not.toBeInTheDocument();
    });

    it('asks for the pre-join attempt again when MeetOpenDesktopAppOnLoad changes, not on other re-renders', () => {
        const { rerender } = render(<OpenInDesktopApp />);
        rerender(<OpenInDesktopApp />);
        expect(openDesktopAppOnPreJoin).toHaveBeenCalledTimes(1);

        mocks.isOpenDesktopAppOnLoadEnabled = true;
        rerender(<OpenInDesktopApp />);

        expect(openDesktopAppOnPreJoin).toHaveBeenCalledTimes(2);
        expect(openDesktopAppOnPreJoin).toHaveBeenLastCalledWith({
            isOpenDesktopAppOnLoadEnabled: true,
            desktopAppPreferenceStorageKey: 'openInDesktopApp.user.user-1',
        });
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
});
