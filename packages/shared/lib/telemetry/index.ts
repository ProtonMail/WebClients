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
    private preInitialisationEventQueue: EventArgs[] = [];

    public init({
        config,
        uid,
        eventOptions,
        overridenPageTitle,
    }: {
        config: ProtonConfig;
        uid: string;
        eventOptions?: TelemetryConfig['events'];
        overridenPageTitle?: string;
    }) {
        this.UID = uid;
        this.config = {
            endpoint: `${config.API_URL}/data/v1/telemetry`,
            appVersion: getAppVersionStr(getClientID(config.APP_NAME), config.APP_VERSION),
            debug: process.env.NODE_ENV !== 'production',
            events: { ...eventOptions, click: false },
            pageTitle: overridenPageTitle,
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
            this.queuePreInitialisationEvent(args);
            return;
        }

        this.telemetry.sendCustomEvent(...args);
    }

    private queuePreInitialisationEvent(args: EventArgs) {
        /**
         * Ensure queue never exceeds max length
         */
        if (this.preInitialisationEventQueue.length >= this.maxQueueLength) {
            this.preInitialisationEventQueue.shift();
        }

        this.preInitialisationEventQueue.push(args);
    }

    private processQueue() {
        for (let i = 0; i < this.preInitialisationEventQueue.length; i++) {
            const args = this.preInitialisationEventQueue[i];
            this.sendCustomEvent(...args);
        }
    }

    private setTelemetry() {
        if (!this.config || !this.UID) {
            return;
        }

        try {
            this.telemetry = createTelemetry({ ...this.config, uidHeader: this.UID });

            this.processQueue();
        } catch (error) {
            /**
             * Browsers such as Pale moon do not support the performance observer.
             * This catches these errors
             */
            captureMessage('@proton/Telemetry: Failed to create telemetry instance', {
                level: 'error',
                extra: { error },
            });
        }
    }
}

export const telemetry = new ProtonTelemetry();
