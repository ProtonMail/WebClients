import { type TelemetryConfig, ProtonTelemetry as createTelemetry } from '@protontech/telemetry';

import { getClientID } from '../apps/helper';
import { getAppVersionStr } from '../fetch/headers';
import { captureMessage } from '../helpers/sentry';
import type { ProtonConfig } from '../interfaces';

class ProtonTelemetry {
    private telemetry: ReturnType<typeof createTelemetry> | undefined;

    private config: Omit<TelemetryConfig, 'uidHeader'> | undefined;

    private UID: string | undefined;

    public init({ config, uid }: { config: ProtonConfig; uid: string }) {
        this.UID = uid;
        this.config = {
            endpoint: `${config.API_URL}/data/v1/telemetry`,
            appVersion: getAppVersionStr(getClientID(config.APP_NAME), config.APP_VERSION),
            debug: process.env.NODE_ENV !== 'production',
        };

        this.setTelemetry();
    }

    public setAuthHeaders(UID: string) {
        this.UID = UID;

        this.setTelemetry();
    }

    private setTelemetry() {
        if (!this.config || !this.UID) {
            return;
        }

        this.telemetry = createTelemetry({ ...this.config, uidHeader: this.UID });
    }

    public sendCustomEvent(
        ...args: Parameters<ReturnType<typeof createTelemetry>['sendCustomEvent']>
    ): ReturnType<ReturnType<typeof createTelemetry>['sendCustomEvent']> {
        if (!this.telemetry || !this.UID) {
            captureMessage('Attempted to send a custom event when @protontech/telemetry has not been initialised.');
            return;
        }

        this.telemetry.sendCustomEvent(...args);
    }
}

export const telemetry = new ProtonTelemetry();
