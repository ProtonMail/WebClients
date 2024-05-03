import type {
    BaseTelemetryEvent,
    TelemetryEvent,
    TelemetryEventName,
    TelemetryPlatform,
} from '@proton/pass/types/data/telemetry';

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
