import { renderHook } from '@testing-library/react';

import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { useWelcomeFlags } from '@proton/account/welcomeFlags';
import { TelemetryMailOnboardingEvents } from '@proton/shared/lib/api/telemetry';
import { tracker } from '@proton/telemetry-tracker/tracker';

import { ONBOARDING_STEPS, useOnboardingTracking } from './onboardingEvents';

jest.mock('@proton/account/allSubscriptions/hooks');

jest.mock('@proton/account/welcomeFlags');

jest.mock('@proton/telemetry-tracker/tracker', () => ({
    tracker: { emit: jest.fn(), startTimer: jest.fn() },
}));

const setReplay = (isReplay: boolean) => {
    jest.mocked(useWelcomeFlags).mockReturnValue({
        endReplay: jest.fn(),
        setDone: jest.fn(),
        startReplay: jest.fn(),
        welcomeFlags: { isWelcomeFlow: false, hasGenericWelcomeStep: false, isDone: false, isReplay },
    });
};

const getEmittedEvents = () => jest.mocked(tracker.emit).mock.calls.map(([event]) => event.event);

describe('onboarding flow dismissal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        sessionStorage.clear();
        setReplay(false);
        jest.mocked(useAllSubscriptions).mockReturnValue([[], false]);
    });

    it('sends flow_dismissed with the last displayed step', () => {
        const { result } = renderHook(() => useOnboardingTracking());

        result.current.trackStepLoaded(ONBOARDING_STEPS.welcome);
        result.current.trackStepLoaded(ONBOARDING_STEPS.themeSelection);
        result.current.trackFlowDismissed();

        const [event, payload] = jest.mocked(tracker.emit).mock.calls.at(-1) ?? [];
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
