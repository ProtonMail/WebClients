import { TelemetryMailOnboardingEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { APPS } from '@proton/shared/lib/constants';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { defineEvent } from '@proton/telemetry-tracker/lib/defineEvent';
import { allowed, duration, number, topValues } from '@proton/telemetry-tracker/lib/dimensions';
import { defineTimer } from '@proton/telemetry-tracker/lib/timers';
import { tracker } from '@proton/telemetry-tracker/lib/tracker';

/**
 * Proof of concept (DAWG-99): signup events sent to a temporary measurement group, to check how the data side
 * links the unauthenticated requests of the Account app with the authenticated ones of the Mail onboarding.
 * The Account app tracker is created before the session exists, so all these requests are unauthenticated,
 * even after the account is created.
 */

enum SIGNUP_STEPS {
    planSelection = 'plan_selection',
    accountCreation = 'account_creation',
    recovery = 'recovery',
    displayName = 'display_name',
}

type SignupProduct = 'mail' | 'calendar';

/** Only the Mail and Calendar signups are tracked. `undefined` means the signup is not tracked. */
export const getSignupProduct = (product: APP_NAMES | undefined): SignupProduct | undefined => {
    if (product === APPS.PROTONMAIL) {
        return 'mail';
    }

    if (product === APPS.PROTONCALENDAR) {
        return 'calendar';
    }

    return undefined;
};

/** The plan is only known once the account is created, so the first steps do not send it */
const baseDimensions = {
    flow: allowed(['signup']),
    product: allowed(['mail', 'calendar']),
    authState: allowed(['unauthenticated']),
};

const dimensionsWithPlan = {
    ...baseDimensions,
    /** Plans of the user, `free` when none */
    plan: topValues(),
};

const signupTimer = defineTimer('signup');

const baseEvent = {
    target: 'telemetry',
    group: TelemetryMeasurementGroups.mailSignupOnboardingPoc,
    values: { activeMs: duration(), timestampMs: number() },
    // The page is reloaded at the end of the signup: a delayed report would be lost
    delay: false,
} as const;

const stepLoad = defineEvent({
    ...baseEvent,
    event: TelemetryMailOnboardingEvents.stepLoad,
    dimensions: { ...baseDimensions, step: allowed([SIGNUP_STEPS.planSelection]) },
});

const accountCreated = defineEvent({
    ...baseEvent,
    event: TelemetryMailOnboardingEvents.stepCompleted,
    dimensions: { ...baseDimensions, step: allowed([SIGNUP_STEPS.accountCreation]) },
});

const recoveryLoad = defineEvent({
    ...baseEvent,
    event: TelemetryMailOnboardingEvents.stepLoad,
    dimensions: { ...dimensionsWithPlan, step: allowed([SIGNUP_STEPS.recovery]) },
});

const displayNameCompleted = defineEvent({
    ...baseEvent,
    event: TelemetryMailOnboardingEvents.stepCompleted,
    dimensions: { ...dimensionsWithPlan, step: allowed([SIGNUP_STEPS.displayName]) },
});

const flowFinished = defineEvent({
    ...baseEvent,
    event: TelemetryMailOnboardingEvents.flowFinished,
    dimensions: dimensionsWithPlan,
});

/** Idempotent: the first event of the signup starts the timer */
const withTiming = () => {
    tracker.startTimer(signupTimer);

    return { values: { timestampMs: Date.now() } };
};

const timing = { durationFrom: signupTimer };

export const trackSignupPlanSelectionLoaded = (product: APP_NAMES | undefined) => {
    const signupProduct = getSignupProduct(product);

    if (signupProduct) {
        tracker.emit(
            stepLoad,
            {
                dimensions: {
                    flow: 'signup',
                    product: signupProduct,
                    authState: 'unauthenticated',
                    step: SIGNUP_STEPS.planSelection,
                },
                ...withTiming(),
            },
            timing
        );
    }
};

export const trackSignupAccountCreated = (product: APP_NAMES | undefined) => {
    const signupProduct = getSignupProduct(product);

    if (signupProduct) {
        tracker.emit(
            accountCreated,
            {
                dimensions: {
                    flow: 'signup',
                    product: signupProduct,
                    authState: 'unauthenticated',
                    step: SIGNUP_STEPS.accountCreation,
                },
                ...withTiming(),
            },
            // Without onboarding the user is redirected right after this step
            { ...timing, flushImmediately: true }
        );
    }
};

export const trackSignupRecoveryLoaded = (product: APP_NAMES | undefined, plan: string) => {
    const signupProduct = getSignupProduct(product);

    if (signupProduct) {
        tracker.emit(
            recoveryLoad,
            {
                dimensions: {
                    flow: 'signup',
                    product: signupProduct,
                    authState: 'unauthenticated',
                    plan,
                    step: SIGNUP_STEPS.recovery,
                },
                ...withTiming(),
            },
            timing
        );
    }
};

/** Last step of the PoC: the display name is saved, the user is then redirected, so the batch is flushed */
export const trackSignupDisplayNameCompleted = (product: APP_NAMES | undefined, plan: string) => {
    const signupProduct = getSignupProduct(product);

    if (!signupProduct) {
        return;
    }

    const dimensions = { flow: 'signup', product: signupProduct, authState: 'unauthenticated', plan } as const;
    tracker.emit(
        displayNameCompleted,
        { dimensions: { ...dimensions, step: SIGNUP_STEPS.displayName }, ...withTiming() },
        timing
    );
    tracker.emit(flowFinished, { dimensions, ...withTiming() }, { ...timing, stopTimer: true, flushImmediately: true });
};
