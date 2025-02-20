import { MAX_MAX_BATCH_PER_REQUEST } from '@proton/pass/constants';
import { api } from '@proton/pass/lib/api/api';
import type { TelemetryEvent } from '@proton/pass/types/data/telemetry';
import type { EventBundle } from '@proton/pass/utils/event/dispatcher';
import chunk from '@proton/utils/chunk';

export const sendTelemetryBundle = async ({ events }: EventBundle<TelemetryEvent>): Promise<void> => {
    await Promise.all(
        chunk(events, MAX_MAX_BATCH_PER_REQUEST).map((EventInfo) =>
            api({
                url: 'data/v1/stats/multiple',
                method: 'post',
                data: { EventInfo },
            })
        )
    );
};
