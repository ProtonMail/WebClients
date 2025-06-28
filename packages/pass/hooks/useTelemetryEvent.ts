import { useCallback, useEffect } from 'react';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { MODEL_VERSION } from '@proton/pass/constants';
import type { Item } from '@proton/pass/types';
import type {
    ExtensionCopiedFromLoginDimensions,
    TelemetryEvent,
    TelemetryFieldType,
    TelemetryPlatform,
} from '@proton/pass/types/data/telemetry';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

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

/** Default unused values which will all be mutated when
 * processing the event in the extension's service-worker. */
const getExtensionCopiedFromLoginBaseDimensions = (
    extensionField: TelemetryFieldType
): ExtensionCopiedFromLoginDimensions => ({
    autofillLoginFormDetected: '0',
    autofillPaused: '0',
    extensionCopiedFromCurrentPage: '0',
    extensionField,
    hasLoginItemForCurrentWebsite: '0',
    loginAutofillEnabled: '0',
    modelVersion: MODEL_VERSION,
    uniqueMatch: '0',
});

export const useLoginClipboardTelemetry = EXTENSION_BUILD
    ? (item: Item<'login'>) => {
          const { onTelemetry } = usePassCore();
          const { urls: itemUrls } = item.content;

          return useCallback(
              (extensionField: TelemetryFieldType) => {
                  onTelemetry(
                      TelemetryEventName.ExtensionCopiedFromLogin,
                      {},
                      getExtensionCopiedFromLoginBaseDimensions(extensionField),
                      undefined,
                      { extensionField, itemUrls }
                  );
              },
              [onTelemetry, itemUrls]
          );
      }
    : noop;
