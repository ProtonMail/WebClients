import { useEffect } from 'react';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import type { TelemetryEvent, TelemetryEventName, TelemetryPlatform } from '@proton/pass/types/data/telemetry';
import isTruthy from '@proton/utils/isTruthy';

/** Pushes the specified telemetry event when the provided
 * dependency array is truthy. Passing an empty dependency
 * array will push the event when the component mounts */
export const useTelemetryEvent = <T extends TelemetryEventName>(
    Event: T,
    Values: TelemetryEvent<T>['Values'],
    Dimensions: TelemetryEvent<T>['Dimensions'],
    platform?: TelemetryPlatform
) =>
    function useTelemetryEventEffect(deps: boolean[]) {
        const { onTelemetry } = usePassCore();

        useEffect(() => {
            if (deps.every(isTruthy)) onTelemetry(Event, Values, Dimensions, platform);
        }, deps);
    };
