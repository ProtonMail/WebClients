import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { Api } from '@proton/shared/lib/interfaces';
import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/storage';
import runInQueue from '@proton/shared/lib/helpers/runInQueue';
import { MINUTE } from '@proton/shared/lib/constants';
import { openDB, IDBPDatabase, deleteDB } from 'idb';
import { decryptMessage as pmcryptoDecryptMessage, getMessage as pmcryptoGetMessage, encryptMessage } from 'pmcrypto';
import { decryptMessage } from '../message/messageDecrypt';
import { GetMessageKeys } from '../../hooks/message/useGetMessageKeys';
import { locateBlockquote } from '../message/messageBlockquote';
import {
    CachedMessage,
    EncryptedSearchDB,
    ESBaseMessage,
    ESIndexingState,
    GetUserKeys,
    MessageForSearch,
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
import { refreshOpenpgp, updateSizeIDB } from './esUtils';
import { queryEvents, queryMessage, queryMessagesCount, queryMessagesMetadata } from './esAPI';
import { toText } from '../parserHtml';
import { sizeOfCachedMessage } from './esCache';

/**
 * Retrieve and decrypt the index key from localStorage. Return undefined if something goes wrong.
 */
export const getIndexKey = async (getUserKeys: GetUserKeys, userID: string) => {
    const encryptedKey = getItem(`ES:${userID}:Key`);

    if (!encryptedKey) {
        return;
    }

    const userKeysList = await getUserKeys();
    const primaryUserKey = userKeysList[0];
    const decryptionResult = await pmcryptoDecryptMessage({
        message: await pmcryptoGetMessage(encryptedKey),
        publicKeys: [primaryUserKey.publicKey],
        privateKeys: [primaryUserKey.privateKey],
    }).catch(() => undefined);

    if (!decryptionResult) {
        return;
    }

    const { data: decryptedKey } = decryptionResult;

    const importedKey = await crypto.subtle
        .importKey('jwk', JSON.parse(decryptedKey), { name: AesKeyGenParams.name }, false, KeyUsages)
        .catch(() => undefined);

    if ((importedKey as CryptoKey).algorithm) {
        return importedKey;
    }
};

/**
 * Remove quoted text and HTML tags from body
 */
export const cleanText = (text: string, removeQuote: boolean) => {
    const domParser = new DOMParser();

    const { body } = domParser.parseFromString(text, 'text/html');
    let removeStyle = true;
    while (removeStyle) {
        const styleElements = body.getElementsByTagName('style');
        const styleElement = styleElements.item(0);
        if (styleElement) {
            styleElement.outerHTML = '';
        }
        removeStyle = styleElements.length !== 0;
    }

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
export const prepareMessageMetadata = (message: Message | MessageForSearch) => {
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
export const encryptToDB = async (messageToCache: CachedMessage, indexKey: CryptoKey): Promise<StoredCiphertext> => {
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
export const isMessageForwarded = (subject: string) => {
    return localisedForwardFlags.some((fwFlag) => subject.slice(0, fwFlag.length).toLocaleLowerCase() === fwFlag);
};

/**
 * Fetches a message and return a CachedMessage
 */
export const fetchMessage = async (
    messageID: string,
    api: Api,
    getMessageKeys: GetMessageKeys,
    signal?: AbortSignal,
    messageMetadata?: Message
): Promise<CachedMessage | undefined> => {
    const message = await queryMessage(api, messageID, signal);
    if (!message) {
        // If a permanent error happened and metadata was given, the returned
        // CachedMessage is as if decryption failed
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
    } catch (error) {
        // leave them undefined
    }

    // Quotes are removed for all sent messages, and all other messages apart from forwarded ones
    const removeQuote = message.LabelIDs.includes('2') || !isMessageForwarded(message.Subject);

    const cachedMessage: CachedMessage = {
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
    recordLocalProgress: (localProgress: number) => void
) => {
    let batchSize = 0;
    let counter = 1;

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
            message
        ))!;

        recordLocalProgress(counter++);
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
        abortIndexingRef.current.signal
    );

    let Messages: Message[];
    if (resultMetadata) {
        ({ Messages } = resultMetadata);
    } else {
        if (inputLastMessage) {
            setItem(`ES:${userID}:Recover`, JSON.stringify(inputLastMessage));
        }
        return false;
    }

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
            recordLocalProgress
        ).catch((error) => {
            if (error.name === 'QuotaExceededError') {
                const quotaRecoveryPoint: RecoveryPoint = { ID: '', Time: -1 };
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

        if (recoveryPoint.ID === '' && recoveryPoint.Time === -1) {
            // If the quota has been reached, indexing is considered to be successful. Since
            // messages are fetched in chronological order, IndexedDB is guaranteed to contain
            // the most recent messages only
            return true;
        }

        setItem(`ES:${userID}:Recover`, JSON.stringify(recoveryPoint));
        updateSizeIDB(userID, batchSize);
        progress += Messages.length;

        resultMetadata = await queryMessagesMetadata(
            api,
            {
                EndID: recoveryPoint.ID,
                End: recoveryPoint.Time,
            },
            abortIndexingRef.current.signal
        );

        if (!resultMetadata) {
            return false;
        }

        Messages = resultMetadata.Messages;

        if (batchCount++ >= OPENPGP_REFRESH_CUTOFF) {
            await refreshOpenpgp();
            batchCount = 0;
        }
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
    const recoverBlob = getItem(`ES:${userID}:Recover`);

    let recoveryPoint: RecoveryPoint | undefined;
    if (recoverBlob) {
        recoveryPoint = JSON.parse(recoverBlob);
    }

    const esDB = await openDB<EncryptedSearchDB>(`ES:${userID}:DB`);

    // Start fetching messages from the recovery point saved in local storage
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

    if (success) {
        removeItem(`ES:${userID}:Recover`);
    }

    esDB.close();

    return success;
};

/**
 * Execute the initial steps of a new indexing, i.e. generating an index key and the DB itself
 */
export const initialiseDB = async (userID: string, getUserKeys: GetUserKeys, api: Api) => {
    const result: { notSupported: boolean; indexKey: CryptoKey | undefined } = {
        notSupported: false,
        indexKey: undefined,
    };

    // Remove IndexedDB in case there is a corrupt leftover
    try {
        await deleteDB(`ES:${userID}:DB`).catch(() => undefined);
    } catch (error) {
        return result;
    }

    // The number of messages before indexing is the one to aim to for showing progress, as
    // new messages will be synced only after indexing has completed. The first message is set
    // as first recovery point
    const initialiser = await queryMessagesCount(api);
    if (!initialiser) {
        return result;
    }

    if (initialiser.Total !== 0) {
        // +1 is added so that firstMessage will be included in the very first batch of messages
        const firstRecoveryPoint: RecoveryPoint = {
            ID: initialiser.firstMessage.ID,
            Time: initialiser.firstMessage.Time + 1,
        };
        setItem(`ES:${userID}:Recover`, JSON.stringify(firstRecoveryPoint));
    }

    // Save the event before starting building IndexedDB
    const previousEvent = await queryEvents(api);
    if (previousEvent && previousEvent.EventID) {
        setItem(`ES:${userID}:BuildProgress`, JSON.stringify({ totalMessages: initialiser.Total }));
        setItem(`ES:${userID}:Event`, previousEvent.EventID);
    } else {
        removeItem(`ES:${userID}:Recover`);
        return result;
    }

    // Set up DB
    let esDB;
    try {
        esDB = await openDB<EncryptedSearchDB>(`ES:${userID}:DB`, 1, {
            upgrade(esDB) {
                esDB.createObjectStore('messages', { keyPath: 'ID' }).createIndex('byTime', ['Time', 'Order'], {
                    unique: true,
                });
            },
        });
    } catch (error) {
        removeItem(`ES:${userID}:Recover`);
        removeItem(`ES:${userID}:Event`);
        removeItem(`ES:${userID}:BuildProgress`);
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
        const userKeysList = await getUserKeys();
        const primaryUserKey = userKeysList[0];
        const keyToEncrypt = await crypto.subtle.exportKey('jwk', indexKey);
        const { data: encryptedKey } = await encryptMessage({
            data: JSON.stringify(keyToEncrypt),
            publicKeys: [primaryUserKey.publicKey],
            privateKeys: [primaryUserKey.privateKey],
        });
        setItem(`ES:${userID}:Key`, encryptedKey);
    } catch (error) {
        removeItem(`ES:${userID}:Recover`);
        removeItem(`ES:${userID}:Event`);
        removeItem(`ES:${userID}:BuildProgress`);
        return result;
    }

    setItem(`ES:${userID}:SizeIDB`, '0');

    return {
        ...result,
        indexKey,
    };
};

/**
 * Compute the estimated time remaining of indexing
 */
export const estimateIndexingTime = (
    esProgress: number,
    esTotal: number,
    endTime: number,
    esState: ESIndexingState
) => {
    let estimatedMinutes = 0;
    let currentProgressValue = 0;

    if (esTotal !== 0 && endTime !== esState.startTime && esProgress !== esState.esPrevProgress) {
        const remainingMessages = esTotal - esProgress;

        estimatedMinutes = Math.ceil(
            (((endTime - esState.startTime) / (esProgress - esState.esPrevProgress)) * remainingMessages) / MINUTE
        );
        currentProgressValue = Math.ceil((esProgress / esTotal) * 100);
    }

    return { estimatedMinutes, currentProgressValue };
};
