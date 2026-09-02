import noop from '@proton/utils/noop';

import { TelemetryMailForegroundEvents, TelemetryMeasurementGroups } from '../api/telemetry';
import { getVisibilityStateSingleton, isVisible } from '../eventManager/VisibilityState';
import { sendTelemetryReport } from '../helpers/metrics';
import type { Api } from '../interfaces';

const eventArgs = {
    measurementGroup: TelemetryMeasurementGroups.mailForegroundActivity,
    event: TelemetryMailForegroundEvents.app_in_foreground,
    delay: false,
    dimensions: {
        app_client: 'web-mail',
    },
};

export const startMailForegroundTelemetry = (api: Api): (() => void) => {
    if (isVisible()) {
        // Flush the initial app load immediately; We want to explicitly capture these metrics in case the user closes the app
        // right after bootstrap has finished.
        sendTelemetryReport({ api, ...eventArgs, flushImmediately: true }).catch(noop);
    }

    return getVisibilityStateSingleton().subscribe((visible) => {
        if (visible) {
            sendTelemetryReport({ api, ...eventArgs }).catch(noop);
        }
    });
};
