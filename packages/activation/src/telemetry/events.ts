import { TelemetryEasySwitchEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { allowed, bool, defineEvent } from '@proton/telemetry-tracker/events';

export const easySwitchImportReportAction = defineEvent({
    target: 'telemetry',
    group: TelemetryMeasurementGroups.easySwitch,
    event: TelemetryEasySwitchEvents.importReportAction,
    dimensions: {
        importAction: allowed(['cancel_import', 'resume_import', 'undo_import', 'delete_report']),
        isBYOE: bool(),
        provider: allowed(['google', 'outlook', 'imap']),
        product: allowed(['mail', 'calendar', 'contacts', 'drive']),
    },
});

export const BYOEAddressAction = defineEvent({
    target: 'telemetry',
    group: TelemetryMeasurementGroups.easySwitch,
    event: TelemetryEasySwitchEvents.byoeAddressAction,
    dimensions: {
        addressAction: allowed(['manage-address', 'disconnect', 'reconnect']),
        // Only Google for now, prepare for Outlook BYOE
        provider: allowed(['google']),
    },
});

export const BYOEClaimableAddressModalShown = defineEvent({
    target: 'telemetry',
    group: TelemetryMeasurementGroups.easySwitch,
    event: TelemetryEasySwitchEvents.byoeClaimableAddressModalShown,
});

export const BYOEClaimableAddressModalAction = defineEvent({
    target: 'telemetry',
    group: TelemetryMeasurementGroups.easySwitch,
    event: TelemetryEasySwitchEvents.byoeClaimableAddressModalAction,
    dimensions: {
        claimableAddressAction: allowed(['claim', 'learn_more', 'close']),
    },
});

export const BYOEAddressLinkedModalShown = defineEvent({
    target: 'telemetry',
    group: TelemetryMeasurementGroups.easySwitch,
    event: TelemetryEasySwitchEvents.byoeAddressLinkedModalShown,
});

export const BYOEAddressLinkedModalAction = defineEvent({
    target: 'telemetry',
    group: TelemetryMeasurementGroups.easySwitch,
    event: TelemetryEasySwitchEvents.byoeAddressLinkedModalAction,
    dimensions: {
        linkedAddressAction: allowed(['view_guide', 'got_it', 'close']),
    },
});
