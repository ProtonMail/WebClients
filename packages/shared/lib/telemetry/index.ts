import { type TelemetryConfig, ProtonTelemetry as createTelemetry } from '@proton/telemetry';

import { getClientID } from '../apps/helper';
import { getAppVersionStr } from '../fetch/headers';
import { captureMessage } from '../helpers/sentry';
import type { ProtonConfig } from '../interfaces';

class ProtonTelemetry {
    private telemetry: ReturnType<typeof createTelemetry> | undefined;

    private config: TelemetryConfig | undefined;

    public init({ config, uid }: { config: ProtonConfig; uid: string }) {
        this.config = {
            endpoint: `${config.API_URL}/data/v1/telemetry`,
            appVersion: getAppVersionStr(getClientID(config.APP_NAME), config.APP_VERSION),
            debug: process.env.NODE_ENV !== 'production',
            uidHeader: uid,
        };
    }

    public setAuthHeaders(UID: string) {
        if (!this.config) {
            return;
        }

        this.config = {
            ...this.config,
            uidHeader: UID,
        };

        this.telemetry = createTelemetry(this.config);
    }

    public sendCustomEvent(
        ...args: Parameters<ReturnType<typeof createTelemetry>['sendCustomEvent']>
    ): ReturnType<ReturnType<typeof createTelemetry>['sendCustomEvent']> {
        if (!this.telemetry || !this.config?.uidHeader) {
            captureMessage('Attempted to send a custom event when @proton/telemetry has not been initialised.');
            return;
        }

        this.telemetry.sendCustomEvent(...args);
    }
}

export const telemetry = new ProtonTelemetry();
