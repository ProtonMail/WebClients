import { startOfDay, sub } from 'date-fns';

import { serverTime } from '@proton/crypto';
import {
    AesGcmCiphertext,
    ESCache,
    ESHelpers,
    ES_MAX_CACHE,
    ES_MAX_CONCURRENT,
    GetUserKeys,
    INDEXING_STATUS,
    defaultESProgress,
    encryptItem,
    getIndexKey,
    openESDB,
    removeFromESCache,
    roundMilliseconds,
    sendIndexingMetrics,
    setContentRecoveryPoint,
    sizeOfESItem,
    updateSize,
    writeContentProgress,
} from '@proton/encrypted-search';
import runInQueue from '@proton/shared/lib/helpers/runInQueue';
import { Api, User } from '@proton/shared/lib/interfaces';

import { ESBaseMessage, ESMessageContent, NormalizedSearchParams } from '../../models/encryptedSearch';
import { getItemInfo } from './encryptedSearchMailHelpers';

/**
 * Compute the start date of the time window inside which
 * we index emails' content
 */
export const getWindowStart = () => roundMilliseconds(startOfDay(sub(serverTime().getTime(), { days: 30 })).getTime());

/**
 * Index the content of the most recent specified amount of time worth of emails
 * for free users, as a way to try out content search
 */
export const activatePartialES = async (
    api: Api,
    user: User,
    getUserKeys: GetUserKeys,
    esHelpers: ESHelpers<ESBaseMessage, NormalizedSearchParams, ESMessageContent>,
    esCacheRef: React.MutableRefObject<ESCache<ESBaseMessage, ESMessageContent>>
) => {
    const { ID: userID } = user;

    const esDB = await openESDB(userID);
    if (!esDB) {
        throw new Error('ESDB cannot be opened');
    }

    const indexKey = await getIndexKey(getUserKeys, userID);
    if (!indexKey) {
        throw new Error('Index key must exist');
    }

    const { fetchESItem } = esHelpers;
    if (!fetchESItem) {
        throw new Error('fetchESItem must be defined to download items content');
    }

    let limitedCache = false;
    let batchSize = 0;

    const esIteratee = async (itemMetadata: ESBaseMessage) => {
        const itemToStore = await fetchESItem(itemMetadata.ID, undefined, esCacheRef);

        let aesGcmCiphertext: AesGcmCiphertext | undefined;
        if (itemToStore) {
            const size = sizeOfESItem(itemToStore);
            batchSize += size;

            if (esCacheRef.current.cacheSize < ES_MAX_CACHE) {
                esCacheRef.current.esCache.set(itemMetadata.ID, {
                    metadata: itemMetadata,
                    content: itemToStore,
                });
                esCacheRef.current.cacheSize += size;
            } else {
                // In case the limit is reached, the content is not added, the metadata is already
                // present, therefore we simply flag that the content in cache is limited
                limitedCache = true;
            }

            aesGcmCiphertext = await encryptItem(itemToStore, indexKey);
        }

        return { itemID: itemMetadata.ID, aesGcmCiphertext };
    };

    const windowStart = getWindowStart();
    const contentMetadata = Array.from(esCacheRef.current.esCache.values(), ({ metadata }) => metadata).filter(
        (metadata) => metadata.Time >= windowStart
    );

    // No messages within the time window has been found. We
    // nonetheless have to encode the fact that partial ES is
    // active. By setting the current date as recovery point, we are
    // ensuring that no messages in the mailbox have content. If new
    // messages arrive they will be newer than such a timepoint and
    // thus correctly indexed with content
    if (!contentMetadata.length) {
        await writeContentProgress<ESBaseMessage>(
            userID,
            {
                ...defaultESProgress,
                recoveryPoint: [windowStart, 0],
                status: INDEXING_STATUS.ACTIVE,
            },
            esCacheRef.current.esCache,
            getItemInfo
        );
        return;
    }

    const ciphertexts = await runInQueue(
        contentMetadata.map((metadata) => () => esIteratee(metadata)),
        ES_MAX_CONCURRENT
    ).catch(() => undefined);

    if (!ciphertexts || ciphertexts.length !== contentMetadata.length) {
        throw new Error('Failed to load messages');
    }

    const tx = esDB.transaction('content', 'readwrite');
    await Promise.all(
        ciphertexts.map(async (ciphertext) =>
            !!ciphertext.aesGcmCiphertext ? tx.store.put(ciphertext.aesGcmCiphertext, ciphertext.itemID) : undefined
        )
    );
    await tx.done;
    esDB.close();

    // We store the last message for which content was indexed in the recoveryPoint
    // of the content indexing progress. Note that since cache is in chronological
    // order, i.e. oldest message first, so is contentMetadata
    const lastMessage = contentMetadata[0];
    await writeContentProgress<ESBaseMessage>(
        userID,
        {
            ...defaultESProgress,
            recoveryPoint: [lastMessage.Time, lastMessage.Order],
            status: INDEXING_STATUS.ACTIVE,
        },
        esCacheRef.current.esCache,
        getItemInfo
    );

    await updateSize<ESBaseMessage>(userID, batchSize, esCacheRef.current.esCache, getItemInfo);

    void sendIndexingMetrics(api, user, true);

    esCacheRef.current.isCacheLimited = limitedCache;
    esCacheRef.current.isContentCached = true;
};

/**
 * Remove the content of messages that have fallen out of the
 * temporal window
 */
export const removeOldContent = async (
    userID: string,
    getUserKeys: GetUserKeys,
    esCacheRef: React.MutableRefObject<ESCache<ESBaseMessage, ESMessageContent>>
) => {
    const esDB = await openESDB(userID);
    if (!esDB) {
        throw new Error('ESDB cannot be opened');
    }

    const indexKey = await getIndexKey(getUserKeys, userID);
    if (!indexKey) {
        throw new Error('Index key not found');
    }

    const windowStart = getWindowStart();

    const cachedItems = [...esCacheRef.current.esCache.values()];
    // We look for all messages older than the start of the time window
    const contentMetadata = Array.from(cachedItems, ({ metadata }) => metadata).filter(
        (metadata) => metadata.Time < windowStart
    );

    // We look for the oldest message that sits in the window to set
    // it as the new last time. Note that since cache is in chronological
    // order, so is cachedItems and therefore the first message within the
    // window is also the oldest to be so
    let recoveryPoint: [number, number] = [windowStart, 0];
    const newLastItem = cachedItems.find((value) => value.metadata.Time >= windowStart);
    if (newLastItem) {
        recoveryPoint = [newLastItem.metadata.Time, newLastItem.metadata.Order];
    }

    const sizes = await Promise.all(
        contentMetadata.map(async (metadata) => {
            await esDB.delete('content', metadata.ID);
            return removeFromESCache<ESBaseMessage, ESMessageContent>(metadata.ID, esCacheRef, true);
        })
    );

    esDB.close();

    await updateSize<ESBaseMessage>(
        userID,
        -1 * sizes.reduce((p, c) => p + c, 0),
        esCacheRef.current.esCache,
        getItemInfo
    );
    await setContentRecoveryPoint<ESBaseMessage>(userID, recoveryPoint, esCacheRef.current.esCache, getItemInfo);
};

/**
 * In case of failure of partial ES activation, only remove
 * what is stored in the content table and content row of
 * the indexingProgress table, as well as any cached content
 */
export const revertPartialESActivation = async (
    userID: string,
    esCacheRef: React.MutableRefObject<ESCache<ESBaseMessage, ESMessageContent>>
) => {
    const esDB = await openESDB(userID);
    if (!esDB) {
        return;
    }

    const contentIDs = await esDB.getAllKeys('content');
    const sizes = await Promise.all(
        contentIDs.map((itemID) => removeFromESCache<ESBaseMessage, ESMessageContent>(itemID, esCacheRef, true))
    );
    await esDB.clear('content');
    await esDB.delete('indexingProgress', 'content');
    esDB.close();

    await updateSize<ESBaseMessage>(
        userID,
        -1 * sizes.reduce((p, c) => p + c, 0),
        esCacheRef.current.esCache,
        getItemInfo
    );

    esCacheRef.current.isCacheLimited = false;
    esCacheRef.current.isContentCached = false;
};
