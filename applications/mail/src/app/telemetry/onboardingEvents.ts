import { useState } from 'react';

import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { useWelcomeFlags } from '@proton/account/welcomeFlags';
import { ONBOARDING_THEMES } from '@proton/components/containers/onboarding/constants';
import { getPlanName } from '@proton/payments/core/subscription/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { TelemetryMailOnboardingEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/sessionStorage';
import { allowed, defineEvent, defineTimer, duration, number, topValues } from '@proton/telemetry-tracker/events';
import { tracker } from '@proton/telemetry-tracker/tracker';
import isTruthy from '@proton/utils/isTruthy';

type OnboardingThemeLabel = (typeof ONBOARDING_THEMES)[number]['label'];

export enum ONBOARDING_STEPS {
    displayName = 'display_name',
    partner = 'partner',
    organization = 'organization',
    discoverApps = 'discover_apps',
    premiumFeatures = 'premium_features',
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
    startOrgSetup = 'start_org_setup',
    back = 'back',
    toggleSetting = 'toggle_setting',
}

/** Settings a user can switch on or off during the onboarding, sent as the `setting` dimension */
export enum ONBOARDING_SETTINGS {
    shortDomain = 'short_domain',
    darkWebMonitoring = 'dark_web_monitoring',
    autoDelete = 'auto_delete',
}

const baseDimensions = {
    flow: allowed(['onboarding']),
    step: allowed(Object.values(ONBOARDING_STEPS)),
    /**
     * Plans the user holds, sorted and joined with a comma (for example `bundle2022,pass2023`), `free` when none, `unknown` while they load.
     * Several subscriptions can coexist, so there is no single plan.
     */
    plan: topValues(),
};

/** Time the user spent in the onboarding, sent as `activeMs` on every event */
const onboardingTimer = defineTimer('mailOnboarding');

export const getPlanDimension = (subscriptions: Subscription[]) => {
    const names = subscriptions.map((subscription) => getPlanName(subscription)).filter(isTruthy);
    return names.length ? Array.from(new Set(names)).sort().join(',') : 'free';
};

const baseValues = {
    activeMs: duration(),
    timestampMs: number(),
};

const baseEvent = {
    target: 'telemetry',
    group: TelemetryMeasurementGroups.mailOnboarding,
    values: baseValues,
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

/** Same event as `stepInteracted`, for the `toggle_setting` action: which setting, and whether it ends up on */
const settingToggled = defineEvent({
    ...baseEvent,
    event: TelemetryMailOnboardingEvents.stepInteracted,
    dimensions: {
        ...baseDimensions,
        action: allowed([ONBOARDING_ACTIONS.toggleSetting]),
        setting: allowed(Object.values(ONBOARDING_SETTINGS)),
        enabled: allowed(['true', 'false']),
    },
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

const flowFinished = defineEvent({
    ...baseEvent,
    event: TelemetryMailOnboardingEvents.flowFinished,
    dimensions: { flow: baseDimensions.flow, plan: baseDimensions.plan },
});

/** Same funnel as the other events, sent when the user closes the onboarding (Esc, close button) before the end */
const flowDismissed = defineEvent({
    ...baseEvent,
    event: TelemetryMailOnboardingEvents.flowDismissed,
    dimensions: baseDimensions,
});

/**
 * Last step displayed, so a dismissal says where the user dropped off.
 * Removed when the flow ends (finished or dismissed): no key means there is nothing left to drop off from.
 */
const LAST_STEP_KEY = 'mail-onboarding-last-step';

const getLastLoadedStep = () => {
    const stored = getItem(LAST_STEP_KEY);
    return Object.values(ONBOARDING_STEPS).find((step) => step === stored);
};

/** Idempotent: the first event of the onboarding starts the timer */
const withTiming = () => {
    tracker.startTimer(onboardingTimer);
    return { values: { timestampMs: Date.now() } };
};

const timing = { durationFrom: onboardingTimer };

const trackStepLoaded = (plan: string, step: ONBOARDING_STEPS) => {
    tracker.emit(stepLoad, { dimensions: { flow: 'onboarding', plan, step }, ...withTiming() }, timing);
};

const trackStepInteracted = (plan: string, step: ONBOARDING_STEPS, action: ONBOARDING_ACTIONS) => {
    tracker.emit(stepInteracted, { dimensions: { flow: 'onboarding', plan, step, action }, ...withTiming() }, timing);
};

const trackStepCompleted = (plan: string, step: ONBOARDING_STEPS) => {
    tracker.emit(stepCompleted, { dimensions: { flow: 'onboarding', plan, step }, ...withTiming() }, timing);
};

const trackThemeStepCompleted = (plan: string, theme: OnboardingThemeLabel) => {
    tracker.emit(
        themeStepCompleted,
        {
            dimensions: { flow: 'onboarding', plan, step: ONBOARDING_STEPS.themeSelection, theme },
            ...withTiming(),
        },
        timing
    );
};

const trackSettingToggled = (plan: string, step: ONBOARDING_STEPS, setting: ONBOARDING_SETTINGS, enabled: boolean) => {
    tracker.emit(
        settingToggled,
        {
            dimensions: {
                flow: 'onboarding',
                plan,
                step,
                action: ONBOARDING_ACTIONS.toggleSetting,
                setting,
                enabled: enabled ? 'true' : 'false',
            },
            ...withTiming(),
        },
        timing
    );
};

const trackFlowDismissed = (plan: string, step: ONBOARDING_STEPS) => {
    tracker.emit(
        flowDismissed,
        { dimensions: { flow: 'onboarding', plan, step }, ...withTiming() },
        { ...timing, stopTimer: true }
    );
};

const trackFlowFinished = (plan: string) => {
    tracker.emit(
        flowFinished,
        { dimensions: { flow: 'onboarding', plan }, ...withTiming() },
        { ...timing, stopTimer: true }
    );
};

/** Replays of the onboarding are not tracked, the funnel only measures first-time users */
export const useOnboardingTracking = () => {
    const { welcomeFlags } = useWelcomeFlags();
    // Only read once: the flag flips back when the modal closes, the last events must still follow the opening state
    const [isReplay] = useState(welcomeFlags.isReplay);
    const [subscriptions] = useAllSubscriptions();
    // `unknown` while the subscriptions load, so a paid user is never reported as free
    const plan = subscriptions ? getPlanDimension(subscriptions) : 'unknown';

    return {
        trackStepLoaded: (step: ONBOARDING_STEPS) => {
            if (!isReplay) {
                setItem(LAST_STEP_KEY, step);
                trackStepLoaded(plan, step);
            }
        },
        trackStepInteracted: (step: ONBOARDING_STEPS, action: ONBOARDING_ACTIONS) => {
            if (!isReplay) {
                trackStepInteracted(plan, step, action);
            }
        },
        trackStepCompleted: (step: ONBOARDING_STEPS) => {
            if (!isReplay) {
                trackStepCompleted(plan, step);
            }
        },
        trackThemeStepCompleted: (theme: OnboardingThemeLabel) => {
            if (!isReplay) {
                trackThemeStepCompleted(plan, theme);
            }
        },
        trackSettingToggled: (step: ONBOARDING_STEPS, setting: ONBOARDING_SETTINGS, enabled: boolean) => {
            if (!isReplay) {
                trackSettingToggled(plan, step, setting, enabled);
            }
        },
        /** Only sent when the user leaves before the end, and after at least one step was displayed */
        trackFlowDismissed: () => {
            const lastLoadedStep = getLastLoadedStep();

            if (!isReplay && lastLoadedStep) {
                removeItem(LAST_STEP_KEY);
                trackFlowDismissed(plan, lastLoadedStep);
            }
        },
        trackFlowFinished: () => {
            if (!isReplay) {
                removeItem(LAST_STEP_KEY);
                trackFlowFinished(plan);
            }
        },
    };
};
