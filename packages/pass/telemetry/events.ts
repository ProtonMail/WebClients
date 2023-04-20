import type { TelemetryEvent, TelemetryEventName, TelemetryPlatform } from '../types/data/telemetry';

export const createTelemetryEvent = <T extends TelemetryEventName>(
    Event: T,
    Values: TelemetryEvent<T>['Values'],
    Dimensions: Omit<TelemetryEvent<T>['Dimensions'], 'user_tier'>,
    platform: TelemetryPlatform = 'any'
) =>
    ({
        MeasurementGroup: `pass.${platform}.user_actions`,
        Event,
        Values,
        Dimensions,
    } as TelemetryEvent<T>);
