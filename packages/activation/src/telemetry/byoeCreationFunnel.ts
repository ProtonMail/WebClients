import { TelemetryBYOECreationFunnelEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { defineEvent } from '@proton/telemetry-tracker/lib/defineEvent';
import { allowed, bool, duration, topValues } from '@proton/telemetry-tracker/lib/dimensions';
import { defineTimer } from '@proton/telemetry-tracker/lib/timers';
import { tracker } from '@proton/telemetry-tracker/lib/tracker';

import type { EASY_SWITCH_SOURCES, TIME_PERIOD } from '../interface';

/**
 * Funnel of the creation of a BYOE address (connecting a Gmail address).
 * One timer covers the whole creation: it starts with `creation_started` and every following step carries
 * the time elapsed since then (`durationMs`). It stops on `importer_created`.
 */
const byoeCreationTimer = defineTimer('byoeCreation');

const PROVIDERS = ['google', 'outlook'] as const;

type BYOEProvider = (typeof PROVIDERS)[number];

const IMPORT_PERIODS = ['big_bang', 'last_year', 'last_6_months', 'last_3_months', 'last_month', 'n/a'] as const;

/**
 * What stopped the creation. It is a free list on the telemetry side (`top_values`), so a new step only needs a
 * new value here and no change to the telemetry definition.
 */
export type BYOECreationErrorStep =
    | 'authentication'
    | 'wrong_account'
    | 'address_already_connected'
    | 'address_linked_to_another_account'
    | 'address_creation';

const group = TelemetryMeasurementGroups.byoeCreationFunnel;
const providerSpec = allowed(PROVIDERS);
const importPeriodSpec = allowed(IMPORT_PERIODS);

/**
 * Arm of the import period experiment (`InboxBringYourOwnEmailImportPeriodExperiment`) the user is in.
 * `n/a` when the experiment does not apply: flag off, or a flow without the experiment (mobile).
 */
const VARIANTS = ['n/a', 'control', 'treatment'] as const;
export type BYOEImportPeriodVariant = (typeof VARIANTS)[number];
const variantSpec = allowed(VARIANTS);

/**
 * Variant of the running creation, set by `trackBYOECreationStarted`. Kept here so that the steps emitted from
 * hooks far from the modal carry it without having it passed down to each of them.
 */
let currentVariant: BYOEImportPeriodVariant = 'n/a';

/** The period only applies to emails: `n/a` when they are not imported or the user could not choose one */
const getTelemetryImportPeriod = (importPeriod: TIME_PERIOD | undefined): (typeof IMPORT_PERIODS)[number] =>
    importPeriod ?? 'n/a';

/** The connection modal is shown. `isConversion` is when a Gmail forwarding is converted to a BYOE address */
const CreationStarted = defineEvent({
    target: 'telemetry',
    group,
    event: TelemetryBYOECreationFunnelEvents.creationStarted,
    dimensions: {
        // Free list on the telemetry side (`top_values`): a new source needs no change to the telemetry definition
        source: topValues(),
        provider: providerSpec,
        isConversion: bool(),
        variant: variantSpec,
    },
});

/** The user pressed "Sign in with Google" ("Connect your email") */
const GoogleSignInClicked = defineEvent({
    target: 'telemetry',
    group,
    event: TelemetryBYOECreationFunnelEvents.googleSignInClicked,
    dimensions: {
        provider: providerSpec,
        hasImportEmails: bool(),
        importPeriodSelected: importPeriodSpec,
        variant: variantSpec,
    },
    values: { durationMs: duration() },
});

/** The Google sign-in succeeded */
const Authenticated = defineEvent({
    target: 'telemetry',
    group,
    event: TelemetryBYOECreationFunnelEvents.authenticated,
    dimensions: { provider: providerSpec, variant: variantSpec },
    values: { durationMs: duration() },
});

/** The upsell modal (more storage) is shown. It comes after the address was created, so there is no duration */
const UpsellModalViewed = defineEvent({
    target: 'telemetry',
    group,
    event: TelemetryBYOECreationFunnelEvents.upsellModalViewed,
    dimensions: { provider: providerSpec, variant: variantSpec },
});

/**
 * The BYOE address was created. `isUpsellShown` tells whether the user goes on to see the upsell modal
 * (free user who imports emails), `isClaimedAddress` whether the address was claimed from another account.
 */
const ImporterCreated = defineEvent({
    target: 'telemetry',
    group,
    event: TelemetryBYOECreationFunnelEvents.importerCreated,
    dimensions: {
        provider: providerSpec,
        hasImportEmails: bool(),
        importPeriodSelected: importPeriodSpec,
        isUpsellShown: bool(),
        isClaimedAddress: bool(),
        variant: variantSpec,
    },
    values: { durationMs: duration() },
});

/** Something failed. `errorStep` tells what stopped the creation */
const CreationError = defineEvent({
    target: 'telemetry',
    group,
    event: TelemetryBYOECreationFunnelEvents.creationError,
    dimensions: { provider: providerSpec, errorStep: topValues(), variant: variantSpec },
    values: { durationMs: duration() },
});

// BYOE only supports Google for now, the dimension is ready for Outlook.
const DEFAULT_PROVIDER: BYOEProvider = 'google';

export const trackBYOECreationStarted = ({
    source,
    isConversion,
    variant = 'n/a',
    provider = DEFAULT_PROVIDER,
}: {
    source: EASY_SWITCH_SOURCES;
    isConversion: boolean;
    variant?: BYOEImportPeriodVariant;
    provider?: BYOEProvider;
}) => {
    // Restart: a creation left unfinished earlier must not leak its time into this one
    tracker.startTimer(byoeCreationTimer, { restart: true });
    currentVariant = variant;
    tracker.emit(
        CreationStarted,
        { dimensions: { source, provider, isConversion, variant } },
        // Every funnel event is flushed right away: batched events share the same timestamp and cannot be ordered
        { flushImmediately: true }
    );
};

/**
 * Timestamp (epoch ms) at which the running creation started. Keep it across a full-page redirect (the timer only
 * lives in memory) and hand it to `resumeBYOECreation` when the user is back. `undefined` when no creation runs.
 */
export const getBYOECreationStartedAt = () => {
    const elapsed = tracker.getElapsed(byoeCreationTimer);
    return elapsed === undefined ? undefined : Date.now() - elapsed;
};

/** Continues a creation that began before a page reload, without emitting `creation_started` again */
export const resumeBYOECreation = (startedAt: number | undefined) => {
    if (startedAt === undefined || !Number.isFinite(startedAt)) {
        return;
    }
    // The experiment does not run in the flows that resume after a redirect
    currentVariant = 'n/a';
    tracker.startTimer(byoeCreationTimer, { restart: true, elapsedMs: Date.now() - startedAt });
};

export const trackBYOEGoogleSignInClicked = ({
    hasImportEmails,
    importPeriod,
    provider = DEFAULT_PROVIDER,
}: {
    hasImportEmails: boolean;
    importPeriod: TIME_PERIOD | undefined;
    provider?: BYOEProvider;
}) => {
    tracker.emit(
        GoogleSignInClicked,
        {
            dimensions: {
                provider,
                hasImportEmails,
                importPeriodSelected: hasImportEmails ? getTelemetryImportPeriod(importPeriod) : 'n/a',
                variant: currentVariant,
            },
        },
        { durationFrom: byoeCreationTimer, flushImmediately: true }
    );
};

export const trackBYOEAuthenticated = (provider: BYOEProvider = DEFAULT_PROVIDER) => {
    tracker.emit(
        Authenticated,
        { dimensions: { provider, variant: currentVariant } },
        { durationFrom: byoeCreationTimer, flushImmediately: true }
    );
};

export const trackBYOEUpsellModalViewed = (provider: BYOEProvider = DEFAULT_PROVIDER) => {
    tracker.emit(UpsellModalViewed, { dimensions: { provider, variant: currentVariant } }, { flushImmediately: true });
};

export const trackBYOEImporterCreated = ({
    hasImportEmails,
    importPeriod,
    isUpsellShown,
    isClaimedAddress,
    provider = DEFAULT_PROVIDER,
}: {
    hasImportEmails: boolean;
    importPeriod: TIME_PERIOD | undefined;
    /** Whether the user goes on to see the upsell modal: free users who import emails, on the web only */
    isUpsellShown: boolean;
    isClaimedAddress: boolean;
    provider?: BYOEProvider;
}) => {
    tracker.emit(
        ImporterCreated,
        {
            dimensions: {
                provider,
                hasImportEmails,
                importPeriodSelected: hasImportEmails ? getTelemetryImportPeriod(importPeriod) : 'n/a',
                isUpsellShown,
                isClaimedAddress,
                variant: currentVariant,
            },
        },
        { durationFrom: byoeCreationTimer, stopTimer: true, flushImmediately: true }
    );
};

export const trackBYOECreationError = (errorStep: BYOECreationErrorStep, provider: BYOEProvider = DEFAULT_PROVIDER) => {
    // The timer keeps running: the user can retry, and the next creation_started restarts it anyway
    tracker.emit(
        CreationError,
        { dimensions: { provider, errorStep, variant: currentVariant } },
        { durationFrom: byoeCreationTimer, flushImmediately: true }
    );
};
