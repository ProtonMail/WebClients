import { TelemetryEasySwitchCreationFunnelEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { defineEvent } from '@proton/telemetry-tracker/lib/defineEvent';
import { allowed, bool, duration, topValues } from '@proton/telemetry-tracker/lib/dimensions';
import { defineTimer } from '@proton/telemetry-tracker/lib/timers';
import { tracker } from '@proton/telemetry-tracker/lib/tracker';

import { type EASY_SWITCH_SOURCES, ImportProvider, ImportType, type TIME_PERIOD } from '../interface';

/**
 * Funnel of the creation of an Easy Switch import (Outlook, Yahoo and "More import options").
 * One timer covers the whole creation: it starts with `creation_started` and every following step carries
 * the time elapsed since then (`durationMs`). It stops on `importer_created`.
 */
export const easySwitchCreationTimer = defineTimer('easySwitchCreation');

const IMPORT_PERIODS = ['big_bang', 'last_year', 'last_6_months', 'last_3_months', 'last_month', 'n/a'] as const;

const PROVIDERS = ['google', 'outlook', 'yahoo', 'imap'] as const;

type FunnelProvider = (typeof PROVIDERS)[number];

const providerToTelemetry = {
    [ImportProvider.GOOGLE]: 'google',
    [ImportProvider.OUTLOOK]: 'outlook',
    [ImportProvider.YAHOO]: 'yahoo',
    // "More import options"
    [ImportProvider.DEFAULT]: 'imap',
} as const satisfies Record<ImportProvider, FunnelProvider>;

/** One boolean per product, so each product can be analysed on its own */
export const getTelemetryProducts = (products: ImportType[] | undefined) => ({
    importsMail: !!products?.includes(ImportType.MAIL),
    importsCalendar: !!products?.includes(ImportType.CALENDAR),
    importsContacts: !!products?.includes(ImportType.CONTACTS),
    importsDrive: !!products?.includes(ImportType.DRIVE),
});

/** The period only applies to emails, `n/a` when the user does not import emails or it is not known yet */
export const getTelemetryImportPeriod = (importPeriod: TIME_PERIOD | undefined): (typeof IMPORT_PERIODS)[number] =>
    importPeriod ?? 'n/a';

const group = TelemetryMeasurementGroups.easySwitchCreationFunnel;
// Free list on the telemetry side (`top_values`): a new source needs no change to the telemetry definition
const sourceSpec = topValues();
const providerSpec = allowed(PROVIDERS);
const productsSpec = {
    importsMail: bool(),
    importsCalendar: bool(),
    importsContacts: bool(),
    importsDrive: bool(),
};
const importPeriodSpec = allowed(IMPORT_PERIODS);

/** The "Import your data" modal is shown. `provider` is the one preselected by the entry point */
const CreationStarted = defineEvent({
    target: 'telemetry',
    group,
    event: TelemetryEasySwitchCreationFunnelEvents.creationStarted,
    dimensions: { source: sourceSpec, provider: providerSpec },
});

/** The user chose a provider and what to import */
const ProductsSubmitted = defineEvent({
    target: 'telemetry',
    group,
    event: TelemetryEasySwitchCreationFunnelEvents.productsSubmitted,
    dimensions: { source: sourceSpec, provider: providerSpec, ...productsSpec },
    values: { durationMs: duration() },
});

/** The instructions screen is shown */
const InstructionsViewed = defineEvent({
    target: 'telemetry',
    group,
    event: TelemetryEasySwitchCreationFunnelEvents.instructionsViewed,
    dimensions: { provider: providerSpec, ...productsSpec },
    values: { durationMs: duration() },
});

/** The user is signed in and can customize the import. `importPeriodSelected` is the default one here */
const PrepareImportViewed = defineEvent({
    target: 'telemetry',
    group,
    event: TelemetryEasySwitchCreationFunnelEvents.prepareImportViewed,
    dimensions: { provider: providerSpec, ...productsSpec, importPeriodSelected: importPeriodSpec },
    values: { durationMs: duration() },
});

/** The import was created and started. `importPeriodSelected` is the one the user ended up with */
const ImporterCreated = defineEvent({
    target: 'telemetry',
    group,
    event: TelemetryEasySwitchCreationFunnelEvents.importerCreated,
    dimensions: { provider: providerSpec, ...productsSpec, importPeriodSelected: importPeriodSpec },
    values: { durationMs: duration() },
});

/**
 * What stopped the creation. It is a free list on the telemetry side (`top_values`), so a new step only needs a
 * new value here and no change to the telemetry definition.
 */
type EasySwitchCreationErrorStep = 'importer_creation' | 'calendar_creation' | 'import_payload' | 'import_start';

/** Something failed. `errorStep` tells at which stage of the creation */
const CreationError = defineEvent({
    target: 'telemetry',
    group,
    event: TelemetryEasySwitchCreationFunnelEvents.creationError,
    dimensions: {
        provider: providerSpec,
        ...productsSpec,
        errorStep: topValues(),
    },
    values: { durationMs: duration() },
});

/**
 * Drive-only imports have their own views and are not part of this funnel after the products are submitted.
 * `products_submitted` is still sent (with `importsDrive: true`) because the product selection modal sends
 * `creation_started` before the products are known: analysis can filter `drive` out of the first step.
 */
const isDriveOnly = (products: ImportType[] | undefined) => products?.length === 1 && products[0] === ImportType.DRIVE;

interface FunnelContext {
    provider: ImportProvider | undefined;
    products: ImportType[] | undefined;
}

// The provider is always known when these steps are reached, the fallback only keeps the types honest.
const toProvider = (provider: ImportProvider | undefined): FunnelProvider =>
    providerToTelemetry[provider ?? ImportProvider.DEFAULT];

export const isEasySwitchDriveOnly = isDriveOnly;

export const trackEasySwitchCreationStarted = ({
    source,
    provider,
}: {
    source: EASY_SWITCH_SOURCES;
    provider: ImportProvider;
}) => {
    // Restart: a creation left unfinished earlier must not leak its time into this one
    tracker.startTimer(easySwitchCreationTimer, { restart: true });
    tracker.emit(
        CreationStarted,
        { dimensions: { source, provider: toProvider(provider) } },
        // Flushed right away so the funnel events are not batched with the same timestamp
        { flushImmediately: true }
    );
};

export const trackEasySwitchProductsSubmitted = ({
    source,
    provider,
    products,
}: FunnelContext & { source: EASY_SWITCH_SOURCES }) => {
    tracker.emit(
        ProductsSubmitted,
        { dimensions: { source, provider: toProvider(provider), ...getTelemetryProducts(products) } },
        { durationFrom: easySwitchCreationTimer, flushImmediately: true }
    );
};

export const trackEasySwitchInstructionsViewed = ({ provider, products }: FunnelContext) => {
    if (isDriveOnly(products)) {
        return;
    }
    tracker.emit(
        InstructionsViewed,
        { dimensions: { provider: toProvider(provider), ...getTelemetryProducts(products) } },
        { durationFrom: easySwitchCreationTimer, flushImmediately: true }
    );
};

export const trackEasySwitchPrepareImportViewed = ({
    provider,
    products,
    importPeriod,
}: FunnelContext & { importPeriod: TIME_PERIOD | undefined }) => {
    if (isDriveOnly(products)) {
        return;
    }
    tracker.emit(
        PrepareImportViewed,
        {
            dimensions: {
                provider: toProvider(provider),
                ...getTelemetryProducts(products),
                importPeriodSelected: getTelemetryImportPeriod(importPeriod),
            },
        },
        { durationFrom: easySwitchCreationTimer, flushImmediately: true }
    );
};

export const trackEasySwitchImporterCreated = ({
    provider,
    products,
    importPeriod,
}: FunnelContext & { importPeriod: TIME_PERIOD | undefined }) => {
    if (isDriveOnly(products)) {
        return;
    }
    tracker.emit(
        ImporterCreated,
        {
            dimensions: {
                provider: toProvider(provider),
                ...getTelemetryProducts(products),
                importPeriodSelected: getTelemetryImportPeriod(importPeriod),
            },
        },
        { durationFrom: easySwitchCreationTimer, stopTimer: true, flushImmediately: true }
    );
};

export const trackEasySwitchCreationError = ({
    provider,
    products,
    errorStep,
}: FunnelContext & { errorStep: EasySwitchCreationErrorStep }) => {
    if (isDriveOnly(products)) {
        return;
    }
    tracker.emit(
        CreationError,
        { dimensions: { provider: toProvider(provider), ...getTelemetryProducts(products), errorStep } },
        // The timer keeps running: the user can retry, and the next creation_started restarts it anyway
        { durationFrom: easySwitchCreationTimer, flushImmediately: true }
    );
};
