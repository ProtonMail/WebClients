import { ONBOARDING_THEMES } from '@proton/components/containers/onboarding/constants';
import { TelemetryMailOnboardingEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { allowed, defineEvent, defineTimer, duration, number } from '@proton/telemetry-tracker/events';
import { tracker } from '@proton/telemetry-tracker/tracker';

// TODO remove the delay false

export enum ONBOARDING_STEPS {
    welcome = 'welcome',
    desktopApp = 'get_desktop_app',
    mobileApp = 'get_mobile_app',
    themeSelection = 'theme',
}

export enum ONBOARDING_ACTIONS {
    downloadApp = 'download_app',
    openAppStore = 'open_app_store',
    openPlayStore = 'open_play_store',
    selectTheme = 'select_theme',
}

const baseDimensions = {
    flow: allowed(['onboarding']),
    step: allowed(Object.values(ONBOARDING_STEPS)),
};

/** Time the user spent in the onboarding, sent as `activeMs` on every event */
const onboardingTimer = defineTimer('mailOnboarding');

const baseValues = {
    activeMs: duration(),
    timestamp: number(),
};

const baseEvent = {
    target: 'telemetry',
    group: TelemetryMeasurementGroups.mailOnboarding,
    values: baseValues,
    delay: false,
} as const;

const stepLoad = defineEvent({
    ...baseEvent,
    event: TelemetryMailOnboardingEvents.stepLoad,
    dimensions: baseDimensions,
});

const stepInteracted = defineEvent({
    ...baseEvent,
    event: TelemetryMailOnboardingEvents.stepInteracted,
    dimensions: { ...baseDimensions, action: allowed(Object.values(ONBOARDING_ACTIONS)) },
});

const stepCompleted = defineEvent({
    ...baseEvent,
    event: TelemetryMailOnboardingEvents.stepCompleted,
    dimensions: baseDimensions,
});

/** Same event as `stepCompleted`, the theme step also says which theme the user ends up with */
const themeStepCompleted = defineEvent({
    ...baseEvent,
    event: TelemetryMailOnboardingEvents.stepCompleted,
    dimensions: { ...baseDimensions, theme: allowed(ONBOARDING_THEMES.map(({ label }) => label)) },
});

/** Idempotent: the first event of the onboarding starts the timer */
const withTiming = () => {
    tracker.startTimer(onboardingTimer);
    return { values: { timestamp: Date.now() } };
};

const timing = { durationFrom: onboardingTimer };

export const trackStepLoaded = (step: ONBOARDING_STEPS) => {
    tracker.emit(stepLoad, { dimensions: { flow: 'onboarding', step }, ...withTiming() }, timing);
};

export const trackStepInteracted = (step: ONBOARDING_STEPS, action: ONBOARDING_ACTIONS) => {
    tracker.emit(stepInteracted, { dimensions: { flow: 'onboarding', step, action }, ...withTiming() }, timing);
};

export const trackStepCompleted = (step: ONBOARDING_STEPS) => {
    tracker.emit(stepCompleted, { dimensions: { flow: 'onboarding', step }, ...withTiming() }, timing);
};

export const trackThemeStepCompleted = (theme: (typeof ONBOARDING_THEMES)[number]['label']) => {
    tracker.emit(
        themeStepCompleted,
        {
            dimensions: { flow: 'onboarding', step: ONBOARDING_STEPS.themeSelection, theme },
            ...withTiming(),
        },
        timing
    );
};
