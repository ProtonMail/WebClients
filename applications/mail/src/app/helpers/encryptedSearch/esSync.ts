import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { Api, LabelCount } from '@proton/shared/lib/interfaces';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import { range } from '@proton/shared/lib/helpers/array';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import runInQueue from '@proton/shared/lib/helpers/runInQueue';
import { IDBPDatabase } from 'idb';
import { MessageEvent } from '../../models/event';
import { GetMessageKeys } from '../../hooks/message/useGetMessageKeys';
import {
    ESMessage,
    EncryptedSearchDB,
    ESBaseMessage,
    ESCache,
    NormalisedSearchParams,
    StoredCiphertext,
} from '../../models/encryptedSearch';
import {
    AesKeyGenParams,
    ES_MAX_CONCURRENT,
    ES_MAX_PAGES_PER_BATCH,
    ES_MAX_PARALLEL_MESSAGES,
    PAGE_SIZE,
} from '../../constants';
import {
    getNumMessagesDB,
    getOldestMessage,
    updateSizeIDB,
    getTotalMessages,
    refreshOpenpgp,
    openESDB,
    esSentryReport,
    getES,
} from './esUtils';
import { applySearch, normaliseSearchParams, uncachedSearch } from './esSearch';
import { queryEvents, queryMessagesMetadata } from './esAPI';
import { encryptToDB, fetchMessage, prepareMessageMetadata } from './esBuild';
import { sizeOfCachedMessage, removeFromESCache, addToESCache, replaceInESCache } from './esCache';

/**
 * Check whether the DB is limited, either after indexing or if it became so
 * after an update
 */
export const checkIsDBLimited = async (userID: string, messageCounts: LabelCount[]) => {
    const count = await getNumMessagesDB(userID);
    const totalMessages = await getTotalMessages(messageCounts);
    return count < totalMessages;
};

/**
 * Decrypt encrypted object from IndexedDB
 */
export const decryptFromDB = async (storedCiphertext: StoredCiphertext, indexKey: CryptoKey): Promise<ESMessage> => {
    const textDecoder = new TextDecoder();

    const { aesGcmCiphertext } = storedCiphertext;
    const decryptedMessage = await crypto.subtle.decrypt(
        { iv: aesGcmCiphertext.iv, name: AesKeyGenParams.name },
        indexKey,
        aesGcmCiphertext.ciphertext
    );

    return JSON.parse(textDecoder.decode(new Uint8Array(decryptedMessage)));
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
        } catch (error: any) {
            esSentryReport('storeToDB: put failed', { error });

            if (error.name === 'QuotaExceededError') {
                // If there is no space left an error is thrown. If the message we are trying to
                // save is older than the oldest message present, then it should be discarded. Otherwise,
                // the oldest message is deleted in favour of the newer one
                const oldestMessage = await getOldestMessage(esDB);
                if (!oldestMessage) {
                    return false;
                }

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
 * Check whether two ESBaseMessage objects are equal
 */
export const compareESBaseMessages = (message1: ESBaseMessage, message2: ESBaseMessage) => {
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
 * Remove messages from and add messages to IDB
 */
export const executeIDBOperations = async (
    esDB: IDBPDatabase<EncryptedSearchDB>,
    messagesToRemove: string[],
    messagesToAdd: StoredCiphertext[]
) => {
    const tx = esDB.transaction('messages', 'readwrite');

    // Firstly, all messages that were deleted are removed from IDB
    if (messagesToRemove.length) {
        for (const ID of messagesToRemove) {
            void tx.store.delete(ID);
        }
    }

    // Then all messages to add are inserted, if a message fails
    // it is saved for retry
    try {
        if (messagesToAdd.length) {
            for (const ciphertext of messagesToAdd) {
                void tx.store.put(ciphertext);
            }
        }
        await tx.done;
    } catch (error: any) {
        // The most likely cause for failure is the quota being exceeded,
        // therefore we use the storeToDB routine which inserts newer messages by
        // removing older ones, or discards the message if it's too old
        if (error.name === 'QuotaExceededError') {
            for (const ciphertext of messagesToAdd) {
                if (!(await storeToDB(ciphertext, esDB))) {
                    throw new Error('Sync of some messages failed');
                }
            }
        } else {
            // Otherwise the same error is thrown
            throw error;
        }
    }
};

/**
 * Synchronise IDB (and optionally cache and search results) with new message events
 */
export const syncMessageEvents = async (
    Messages: MessageEvent[],
    userID: string,
    esCacheRef: React.MutableRefObject<ESCache>,
    permanentResults: ESMessage[],
    isSearch: boolean,
    api: Api,
    getMessageKeys: GetMessageKeys,
    indexKey: CryptoKey,
    normalisedSearchParams: NormalisedSearchParams,
    recordProgressLocal?: () => void
) => {
    const esDB = await openESDB(userID);
    let searchChanged = false;

    // In case something happens while displaying search results, this function keeps
    // the results in sync live (e.g. by creating or removing messages from the results)
    const updatePermanentResults = ({
        resultIndex,
        messageToCache,
    }: {
        resultIndex?: number;
        messageToCache?: ESMessage;
    }) => {
        if (messageToCache) {
            if (resultIndex) {
                permanentResults.splice(resultIndex, 1, messageToCache);
            } else {
                permanentResults.push(messageToCache);
            }
        } else {
            permanentResults.splice(resultIndex as number, 1);
        }
        searchChanged = true;
    };

    // Any interaction with IDB is postponed
    const messagesToRemove: string[] = [];
    const messagesToAdd: StoredCiphertext[] = [];

    // We speed up message syncing by first fetching in parallel all messages that are
    // required (i.e. for new messages or draft update) and then syncing them all
    for (let batch = 0; batch < Messages.length; batch += ES_MAX_PARALLEL_MESSAGES) {
        const messageEventsBatch = Messages.slice(batch, Math.min(Messages.length, batch + ES_MAX_PARALLEL_MESSAGES));
        const prefetchedMessages = (
            await Promise.all(
                messageEventsBatch.map(async (messageEvent) => {
                    const { ID, Action } = messageEvent;
                    if (Action === EVENT_ACTIONS.CREATE || Action === EVENT_ACTIONS.UPDATE_DRAFT) {
                        return fetchMessage(ID, api, getMessageKeys);
                    }
                })
            )
        ).filter(isTruthy);

        for (const messageEvent of messageEventsBatch) {
            const { ID, Action, Message } = messageEvent;

            // If a message is deleted:
            //   - if a cache exists and has it, delete it from there
            //   - if results are being shown, delete it from there too
            if (Action === EVENT_ACTIONS.DELETE) {
                messagesToRemove.push(ID);
                const size = removeFromESCache(ID, esCacheRef) || 0;
                updateSizeIDB(userID, -size);

                const resultIndex = permanentResults.findIndex((message) => message.ID === ID);
                if (isSearch && resultIndex !== -1) {
                    updatePermanentResults({ resultIndex });
                }
            }

            // If a message is created:
            //   - if a cache exists, add it to there
            //   - if results are being shown and the new message fulfills, add it there too
            if (Action === EVENT_ACTIONS.CREATE) {
                if (!Message) {
                    continue;
                }

                // Fetch the whole message since the event only contains metadata
                const messageToCache = prefetchedMessages.find((prefetchedMessage) => prefetchedMessage.ID === ID);
                if (!messageToCache) {
                    // If a permanent error occured while fetching, we ignore the update
                    continue;
                }

                const newCiphertextToStore = await encryptToDB(messageToCache, indexKey);

                messagesToAdd.push(newCiphertextToStore);

                const size = sizeOfCachedMessage(messageToCache);
                updateSizeIDB(userID, size);
                addToESCache(messageToCache, esCacheRef, size);

                if (isSearch && applySearch(normalisedSearchParams, messageToCache)) {
                    updatePermanentResults({ messageToCache });
                }
            }

            // If a message is modified, what to do depends whether it's a draft or not
            if (Action === EVENT_ACTIONS.UPDATE_DRAFT || Action === EVENT_ACTIONS.UPDATE_FLAGS) {
                if (!Message) {
                    continue;
                }

                // If the message is not in IndexedDB, it means the latter is only partial for
                // space constraints and the message was too old to fit. In this case, the update
                // is ignored
                const oldMessage = await getMessageFromDB(ID, indexKey, esDB);
                if (!oldMessage) {
                    continue;
                }

                let newMessageToCache: ESMessage | undefined;
                // If the modification is a draft update, fetch the draft from server so to have the new body...
                if (Action === EVENT_ACTIONS.UPDATE_DRAFT) {
                    const fetchedMessageToCache = prefetchedMessages.find(
                        (prefetchedMessage) => prefetchedMessage.ID === ID
                    );
                    if (!fetchedMessageToCache) {
                        // If a permanent error occured while fetching, we ignore the update
                        continue;
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
                    throw new Error('Plaintext to store is undefined');
                }

                const newCiphertextToStore = await encryptToDB(newMessageToCache, indexKey);

                messagesToAdd.push(newCiphertextToStore);

                const sizeDelta = sizeOfCachedMessage(newMessageToCache) - sizeOfCachedMessage(oldMessage);
                updateSizeIDB(userID, sizeDelta);

                // If a cache exists, update the message there too
                replaceInESCache(newMessageToCache, esCacheRef, Action === EVENT_ACTIONS.UPDATE_DRAFT, sizeDelta);

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

            if (recordProgressLocal) {
                recordProgressLocal();
            }
        }
    }

    await executeIDBOperations(esDB, messagesToRemove, messagesToAdd);

    esDB.close();

    return searchChanged;
};

/**
 * When an old key is activated, try to correct any previous decryption errors
 */
export const correctDecryptionErrors = async (
    userID: string,
    indexKey: CryptoKey,
    api: Api,
    getMessageKeys: GetMessageKeys,
    recordProgress: (progress: number, total: number) => void,
    esCacheRef?: React.MutableRefObject<ESCache>
) => {
    const { resultsArray: searchResults } = await uncachedSearch(
        userID,
        indexKey,
        { ...normaliseSearchParams({}, '5'), decryptionError: true },
        {}
    );

    if (!searchResults.length) {
        // There are no messages for which decryption failed
        return false;
    }

    recordProgress(0, searchResults.length);

    let counter = 0;
    const messagesToAdd = (
        await Promise.all(
            searchResults.map(async (message) => {
                const newMessage = await fetchMessage(message.ID, api, getMessageKeys);
                if (!newMessage || newMessage.decryptionError) {
                    // Message still fails decryption
                    return;
                }

                const newCiphertextToStore = await encryptToDB(newMessage, indexKey);

                const size = sizeOfCachedMessage(newMessage);
                updateSizeIDB(userID, size);
                if (esCacheRef) {
                    addToESCache(newMessage, esCacheRef, size);
                }
                recordProgress(++counter, searchResults.length);

                return newCiphertextToStore;
            })
        )
    ).filter(isTruthy);

    const newMessagesFound = messagesToAdd.length;

    if (newMessagesFound) {
        const esDB = await openESDB(userID);
        await executeIDBOperations(esDB, [], messagesToAdd);
        esDB.close();
    }

    return newMessagesFound;
};

/**
 * Fetch, prepare and store the specified messages to IndexedDB
 */
const syncMessagesBatch = async (
    userID: string,
    messagesMetadata: Message[],
    esDB: IDBPDatabase<EncryptedSearchDB>,
    indexKey: CryptoKey,
    api: Api,
    getMessageKeys: GetMessageKeys,
    recordLocalProgress: (localProgress: number) => void
) => {
    let counter = 0;

    const esIteratee = async (message: Message) => {
        // Since we are passing metadata, messageToCache cannot be undefined
        // even if there was a permanent error while fetching the message
        const messageToCache = (await fetchMessage(message.ID, api, getMessageKeys, undefined, message))!;

        const size = sizeOfCachedMessage(messageToCache);
        updateSizeIDB(userID, size);

        recordLocalProgress(++counter);
        return encryptToDB(messageToCache, indexKey);
    };

    // ciphertexts is a list of symmetrically encrypted messages in reverse chronological order
    const ciphertexts = await runInQueue<StoredCiphertext>(
        messagesMetadata.map((message) => () => esIteratee(message)),
        ES_MAX_CONCURRENT
    );

    const tx = esDB.transaction('messages', 'readwrite');
    await Promise.all(ciphertexts.map(async (ciphertext) => tx.store.put(ciphertext)));
    await tx.done;
};

/**
 * Refresh index when we get a Refresh=1 from queryEvents
 */
export const refreshIndex = async (
    userID: string,
    api: Api,
    indexKey: CryptoKey,
    getMessageKeys: GetMessageKeys,
    recordProgress: (progress: number, total: number) => void,
    messageCounts: LabelCount[]
) => {
    // Get the latest event to catch up after refreshing
    const eventSinceRefresh = await queryEvents(api);
    if (!eventSinceRefresh || !eventSinceRefresh.EventID) {
        throw new Error('Event fetching failed');
    }

    // If we hit a refresh event, we could have missed a key reactivation, therefore
    // before attempting to refresh the index, we also retry decryption of previously failed
    // messages. This is due to refresh not trying to decrypt all messages, but only drafts
    // and completely new messages
    await correctDecryptionErrors(userID, indexKey, api, getMessageKeys, recordProgress);

    // Progress is wiped before actual refreshing
    recordProgress(0, 0);

    const esDB = await openESDB(userID);

    // Fetching and preparing all metadata
    const Total = await getTotalMessages(messageCounts);
    const numPages = Math.ceil(Total / PAGE_SIZE);
    const numBatches = Math.ceil(numPages / ES_MAX_PAGES_PER_BATCH);
    let numMessages = 0;

    recordProgress(0, Total);

    // All drafts from IndexedDB are removed before starting, they will be fetched again in the loop below. This
    // is to avoid checking whether the body was modified or not
    let drafts: ESMessage[] = [];
    try {
        ({ resultsArray: drafts } = await uncachedSearch(userID, indexKey, normaliseSearchParams({}, '8'), {}));
    } catch (error: any) {
        throw new Error('Drafts fetching failed');
    }

    const indexedIDs = new Set(await esDB.getAllKeys('messages'));

    // In case of big mailboxes, we don't want all pages at once in memory
    for (let startPageBatch = 0; startPageBatch < numBatches; startPageBatch++) {
        const startPage = startPageBatch * ES_MAX_PAGES_PER_BATCH;
        const endPage = Math.min((startPageBatch + 1) * ES_MAX_PAGES_PER_BATCH, numPages);

        const fetchedMetadata: Message[] = [];
        const pagesRange = range(startPage, endPage);

        const error = await Promise.all(
            pagesRange.map(async (Page) => {
                const resultMetadata = await queryMessagesMetadata(api, { Page, Limit: PAGE_SIZE });
                if (!resultMetadata) {
                    throw new Error();
                }

                fetchedMetadata.push(...resultMetadata.Messages);
            })
        )
            .then(() => false)
            .catch(() => true);

        if (error) {
            throw new Error('Metadata fetching failed');
        }

        // Any interaction with IDB is postponed
        const messagesToAdd: StoredCiphertext[] = [];
        const messagesToFetch: Message[] = [];

        for (const message of fetchedMetadata) {
            const { ID } = message;

            if (indexedIDs.has(ID)) {
                // First we check if the message is an existing draft. If it is and its Time
                // is the same, it means it hasn't been modified. Otherwise it is added to the
                // messages to fetch
                const draft = drafts.find(({ ID }) => message.ID === ID);
                if (draft) {
                    if (draft.Time !== message.Time) {
                        messagesToFetch.push(message);
                    }
                    indexedIDs.delete(ID);
                    continue;
                }

                // Update metadata if something changed
                const oldMessage = await getMessageFromDB(ID, indexKey, esDB);
                if (!oldMessage) {
                    throw new Error('Old message is undefined');
                }

                const { decryptionError, decryptedBody, decryptedSubject } = oldMessage;
                const oldBaseMessage = prepareMessageMetadata(oldMessage);
                const newBaseMessage = prepareMessageMetadata(message);

                if (!compareESBaseMessages(oldBaseMessage, newBaseMessage)) {
                    const newMessageToCache: ESMessage = {
                        decryptionError,
                        decryptedBody,
                        decryptedSubject,
                        ...newBaseMessage,
                    };

                    const newCiphertextToStore = await encryptToDB(newMessageToCache, indexKey);

                    const sizeDelta = sizeOfCachedMessage(newMessageToCache) - sizeOfCachedMessage(oldMessage);
                    updateSizeIDB(userID, sizeDelta);
                    messagesToAdd.push(newCiphertextToStore);
                }

                indexedIDs.delete(ID);
                recordProgress(numMessages++, Total);
            } else {
                // New messages are retrieved later in parallel
                messagesToFetch.push(message);
            }
        }

        // Messages for which only the metadata changed are updated
        if (messagesToAdd.length) {
            await executeIDBOperations(esDB, [], messagesToAdd);
        }

        // Then new messages are fetched and stored
        if (messagesToFetch.length) {
            const recordLocalProgress = (numMessages: number) => (progressLocal: number) =>
                recordProgress(numMessages + progressLocal, Total);
            await syncMessagesBatch(
                userID,
                messagesToFetch,
                esDB,
                indexKey,
                api,
                getMessageKeys,
                recordLocalProgress(numMessages)
            );
            await refreshOpenpgp();
        }
    }

    // All messages that haven't been removed from indexedIDs no longer exist
    const messagesToRemove = [...indexedIDs];
    await executeIDBOperations(esDB, messagesToRemove, []);

    esDB.close();

    // Return events since refresh started
    const newMessageEvent = await queryEvents(api, eventSinceRefresh.EventID);
    if (!newMessageEvent || !newMessageEvent.EventID) {
        throw new Error('Failed to fetch events after refresh');
    }

    return newMessageEvent;
};

/**
 * Return the (possibly partial) list of events since the one stored in localStorage
 */
export const getEventFromLS = async (userID: string, api: Api) => {
    const storedEventID = getES.Event(userID);
    if (!storedEventID) {
        return;
    }
    return queryEvents(api, storedEventID);
};
