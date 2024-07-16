import { MAX_BATCH_PER_REQUEST } from '@proton/pass/constants';
import { api } from '@proton/pass/lib/api/api';
import type { ItemMarkAsReadRequest } from '@proton/pass/types';
import { type B2BEvent, B2BEventName } from '@proton/pass/types/data/b2b';
import { groupByKey } from '@proton/pass/utils/array/group-by-key';
import type { EventBundle } from '@proton/pass/utils/event/dispatcher';
import chunk from '@proton/utils/chunk';

import { isB2BEvent } from './b2b.utils';

export const sendItemReadEvents = async (events: B2BEvent<B2BEventName.ItemRead>[]) =>
    Promise.all(
        groupByKey(events, 'shareId').map((events) => {
            const batches = chunk(events, MAX_BATCH_PER_REQUEST);

            return Promise.all(
                batches.map((batch) => {
                    const { shareId } = batch[0];

                    const ItemTimes = batch.map<ItemMarkAsReadRequest>((event) => ({
                        ItemID: event.itemId,
                        Timestamp: event.timestamp,
                    }));

                    return api({
                        url: `pass/v1/share/${shareId}/item/read`,
                        method: 'put',
                        data: { ItemTimes },
                    });
                })
            );
        })
    );

export const sendB2BEventsBundle = async ({ events }: EventBundle<B2BEvent>): Promise<void> => {
    await sendItemReadEvents(events.filter(isB2BEvent(B2BEventName.ItemRead)));
};
