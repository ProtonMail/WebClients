import { act, fireEvent, render, screen } from '@testing-library/react';
import type { Mock } from 'vitest';

import { isDesktopEnvironment } from '@proton/lumo-api-client/core/desktop-tools';

import { useLumoFlags } from '../../hooks/useLumoFlags';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { useLumoSelector } from '../../redux/hooks';
import {
    sendDesktopOnboardingDismissedEvent,
    sendDesktopOnboardingDownloadEvent,
    sendDesktopOnboardingShownEvent,
} from '../../util/telemetry';
import { DesktopOnboardingProvider, useIsDesktopOnboardingBlocking } from './DesktopOnboardingProvider';
import { fetchLumoDesktopInstallerUrl, getLumoDesktopTarget, startInstallerDownload } from './desktopDownloads';
import { getDesktopOnboardingRecord } from './desktopOnboardingStorage';
import { getDesktopOnboardingSurface } from './desktopOnboardingSurface';

const mockCreateNotification = vi.fn(() => {
    return 1;
});

vi.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => {
        return { createNotification: mockCreateNotification, hideNotification: vi.fn() };
    },
}));
vi.mock('@proton/lumo-api-client/core/desktop-tools', () => ({
    isDesktopEnvironment: vi.fn(),
}));
vi.mock('../../components/Composer/hooks/useNativeComposerVisibilityApi', () => ({
    useNativeComposerVisibilityApi: vi.fn(),
}));
vi.mock('../../hooks/useLumoFlags', () => ({
    useLumoFlags: vi.fn(),
}));
vi.mock('../../providers/IsGuestProvider', () => ({
    useIsGuest: vi.fn(),
}));
vi.mock('../../redux/hooks', () => ({
    useLumoSelector: vi.fn(),
}));
vi.mock('../../redux/selectors', () => ({
    selectMasterKeyState: (state: { masterKey: unknown }) => {
        return state.masterKey;
    },
}));
vi.mock('../../util/telemetry', () => ({
    sendDesktopOnboardingShownEvent: vi.fn(),
    sendDesktopOnboardingDismissedEvent: vi.fn(),
    sendDesktopOnboardingDownloadEvent: vi.fn(),
}));
vi.mock('./desktopDownloads', async () => ({
    ...(await vi.importActual('./desktopDownloads')),
    getLumoDesktopTarget: vi.fn(),
    fetchLumoDesktopInstallerUrl: vi.fn(),
    startInstallerDownload: vi.fn(),
}));
vi.mock('./desktopOnboardingSurface', async () => ({
    ...(await vi.importActual('./desktopOnboardingSurface')),
    getDesktopOnboardingSurface: vi.fn(),
}));

const BlockingProbe = () => {
    const isBlocking = useIsDesktopOnboardingBlocking();
    return <span data-testid="blocking">{String(isBlocking)}</span>;
};

const setup = ({
    flag = true,
    isGuest = false,
    isDesktopApp = false,
    surface = 'web',
    masterKeyReady = true,
}: {
    flag?: boolean;
    isGuest?: boolean;
    isDesktopApp?: boolean;
    surface?: string;
    masterKeyReady?: boolean;
} = {}) => {
    (useLumoFlags as Mock).mockReturnValue({ desktopOnboardingModal: flag });
    (useIsGuest as Mock).mockReturnValue(isGuest);
    (isDesktopEnvironment as Mock).mockReturnValue(isDesktopApp);
    (getDesktopOnboardingSurface as Mock).mockReturnValue(surface);
    (useLumoSelector as Mock).mockImplementation((selector) => {
        return selector({ masterKey: { status: masterKeyReady ? 'ready' : 'loading' } });
    });
    return render(
        <DesktopOnboardingProvider>
            <BlockingProbe />
        </DesktopOnboardingProvider>
    );
};

const advancePastDelay = () => {
    act(() => {
        vi.advanceTimersByTime(500);
    });
};

const title = () => {
    return screen.queryByText('Meet Lumo for desktop');
};

describe('DesktopOnboardingProvider', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        localStorage.clear();
        (getLumoDesktopTarget as Mock).mockReturnValue({ platform: 'macos' });
        (fetchLumoDesktopInstallerUrl as Mock).mockResolvedValue('https://x/Lumo.dmg');
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('opens 500ms after load when the flag is on, and blocks other onboarding', () => {
        setup();
        expect(screen.getByTestId('blocking')).toHaveTextContent('true');
        expect(title()).toBeNull();

        advancePastDelay();

        expect(title()).toBeInTheDocument();
        expect(screen.getByText('Download the desktop app')).toBeInTheDocument();
        expect(sendDesktopOnboardingShownEvent).toHaveBeenCalledWith({ surface: 'web', platform: 'macos' });
        expect(getDesktopOnboardingRecord()?.outcome).toBe('shown');
    });

    it.each([
        ['the flag is off', { flag: false }],
        ['the visitor is a guest', { isGuest: true }],
        ['running in the desktop app', { isDesktopApp: true }],
    ])('does not show or block when %s', (_, options) => {
        setup(options);
        advancePastDelay();
        expect(title()).toBeNull();
        expect(screen.getByTestId('blocking')).toHaveTextContent('false');
    });

    it('waits for the master key before opening', () => {
        setup({ masterKeyReady: false });
        advancePastDelay();
        expect(title()).toBeNull();
        expect(screen.getByTestId('blocking')).toHaveTextContent('true');
    });

    it('is shown only once per device', () => {
        const { unmount } = setup();
        advancePastDelay();
        fireEvent.click(screen.getByText('Not now'));
        expect(sendDesktopOnboardingDismissedEvent).toHaveBeenCalledWith({ surface: 'web', method: 'not-now' });
        expect(getDesktopOnboardingRecord()?.outcome).toBe('not-now');
        // Still blocks for the rest of this session, so nothing else opens right after it.
        expect(screen.getByTestId('blocking')).toHaveTextContent('true');
        unmount();

        setup();
        advancePastDelay();
        expect(title()).toBeNull();
        expect(screen.getByTestId('blocking')).toHaveTextContent('false');
    });

    it('shows "Got it" and the later-download note on phones and in the native apps', () => {
        setup({ surface: 'ios-app' });
        advancePastDelay();

        expect(screen.queryByText('Download the desktop app')).toBeNull();
        expect(screen.getByText('You can download it on your computer later.')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Got it'));

        expect(sendDesktopOnboardingShownEvent).toHaveBeenCalledWith({ surface: 'ios-app', platform: 'mobile' });
        expect(sendDesktopOnboardingDismissedEvent).toHaveBeenCalledWith({ surface: 'ios-app', method: 'got-it' });
        expect(getDesktopOnboardingRecord()?.outcome).toBe('got-it');
    });

    it('downloads the installer for this computer and shows a toast', async () => {
        setup();
        advancePastDelay();
        await act(async () => {
            fireEvent.click(screen.getByText('Download the desktop app'));
        });

        expect(fetchLumoDesktopInstallerUrl).toHaveBeenCalledWith({ platform: 'macos' });
        expect(startInstallerDownload).toHaveBeenCalledWith('https://x/Lumo.dmg');
        expect(mockCreateNotification).toHaveBeenCalledTimes(1);
        expect(sendDesktopOnboardingDownloadEvent).toHaveBeenCalledWith({
            surface: 'web',
            platform: 'macos',
            result: 'installer',
        });
        expect(getDesktopOnboardingRecord()?.outcome).toBe('download');
    });

    it('opens the download page when no installer fits this computer', async () => {
        (getLumoDesktopTarget as Mock).mockReturnValue(null);
        const open = vi.spyOn(window, 'open').mockImplementation(() => {
            return null;
        });

        setup();
        advancePastDelay();
        await act(async () => {
            fireEvent.click(screen.getByText('Download the desktop app'));
        });

        expect(fetchLumoDesktopInstallerUrl).not.toHaveBeenCalled();
        expect(open).toHaveBeenCalledWith('https://proton.me/lumo/download', '_blank', 'noopener,noreferrer');
        expect(sendDesktopOnboardingDownloadEvent).toHaveBeenCalledWith({
            surface: 'web',
            platform: 'unknown',
            result: 'download-page',
        });
        expect(mockCreateNotification).not.toHaveBeenCalled();
        open.mockRestore();
    });
});
