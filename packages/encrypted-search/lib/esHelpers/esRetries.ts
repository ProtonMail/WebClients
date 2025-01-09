import { add } from 'date-fns';

import { serverTime } from '@proton/crypto';
import { MINUTE } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';

import { esSentryReport } from '..';
import { executeContentOperations, openESDB, readMetadataBatch, readRetries, setRetries } from '../esIDB';
import type { EncryptedItemWithInfo, InternalESCallbacks, RetryObject } from '../models';
import { encryptItem } from './esBuild';
import { isObjectEmpty } from './esUtils';

/**
 * Increase the number of retries by one and set a new retryTime accordingly
 */
export const updateRetryObject = (retry: RetryObject): RetryObject => ({
    retryTime: +serverTime() + 2 ** (retry.numberRetries + 1) * MINUTE,
    numberRetries: retry.numberRetries + 1,
});

/**
 * Add a new item ID to the list of retries
 */
export const addRetry = async (userID: string, retryID: string) => {
    const retryMap = await readRetries(userID);
    const retryObject = retryMap.get(retryID);
    const now = +serverTime();

    if (!!retryObject) {
        const { retryTime } = retryObject;
        if (retryTime < now) {
            retryMap.set(retryID, updateRetryObject(retryObject));
        }
    } else {
        const defaultRetryObject: RetryObject = { retryTime: now, numberRetries: 0 };
        retryMap.set(retryID, defaultRetryObject);
    }

    return setRetries(userID, retryMap);
};

/**
 * Get all items to be retried. If an item has reached a
 * retry time of one year, we remove it from the list
 */
export const getRetries = async (userID: string) => {
    const retryMap = await readRetries(userID);

    for (const [retryID, { retryTime }] of retryMap) {
        if (retryTime > +add(serverTime(), { years: 1 })) {
            retryMap.delete(retryID);
        }
    }

    await setRetries(userID, retryMap);

    return retryMap;
};

/**
 * Retry previously failed API calls
 */
export const retryAPICalls = async <ESItemContent>(
    userID: string,
    indexKey: CryptoKey,
    fetchESItemContent?: InternalESCallbacks<unknown, unknown, ESItemContent>['fetchESItemContent']
) => {
    const retryMap = await getRetries(userID);
    esSentryReport('[ES Debug] Retrying API calls:', {
        retryCount: retryMap.size,
        userID,
    });
    if (!retryMap.size || !fetchESItemContent) {
        return;
    }

    const now = +serverTime();
    const esDB = await openESDB(userID);
    if (!esDB) {
        return;
    }

    const contentToAdd: EncryptedItemWithInfo[] = [];

    const IDs = [...retryMap.keys()];
    const metadataMap = new Map(
        await readMetadataBatch(userID, IDs).then((metadata) => {
            if (!metadata) {
                return;
            }
            return metadata.map((encryptedMetadata, index) => {
                if (!encryptedMetadata) {
                    return [IDs[index], undefined];
                }
                return [encryptedMetadata.ID, encryptedMetadata.timepoint];
            });
        })
    );
    if (!metadataMap.size) {
        return;
    }

    const arrayMap = Array.from(retryMap);
    const newArrayMap = (
        await Promise.all(
            arrayMap.map(async ([ID, retryObject]): Promise<[string, RetryObject] | undefined> => {
                if (retryObject.retryTime > now) {
                    return [ID, retryObject];
                }

                const item = await fetchESItemContent(ID);
                const timepoint = metadataMap.get(ID);

                if (item && !isObjectEmpty(item) && timepoint) {
                    try {
                        const aesGcmCiphertext = await encryptItem(item, indexKey);
                        contentToAdd.push({
                            ID,
                            timepoint,
                            aesGcmCiphertext,
                        });
                        return;
                    } catch (error: any) {
                        // We store it back as if it failed fetching
                    }
                }

                return [ID, updateRetryObject(retryObject)];
            })
        )
    ).filter(isTruthy);

    await executeContentOperations(userID, [], contentToAdd);
    return setRetries(userID, newArrayMap);
};
