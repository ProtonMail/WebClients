import { useCallback, useEffect } from 'react';

import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { usePassCore } from '../components/Core/PassCoreProvider';
import { MODEL_VERSION } from '../constants';
import { isAutofillTargetMode } from '../lib/urls/utils/autofill';
import type { Item } from '../types';
import type {
    ExtensionCopiedFromLoginDimensions,
    TelemetryEvent,
    TelemetryFieldType,
    TelemetryPlatform,
} from '../types/data/telemetry';
import { NO_PAGE_CONTEXT_TELEMETRY_DIMENSIONS, TelemetryEventName } from '../types/data/telemetry';

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
    ...NO_PAGE_CONTEXT_TELEMETRY_DIMENSIONS,
});

export const useLoginClipboardTelemetry = EXTENSION_BUILD
    ? (item: Item<'login'>) => {
          const { onTelemetry } = usePassCore();
          const itemUrls = item.content.autofillUrls
              .filter(({ mode }) => isAutofillTargetMode(mode))
              .map(({ url }) => url);

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
