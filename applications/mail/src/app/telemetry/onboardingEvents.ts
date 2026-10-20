import { ONBOARDING_THEMES } from '@proton/components/containers/onboarding/constants';
import { TelemetryMailOnboardingEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { allowed, defineEvent } from '@proton/telemetry-tracker/events';
import { tracker } from '@proton/telemetry-tracker/tracker';

// TODO how we send the time?
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

const baseEvent = {
    target: 'telemetry',
    group: TelemetryMeasurementGroups.mailOnboarding,
    delay: false,
} as const;

const stepViewed = defineEvent({
    ...baseEvent,
    event: TelemetryMailOnboardingEvents.stepViewed,
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

export const trackStepViewed = (step: ONBOARDING_STEPS) => {
    tracker.emit(stepViewed, { dimensions: { flow: 'onboarding', step } });
};

export const trackStepInteracted = (step: ONBOARDING_STEPS, action: ONBOARDING_ACTIONS) => {
    tracker.emit(stepInteracted, { dimensions: { flow: 'onboarding', step, action } });
};

export const trackStepCompleted = (step: ONBOARDING_STEPS) => {
    tracker.emit(stepCompleted, { dimensions: { flow: 'onboarding', step } });
};

export const trackThemeStepCompleted = (theme: (typeof ONBOARDING_THEMES)[number]['label']) => {
    tracker.emit(themeStepCompleted, {
        dimensions: { flow: 'onboarding', step: ONBOARDING_STEPS.themeSelection, theme },
    });
};
