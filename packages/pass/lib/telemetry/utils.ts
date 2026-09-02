import type {
    BaseTelemetryEvent,
    TelemetryEvent,
    TelemetryEventName,
    TelemetryPlatform,
} from '../../types/data/telemetry';

export const createTelemetryEvent = <T extends TelemetryEventName>(
    Event: T,
    Values: TelemetryEvent<T>['Values'],
    Dimensions: TelemetryEvent<T>['Dimensions'],
    platform: TelemetryPlatform = 'any'
) =>
    ({
        MeasurementGroup: `pass.${platform}.user_actions`,
        Event,
        Values,
        Dimensions,
    }) satisfies BaseTelemetryEvent<T> as TelemetryEvent<T>;

/** Telemetry booleans should always be integers.
 * FIXME: we could post-process all boolean values
 * inside the telemetry service when pushing events */
export const telemetryBool = (val: boolean) => (val ? '1' : '0');
