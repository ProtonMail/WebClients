import { ActionEventV6, type EventV6Response } from '@proton/shared/lib/api/events';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import type { UpdateCollectionV6 } from '@proton/shared/lib/eventManager/updateCollectionV6';
import isTruthy from '@proton/utils/isTruthy';
import uniqueBy from '@proton/utils/uniqueBy';

export type UpdateCollectionAsyncV6<T> =
    | {
          type: 'ignore' | 'refetch';
      }
    | {
          type: 'update';
          payload: UpdateCollectionV6<T>;
      };

/**
 * Handles the fetching and processing of an update collection asynchronously based on a provided event list.
 * It categorizes the updates as `refetch`, `ignore`, or `update`, depending on the number and type of events.
 *
 * @param {Object} params - The parameters needed to process the update collection.
 * @param {(ID: string) => Promise<T>} params.get - A function to fetch an item by its ID.
 * @param {EventV6Response} params.events - A list of events containing details about actions to process.
 * @param {number} [params.n=6] - The threshold for determining whether to process all events as a complete refetch. Defaults to 6.
 *
 * @returns {Promise<UpdateCollectionAsyncV6<T>>} A promise that resolves to an object describing the outcome:
 * - When no events are provided, resolves as `type: 'ignore'`.
 * - When more than `n` events are present, resolves as `type: 'refetch'`.
 * - Otherwise, resolves as `type: 'update'`, containing the `delete` and `upsert` payloads.
 *
 * @throws Will rethrow errors encountered during retrieval unless the error has a client-side status (4xx),
 *         in which case the error is ignored for the specific entity.
 */
const getUpdateCollectionAsyncV6Result = async <T>({
    get,
    events,
    n = 6,
}: {
    get: (ID: string) => Promise<T>;
    events: EventV6Response;
    n?: number;
}): Promise<UpdateCollectionAsyncV6<T>> => {
    if (!events?.length) {
        return { type: 'ignore' };
    }

    // If this affects more than x items, we might as well fetch the entire list
    const fetchEverything = events && events.length > n;
    if (fetchEverything) {
        return { type: 'refetch' };
    }

    const toDelete = events.filter(({ Action }) => Action === ActionEventV6.Delete).map((item) => item.ID);
    // Unique them in case there's both CREATE + UPDATE
    const toUpsert = uniqueBy(
        events.filter(({ Action }) => Action === ActionEventV6.Create || Action === ActionEventV6.Update),
        (data) => data.ID
    );

    if (!toDelete.length && !toUpsert.length) {
        return { type: 'ignore' };
    }

    const result = await Promise.all(
        toUpsert.map(async ({ ID }) => {
            try {
                return await get(ID);
            } catch (error) {
                const { status } = getApiError(error);
                // Ignore 4xx errors. If this happens the client is doing something wrong, and it shouldn't retry.
                if (status >= 400 && status < 500) {
                    return;
                }
                // Throw error otherwise. The expectation is that this will get caught by the event loop manager and it won't
                // advance the event loop id but retry the whole thing.
                throw error;
            }
        })
    );

    return {
        type: 'update',
        payload: { delete: toDelete, upsert: result.filter(isTruthy) },
    };
};

export const updateCollectionAsyncV6 = async <T>({
    refetch,
    update,
    ...rest
}: Parameters<typeof getUpdateCollectionAsyncV6Result<T>>[0] & {
    refetch: () => Promise<any>;
    update: (update: UpdateCollectionV6<T>) => void;
}) => {
    const result = await getUpdateCollectionAsyncV6Result<T>(rest);
    if (result.type === 'update') {
        update(result.payload);
    }
    if (result.type === 'refetch') {
        return refetch();
    }
};
