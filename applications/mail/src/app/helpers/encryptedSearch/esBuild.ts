import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { Api } from '@proton/shared/lib/interfaces';
import runInQueue from '@proton/shared/lib/helpers/runInQueue';
import { MINUTE, SECOND } from '@proton/shared/lib/constants';
import { IDBPDatabase } from 'idb';
import { decryptMessage as pmcryptoDecryptMessage, getMessage as pmcryptoGetMessage, encryptMessage } from 'pmcrypto';
import { decryptMessage } from '../message/messageDecrypt';
import { GetMessageKeys } from '../../hooks/message/useGetMessageKeys';
import { locateBlockquote } from '../message/messageBlockquote';
import {
    ESMessage,
    EncryptedSearchDB,
    ESBaseMessage,
    ESIndexingState,
    GetUserKeys,
    RecoveryPoint,
    StoredCiphertext,
} from '../../models/encryptedSearch';
import {
    AesKeyGenParams,
    ES_MAX_CONCURRENT,
    KeyUsages,
    localisedForwardFlags,
    OPENPGP_REFRESH_CUTOFF,
} from '../../constants';
import {
    addESTimestamp,
    createESDB,
    deleteESDB,
    esSentryReport,
    getES,
    getOldestMessage,
    openESDB,
    refreshOpenpgp,
    removeES,
    setES,
    setOriginalEstimate,
    updateSizeIDB,
} from './esUtils';
import { queryEvents, queryMessage, queryMessagesCount, queryMessagesMetadata, sendESMetrics } from './esAPI';
import { toText } from '../parserHtml';
import { sizeOfCachedMessage } from './esCache';

/**
 * Decrypt the given armored index key. Return undefined if something goes wrong.
 */
export const decryptIndexKey = async (getUserKeys: GetUserKeys, encryptedKey: string | null | undefined) => {
    if (!encryptedKey) {
        return;
    }

    const userKeysList = await getUserKeys();
    const primaryUserKey = userKeysList[0];
    const decryptionResult = await pmcryptoDecryptMessage({
        message: await pmcryptoGetMessage(encryptedKey),
        publicKeys: [primaryUserKey.publicKey],
        privateKeys: [primaryUserKey.privateKey],
    });

    if (!decryptionResult) {
        return;
    }

    const { data: decryptedKey } = decryptionResult;

    const importedKey = await crypto.subtle.importKey(
        'jwk',
        JSON.parse(decryptedKey),
        { name: AesKeyGenParams.name },
        true,
        KeyUsages
    );

    if ((importedKey as CryptoKey).algorithm) {
        return importedKey;
    }
};

/**
 * Retrieve and decrypt the index key from localStorage. Return undefined if something goes wrong.
 */
export const getIndexKey = async (getUserKeys: GetUserKeys, userID: string) => {
    try {
        return decryptIndexKey(getUserKeys, getES.Key(userID));
    } catch (error: any) {
        esSentryReport('getIndexKey', { error });
    }
};

/**
 * Remove the specified tag from the given HTML element
 */
export const removeTag = (element: HTMLElement, tagName: string) => {
    let removeTag = true;
    while (removeTag) {
        const tagInstances = element.getElementsByTagName(tagName);
        const tagInstance = tagInstances.item(0);
        if (tagInstance) {
            tagInstance.remove();
        }
        removeTag = tagInstances.length !== 0;
    }
};

/**
 * Remove quoted text and HTML tags from body
 */
export const cleanText = (text: string, removeQuote: boolean) => {
    const domParser = new DOMParser();

    const { body } = domParser.parseFromString(text, 'text/html');
    removeTag(body, 'style');
    removeTag(body, 'script');

    let content = body.innerHTML;
    if (removeQuote) {
        const [noQuoteContent] = locateBlockquote(body);
        content = noQuoteContent;
    }

    return toText(content);
};

/**
 * Turns a Message into a ESBaseMessage
 */
export const prepareMessageMetadata = (message: Message | ESMessage) => {
    const messageForSearch: ESBaseMessage = {
        ID: message.ID,
        ConversationID: message.ConversationID,
        Subject: message.Subject,
        Unread: message.Unread,
        Sender: message.Sender,
        Flags: message.Flags,
        AddressID: message.AddressID,
        IsReplied: message.IsReplied,
        IsRepliedAll: message.IsRepliedAll,
        IsForwarded: message.IsForwarded,
        ToList: message.ToList,
        CCList: message.CCList,
        BCCList: message.BCCList,
        Size: message.Size,
        NumAttachments: message.NumAttachments,
        ExpirationTime: message.ExpirationTime,
        LabelIDs: message.LabelIDs,
        Time: message.Time,
        Order: message.Order,
    };
    return messageForSearch;
};

/**
 * Create encrypted object to store in IndexedDB
 */
export const encryptToDB = async (messageToCache: ESMessage, indexKey: CryptoKey): Promise<StoredCiphertext> => {
    const messageToEncrypt = JSON.stringify(messageToCache);
    const textEncoder = new TextEncoder();

    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);

    const encryptedMessage = await crypto.subtle.encrypt(
        { iv, name: AesKeyGenParams.name },
        indexKey,
        textEncoder.encode(messageToEncrypt)
    );

    const { ID, Time, Order, LabelIDs } = messageToCache;
    return {
        ID,
        Time,
        Order,
        LabelIDs,
        aesGcmCiphertext: {
            ciphertext: encryptedMessage,
            iv,
        },
    };
};

/**
 * Compare the subject to a set of known translations of the Fw: flag and decide
 * if the message is a forwarded one
 */
export const isMessageForwarded = (subject: string | undefined) => {
    if (!subject) {
        return false;
    }
    return localisedForwardFlags.some((fwFlag) => subject.slice(0, fwFlag.length).toLocaleLowerCase() === fwFlag);
};

/**
 * Fetches a message and return a ESMessage
 */
export const fetchMessage = async (
    messageID: string,
    api: Api,
    getMessageKeys: GetMessageKeys,
    signal?: AbortSignal,
    messageMetadata?: Message,
    userID?: string
): Promise<ESMessage | undefined> => {
    const message = await queryMessage(api, messageID, signal, userID);
    if (!message) {
        // If a permanent error happened and metadata was given, the returned
        // ESMessage is as if decryption failed
        if (messageMetadata) {
            return {
                ...prepareMessageMetadata(messageMetadata),
                decryptionError: true,
            };
        }
        // Otherwise an undefined message is returned
        return;
    }

    let decryptedSubject: string | undefined;
    let decryptedBody: string | undefined;
    let decryptionError = true;
    try {
        const keys = await getMessageKeys(message);
        const decryptionResult = await decryptMessage(message, keys.privateKeys, undefined);
        if (!decryptionResult.errors) {
            ({ decryptedSubject, decryptedBody } = decryptionResult);
            decryptionError = false;
        }
    } catch (error: any) {
        // Decryption can legitimately fail if there are inactive keys. In this
        // case the above three variables are left undefined
    }

    // Quotes are removed for all sent messages, and all other messages apart from forwarded ones
    const removeQuote = message.LabelIDs.includes('2') || !isMessageForwarded(message.Subject);

    const cachedMessage: ESMessage = {
        ...prepareMessageMetadata(message),
        decryptedBody: typeof decryptedBody === 'string' ? cleanText(decryptedBody, removeQuote) : undefined,
        decryptedSubject,
        decryptionError,
    };

    return cachedMessage;
};

/**
 * Store one batch of messages to IndexedDB
 */
const storeMessages = async (
    messagesMetadata: Message[],
    esDB: IDBPDatabase<EncryptedSearchDB>,
    indexKey: CryptoKey,
    api: Api,
    getMessageKeys: GetMessageKeys,
    abortIndexingRef: React.MutableRefObject<AbortController>,
    recordLocalProgress: (localProgress: number) => void,
    userID: string
) => {
    let batchSize = 0;
    let counter = 0;

    const esIteratee = async (message: Message) => {
        if (abortIndexingRef.current.signal.aborted) {
            throw new Error('Operation aborted');
        }

        // Since we are passing metadata, messageToCache cannot be undefined
        // even if there was a permanent error while fetching the message
        const messageToCache = (await fetchMessage(
            message.ID,
            api,
            getMessageKeys,
            abortIndexingRef.current.signal,
            message,
            userID
        ))!;

        recordLocalProgress(++counter);
        batchSize += sizeOfCachedMessage(messageToCache);
        return encryptToDB(messageToCache, indexKey);
    };

    // ciphertexts is a list of symmetrically encrypted messages in reverse chronological order
    const ciphertexts = await runInQueue<StoredCiphertext>(
        messagesMetadata.map((message) => () => esIteratee(message)),
        ES_MAX_CONCURRENT
    );

    if (abortIndexingRef.current.signal.aborted) {
        throw new Error('Operation aborted');
    }

    // Since transactions are atomic, i.e. either all ciphertexts are stored or
    // none of them is, it's safe to take the last ciphertext as recovery point
    const recoveryPoint: RecoveryPoint = {
        ID: ciphertexts[ciphertexts.length - 1].ID,
        Time: ciphertexts[ciphertexts.length - 1].Time,
    };

    const tx = esDB.transaction('messages', 'readwrite');
    await Promise.all(ciphertexts.map(async (ciphertext) => tx.store.put(ciphertext)));
    await tx.done;

    return { recoveryPoint, batchSize };
};

/**
 * Fetch and store messages in batches starting from the given one, if any
 */
const storeMessagesBatches = async (
    userID: string,
    esDB: IDBPDatabase<EncryptedSearchDB>,
    indexKey: CryptoKey,
    getMessageKeys: GetMessageKeys,
    api: Api,
    abortIndexingRef: React.MutableRefObject<AbortController>,
    inputLastMessage: RecoveryPoint | undefined,
    recordProgress: (progress: number) => void
) => {
    let resultMetadata = await queryMessagesMetadata(
        api,
        {
            EndID: inputLastMessage?.ID,
            End: inputLastMessage?.Time,
        },
        abortIndexingRef.current.signal,
        userID
    );

    if (!resultMetadata) {
        return false;
    }

    let { Messages } = resultMetadata;

    let batchCount = 0;
    let progress = 0;
    while (Messages.length) {
        const inloopProgress = progress;
        const recordLocalProgress = (localProgress: number) => {
            recordProgress(inloopProgress + localProgress);
        };

        const storeOutput = await storeMessages(
            Messages,
            esDB,
            indexKey,
            api,
            getMessageKeys,
            abortIndexingRef,
            recordLocalProgress,
            userID
        ).catch((error: any) => {
            if (
                !(error.message && error.message === 'Operation aborted') &&
                !(error.name && error.name === 'AbortError')
            ) {
                // This happens when the user pauses indexing, for which we don't need a sentry report
                esSentryReport('storeMessagesBatches: storeMessages', { error });
            }

            if (error.name === 'QuotaExceededError') {
                const quotaRecoveryPoint: RecoveryPoint = { ID: 'QuotaExceededError', Time: -1 };
                return {
                    recoveryPoint: quotaRecoveryPoint,
                    batchSize: 0,
                };
            }
        });

        if (!storeOutput || abortIndexingRef.current.signal.aborted) {
            return false;
        }
        const { recoveryPoint, batchSize } = storeOutput;

        if (recoveryPoint.ID === 'QuotaExceededError' && recoveryPoint.Time === -1) {
            // If the quota has been reached, indexing is considered to be successful. Since
            // messages are fetched in chronological order, IndexedDB is guaranteed to contain
            // the most recent messages only
            return true;
        }

        updateSizeIDB(userID, batchSize);
        progress += Messages.length;

        resultMetadata = await queryMessagesMetadata(
            api,
            {
                EndID: recoveryPoint.ID,
                End: recoveryPoint.Time,
            },
            abortIndexingRef.current.signal,
            userID
        );

        if (!resultMetadata) {
            return false;
        }

        Messages = resultMetadata.Messages;

        if (batchCount++ >= OPENPGP_REFRESH_CUTOFF) {
            await refreshOpenpgp();
            batchCount = 0;
        }

        addESTimestamp(userID, 'step');
    }

    return true;
};

/**
 * Opens the DB and starts indexing
 */
export const buildDB = async (
    userID: string,
    indexKey: CryptoKey,
    getMessageKeys: GetMessageKeys,
    api: Api,
    abortIndexingRef: React.MutableRefObject<AbortController>,
    recordProgress: (progress: number) => void
) => {
    addESTimestamp(userID, 'start');
    const esDB = await openESDB(userID);

    // Use the oldest message stored as recovery point
    let recoveryPoint: RecoveryPoint | undefined;
    const oldestMessage = await getOldestMessage(esDB);
    if (oldestMessage) {
        const { ID, Time } = oldestMessage;
        recoveryPoint = { ID, Time };
    }

    // Start fetching messages from the last stored message
    // or from scratch if a recovery point was not found
    const success = await storeMessagesBatches(
        userID,
        esDB,
        indexKey,
        getMessageKeys,
        api,
        abortIndexingRef,
        recoveryPoint,
        recordProgress
    );

    esDB.close();

    return success;
};

/**
 * Store an existing index key to local storage
 */
export const storeIndexKey = async (indexKey: CryptoKey, userID: string, getUserKeys: GetUserKeys) => {
    const userKeysList = await getUserKeys();
    const primaryUserKey = userKeysList[0];
    const keyToEncrypt = await crypto.subtle.exportKey('jwk', indexKey);
    const { data: encryptedKey } = await encryptMessage({
        data: JSON.stringify(keyToEncrypt),
        publicKeys: [primaryUserKey.publicKey],
        privateKeys: [primaryUserKey.privateKey],
    });
    setES.Key(userID, encryptedKey);
};

/**
 * Execute the initial steps of a new indexing, i.e. generating an index key and the DB itself
 */
export const initialiseDB = async (userID: string, getUserKeys: GetUserKeys, api: Api, isRefreshed: boolean) => {
    const result: { notSupported: boolean; indexKey: CryptoKey | undefined } = {
        notSupported: false,
        indexKey: undefined,
    };

    // Remove IndexedDB in case there is a corrupt leftover
    try {
        await deleteESDB(userID);
    } catch (error: any) {
        if (error.name !== 'InvalidStateError') {
            esSentryReport('initialiseDB: deleteESDB', { error });
        }

        return {
            ...result,
            notSupported: true,
        };
    }

    // The number of messages before indexing is the one to aim to for showing progress, as
    // new messages will be synced only after indexing has completed. The first message is set
    // as first recovery point
    const initialiser = await queryMessagesCount(api);
    if (!initialiser) {
        return result;
    }

    // Save the event before starting building IndexedDB
    const previousEvent = await queryEvents(api);
    if (previousEvent && previousEvent.EventID) {
        setES.Progress(userID, {
            totalMessages: initialiser.Total,
            isRefreshed,
            numPauses: 0,
            timestamps: [],
            originalEstimate: 0,
        });
        setES.Event(userID, previousEvent.EventID);
    } else {
        return result;
    }

    // Set up DB
    let esDB: IDBPDatabase<EncryptedSearchDB>;
    try {
        esDB = await createESDB(userID);
    } catch (error: any) {
        if (error.name !== 'InvalidStateError') {
            esSentryReport('initialiseDB: createESDB', { error });
        }

        removeES.Event(userID);
        removeES.Progress(userID);
        return {
            ...result,
            notSupported: true,
        };
    }
    esDB.close();

    // Create an index key and save it to localStorage in encrypted form
    let indexKey: CryptoKey;
    try {
        indexKey = await crypto.subtle.generateKey(AesKeyGenParams, true, KeyUsages);
        await storeIndexKey(indexKey, userID, getUserKeys);
    } catch (error: any) {
        esSentryReport('initialiseDB: key generation', { error });

        removeES.Event(userID);
        removeES.Progress(userID);
        await deleteESDB(userID);
        return result;
    }

    setES.Size(userID, 0);

    return {
        ...result,
        indexKey,
    };
};

/**
 * Compute the estimated time remaining of indexing
 */
export const estimateIndexingProgress = (
    userID: string,
    esProgress: number,
    esTotal: number,
    endTime: number,
    esState: ESIndexingState
) => {
    let estimatedMinutes = 0;
    let currentProgressValue = 0;

    if (esTotal !== 0 && endTime !== esState.startTime && esProgress !== esState.esPrevProgress) {
        const remainingMessages = esTotal - esProgress;

        setOriginalEstimate(
            userID,
            Math.floor(
                (((endTime - esState.startTime) / (esProgress - esState.esPrevProgress)) * remainingMessages) / SECOND
            )
        );

        estimatedMinutes = Math.ceil(
            (((endTime - esState.startTime) / (esProgress - esState.esPrevProgress)) * remainingMessages) / MINUTE
        );
        currentProgressValue = Math.ceil((esProgress / esTotal) * 100);
    }

    return { estimatedMinutes, currentProgressValue };
};

/**
 * Compute the total indexing time based on locally cached timestamps
 */
const estimateIndexingDuration = (
    timestamps: {
        type: 'start' | 'step' | 'stop';
        time: number;
    }[]
) => {
    let indexTime = 0;
    let totalInterruptions = 0;

    for (let index = 0; index < timestamps.length - 1; index++) {
        const [timestamp1, timestamp2] = timestamps.slice(index, index + 2);

        if (timestamp1.type !== 'stop' && timestamp2.type !== 'start') {
            indexTime += timestamp2.time - timestamp1.time;
        } else if (timestamp1.type !== 'stop' || timestamp2.type !== 'stop') {
            totalInterruptions++;
        }
    }

    return { indexTime, totalInterruptions };
};

/**
 * Send metrics about the indexing process
 */
export const sendIndexingMetrics = async (api: Api, userID: string) => {
    addESTimestamp(userID, 'stop');
    const progressBlob = getES.Progress(userID);
    if (!progressBlob) {
        return;
    }

    const { totalMessages: numMessagesIndexed, isRefreshed, numPauses, timestamps, originalEstimate } = progressBlob;
    const { indexTime, totalInterruptions } = estimateIndexingDuration(timestamps);

    return sendESMetrics(api, 'index', {
        numInterruptions: totalInterruptions - numPauses,
        indexSize: getES.Size(userID),
        originalEstimate,
        indexTime,
        numMessagesIndexed,
        isRefreshed,
        numPauses,
    });
};
