import { fireEvent, render, screen } from '@testing-library/react';
import type { Mock } from 'vitest';

import { TelemetryMeetActionsEvents, sendMeetActionsEvent } from '@proton/meet/telemetry/meetTelemetry';

import { canOpenInDesktopApp } from '../../utils/desktopAppDetector';
import { OpenDesktopAppBanner } from './OpenDesktopAppBanner';

const BANNER_TEXT = /Get the best experience with the/;

vi.mock('@proton/meet/telemetry/meetTelemetry', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    sendMeetActionsEvent: vi.fn(),
}));

vi.mock('../../utils/desktopAppDetector', () => ({
    canOpenInDesktopApp: vi.fn(),
}));

const canOpenInDesktopAppMock = canOpenInDesktopApp as unknown as Mock;

describe('OpenDesktopAppBanner', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        canOpenInDesktopAppMock.mockReturnValue(true);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('shows the text and a download button in a desktop browser, without an open app button', () => {
        render(<OpenDesktopAppBanner />);

        expect(screen.getByText(BANNER_TEXT)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Download app/ })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Open app/ })).not.toBeInTheDocument();
    });

    it('is not shown in the desktop app, on iPad or on phones', () => {
        canOpenInDesktopAppMock.mockReturnValue(false);

        const { container } = render(<OpenDesktopAppBanner />);

        expect(container).toBeEmptyDOMElement();
    });

    it('sends no telemetry when it is shown', () => {
        render(<OpenDesktopAppBanner />);

        expect(sendMeetActionsEvent).not.toHaveBeenCalled();
    });

    it('reports the download and opens the download page in a new tab', () => {
        const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
        render(<OpenDesktopAppBanner />);

        fireEvent.click(screen.getByRole('button', { name: /Download app/ }));

        expect(sendMeetActionsEvent).toHaveBeenCalledTimes(1);
        expect(sendMeetActionsEvent).toHaveBeenCalledWith(TelemetryMeetActionsEvents.desktop_app_banner_clicked, {
            action: 'download',
        });
        expect(openSpy).toHaveBeenCalledWith('https://proton.me/meet/download', '_blank');
    });

    it('hides itself on close without sending an event or storing anything', () => {
        const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
        render(<OpenDesktopAppBanner />);

        fireEvent.click(screen.getByRole('button', { name: 'Close' }));

        expect(screen.queryByText(BANNER_TEXT)).not.toBeInTheDocument();
        expect(sendMeetActionsEvent).not.toHaveBeenCalled();
        expect(setItemSpy).not.toHaveBeenCalled();
    });
});
