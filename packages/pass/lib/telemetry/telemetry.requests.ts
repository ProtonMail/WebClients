import { api } from '@proton/pass/lib/api/api';
import type { TelemetryEvent } from '@proton/pass/types/data/telemetry';
import { logger } from '@proton/pass/utils/logger';
import chunk from '@proton/utils/chunk';

import { type TelemetryEventBundle } from './service';

export const TELEMETRY_BATCH_SIZE = 100;
export const TELEMETRY_MAX_RETRY = 2;

export const sendTelemetryEvents = async (events: TelemetryEvent[]) => {
    const batches = chunk(events, TELEMETRY_BATCH_SIZE);

    await Promise.all(
        batches.map((EventInfo) =>
            api({
                url: 'data/v1/stats/multiple',
                method: 'post',
                data: {
                    EventInfo,
                },
            })
        )
    );
};

/* sends all events in current bundle to the telemetry endpoint
 * and returns a boolean indicating success or failure. Skip bundle
 * if we have reached the max retry count or if the user settings do
 * not allow telemetry */
export const sendTelemetryBundle = async (
    bundle: TelemetryEventBundle,
    isTelemetryEnabled: boolean
): Promise<{ ok: true } | { ok: false; retry: boolean }> => {
    try {
        if (bundle.retryCount >= TELEMETRY_MAX_RETRY || !isTelemetryEnabled) return { ok: false, retry: false };
        logger.info(`[Telemetry] dispatching current bundle [${bundle.events.length} event(s)]`);

        await sendTelemetryEvents(bundle.events);
        return { ok: true };
    } catch (e) {
        logger.warn(`[Telemetry] failed to send telemetry bundle`);
        return { ok: false, retry: true };
    }
};
