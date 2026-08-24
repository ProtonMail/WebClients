import chunk from '@proton/utils/chunk';

import { MAX_MAX_BATCH_PER_REQUEST } from '../../constants';
import type { TelemetryEvent } from '../../types/data/telemetry';
import type { EventBundle } from '../../utils/event/dispatcher';
import { api } from '../api/api';

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
