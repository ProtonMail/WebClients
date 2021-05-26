import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { Api } from 'proton-shared/lib/interfaces';
import { getItem, removeItem, setItem } from 'proton-shared/lib/helpers/storage';
import { destroyOpenPGP, loadOpenPGP } from 'proton-shared/lib/openpgp';
import { wait } from 'proton-shared/lib/helpers/promise';
import { openDB, IDBPDatabase, deleteDB } from 'idb';
import { decryptMessage as pmcryptoDecryptMessage, getMessage as pmcryptoGetMessage, encryptMessage } from 'pmcrypto';
import runInQueue from 'proton-shared/lib/helpers/runInQueue';
import { decryptMessage } from '../message/messageDecrypt';
import { GetMessageKeys } from '../../hooks/message/useGetMessageKeys';
import { locateBlockquote } from '../message/messageBlockquote';
import { CLASSNAME_SIGNATURE_CONTAINER } from '../message/messageSignature';
import {
    CachedMessage,
    EncryptedSearchDB,
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
import { queryEvents, queryMessage, queryMessagesCount, queryMessagesMetadata } from './esAPI';

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
    const styleElements = body.getElementsByTagName('style');
    for (let index = 0; index < styleElements.length; index++) {
        styleElements[index].outerHTML = '';
    }
    const userSignatures = body.getElementsByClassName(CLASSNAME_SIGNATURE_CONTAINER);
    for (let index = 0; index < userSignatures.length; index++) {
        userSignatures[index].outerHTML = '';
    }

    let content = body.innerHTML;
    if (removeQuote) {
        const [noQuoteContent] = locateBlockquote(body);
        content = noQuoteContent;
    }
    const { body: newBody } = domParser.parseFromString(content, 'text/html');

    return newBody.innerText
        .replace(/\s+/gi, ' ')
        .split(' ')
        .filter((s) => s)
        .join(' ')
        .toLocaleLowerCase();
};

/**
 * Turns a Message into a MessageForSearch
 */
export const prepareMessageMetadata = (message: Message) => {
    const messageForSearch: MessageForSearch = {
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
export const encryptToDB = async (messageToCache: CachedMessage, indexKey: CryptoKey) => {
    const messageToEncrypt = JSON.stringify(messageToCache);
    const textEncoder = new TextEncoder();

    try {
        const iv = new Uint8Array(12);
        crypto.getRandomValues(iv);

        const encryptedMessage = await crypto.subtle.encrypt(
            { iv, name: AesKeyGenParams.name },
            indexKey,
            textEncoder.encode(messageToEncrypt)
        );

        const { ID, Time, Order, LabelIDs } = messageToCache;
        const storedCiphertext: StoredCiphertext = {
            ID,
            Time,
            Order,
            LabelIDs,
            aesGcmCiphertext: {
                ciphertext: encryptedMessage,
                iv,
            },
        };

        return storedCiphertext;
    } catch (error) {
        // return undefined
    }
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
    signal?: AbortSignal
) => {
    const message = await queryMessage(api, messageID, signal);
    if (!message) {
        return;
    }

    let decryptedSubject: string | undefined;
    let decryptedBody: string | undefined;
    let decryptionError = true;
    try {
        const keys = await getMessageKeys(message);
        const decryptionResult = await decryptMessage(message, keys.privateKeys, undefined);
        if (!decryptionResult.errors) {
            decryptedSubject = decryptionResult.decryptedSubject;
            decryptedBody = decryptionResult.decryptedBody;
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
    abortControllerRef: React.MutableRefObject<AbortController>
) => {
    const messagesToStore: StoredCiphertext[] = [];

    const esIteratee = async (message: Message) => {
        if (message.ExpirationTime) {
            return;
        }

        const messageToCache = await fetchMessage(message.ID, api, getMessageKeys, abortControllerRef.current.signal);

        if (!messageToCache) {
            throw new Error('Plaintext to store is undefined');
        }

        const newCiphertextToStore = await encryptToDB(messageToCache, indexKey);

        if (!newCiphertextToStore) {
            throw new Error('Ciphertext to store is undefined');
        }

        messagesToStore.push(newCiphertextToStore);
    };

    await runInQueue<void>(
        messagesMetadata.map((message) => () => esIteratee(message)),
        ES_MAX_CONCURRENT
    );

    const recoveryPoint: RecoveryPoint = { ID: '', Time: Number.MAX_SAFE_INTEGER };
    let recoveryOrder = Number.MAX_SAFE_INTEGER;
    const tx = esDB.transaction('messages', 'readwrite');
    await Promise.all(
        messagesToStore.map(async (ciphertext) => {
            void tx.store.put(ciphertext);
            if (
                ciphertext.Time < recoveryPoint.Time ||
                (ciphertext.Time === recoveryPoint.Time && ciphertext.Order < recoveryOrder)
            ) {
                recoveryPoint.ID = ciphertext.ID;
                recoveryPoint.Time = ciphertext.Time;
                recoveryOrder = ciphertext.Order;
            }
        })
    );
    await tx.done;

    return recoveryPoint;
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
    abortControllerRef: React.MutableRefObject<AbortController>,
    inputLastMessage: RecoveryPoint | undefined,
    recordProgress: (progress: number) => void
) => {
    let resultMetadata = await queryMessagesMetadata(
        api,
        {
            EndID: inputLastMessage?.ID,
            End: inputLastMessage?.Time,
        },
        abortControllerRef.current.signal
    );

    let Messages: Message[];
    if (resultMetadata) {
        Messages = resultMetadata.Messages;
    } else {
        if (inputLastMessage) {
            setItem(`ES:${userID}:Recover`, JSON.stringify(inputLastMessage));
        }
        return false;
    }

    let batchCount = 0;
    while (Messages.length) {
        const recoveryPoint = await storeMessages(
            Messages,
            esDB,
            indexKey,
            api,
            getMessageKeys,
            abortControllerRef
        ).catch((error) => {
            if (error.name === 'QuotaExceededError') {
                const quotaRecoveryPoint: RecoveryPoint = { ID: '', Time: -1 };
                return quotaRecoveryPoint;
            }
        });

        if (!recoveryPoint) {
            return false;
        }
        if (recoveryPoint.ID === '' && recoveryPoint.Time === -1) {
            // If the quota has been reached, indexing is condisered to be successful. Since
            // messages are fetched in chronological order, IndexedDB is guaranteed to contain
            // the most recent messages only
            return true;
        }

        setItem(`ES:${userID}:Recover`, JSON.stringify(recoveryPoint));

        recordProgress(Messages.length);

        resultMetadata = await queryMessagesMetadata(
            api,
            {
                EndID: recoveryPoint.ID,
                End: recoveryPoint.Time,
            },
            abortControllerRef.current.signal
        );

        if (!resultMetadata) {
            return false;
        }

        Messages = resultMetadata.Messages;

        if (batchCount++ >= OPENPGP_REFRESH_CUTOFF) {
            const { openpgp } = window as any;
            // In case the workers are performing some operations, wait until they are done
            const openpgpWorkers = openpgp.getWorker();
            if (!openpgpWorkers) {
                continue;
            }
            while (openpgpWorkers.workers.some((worker: any) => worker.requests)) {
                await wait(1000);
            }
            await destroyOpenPGP();
            await loadOpenPGP();
            batchCount = 0;
        }
    }

    return true;
};

/**
 * Try to recover indexing if something went wrong
 */
export const buildDB = async (
    userID: string,
    indexKey: CryptoKey,
    getMessageKeys: GetMessageKeys,
    api: Api,
    abortControllerRef: React.MutableRefObject<AbortController>,
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
        abortControllerRef,
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
    if (!initialiser || initialiser.Total === 0) {
        return result;
    }
    // +1 is added so that firstMessage will be included in the very first batch of messages
    const firstRecoveryPoint: RecoveryPoint = {
        ID: initialiser.firstMessage.ID,
        Time: initialiser.firstMessage.Time + 1,
    };
    setItem(`ES:${userID}:Recover`, JSON.stringify(firstRecoveryPoint));

    // Save the event before starting building IndexedDB
    const previousEvent = await queryEvents(api);
    if (previousEvent) {
        setItem(
            `ES:${userID}:BuildEvent`,
            JSON.stringify({ event: previousEvent.EventID, totalMessages: initialiser.Total })
        );
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
        removeItem(`ES:${userID}:BuildEvent`);
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
        removeItem(`ES:${userID}:BuildEvent`);
        return result;
    }

    return {
        ...result,
        indexKey,
    };
};
