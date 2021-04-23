import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { Api } from 'proton-shared/lib/interfaces';
import { setItem } from 'proton-shared/lib/helpers/storage';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';
import { openDB, IDBPDatabase } from 'idb';
import { AttachmentsCache } from '../../containers/AttachmentProvider';
import { MessageEvent } from '../../models/event';
import { GetMessageKeys } from '../../hooks/message/useGetMessageKeys';
import {
    CachedMessage,
    EncryptedSearchDB,
    MessageForSearch,
    NormalisedSearchParams,
    StoredCiphertext,
} from '../../models/encryptedSearch';
import { AesKeyGenParams, ES_LIMIT, ES_MAX_PAGEBATCH } from '../../constants';
import { indexKeyExists, getNumMessagesDB, getOldestMessage, getOldestTimePoint } from './esUtils';
import { applySearch, splitCachedMessage, uncachedSearch } from './esSearch';
import { queryEvents, queryMessagesCount, queryMessagesMetadata } from './esAPI';
import { encryptToDB, fetchMessage, prepareMessageMetadata } from './esBuild';

/**
 * Check whether the DB is limited, either after indexing or if it became so
 * after an update
 */
export const checkIsDBLimited = async (userID: string, api: Api) => {
    const count = await getNumMessagesDB(userID);
    const totalMessages = (await queryMessagesCount(api))?.Total || 0;
    return count < totalMessages;
};

/**
 * Decrypt encrypted object from IndexedDB
 */
export const decryptFromDB = async (storedCiphertext: StoredCiphertext, indexKey: CryptoKey) => {
    const textDecoder = new TextDecoder();

    try {
        const { aesGcmCiphertext } = storedCiphertext;
        const decryptedMessage = await crypto.subtle.decrypt(
            { iv: aesGcmCiphertext.iv, name: AesKeyGenParams.name },
            indexKey,
            aesGcmCiphertext.ciphertext
        );
        const cachedMessage: CachedMessage = JSON.parse(textDecoder.decode(new Uint8Array(decryptedMessage)));

        return cachedMessage;
    } catch (error) {
        // return undefined
    }
};

/**
 * Get message from IndexedDB
 */
export const getMessageFromDB = async (ID: string, indexKey: CryptoKey, esDB: IDBPDatabase<EncryptedSearchDB>) => {
    const storedCiphertext = await esDB.get('messages', ID);
    if (!storedCiphertext) {
        return;
    }

    return decryptFromDB(storedCiphertext, indexKey);
};

/**
 * Stores a message to IndexedDB. If there is not enough space, older messages are
 * removed in favour of new ones
 */
export const storeToDB = async (newCiphertextToStore: StoredCiphertext, esDB: IDBPDatabase<EncryptedSearchDB>) => {
    const retryStoring = true;
    while (retryStoring) {
        try {
            await esDB.put('messages', newCiphertextToStore);
            return true;
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                // If there is no space left an error is thrown. If the message we are trying to
                // save is older than the oldest message present, then it should be discarded. Otherwise,
                // the oldest message is deleted in favour of the newer one
                const oldestMessage = await getOldestMessage(esDB);
                const oldestTime = [oldestMessage.Time, oldestMessage.Order];
                const currentTime = [newCiphertextToStore.Time, newCiphertextToStore.Order];

                if (currentTime < oldestTime) {
                    // The message is treated as succesfully stored
                    return true;
                }

                // The oldest message is deleted, the function then loops to
                // check whether enough spaces has been freed
                await esDB.delete('messages', oldestMessage.ID);
            } else {
                // Any other error should be interpreted as a failure
                return false;
            }
        }
    }
};

/**
 * Check whether two MessageForSearch objects are equal
 */
const compareMessagesForSearch = (message1: MessageForSearch, message2: MessageForSearch) => {
    let key1: keyof typeof message1;
    for (key1 in message1) {
        if (JSON.stringify(message1[key1]) !== JSON.stringify(message2[key1])) {
            return false;
        }
    }

    let key2: keyof typeof message2;
    for (key2 in message2) {
        if (JSON.stringify(message2[key2]) !== JSON.stringify(message1[key2])) {
            return false;
        }
    }

    return true;
};

/**
 * Refresh index when we get a Refresh=1 from queryEvents
 */
export const refreshIndex = async (
    userID: string,
    api: Api,
    indexKey: CryptoKey,
    getMessageKeys: GetMessageKeys,
    attachmentsCache: AttachmentsCache,
    recordProgress: (progress: number, total: number) => void
) => {
    // Avoid new events being synced while this operation is ongoing by setting a RefreshEvent object
    const event = await queryEvents(api);
    if (!event || !event.EventID) {
        return;
    }
    setItem(`ES:${userID}:RefreshEvent`, event.EventID);

    const esDB = await openDB<EncryptedSearchDB>(`ES:${userID}:DB`);

    // All drafts from IndexedDB are removed before starting, they will be fetched again in the loop below. This
    // is to avoid checking whether the body was modified or not
    let searchResults: MessageForSearch[] = [];
    try {
        searchResults = await uncachedSearch(indexKey, userID, {
            labelID: '8',
            normalisedKeywords: undefined,
        });
    } catch (error) {
        // leave empty array
    }

    if (searchResults.length) {
        try {
            const tx = esDB.transaction('messages', 'readwrite');
            searchResults.forEach(async ({ ID }) => {
                await tx.store.delete(ID);
            });
            await tx.done;
        } catch (error) {
            return;
        }
    }

    const indexedIDs = new Map(
        (await esDB.getAllKeys('messages')).map((key) => [key, undefined]) as [string, undefined][]
    );

    // Fetching and preparing all metadata
    const Total = (await queryMessagesCount(api))?.Total;
    if (!Total) {
        return;
    }
    const numPages = Math.ceil(Total / ES_LIMIT);

    // IF DB is partial, we want a reference to the oldest message to discriminate whether to update the DB or not
    const count = await getNumMessagesDB(userID);
    let oldestTime: [number, number] | undefined;
    if (count < Total) {
        oldestTime = await getOldestTimePoint(userID);
    }

    // In case of big mailboxes, we don't want all pages at once in memory
    for (let startPageBatch = 0; startPageBatch < numPages; startPageBatch += ES_MAX_PAGEBATCH) {
        const startPage = startPageBatch * ES_MAX_PAGEBATCH;
        const endPage = Math.min((startPageBatch + 1) * ES_MAX_PAGEBATCH, numPages);

        const metadataPromiseArray: Promise<Message[]>[] = [];
        for (let Page = startPage; Page < endPage; Page++) {
            metadataPromiseArray.push(
                queryMessagesMetadata(api, { Page, PageSize: ES_LIMIT }).then((resultMetadata) => {
                    if (!resultMetadata) {
                        throw new Error('Metadata fetching failed');
                    }
                    return resultMetadata.Messages;
                })
            );
        }

        let metadataMatrix = await Promise.all(metadataPromiseArray).catch(() => undefined);
        if (!metadataMatrix) {
            // In case anything failed during page fetching, retry only the current batch
            if (startPageBatch !== 0) {
                startPageBatch -= ES_MAX_PAGEBATCH;
                continue;
            }
            return;
        }

        const fetchedMetadata: Map<string, Message> = new Map();
        metadataMatrix.forEach((metadataArray) => {
            metadataArray.forEach((message) => {
                fetchedMetadata.set(message.ID, message);
            });
        });
        // Delete reference for GC
        metadataMatrix = undefined;

        const compareMaps = async () => {
            const promiseArray: Promise<void>[] = [];

            fetchedMetadata.forEach(async (message, ID, fetchedMap) => {
                // Kill switch in case user logs out
                if (!indexKeyExists(userID)) {
                    throw new Error('Key was removed');
                }
                if (message.ExpirationTime) {
                    fetchedMap.delete(ID);
                    return;
                }
                if (indexedIDs.has(ID)) {
                    // If indexedIDs has ID, update metadata if something changed
                    promiseArray.push(
                        getMessageFromDB(ID, indexKey, esDB)
                            .then(async (oldMessage) => {
                                if (!oldMessage) {
                                    throw new Error('Old message is undefined');
                                }
                                const {
                                    decryptionError,
                                    decryptedBody,
                                    decryptedSubject,
                                    messageForSearch,
                                } = splitCachedMessage(oldMessage);
                                const newMessageForSearch = prepareMessageMetadata(message);
                                if (!compareMessagesForSearch(messageForSearch, newMessageForSearch)) {
                                    const newMessageToCache: CachedMessage = {
                                        decryptionError,
                                        decryptedBody,
                                        decryptedSubject,
                                        ...newMessageForSearch,
                                    };

                                    const newCiphertextToStore = await encryptToDB(newMessageToCache, indexKey);
                                    if (!newCiphertextToStore) {
                                        throw new Error('Ciphertext to store is undefined');
                                    }
                                    // Note that if DB is limited, storeToDB already takes care of it
                                    await storeToDB(newCiphertextToStore, esDB);
                                }
                            })
                            .then(() => {
                                indexedIDs.delete(ID);
                                fetchedMap.delete(ID);
                            })
                    );
                } else {
                    // If indexedIDs doesn't have ID, fetch it and index it, unless the DB is
                    // structurally limited
                    if (oldestTime && [message.Time, message.Order] < oldestTime) {
                        return;
                    }
                    promiseArray.push(
                        fetchMessage(ID, api, getMessageKeys, attachmentsCache).then(async (fetchedMessageToCache) => {
                            // Kill switch in case user logs out
                            if (!indexKeyExists(userID)) {
                                throw new Error('Key was removed');
                            }
                            if (!fetchedMessageToCache) {
                                throw new Error('Cannot fetch new message');
                            }
                            const newCiphertextToStore = await encryptToDB(fetchedMessageToCache, indexKey);
                            if (!newCiphertextToStore) {
                                throw new Error('Ciphertext to store is undefined');
                            }
                            await storeToDB(newCiphertextToStore, esDB);
                            fetchedMap.delete(ID);
                        })
                    );
                }
            });

            return Promise.all(promiseArray)
                .then(() => true)
                .catch(() => false);
        };

        let success = false;
        while (!success) {
            success = await compareMaps();
            // Kill switch in case user logs out
            if (!indexKeyExists(userID)) {
                return;
            }
        }

        recordProgress(ES_MAX_PAGEBATCH * ES_LIMIT, Total);
    }

    try {
        // If there are leftovers in indexedIDs, they have to be removed
        const tx = esDB.transaction('messages', 'readwrite');
        indexedIDs.forEach(async (_, key) => {
            await tx.store.delete(key);
        });
        await tx.done;
    } catch (error) {
        // This is a crucial operation, so if anything fails during deletion, start over
        return;
    }

    esDB.close();
};

export const syncMessageEvents = async (
    Messages: MessageEvent[],
    userID: string,
    oldESCache: CachedMessage[],
    oldPermanentResults: MessageForSearch[],
    isSearch: boolean,
    api: Api,
    getMessageKeys: GetMessageKeys,
    attachmentsCache: AttachmentsCache,
    indexKey: CryptoKey,
    normalisedSearchParams: NormalisedSearchParams
) => {
    const failedMessageEvents: string[] = [];
    let esCache = [...oldESCache];
    let permanentResults = [...oldPermanentResults];
    const esDB = await openDB<EncryptedSearchDB>(`ES:${userID}:DB`);
    let cacheChanged = false;
    let searchChanged = false;

    // In case something happens while displaying search results, this function keeps
    // the results in sync live (e.g. by creating or removing messages from the results)
    const updatePermanentResults = ({
        resultIndex,
        messageToCache,
    }: {
        resultIndex?: number;
        messageToCache?: CachedMessage;
    }) => {
        if (messageToCache) {
            const { messageForSearch } = splitCachedMessage(messageToCache);

            if (resultIndex) {
                permanentResults.splice(resultIndex, 1, messageForSearch);
            } else {
                permanentResults = permanentResults.concat(messageForSearch);
            }
        } else {
            permanentResults.splice(resultIndex as number, 1);
        }
        searchChanged = true;
    };

    await Promise.all(
        Messages.map(async (messageEvent) => {
            const { ID, Action, Message } = messageEvent;

            // If a message is deleted:
            //   - delete it from DB
            //   - if a cache exists, delete it from there
            //   - if results are being shown, delete it from there too
            if (Action === EVENT_ACTIONS.DELETE || Message?.ExpirationTime) {
                void esDB.delete('messages', ID);

                if (esCache.length) {
                    const index = esCache.findIndex((cachedMessage) => cachedMessage.ID === ID);
                    esCache.splice(index, 1);
                    cacheChanged = true;
                }

                const resultIndex = permanentResults.findIndex((message) => message.ID === ID);
                if (isSearch && resultIndex !== -1) {
                    updatePermanentResults({ resultIndex });
                }
            }

            // If a message is created:
            //   - add it to DB
            //   - if a cache exists, add it to there
            //   - if results are being shown and the new message fulfills, add it there too
            if (Action === EVENT_ACTIONS.CREATE) {
                if (!Message) {
                    return;
                }

                // Fetch the whole message since the event only contains metadata
                const messageToCache = await fetchMessage(ID, api, getMessageKeys, attachmentsCache);
                if (!messageToCache) {
                    failedMessageEvents.push(ID);
                    return;
                }

                const newCiphertextToStore = await encryptToDB(messageToCache, indexKey);
                if (!newCiphertextToStore) {
                    failedMessageEvents.push(ID);
                    return;
                }

                const storeSuccess = await storeToDB(newCiphertextToStore, esDB);

                if (!storeSuccess) {
                    failedMessageEvents.push(ID);
                    return;
                }

                if (esCache.length) {
                    esCache = esCache.concat(messageToCache);
                    cacheChanged = true;
                }

                if (isSearch && applySearch(normalisedSearchParams, messageToCache)) {
                    updatePermanentResults({ messageToCache });
                }
            }

            // If a message is modified, what to do depends whether it's a draft or not
            if (Action === EVENT_ACTIONS.UPDATE_DRAFT || Action === EVENT_ACTIONS.UPDATE_FLAGS) {
                if (!Message) {
                    return;
                }

                // If the message is not in IndexedDB, it means the latter is only partial for
                // space constraints and the message was too old to fit. In this case, the update
                // is ignored
                const storedMessage = await esDB.get('messages', ID);
                if (!storedMessage) {
                    return;
                }

                // Get the old version of the message from DB
                const oldMessage = await getMessageFromDB(ID, indexKey, esDB);
                if (!oldMessage) {
                    failedMessageEvents.push(ID);
                    return;
                }

                let newMessageToCache: CachedMessage | undefined;
                // If the modification is a draft update, fetch the draft from server so to have the new body...
                if (Action === EVENT_ACTIONS.UPDATE_DRAFT) {
                    const fetchedMessageToCache = await fetchMessage(ID, api, getMessageKeys, attachmentsCache);
                    if (!fetchedMessageToCache) {
                        failedMessageEvents.push(ID);
                        return;
                    }
                    newMessageToCache = fetchedMessageToCache;
                }

                // ...otherwise modify the old message only.
                if (Action === EVENT_ACTIONS.UPDATE_FLAGS) {
                    const { LabelIDsRemoved, LabelIDsAdded, ...otherChanges } = Message;
                    let { LabelIDs } = oldMessage;
                    if (LabelIDsRemoved) {
                        LabelIDs = LabelIDs.filter((labelID) => !LabelIDsRemoved.includes(labelID));
                    }
                    if (LabelIDsAdded) {
                        LabelIDs = LabelIDs.concat(LabelIDsAdded);
                    }

                    newMessageToCache = {
                        ...oldMessage,
                        ...otherChanges,
                        LabelIDs,
                    };
                }
                if (!newMessageToCache) {
                    failedMessageEvents.push(ID);
                    return;
                }

                const newCiphertextToStore = await encryptToDB(newMessageToCache, indexKey);
                if (!newCiphertextToStore) {
                    failedMessageEvents.push(ID);
                    return;
                }

                // Store the new message to DB
                const storeSuccess = await storeToDB(newCiphertextToStore, esDB);

                if (!storeSuccess) {
                    failedMessageEvents.push(ID);
                    return;
                }

                // If a cache exists, update the message there too
                if (esCache.length) {
                    const index = esCache.findIndex((cachedMessage) => cachedMessage.ID === ID);
                    esCache.splice(index, 1, newMessageToCache);
                    cacheChanged = true;
                }

                // If results are being shown:
                //   - if the old message was part of the search and the new one still is, update it;
                //   - if the old message was part of the search and the new one shouldn't be, delete it;
                //   - if the old message wasn't part of the search and the new one should be, add it;
                if (isSearch) {
                    if (applySearch(normalisedSearchParams, oldMessage)) {
                        const resultIndex = permanentResults.findIndex((message) => message.ID === ID);

                        if (applySearch(normalisedSearchParams, newMessageToCache)) {
                            updatePermanentResults({ resultIndex, messageToCache: newMessageToCache });
                        } else {
                            updatePermanentResults({ resultIndex });
                        }
                    } else if (applySearch(normalisedSearchParams, newMessageToCache)) {
                        updatePermanentResults({ messageToCache: newMessageToCache });
                    }
                }
            }
        })
    );

    esDB.close();

    return {
        failedMessageEvents,
        newESCache: esCache,
        newPermanentResults: permanentResults,
        cacheChanged,
        searchChanged,
    };
};

export const correctDecryptionErrors = async (
    userID: string,
    indexKey: CryptoKey,
    api: Api,
    getMessageKeys: GetMessageKeys,
    attachmentsCache: AttachmentsCache,
    recordProgress: (progress: number, total: number) => void
) => {
    let searchResults: MessageForSearch[] = [];

    try {
        searchResults = await uncachedSearch(indexKey, userID, {
            labelID: '5',
            normalisedKeywords: undefined,
            decryptionError: true,
        });
    } catch (error) {
        return;
    }

    if (!searchResults.length) {
        // There are no messages for which decryption failed
        return false;
    }

    const esDB = await openDB<EncryptedSearchDB>(`ES:${userID}:DB`);

    const booleanArray = await Promise.all(
        searchResults.map(async (message) => {
            return fetchMessage(message.ID, api, getMessageKeys, attachmentsCache).then(async (newMessage) => {
                if (!newMessage || newMessage.decryptionError) {
                    return false;
                }
                const newCiphertextToStore = await encryptToDB(newMessage, indexKey);
                if (!newCiphertextToStore) {
                    return false;
                }

                recordProgress(1, searchResults.length);

                return storeToDB(newCiphertextToStore, esDB);
            });
        })
    );

    esDB.close();

    return booleanArray.reduce((prev, current) => {
        return prev || current;
    });
};
