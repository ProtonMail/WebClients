import { MemoryRouter, Route } from 'react-router-dom';

import { act, fireEvent, render, screen } from '@testing-library/react';

import { isDesktopEnvironment } from '@proton/lumo-api-client/core/desktop-tools';

import { useLumoFlags } from '../../hooks/useLumoFlags';
import { useLumoPlan } from '../../hooks/useLumoPlan';
import { useDeviceSettings } from '../../providers/DeviceSettingsProvider';
import { useIsGuest } from '../../providers/IsGuestProvider';
import { useLumoSelector } from '../../redux/hooks';
import useLumoPlusUpsellButtonConfig from '../../upsells/useLumoPlusUpsellButtonConfig';
import {
    sendDesktopAppOnboardingEndedEvent,
    sendDesktopAppOnboardingNotificationsEvent,
    sendDesktopAppOnboardingShownEvent,
    sendDesktopAppOnboardingStepViewedEvent,
} from '../../util/telemetry';
import { useIsDesktopOnboardingBlocking } from '../desktopOnboarding/DesktopOnboardingProvider';
import { DesktopAppOnboardingProvider } from './DesktopAppOnboardingProvider';
import { getDesktopAppOnboardingRecord } from './desktopAppOnboardingStorage';

jest.mock('@proton/shared/lib/helpers/desktop', () => ({
    isTauriOnMac: true,
}));
jest.mock('@proton/lumo-api-client/core/desktop-tools', () => ({
    isDesktopEnvironment: jest.fn(),
}));
jest.mock('../../hooks/useLumoFlags', () => ({
    useLumoFlags: jest.fn(),
}));
jest.mock('../../hooks/useLumoPlan', () => ({
    useLumoPlan: jest.fn(),
}));
jest.mock('../../providers/DeviceSettingsProvider', () => ({
    useDeviceSettings: jest.fn(),
}));
jest.mock('../../providers/IsGuestProvider', () => ({
    useIsGuest: jest.fn(),
}));
jest.mock('../../redux/hooks', () => ({
    useLumoSelector: jest.fn(),
}));
jest.mock('../../redux/selectors', () => ({
    selectMasterKeyState: (state: { masterKey: unknown }) => {
        return state.masterKey;
    },
}));
jest.mock('../../upsells/providers/LumoUpsellModalProvider', () => ({
    useOfferFlags: () => {
        return { loadingOffer: false };
    },
}));
jest.mock('../../upsells/useLumoPlusUpsellButtonConfig', () => ({
    __esModule: true,
    default: jest.fn(),
}));
jest.mock('../../util/telemetry', () => ({
    sendDesktopAppOnboardingShownEvent: jest.fn(),
    sendDesktopAppOnboardingStepViewedEvent: jest.fn(),
    sendDesktopAppOnboardingNotificationsEvent: jest.fn(),
    sendDesktopAppOnboardingEndedEvent: jest.fn(),
}));

const mockRequestPermission = jest.fn();
const mockOpenSettings = jest.fn();
const mockOnUpgrade = jest.fn();

const BlockingProbe = () => {
    const isBlocking = useIsDesktopOnboardingBlocking();
    return <span data-testid="blocking">{String(isBlocking)}</span>;
};

const LocationProbe = () => {
    return (
        <Route
            render={({ location }) => {
                return <span data-testid="location">{`${location.pathname}${location.search}`}</span>;
            }}
        />
    );
};

interface SetupOptions {
    flag?: boolean;
    isDesktopApp?: boolean;
    isGuest?: boolean;
    permission?: 'not_determined' | 'denied' | 'granted' | undefined;
    hasNotificationsApi?: boolean;
    isFree?: boolean;
    planLoading?: boolean;
}

const setup = ({
    flag = true,
    isDesktopApp = true,
    isGuest = false,
    permission = 'not_determined',
    hasNotificationsApi = true,
    isFree = true,
    planLoading = false,
}: SetupOptions = {}) => {
    (useLumoFlags as jest.Mock).mockReturnValue({ desktopAppOnboarding: flag, skills: true });
    (isDesktopEnvironment as jest.Mock).mockReturnValue(isDesktopApp);
    (useIsGuest as jest.Mock).mockReturnValue(isGuest);
    (useLumoPlan as jest.Mock).mockReturnValue({ isLumoPlanLoading: planLoading });
    (useLumoPlusUpsellButtonConfig as jest.Mock).mockReturnValue(isFree ? { onUpgrade: mockOnUpgrade } : null);
    (useDeviceSettings as jest.Mock).mockReturnValue({
        notificationSettings: { permission, requestPermission: mockRequestPermission, openSettings: mockOpenSettings },
    });
    (useLumoSelector as jest.Mock).mockImplementation((selector) => {
        return selector({ masterKey: { status: 'ready' } });
    });
    if (hasNotificationsApi) {
        (window as { LumoNotifications?: unknown }).LumoNotifications = {};
    } else {
        delete (window as { LumoNotifications?: unknown }).LumoNotifications;
    }
    return render(
        <MemoryRouter initialEntries={['/']}>
            <DesktopAppOnboardingProvider>
                <BlockingProbe />
                <LocationProbe />
            </DesktopAppOnboardingProvider>
        </MemoryRouter>
    );
};

const advancePastDelay = () => {
    act(() => {
        jest.advanceTimersByTime(500);
    });
};

const heading = () => {
    return screen.queryByRole('heading', { level: 2 });
};

const click = (name: string) => {
    fireEvent.click(screen.getByRole('button', { name }));
};

describe('DesktopAppOnboardingProvider', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
        localStorage.clear();
    });

    afterEach(() => {
        jest.useRealTimers();
        delete (window as { LumoNotifications?: unknown }).LumoNotifications;
    });

    it('opens 500ms after load in the desktop app and holds back other onboarding', () => {
        setup();
        expect(screen.getByTestId('blocking')).toHaveTextContent('true');
        expect(heading()).toBeNull();
        advancePastDelay();
        expect(heading()).toHaveTextContent('Meet the Lumo desktop app');
        expect(screen.getByText('Step 1 of 6')).toBeInTheDocument();
        expect(sendDesktopAppOnboardingShownEvent).toHaveBeenCalledWith({ finalStep: 'upsell', stepCount: 6 });
        expect(getDesktopAppOnboardingRecord()?.outcome).toBe('shown');
    });

    it.each([
        ['outside the desktop app', { isDesktopApp: false }],
        ['with the flag off', { flag: false }],
        ['for guests', { isGuest: true }],
    ])('never opens %s', (_, options) => {
        setup(options);
        advancePastDelay();
        expect(heading()).toBeNull();
        expect(screen.getByTestId('blocking')).toHaveTextContent('false');
    });

    it('does not open again on this device once shown', () => {
        const { unmount } = setup();
        advancePastDelay();
        unmount();
        setup();
        advancePastDelay();
        expect(heading()).toBeNull();
    });

    it('waits for the plan before opening', () => {
        setup({ planLoading: true });
        advancePastDelay();
        expect(heading()).toBeNull();
    });

    it('walks the tour with Next and Back', () => {
        setup();
        advancePastDelay();
        click('Get started');
        expect(heading()).toHaveTextContent('Connect your apps and files');
        click('Next');
        expect(heading()).toHaveTextContent('Teach Lumo how you work');
        click('Back');
        expect(heading()).toHaveTextContent('Connect your apps and files');
        click('Next');
        click('Next');
        expect(heading()).toHaveTextContent('Set tasks to repeat');
        click('Next');
        expect(heading()).toHaveTextContent('Turn on notifications');
    });

    it('skips the notifications step when permission is already granted', () => {
        setup({ permission: 'granted' });
        advancePastDelay();
        expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
        click('Get started');
        click('Next');
        click('Next');
        click('Next');
        expect(heading()).toHaveTextContent('Go further with Lumo Plus');
    });

    it('skips the notifications step in desktop builds without the notifications bridge', () => {
        setup({ hasNotificationsApi: false, permission: undefined });
        advancePastDelay();
        expect(screen.getByText('Step 1 of 5')).toBeInTheDocument();
    });

    it('asks macOS for permission, then moves on', async () => {
        mockRequestPermission.mockResolvedValue(true);
        setup();
        advancePastDelay();
        click('Get started');
        click('Next');
        click('Next');
        click('Next');
        await act(async () => {
            click('Turn on notifications');
        });
        expect(mockRequestPermission).toHaveBeenCalled();
        expect(sendDesktopAppOnboardingNotificationsEvent).toHaveBeenCalledWith({ result: 'granted' });
        expect(heading()).toHaveTextContent('Go further with Lumo Plus');
    });

    it('opens the OS settings when permission was denied', async () => {
        setup({ permission: 'denied' });
        advancePastDelay();
        click('Get started');
        click('Next');
        click('Next');
        click('Next');
        await act(async () => {
            click('Turn on notifications');
        });
        expect(mockRequestPermission).not.toHaveBeenCalled();
        expect(mockOpenSettings).toHaveBeenCalled();
        expect(sendDesktopAppOnboardingNotificationsEvent).toHaveBeenCalledWith({ result: 'opened-settings' });
    });

    const deferred = () => {
        let resolve: (value?: unknown) => void = () => {};
        const promise = new Promise((done) => {
            resolve = done;
        });
        return { promise, resolve };
    };

    const goToNotifications = () => {
        click('Get started');
        click('Next');
        click('Next');
        click('Next');
    };

    it('stays where the user went with Back while OS settings are open', async () => {
        const settings = deferred();
        mockOpenSettings.mockReturnValue(settings.promise);
        setup({ permission: 'denied' });
        advancePastDelay();
        goToNotifications();
        click('Turn on notifications');
        click('Back');
        expect(heading()).toHaveTextContent('Set tasks to repeat');
        await act(async () => {
            settings.resolve();
        });
        expect(heading()).toHaveTextContent('Set tasks to repeat');
    });

    it('disables Back while the macOS prompt is open', async () => {
        const prompt = deferred();
        mockRequestPermission.mockReturnValue(prompt.promise);
        setup();
        advancePastDelay();
        goToNotifications();
        click('Turn on notifications');
        expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
        await act(async () => {
            prompt.resolve(true);
        });
        expect(heading()).toHaveTextContent('Go further with Lumo Plus');
    });

    it('does not move on after the tour was closed during the request', async () => {
        const settings = deferred();
        mockOpenSettings.mockReturnValue(settings.promise);
        setup({ permission: 'denied' });
        advancePastDelay();
        goToNotifications();
        click('Turn on notifications');
        click('Close');
        (sendDesktopAppOnboardingStepViewedEvent as jest.Mock).mockClear();
        await act(async () => {
            settings.resolve();
        });
        expect(sendDesktopAppOnboardingStepViewedEvent).not.toHaveBeenCalled();
        expect(getDesktopAppOnboardingRecord()?.outcome).toBe('closed');
    });

    it('free users: "Get Lumo Plus" closes the tour and opens the upgrade modal', () => {
        setup({ permission: 'granted' });
        advancePastDelay();
        click('Get started');
        click('Next');
        click('Next');
        click('Next');
        click('Get Lumo Plus');
        expect(mockOnUpgrade).toHaveBeenCalled();
        expect(sendDesktopAppOnboardingEndedEvent).toHaveBeenCalledWith({
            step: 'final',
            method: 'get-lumo-plus',
            finalStep: 'upsell',
        });
        expect(getDesktopAppOnboardingRecord()?.outcome).toBe('get-lumo-plus');
    });

    it('paid users: the last step sends them to Customize › Connectors', () => {
        setup({ permission: 'granted', isFree: false });
        advancePastDelay();
        click('Get started');
        click('Next');
        click('Next');
        click('Next');
        expect(heading()).toHaveTextContent('Connect your first app');
        expect(screen.queryByRole('button', { name: 'Get Lumo Plus' })).toBeNull();
        click('Set up a connector');
        expect(screen.getByTestId('location')).toHaveTextContent('/customize?tab=connectors');
    });

    it('× closes from a middle step and records where', () => {
        setup();
        advancePastDelay();
        click('Get started');
        click('Close');
        expect(sendDesktopAppOnboardingEndedEvent).toHaveBeenCalledWith({
            step: 'connectors',
            method: 'close',
            finalStep: 'upsell',
        });
        expect(getDesktopAppOnboardingRecord()?.outcome).toBe('closed');
        // Stays blocking for the rest of the session, like the web introduction.
        expect(screen.getByTestId('blocking')).toHaveTextContent('true');
    });
});
