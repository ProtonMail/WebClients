import { renderHook } from '@testing-library/react';

import { useWelcomeFlags } from '@proton/account/welcomeFlags';
import { TelemetryMailOnboardingEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { tracker } from '@proton/telemetry-tracker/lib/tracker';

import { ONBOARDING_STEPS, useOnboardingTracking } from './onboardingEvents';
import { rememberWebSignup } from './signupOrigin';

vi.mock('@proton/account/welcomeFlags');

vi.mock('@proton/telemetry-tracker/lib/tracker', () => ({
    tracker: { emit: vi.fn(), startTimer: vi.fn() },
}));

const setReplay = (isReplay: boolean) => {
    vi.mocked(useWelcomeFlags).mockReturnValue({
        endReplay: vi.fn(),
        setDone: vi.fn(),
        startReplay: vi.fn(),
        welcomeFlags: { isWelcomeFlow: false, hasGenericWelcomeStep: false, isDone: false, isReplay },
    });
};

const getEmittedEvents = () =>
    vi
        .mocked(tracker.emit)
        .mock.calls.filter(([event]) => event.group === TelemetryMeasurementGroups.mailOnboarding)
        .map(([event]) => event.event);

describe('onboarding flow dismissal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
        setReplay(false);
    });

    it('sends flow_dismissed with the last displayed step', () => {
        const { result } = renderHook(() => useOnboardingTracking());

        result.current.trackStepLoaded(ONBOARDING_STEPS.welcome);
        result.current.trackStepLoaded(ONBOARDING_STEPS.themeSelection);
        result.current.trackFlowDismissed();

        const [event, payload] = vi.mocked(tracker.emit).mock.calls.at(-1) ?? [];
        expect(event?.event).toBe(TelemetryMailOnboardingEvents.flowDismissed);
        expect(payload?.dimensions).toMatchObject({ flow: 'onboarding', step: ONBOARDING_STEPS.themeSelection });
    });

    it('does not send flow_dismissed when no step was displayed', () => {
        const { result } = renderHook(() => useOnboardingTracking());

        result.current.trackFlowDismissed();

        expect(tracker.emit).not.toHaveBeenCalled();
    });

    it('does not send flow_dismissed when the modal closes after the flow finished', () => {
        const { result } = renderHook(() => useOnboardingTracking());

        result.current.trackStepLoaded(ONBOARDING_STEPS.welcome);
        result.current.trackFlowFinished();
        result.current.trackFlowDismissed();

        expect(getEmittedEvents()).toEqual([
            TelemetryMailOnboardingEvents.stepLoad,
            TelemetryMailOnboardingEvents.flowFinished,
        ]);
    });

    it('sends flow_dismissed once', () => {
        const { result } = renderHook(() => useOnboardingTracking());

        result.current.trackStepLoaded(ONBOARDING_STEPS.welcome);
        result.current.trackFlowDismissed();
        result.current.trackFlowDismissed();

        expect(getEmittedEvents().filter((name) => name === TelemetryMailOnboardingEvents.flowDismissed)).toHaveLength(
            1
        );
    });

    it('does not track anything on replay', () => {
        setReplay(true);
        const { result } = renderHook(() => useOnboardingTracking());

        result.current.trackStepLoaded(ONBOARDING_STEPS.welcome);
        result.current.trackFlowDismissed();

        expect(tracker.emit).not.toHaveBeenCalled();
    });
});

describe('signup proof of concept', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
        rememberWebSignup('?welcome=true&signupProduct=Mail');
        setReplay(false);
    });

    const getPocEvents = () =>
        vi
            .mocked(tracker.emit)
            .mock.calls.filter(([event]) => event.group === TelemetryMeasurementGroups.mailSignupOnboardingPoc);

    it('sends the welcome step to the PoC group as authenticated, once', () => {
        const { result } = renderHook(() => useOnboardingTracking());

        result.current.trackStepLoaded(ONBOARDING_STEPS.welcome);
        result.current.trackStepLoaded(ONBOARDING_STEPS.themeSelection);

        const pocEvents = getPocEvents();
        expect(pocEvents).toHaveLength(1);
        expect(pocEvents[0][1]).toMatchObject({
            dimensions: {
                flow: 'onboarding',
                product: 'mail',
                authState: 'authenticated',
                step: ONBOARDING_STEPS.welcome,
            },
        });
    });

    it('does not send it when the account was not created by the web signup', () => {
        sessionStorage.clear();
        const { result } = renderHook(() => useOnboardingTracking());

        result.current.trackStepLoaded(ONBOARDING_STEPS.welcome);

        expect(getPocEvents()).toHaveLength(0);
        // The regular onboarding events are not affected
        expect(getEmittedEvents()).toHaveLength(1);
    });

    it('does not send it on a replay', () => {
        setReplay(true);
        const { result } = renderHook(() => useOnboardingTracking());

        result.current.trackStepLoaded(ONBOARDING_STEPS.welcome);

        expect(getPocEvents()).toHaveLength(0);
    });
});

describe('view layout step', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
        setReplay(false);
    });

    it('sends step_completed with the chosen layout', () => {
        const { result } = renderHook(() => useOnboardingTracking());

        result.current.trackViewLayoutStepCompleted('column');

        const [event, payload] = vi.mocked(tracker.emit).mock.calls.at(-1) ?? [];
        expect(event?.event).toBe(TelemetryMailOnboardingEvents.stepCompleted);
        expect(event?.group).toBe(TelemetryMeasurementGroups.mailOnboarding);
        expect(payload?.dimensions).toEqual({
            flow: 'onboarding',
            step: ONBOARDING_STEPS.viewLayout,
            viewLayout: 'column',
        });
    });

    it('does not send it on a replay', () => {
        setReplay(true);
        const { result } = renderHook(() => useOnboardingTracking());

        result.current.trackViewLayoutStepCompleted('row');

        expect(tracker.emit).not.toHaveBeenCalled();
    });
});
