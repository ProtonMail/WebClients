import noop from '@proton/utils/noop';

import { TelemetryMailForegroundEvents, TelemetryMeasurementGroups } from '../api/telemetry';
import {
    addIPCHostUpdateListener,
    canListenInboxDesktopHostMessages,
    hasInboxDesktopFeature,
} from '../desktop/ipcHelpers';
import { getVisibilityStateSingleton, isVisible } from '../eventManager/VisibilityState';
import { isLinux, isMac } from '../helpers/browser';
import { isElectronMail } from '../helpers/desktop';
import { sendTelemetryReport } from '../helpers/metrics';
import type { Api } from '../interfaces';

type AppClient = 'web-mail' | 'macos-mail' | 'windows-mail' | 'linux-mail';

const getAppClient = (): AppClient => {
    if (!isElectronMail) {
        return 'web-mail';
    }

    if (isLinux()) {
        return 'linux-mail';
    }
    if (isMac()) {
        return 'macos-mail';
    }
    return 'windows-mail';
};

const eventArgs = {
    measurementGroup: TelemetryMeasurementGroups.mailForegroundActivity,
    event: TelemetryMailForegroundEvents.app_in_foreground,
    delay: false,
    dimensions: {
        app_client: getAppClient(),
    },
};

export const startMailForegroundTelemetry = (api: Api): (() => void) => {
    // Flush the initial app load immediately; We want to explicitly capture these metrics in case the user closes the app
    // right after bootstrap has finished.
    if (isElectronMail || isVisible()) {
        sendTelemetryReport({ api, ...eventArgs, flushImmediately: true }).catch(noop);
    }

    // If on desktop and telemetry is supported, electron pings when to fire the telemetry
    // otherwise delegate this to the web-client;
    if (canListenInboxDesktopHostMessages && hasInboxDesktopFeature('AppInFocusTelemetry')) {
        const listener = addIPCHostUpdateListener('desktopAppInFocus', () => {
            sendTelemetryReport({ api, ...eventArgs }).catch(noop);
        });

        return () => listener.removeListener();
    }

    return getVisibilityStateSingleton().subscribe((visible) => {
        if (visible) {
            sendTelemetryReport({ api, ...eventArgs }).catch(noop);
        }
    });
};
