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
