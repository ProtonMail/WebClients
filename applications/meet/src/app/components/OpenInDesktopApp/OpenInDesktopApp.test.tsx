import { fireEvent, render, screen } from '@testing-library/react';

import { TelemetryMeetActionsEvents, sendMeetActionsEvent } from '@proton/meet/telemetry/meetTelemetry';

import { saveDesktopAppPreference, tryOpenInDesktopApp } from '../../utils/desktopAppDetector';
import { OpenInDesktopAppCard, OpenInDesktopAppLink } from './OpenInDesktopApp';

const MEETING_LINK = 'https://meet.proton.me/join/id-meeting-abc#pwd-password-abc';

vi.mock('@proton/meet/store/hooks', () => ({
    useMeetSelector: () => MEETING_LINK,
}));

vi.mock('@proton/meet/telemetry/meetTelemetry', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    sendMeetActionsEvent: vi.fn(),
}));

vi.mock('../../utils/desktopAppDetector', () => ({
    tryOpenInDesktopApp: vi.fn(),
    saveDesktopAppPreference: vi.fn(),
}));

describe('OpenInDesktopAppLink', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('reports that the link was shown once', () => {
        const { rerender } = render(<OpenInDesktopAppLink onOpen={vi.fn()} />);
        rerender(<OpenInDesktopAppLink onOpen={vi.fn()} />);

        expect(sendMeetActionsEvent).toHaveBeenCalledTimes(1);
        expect(sendMeetActionsEvent).toHaveBeenCalledWith(TelemetryMeetActionsEvents.desktop_app_banner_shown);
    });

    it('opens the meeting in the desktop app on click and remembers the choice', () => {
        const onOpen = vi.fn();
        render(<OpenInDesktopAppLink onOpen={onOpen} />);

        fireEvent.click(screen.getByRole('button', { name: 'Open this meeting in the desktop app' }));

        expect(tryOpenInDesktopApp).toHaveBeenCalledWith(MEETING_LINK);
        expect(saveDesktopAppPreference).toHaveBeenCalledTimes(1);
        expect(onOpen).toHaveBeenCalledTimes(1);
        expect(sendMeetActionsEvent).toHaveBeenCalledWith(TelemetryMeetActionsEvents.desktop_app_banner_clicked, {
            action: 'open_app',
        });
    });
});

describe('OpenInDesktopAppCard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('focuses the try again button when it appears', () => {
        render(<OpenInDesktopAppCard />);

        expect(screen.getByText("App didn't open?")).toBeInTheDocument();
        const button = screen.getByRole('button', { name: 'Try again' });
        expect(button).toHaveFocus();
        expect(button).toHaveAccessibleDescription("App didn't open?");
        expect(screen.getByText('Already in the app? You can close this tab.')).toBeInTheDocument();
    });

    it('retries opening the same meeting', () => {
        render(<OpenInDesktopAppCard />);

        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

        expect(tryOpenInDesktopApp).toHaveBeenCalledWith(MEETING_LINK);
        expect(sendMeetActionsEvent).toHaveBeenCalledWith(TelemetryMeetActionsEvents.desktop_app_banner_clicked, {
            action: 'retry',
        });
    });

    it('opens the download page in a new tab', () => {
        const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
        render(<OpenInDesktopAppCard />);

        fireEvent.click(screen.getByRole('button', { name: /Download app/ }));

        expect(openSpy).toHaveBeenCalledWith('https://proton.me/meet/download', '_blank', 'noopener,noreferrer');
        expect(sendMeetActionsEvent).toHaveBeenCalledWith(TelemetryMeetActionsEvents.desktop_app_banner_clicked, {
            action: 'download',
        });
        openSpy.mockRestore();
    });
});
