import { TelemetryCalendarClientEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { allowed, defineEvent } from '@proton/telemetry-tracker/events';

/**
 * A calendar card was not valid as binary but verified through the legacy path, i.e. signed as text by an
 * older client (EOL normalisation and stripped trailing spaces).
 */
export const legacySignatureFallback = defineEvent({
    target: 'telemetry',
    group: TelemetryMeasurementGroups.calendarClient,
    event: TelemetryCalendarClientEvents.legacy_signature_fallback,
    dimensions: {
        legacy_verification: allowed(['valid', 'invalid']),
    },
});
