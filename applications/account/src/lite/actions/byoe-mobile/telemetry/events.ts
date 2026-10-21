import type { ConnectBYOEAddressFailure } from '@proton/activation/src/byoe/connectBYOEAddress.interface';
import { TelemetryMailBringYourOwnEmailEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { allowed, defineEvent } from '@proton/telemetry-tracker/events';

// Definition: mail.any.bring_your_own_email (shared with the native clients).
//
// Dimensions of the definition that the web cannot fill, so they are not declared here:
// - `variant`: experiment group, native only.
// - `surface`: native screens only. The web page is always the settings page.
// - `bannerDayIndex`: sidebar banner of the native app only.

const DAYS_SINCE_ACCOUNT_CREATION = ['0', '01-03', '04-10', '11-30', '31-60', '61-120', '>120', 'n/a'] as const;
export type DaysSinceAccountCreation = (typeof DAYS_SINCE_ACCOUNT_CREATION)[number];

/** B2B users never see BYOE, so no event is sent for them. */
const AUDIENCES = ['b2c', 'free'] as const;
export type BYOEMobileAudience = (typeof AUDIENCES)[number];

export type BYOEMobileConnectErrorType = Exclude<ConnectBYOEAddressFailure['type'], 'claimable-address'>;

// A type is erased at runtime, so the list is built from a record keyed by the failure types: adding or removing
// a failure type fails the compilation until this record is updated.
// `claimable-address` is a confirmation, not a failure, so it is not reported.
const CONNECT_ERROR_TYPES_RECORD: Record<BYOEMobileConnectErrorType, true> = {
    'no-access': true,
    'already-added': true,
    'create-failed': true,
    'convert-failed': true,
    'linked-to-another-account': true,
    'wrong-account': true,
    'token-failed': true,
    unknown: true,
};
const CONNECT_ERROR_TYPES = Object.keys(CONNECT_ERROR_TYPES_RECORD) as BYOEMobileConnectErrorType[];

const baseDimensions = {
    daysSinceAccountCreation: allowed(DAYS_SINCE_ACCOUNT_CREATION),
    audience: allowed(AUDIENCES),
};

const group = TelemetryMeasurementGroups.mailBringYourOwnEmail;

export const byoeMobileSettingsView = defineEvent({
    target: 'telemetry',
    group,
    event: TelemetryMailBringYourOwnEmailEvents.settingsView,
    dimensions: baseDimensions,
});

export const byoeMobileSettingsListOnlyShown = defineEvent({
    target: 'telemetry',
    group,
    event: TelemetryMailBringYourOwnEmailEvents.settingsListOnlyShown,
    dimensions: baseDimensions,
});

export const byoeMobileConnectStarted = defineEvent({
    target: 'telemetry',
    group,
    event: TelemetryMailBringYourOwnEmailEvents.connectStarted,
    dimensions: {
        ...baseDimensions,
        importMode: allowed(['enabled', 'disabled']),
    },
});

export const byoeMobileConnectSucceeded = defineEvent({
    target: 'telemetry',
    group,
    event: TelemetryMailBringYourOwnEmailEvents.connectSucceeded,
    dimensions: baseDimensions,
});

export const byoeMobileConnectFailed = defineEvent({
    target: 'telemetry',
    group,
    event: TelemetryMailBringYourOwnEmailEvents.connectFailed,
    dimensions: {
        ...baseDimensions,
        errorType: allowed(CONNECT_ERROR_TYPES),
    },
});
