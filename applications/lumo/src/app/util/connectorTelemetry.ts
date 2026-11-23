import { subscribeDesktopConnectorLifecycle } from '@proton/lumo-api-client/core/desktop-tools';

import { sendConnectorAddedEvent, sendConnectorRemovedEvent } from './telemetry';

let unsubscribeLifecycle: (() => void) | undefined;

/**
 * Counts connectors added and removed in Lumo Desktop's settings. Safe to call more than once, and
 * a no-op outside the desktop app, where those events never fire.
 */
export const initDesktopConnectorTelemetry = () => {
    if (unsubscribeLifecycle) {
        return;
    }
    unsubscribeLifecycle = subscribeDesktopConnectorLifecycle(({ action, kind }) => {
        if (action === 'added') {
            sendConnectorAddedEvent({ kind });
        } else {
            sendConnectorRemovedEvent({ kind });
        }
    });
};
