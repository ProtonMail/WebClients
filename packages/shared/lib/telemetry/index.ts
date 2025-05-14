import { type TelemetryConfig, ProtonTelemetry as createTelemetry } from '@protontech/telemetry';

import { getClientID } from '../apps/helper';
import { getAppVersionStr } from '../fetch/headers';
import { captureMessage } from '../helpers/sentry';
import type { ProtonConfig } from '../interfaces';

type EventArgs = Parameters<ReturnType<typeof createTelemetry>['sendCustomEvent']>;

class ProtonTelemetry {
    private telemetry: ReturnType<typeof createTelemetry> | undefined;

    private config: Omit<TelemetryConfig, 'uidHeader'> | undefined;

    private UID: string | undefined;

    private readonly maxQueueLength: number = 10;

    /**
     * This queue is pushed to if telemetry has not been initialised. Then processed once initialisation has begun.
     * This is to avoid events being dropped before initialisation
     */
    private eventQueue: EventArgs[] = [];

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

    public sendCustomEvent(...args: EventArgs): ReturnType<ReturnType<typeof createTelemetry>['sendCustomEvent']> {
        if (!this.telemetry || !this.UID) {
            captureMessage('Attempted to send a custom event when @protontech/telemetry has not been initialised.');
            this.addToEventQueue(args);
            return;
        }

        this.telemetry.sendCustomEvent(...args);
    }

    private addToEventQueue(args: EventArgs) {
        /**
         * Ensure queue never exceeds max length
         */
        if (this.eventQueue.length >= this.maxQueueLength) {
            this.eventQueue.shift();
        }

        this.eventQueue.push(args);
    }

    private processQueue() {
        for (let i = 0; i < this.eventQueue.length; i++) {
            const args = this.eventQueue[i];
            this.sendCustomEvent(...args);
        }
    }

    private setTelemetry() {
        if (!this.config || !this.UID) {
            return;
        }

        this.telemetry = createTelemetry({ ...this.config, uidHeader: this.UID });

        this.processQueue();
    }
}

export const telemetry = new ProtonTelemetry();
