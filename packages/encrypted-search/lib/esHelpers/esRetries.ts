import { serverTime } from '@proton/crypto';
import { MINUTE } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import isTruthy from '@proton/utils/isTruthy';

import { esSentryReport } from '..';
import { ES_MAX_RETRIES, ES_MAX_RETRY_DELAY, ES_RETRY_QUEUE_TIMEOUT } from '../constants';
import { executeContentOperations, openESDB, readMetadataBatch, readRetries, setRetries } from '../esIDB';
import type { EncryptedItemWithInfo, InternalESCallbacks, RetryObject } from '../models';
import { encryptItem } from './esBuild';
import { isObjectEmpty } from './esUtils';

/**
 * Helper to handle removal of an item from retry queue due to max retries
 */
const handleMaxRetriesReached = (
    userID: string,
    retryID: string,
    retry: RetryObject,
    retryMap?: Map<string, RetryObject>
) => {
    const now = +serverTime();
    // Calculate initial time using retryTime and accumulated delays
    const initialRetryTime = retry.retryTime - 2 ** retry.numberRetries * MINUTE;

    esSentryReport('[ES Debug] Item removed from retry queue - max retries reached:', {
        retryID,
        queueTime: Math.floor((now - initialRetryTime) / (60 * 1000)), // minutes
    });

    // If map is provided, remove item directly
    if (retryMap) {
        retryMap.delete(retryID);
    }

    // Otherwise return undefined to filter out the item
    return undefined;
};

/**
 * Increase the number of retries by one and set a new retryTime accordingly
 * with exponential backoff capped at 24 hours
 */
export const updateRetryObject = (
    retry: RetryObject,
    userID: string,
    retryID: string,
    retryMap?: Map<string, RetryObject>
): RetryObject | undefined => {
    // If we've reached max retries, return undefined to indicate removal
    if (retry.numberRetries >= ES_MAX_RETRIES) {
        return handleMaxRetriesReached(userID, retryID, retry, retryMap);
    }

    const nextRetryNumber = retry.numberRetries + 1;
    // Calculate delay with exponential backoff
    const delay = Math.min(2 ** nextRetryNumber * MINUTE, ES_MAX_RETRY_DELAY);

    return {
        retryTime: +serverTime() + delay,
        numberRetries: nextRetryNumber,
    };
};

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
            const updatedRetry = updateRetryObject(retryObject, userID, retryID, retryMap);
            if (updatedRetry) {
                retryMap.set(retryID, updatedRetry);
            }
        }
    } else {
        const defaultRetryObject: RetryObject = {
            retryTime: now,
            numberRetries: 0,
        };
        retryMap.set(retryID, defaultRetryObject);
    }

    return setRetries(userID, retryMap);
};

/**
 * Get all items to be retried. Remove items that:
 * 1. Have been in the queue for more than 2 days (based on initial retryTime)
 * 2. Have reached max retry attempts
 */
export const getRetries = async (userID: string) => {
    const retryMap = await readRetries(userID);
    const now = +serverTime();

    // Track items to remove
    const itemsToRemove: string[] = [];

    for (const [retryID, retryObject] of retryMap) {
        // Remove if item has been in queue for too long
        // We use initial retryTime as the start time since it was set to 'now' when item was first added
        const initialRetryTime = retryObject.retryTime - 2 ** retryObject.numberRetries * MINUTE;
        if (now - initialRetryTime > ES_RETRY_QUEUE_TIMEOUT) {
            itemsToRemove.push(retryID);
            esSentryReport('[ES Debug] Item removed from retry queue - timeout reached:', {
                retryID,
                queueTime: Math.floor((now - initialRetryTime) / (60 * 1000)), // minutes
            });
        }
    }

    // Remove tracked items
    itemsToRemove.forEach((id) => retryMap.delete(id));

    // Update the retry map if we removed any items
    if (itemsToRemove.length > 0) {
        await setRetries(userID, retryMap);
    }

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

    const arrayMap = [...retryMap.entries()];
    const newArrayMap = (
        await Promise.all(
            arrayMap.map(async ([ID, retryObject]): Promise<[string, RetryObject] | undefined> => {
                if (retryObject.retryTime > now) {
                    return [ID, retryObject];
                }

                const result = await fetchESItemContent(ID);
                const timepoint = metadataMap.get(ID);

                if (!result) {
                    const updatedRetry = updateRetryObject(retryObject, userID, ID);
                    return updatedRetry ? [ID, updatedRetry] : undefined;
                }

                const { content, error } = result;
                // Handle 2501 (NOT_FOUND) specially - if the item is gone, no need to retry
                if (error?.data?.Code === API_CUSTOM_ERROR_CODES.NOT_FOUND) {
                    return undefined;
                }

                // For any other error, or if content is missing/empty, retry
                if (error || !content || isObjectEmpty(content) || !timepoint) {
                    const updatedRetry = updateRetryObject(retryObject, userID, ID);
                    return updatedRetry ? [ID, updatedRetry] : undefined;
                }

                try {
                    const aesGcmCiphertext = await encryptItem(content, indexKey);
                    contentToAdd.push({
                        ID,
                        timepoint,
                        aesGcmCiphertext,
                    });
                    return undefined;
                } catch (error: any) {
                    // If encryption fails, retry
                    const updatedRetry = updateRetryObject(retryObject, userID, ID);
                    return updatedRetry ? [ID, updatedRetry] : undefined;
                }
            })
        )
    ).filter(isTruthy);

    await executeContentOperations(userID, [], contentToAdd);
    return setRetries(userID, newArrayMap);
};
