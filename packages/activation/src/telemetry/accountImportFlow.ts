import { TelemetryAccountImportFlowEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { defineEvent } from '@proton/telemetry-tracker/lib/defineEvent';
import { allowed, bool, duration, number, topValues } from '@proton/telemetry-tracker/lib/dimensions';
import { defineTimer } from '@proton/telemetry-tracker/lib/timers';
import { tracker } from '@proton/telemetry-tracker/lib/tracker';

import { type EASY_SWITCH_SOURCES, ImportProvider, ImportType, type TIME_PERIOD } from '../interface';

/**
 * Telemetry of the BYOE and Easy Switch flows, modelled like the Mail onboarding (`onboardingEvents.ts`): a few
 * generic events (`step_load`, `step_interacted`, `step_completed`, `flow_finished`, `flow_error`) described by
 * `flow`, `step` and `action`, all in one group.
 *
 * It runs next to the earlier groups (`byoeCreationFunnel`, `easySwitchCreationFunnel`, `events`), which still
 * receive their events until the Data team has moved to this one.
 */

const FLOWS = ['byoe', 'easy_switch'] as const;
type Flow = (typeof FLOWS)[number];

const STEPS = [
    /** BYOE: the modal that connects a Gmail address */
    'connect_modal',
    /** BYOE: the Google sign-in */
    'sign_in',
    /** BYOE: the storage upsell shown after the address was created */
    'upsell',
    'claimable_address_modal',
    'linked_address_modal',
    /** BYOE: the connected address, in the settings or the success modal */
    'address_management',
    /** Easy Switch: the "Import your data" modal, where the provider and what to import are chosen */
    'import_modal',
    'instructions',
    /** Easy Switch: the user is signed in and can customize the import */
    'customize_import',
    /** Easy Switch: a row of the import table */
    'import_report',
] as const;

const ACTIONS = [
    'sign_in',
    'claim',
    'learn_more',
    'view_guide',
    'got_it',
    'close',
    'manage_address',
    'disconnect',
    'reconnect',
    'cancel_import',
    'resume_import',
    'undo_import',
    'delete_report',
] as const;
type Action = (typeof ACTIONS)[number];

const PROVIDERS = ['google', 'outlook', 'yahoo', 'imap'] as const;
type Provider = (typeof PROVIDERS)[number];

const PRODUCTS = ['mail', 'calendar', 'contacts', 'drive'] as const;

const IMPORT_PERIODS = ['big_bang', 'last_year', 'last_6_months', 'last_3_months', 'last_month', 'n/a'] as const;

/**
 * Arm of the import period experiment (`InboxBringYourOwnEmailImportPeriodExperiment`) the user is in.
 * `n/a` when the experiment does not apply: flag off, or a flow without the experiment (mobile).
 */
export const VARIANTS = ['n/a', 'control', 'treatment'] as const;
export type AccountImportFlowVariant = (typeof VARIANTS)[number];

/**
 * What stopped the flow. It is a free list on the telemetry side (`top_values`), so a new error only needs a
 * new value here and no change to the telemetry definition.
 */
export type AccountImportFlowErrorStep = string;

const flowSpec = allowed(FLOWS);
const stepSpec = allowed(STEPS);
const actionSpec = allowed(ACTIONS);
const providerSpec = allowed(PROVIDERS);
const importPeriodSpec = allowed(IMPORT_PERIODS);
const variantSpec = allowed(VARIANTS);
// Free list on the telemetry side (`top_values`): a new source needs no change to the telemetry definition
const sourceSpec = topValues();
const productsSpec = {
    importsMail: bool(),
    importsCalendar: bool(),
    importsContacts: bool(),
    importsDrive: bool(),
};

/** Time the user spent in the flow (activeMs) and when the event happened (timestampMs), sent on every event */
const baseValues = { activeMs: duration(), timestampMs: number() };

const baseEvent = {
    target: 'telemetry',
    group: TelemetryMeasurementGroups.accountImportFlow,
    values: baseValues,
} as const;

/**
 * One timer per flow, started by the first step of that flow and stopped when it finishes. A step only gets `activeMs`
 * from the timer of its own flow, so a step sent without its flow's start (a drive-only import, an event after an
 * abandoned flow of the other kind) never picks up the time of another flow. The events sent when no flow runs (the
 * modals shown on their own, the actions on a connected address or an import) carry no `activeMs`.
 */
const byoeTimer = defineTimer('accountImportByoe');
const easySwitchTimer = defineTimer('accountImportEasySwitch');
const byoeTiming = { durationFrom: byoeTimer, flushImmediately: true };
const easySwitchTiming = { durationFrom: easySwitchTimer, flushImmediately: true };

const withTimestamp = () => ({ values: { timestampMs: Date.now() } });

// step_load

const modalShown = defineEvent({
    ...baseEvent,
    event: TelemetryAccountImportFlowEvents.stepLoad,
    dimensions: { flow: flowSpec, step: stepSpec },
});

const byoeConnectModalShown = defineEvent({
    ...baseEvent,
    event: TelemetryAccountImportFlowEvents.stepLoad,
    dimensions: {
        flow: flowSpec,
        step: stepSpec,
        source: sourceSpec,
        provider: providerSpec,
        isConversion: bool(),
        variant: variantSpec,
    },
});

const byoeStepLoad = defineEvent({
    ...baseEvent,
    event: TelemetryAccountImportFlowEvents.stepLoad,
    dimensions: { flow: flowSpec, step: stepSpec, provider: providerSpec, variant: variantSpec },
});

const easySwitchImportModalShown = defineEvent({
    ...baseEvent,
    event: TelemetryAccountImportFlowEvents.stepLoad,
    dimensions: { flow: flowSpec, step: stepSpec, source: sourceSpec, provider: providerSpec },
});

const easySwitchInstructionsShown = defineEvent({
    ...baseEvent,
    event: TelemetryAccountImportFlowEvents.stepLoad,
    dimensions: { flow: flowSpec, step: stepSpec, provider: providerSpec, ...productsSpec },
});

const easySwitchCustomizeShown = defineEvent({
    ...baseEvent,
    event: TelemetryAccountImportFlowEvents.stepLoad,
    dimensions: {
        flow: flowSpec,
        step: stepSpec,
        provider: providerSpec,
        ...productsSpec,
        importPeriodSelected: importPeriodSpec,
    },
});

// step_interacted

const modalAction = defineEvent({
    ...baseEvent,
    event: TelemetryAccountImportFlowEvents.stepInteracted,
    dimensions: { flow: flowSpec, step: stepSpec, action: actionSpec },
});

const byoeSignInClicked = defineEvent({
    ...baseEvent,
    event: TelemetryAccountImportFlowEvents.stepInteracted,
    dimensions: {
        flow: flowSpec,
        step: stepSpec,
        action: actionSpec,
        provider: providerSpec,
        hasImportEmails: bool(),
        importPeriodSelected: importPeriodSpec,
        variant: variantSpec,
    },
});

const byoeAddressAction = defineEvent({
    ...baseEvent,
    event: TelemetryAccountImportFlowEvents.stepInteracted,
    dimensions: { flow: flowSpec, step: stepSpec, action: actionSpec, provider: providerSpec },
});

const importReportAction = defineEvent({
    ...baseEvent,
    event: TelemetryAccountImportFlowEvents.stepInteracted,
    dimensions: {
        flow: flowSpec,
        step: stepSpec,
        action: actionSpec,
        isBYOE: bool(),
        provider: providerSpec,
        product: allowed(PRODUCTS),
    },
});

// step_completed

const byoeStepCompleted = defineEvent({
    ...baseEvent,
    event: TelemetryAccountImportFlowEvents.stepCompleted,
    dimensions: { flow: flowSpec, step: stepSpec, provider: providerSpec, variant: variantSpec },
});

const easySwitchImportModalCompleted = defineEvent({
    ...baseEvent,
    event: TelemetryAccountImportFlowEvents.stepCompleted,
    dimensions: {
        flow: flowSpec,
        step: stepSpec,
        source: sourceSpec,
        provider: providerSpec,
        ...productsSpec,
    },
});

// flow_finished

const byoeFlowFinished = defineEvent({
    ...baseEvent,
    event: TelemetryAccountImportFlowEvents.flowFinished,
    dimensions: {
        flow: flowSpec,
        provider: providerSpec,
        hasImportEmails: bool(),
        importPeriodSelected: importPeriodSpec,
        isUpsellShown: bool(),
        isClaimedAddress: bool(),
        variant: variantSpec,
    },
});

const easySwitchFlowFinished = defineEvent({
    ...baseEvent,
    event: TelemetryAccountImportFlowEvents.flowFinished,
    dimensions: { flow: flowSpec, provider: providerSpec, ...productsSpec, importPeriodSelected: importPeriodSpec },
});

// flow_error

const byoeFlowError = defineEvent({
    ...baseEvent,
    event: TelemetryAccountImportFlowEvents.flowError,
    dimensions: { flow: flowSpec, provider: providerSpec, errorStep: topValues(), variant: variantSpec },
});

const easySwitchFlowError = defineEvent({
    ...baseEvent,
    event: TelemetryAccountImportFlowEvents.flowError,
    dimensions: { flow: flowSpec, provider: providerSpec, ...productsSpec, errorStep: topValues() },
});

const BYOE: Flow = 'byoe';
const EASY_SWITCH: Flow = 'easy_switch';

/** The period only applies to emails: `n/a` when they are not imported or the user could not choose one */
const toImportPeriod = (importPeriod: TIME_PERIOD | undefined): (typeof IMPORT_PERIODS)[number] =>
    importPeriod ?? 'n/a';

/** One boolean per product, so each product can be analysed on its own */
const toProducts = (products: ImportType[] | undefined) => ({
    importsMail: !!products?.includes(ImportType.MAIL),
    importsCalendar: !!products?.includes(ImportType.CALENDAR),
    importsContacts: !!products?.includes(ImportType.CONTACTS),
    importsDrive: !!products?.includes(ImportType.DRIVE),
});

const easySwitchProviders = {
    [ImportProvider.GOOGLE]: 'google',
    [ImportProvider.OUTLOOK]: 'outlook',
    [ImportProvider.YAHOO]: 'yahoo',
    // "More import options"
    [ImportProvider.DEFAULT]: 'imap',
} as const satisfies Record<ImportProvider, Provider>;

// The provider is always known when these steps are reached, the fallback only keeps the types honest
const toEasySwitchProvider = (provider: ImportProvider | undefined): Provider =>
    easySwitchProviders[provider ?? ImportProvider.DEFAULT];

// Restart: a flow left unfinished earlier must not leak its time into this one
const startFlow = (timer: typeof byoeTimer | typeof easySwitchTimer) => tracker.startTimer(timer, { restart: true });

/**
 * Timestamp (epoch ms) at which the running BYOE flow started, `undefined` when none runs. Used to keep the time across a
 * full-page redirect, see `resumeAccountImportBYOE`.
 */
export const getAccountImportBYOEStartedAt = () => {
    const elapsed = tracker.getElapsed(byoeTimer);
    return elapsed === undefined ? undefined : Date.now() - elapsed;
};

/** Continues a BYOE flow that began before a page reload, without emitting its first step again */
export const resumeAccountImportBYOE = (startedAt: number | undefined) => {
    if (startedAt === undefined || !Number.isFinite(startedAt)) {
        return;
    }
    tracker.startTimer(byoeTimer, { restart: true, elapsedMs: Date.now() - startedAt });
};

export const trackAccountImportBYOEStarted = ({
    source,
    provider,
    isConversion,
    variant,
}: {
    source: EASY_SWITCH_SOURCES;
    provider: Provider;
    isConversion: boolean;
    variant: AccountImportFlowVariant;
}) => {
    startFlow(byoeTimer);
    tracker.emit(
        byoeConnectModalShown,
        {
            dimensions: { flow: BYOE, step: 'connect_modal', source, provider, isConversion, variant },
            ...withTimestamp(),
        },
        byoeTiming
    );
};

export const trackAccountImportBYOESignInClicked = ({
    provider,
    hasImportEmails,
    importPeriod,
    variant,
}: {
    provider: Provider;
    hasImportEmails: boolean;
    importPeriod: TIME_PERIOD | undefined;
    variant: AccountImportFlowVariant;
}) => {
    tracker.emit(
        byoeSignInClicked,
        {
            dimensions: {
                flow: BYOE,
                step: 'connect_modal',
                action: 'sign_in',
                provider,
                hasImportEmails,
                importPeriodSelected: hasImportEmails ? toImportPeriod(importPeriod) : 'n/a',
                variant,
            },
            ...withTimestamp(),
        },
        byoeTiming
    );
};

export const trackAccountImportBYOEAuthenticated = ({
    provider,
    variant,
}: {
    provider: Provider;
    variant: AccountImportFlowVariant;
}) => {
    tracker.emit(
        byoeStepCompleted,
        { dimensions: { flow: BYOE, step: 'sign_in', provider, variant }, ...withTimestamp() },
        byoeTiming
    );
};

export const trackAccountImportBYOEUpsellViewed = ({
    provider,
    variant,
}: {
    provider: Provider;
    variant: AccountImportFlowVariant;
}) => {
    // After the address was created: the flow is over, there is no `activeMs`
    tracker.emit(
        byoeStepLoad,
        { dimensions: { flow: BYOE, step: 'upsell', provider, variant }, ...withTimestamp() },
        { flushImmediately: true }
    );
};

export const trackAccountImportBYOEFinished = ({
    provider,
    hasImportEmails,
    importPeriod,
    isUpsellShown,
    isClaimedAddress,
    variant,
}: {
    provider: Provider;
    hasImportEmails: boolean;
    importPeriod: TIME_PERIOD | undefined;
    isUpsellShown: boolean;
    isClaimedAddress: boolean;
    variant: AccountImportFlowVariant;
}) => {
    tracker.emit(
        byoeFlowFinished,
        {
            dimensions: {
                flow: BYOE,
                provider,
                hasImportEmails,
                importPeriodSelected: hasImportEmails ? toImportPeriod(importPeriod) : 'n/a',
                isUpsellShown,
                isClaimedAddress,
                variant,
            },
            ...withTimestamp(),
        },
        { ...byoeTiming, stopTimer: true }
    );
};

export const trackAccountImportBYOEError = ({
    provider,
    errorStep,
    variant,
}: {
    provider: Provider;
    errorStep: AccountImportFlowErrorStep;
    variant: AccountImportFlowVariant;
}) => {
    // The timer keeps running: the user can retry, and the next start restarts it anyway
    tracker.emit(
        byoeFlowError,
        { dimensions: { flow: BYOE, provider, errorStep, variant }, ...withTimestamp() },
        byoeTiming
    );
};

/** The claim modal, shown when the Gmail address belongs to another account that can be claimed */
export const trackAccountImportClaimableAddressModalShown = () => {
    tracker.emit(
        modalShown,
        { dimensions: { flow: BYOE, step: 'claimable_address_modal' }, ...withTimestamp() },
        { flushImmediately: true }
    );
};

export const trackAccountImportClaimableAddressModalAction = (
    action: Extract<Action, 'claim' | 'learn_more' | 'close'>
) => {
    tracker.emit(
        modalAction,
        { dimensions: { flow: BYOE, step: 'claimable_address_modal', action }, ...withTimestamp() },
        { flushImmediately: true }
    );
};

/** The modal telling the user the Gmail address is linked to another account */
export const trackAccountImportLinkedAddressModalShown = () => {
    tracker.emit(
        modalShown,
        { dimensions: { flow: BYOE, step: 'linked_address_modal' }, ...withTimestamp() },
        { flushImmediately: true }
    );
};

export const trackAccountImportLinkedAddressModalAction = (
    action: Extract<Action, 'view_guide' | 'got_it' | 'close'>
) => {
    tracker.emit(
        modalAction,
        { dimensions: { flow: BYOE, step: 'linked_address_modal', action }, ...withTimestamp() },
        { flushImmediately: true }
    );
};

export const trackAccountImportBYOEAddressAction = (
    action: Extract<Action, 'manage_address' | 'disconnect' | 'reconnect'>,
    provider: Provider = 'google'
) => {
    tracker.emit(byoeAddressAction, {
        dimensions: { flow: BYOE, step: 'address_management', action, provider },
        ...withTimestamp(),
    });
};

export const trackAccountImportEasySwitchStarted = ({
    source,
    provider,
}: {
    source: EASY_SWITCH_SOURCES;
    provider: ImportProvider;
}) => {
    startFlow(easySwitchTimer);
    tracker.emit(
        easySwitchImportModalShown,
        {
            dimensions: { flow: EASY_SWITCH, step: 'import_modal', source, provider: toEasySwitchProvider(provider) },
            ...withTimestamp(),
        },
        easySwitchTiming
    );
};

export const trackAccountImportEasySwitchProductsSubmitted = ({
    source,
    provider,
    products,
}: {
    source: EASY_SWITCH_SOURCES;
    provider: ImportProvider | undefined;
    products: ImportType[] | undefined;
}) => {
    tracker.emit(
        easySwitchImportModalCompleted,
        {
            dimensions: {
                flow: EASY_SWITCH,
                step: 'import_modal',
                source,
                provider: toEasySwitchProvider(provider),
                ...toProducts(products),
            },
            ...withTimestamp(),
        },
        easySwitchTiming
    );
};

export const trackAccountImportEasySwitchInstructionsViewed = ({
    provider,
    products,
}: {
    provider: ImportProvider | undefined;
    products: ImportType[] | undefined;
}) => {
    tracker.emit(
        easySwitchInstructionsShown,
        {
            dimensions: {
                flow: EASY_SWITCH,
                step: 'instructions',
                provider: toEasySwitchProvider(provider),
                ...toProducts(products),
            },
            ...withTimestamp(),
        },
        easySwitchTiming
    );
};

export const trackAccountImportEasySwitchCustomizeViewed = ({
    provider,
    products,
    importPeriod,
}: {
    provider: ImportProvider | undefined;
    products: ImportType[] | undefined;
    importPeriod: TIME_PERIOD | undefined;
}) => {
    tracker.emit(
        easySwitchCustomizeShown,
        {
            dimensions: {
                flow: EASY_SWITCH,
                step: 'customize_import',
                provider: toEasySwitchProvider(provider),
                ...toProducts(products),
                importPeriodSelected: toImportPeriod(importPeriod),
            },
            ...withTimestamp(),
        },
        easySwitchTiming
    );
};

export const trackAccountImportEasySwitchFinished = ({
    provider,
    products,
    importPeriod,
}: {
    provider: ImportProvider | undefined;
    products: ImportType[] | undefined;
    importPeriod: TIME_PERIOD | undefined;
}) => {
    tracker.emit(
        easySwitchFlowFinished,
        {
            dimensions: {
                flow: EASY_SWITCH,
                provider: toEasySwitchProvider(provider),
                ...toProducts(products),
                importPeriodSelected: toImportPeriod(importPeriod),
            },
            ...withTimestamp(),
        },
        { ...easySwitchTiming, stopTimer: true }
    );
};

export const trackAccountImportEasySwitchError = ({
    provider,
    products,
    errorStep,
}: {
    provider: ImportProvider | undefined;
    products: ImportType[] | undefined;
    errorStep: AccountImportFlowErrorStep;
}) => {
    tracker.emit(
        easySwitchFlowError,
        {
            dimensions: {
                flow: EASY_SWITCH,
                provider: toEasySwitchProvider(provider),
                ...toProducts(products),
                errorStep,
            },
            ...withTimestamp(),
        },
        easySwitchTiming
    );
};

export const trackAccountImportReportAction = ({
    action,
    isBYOE,
    provider,
    product,
}: {
    action: Extract<Action, 'cancel_import' | 'resume_import' | 'undo_import' | 'delete_report'>;
    isBYOE: boolean;
    provider: 'google' | 'outlook' | 'imap';
    product: (typeof PRODUCTS)[number];
}) => {
    tracker.emit(importReportAction, {
        dimensions: { flow: EASY_SWITCH, step: 'import_report', action, isBYOE, provider, product },
        ...withTimestamp(),
    });
};
