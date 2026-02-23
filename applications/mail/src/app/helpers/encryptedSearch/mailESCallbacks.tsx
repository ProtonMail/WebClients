import type { History } from 'history';

import type {
    CachedItem,
    ESCallbacks,
    ESEvent,
    ESItemInfo,
    ESStatusBooleans,
    ESTimepoint,
    EncryptedItemWithInfo,
    EventsObject,
    RecordProgress,
} from '@proton/encrypted-search/models';
import {
    apiHelper,
    buildContentDB,
    esSentryReport,
    serializeAndEncryptItem,
    testKeywords,
} from '@proton/encrypted-search';
import {
    ES_BACKGROUND_METADATA_BATCH,
    ES_MAX_METADATA_BATCH,
    ES_MAX_PARALLEL_ITEMS,
} from '@proton/encrypted-search/constants';
import {
    checkVersionedESDB,
    executeContentOperations,
    metadataIndexingProgress,
    readLastEvent,
    readMetadataItem,
    readNumContent,
} from '@proton/encrypted-search/esIDB';
import type { NormalizedSearchParams } from '@proton/encrypted-search/lib/models/mail';
import { queryMessageMetadata } from '@proton/shared/lib/api/messages';
import { MAILBOX_LABEL_IDS, MIME_TYPES } from '@proton/shared/lib/constants';
import { EVENT_ERRORS } from '@proton/shared/lib/errors';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import type { Api, LabelCount, UserModel } from '@proton/shared/lib/interfaces';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { getRecipients } from '@proton/shared/lib/mail/messages';
import isTruthy from '@proton/utils/isTruthy';

import { MAIL_EVENTLOOP_NAME } from '../../constants';
import type { GetMessageKeys } from '../../hooks/message/useGetMessageKeys';
import type { ESBaseMessage, ESMessage, ESMessageContent, MetadataRecoveryPoint } from '../../models/encryptedSearch';
import type { Event } from '../../models/event';
import { decryptMessage } from '../message/messageDecrypt';
import ESdeletedConversationIdsCache from './ESDeletedConversationsCache';
import { queryConversation, queryEvents, queryMessage } from './esAPI';
import { cleanText, externalIDExists, fetchMessage, getBaseMessage, getExternalID } from './esBuild';
import { shouldOnlySortResults, testMetadata, transformRecipients } from './esSearch';
import { convertEventType, findRecoveryPoint, getTotal } from './esSync';
import { parseSearchParams as parseSearchParamsMail, resetSort } from './esUtils';

interface Props {
    getMessageKeys: GetMessageKeys;
    getMessageCounts: () => Promise<LabelCount[]>;
    api: Api;
    user: UserModel;
    history: History;
    numAddresses: number;
    disabledCategoriesIDs: string[];
}

export const getItemInfo = (item: ESBaseMessage | ESMessage): ESItemInfo => ({
    ID: item.ID,
    timepoint: [item.Time, item.Order],
});

export const getESCallbacks = ({
    getMessageKeys,
    getMessageCounts,
    api,
    user,
    history,
    numAddresses,
    disabledCategoriesIDs,
}: Props): ESCallbacks<ESBaseMessage, NormalizedSearchParams, ESMessageContent> => {
    const { ID: userID } = user;

    const getSearchInterval = (esSearchParameters: NormalizedSearchParams) => ({
        begin: esSearchParameters.begin,
        end: esSearchParameters.end,
    });

    const fetchESItemContent = (itemID: string, abortSignal?: AbortSignal) =>
        fetchMessage(itemID, api, getMessageKeys, abortSignal);

    // We need to keep the recovery point for metadata indexing in memory
    // for cases where IDB couldn't be instantiated but we still want to
    // index content
    let metadataRecoveryPoint: MetadataRecoveryPoint | undefined;
    const queryItemsMetadata = async (
        signal: AbortSignal,
        isBackgroundIndexing?: boolean
    ): Promise<{
        resultMetadata?: ESBaseMessage[];
        setRecoveryPoint?: (setIDB?: boolean) => Promise<void>;
    }> => {
        const messagesPromises: Promise<ESBaseMessage[] | undefined>[] = [];
        const Messages: ESBaseMessage[] = [];
        const numPagesFetched = isBackgroundIndexing ? ES_BACKGROUND_METADATA_BATCH : ES_MAX_METADATA_BATCH;

        let recoveryPoint: MetadataRecoveryPoint | undefined = metadataRecoveryPoint;
        // Note that indexing, and therefore an instance of this function,
        // can exist even without an IDB, because we can index in memory only.
        // Therefore, we have to check if an IDB exists before querying it
        const esdbExists = await checkVersionedESDB(userID);
        if (!recoveryPoint && esdbExists) {
            recoveryPoint = await metadataIndexingProgress.readRecoveryPoint(userID);
        }

        const total = await getTotal(getMessageCounts)();
        const numPages = Math.ceil(total / ES_MAX_PARALLEL_ITEMS);

        let Page = 0;

        while (Page < numPagesFetched && Page < numPages) {
            messagesPromises[Page] = apiHelper<{ Messages: Message[] }>({
                api,
                signal,
                options: queryMessageMetadata({
                    PageSize: ES_MAX_PARALLEL_ITEMS,
                    Location: MAILBOX_LABEL_IDS.ALL_MAIL,
                    Sort: 'Time',
                    Desc: 1,
                    Page,
                    End: recoveryPoint?.End,
                    EndID: recoveryPoint?.EndID,
                }),
                callingContext: 'queryMessageMetadata',
            }).then((result) => {
                if (!result) {
                    return;
                }
                return result.Messages.map((message) => getBaseMessage(message));
            });
            Page++;
        }

        if (messagesPromises.length) {
            const awaitedMessages = await Promise.all(messagesPromises);
            // We only want to return messages metadata up until the first
            // undefined, which means a failed batch, to avoid leaving holes
            // in the indexe metadata
            for (const batch of awaitedMessages) {
                if (!batch) {
                    break;
                }
                Messages.push(...batch);
            }
        }

        if (signal.aborted) {
            return {};
        }

        // Fetching is over
        if (!Messages.length) {
            return { resultMetadata: [] };
        }

        const lastMessage = Messages[Messages.length - 1];
        const newRecoveryPoint = {
            End: lastMessage.Time,
            EndID: lastMessage.ID,
        };

        return {
            resultMetadata: Messages,
            setRecoveryPoint: esdbExists
                ? async (setIDB: boolean = true) => {
                      metadataRecoveryPoint = newRecoveryPoint;
                      if (setIDB) {
                          await metadataIndexingProgress.setRecoveryPoint(userID, newRecoveryPoint);
                      }
                  }
                : undefined,
        };
    };

    const checkIsReverse = (esSearchParams: NormalizedSearchParams) => esSearchParams.sort.desc;

    const getKeywords = (esSearchParams: NormalizedSearchParams) => esSearchParams.normalizedKeywords;

    const getSearchParams = () => {
        const { isSearch, esSearchParams } = parseSearchParamsMail(history.location, disabledCategoriesIDs);
        return {
            isSearch,
            esSearchParams,
        };
    };

    const getPreviousEventID = async (): Promise<EventsObject> => {
        const event = await queryEvents(api);
        if (!event || !event.EventID) {
            return {};
        }
        const eventsToStore: EventsObject = {};
        eventsToStore[MAIL_EVENTLOOP_NAME] = event.EventID;
        return eventsToStore;
    };

    const getEventFromIDB = async (
        previousEventsObject?: EventsObject
    ): Promise<{
        newEvents: ESEvent<ESBaseMessage>[];
        shouldRefresh: boolean;
        eventsToStore: EventsObject;
    }> => {
        let lastEventID: string;
        if (previousEventsObject) {
            lastEventID = previousEventsObject[MAIL_EVENTLOOP_NAME];
        } else {
            const storedEventID = await readLastEvent(userID, MAIL_EVENTLOOP_NAME);
            if (!storedEventID) {
                throw new Error('Event ID from IDB not found');
            }
            lastEventID = storedEventID;
        }

        const initialEvent = await queryEvents(api, lastEventID);

        if (!initialEvent) {
            throw new Error('Event fetch failed');
        }

        // We want to sync all items, potentially in multiple batches if the More flag
        // is set. Even it isn't, we still fetch a further batch and, if the event ID hasn't
        // changed, we can be sure nothing else has happened and the syncing process is considered
        // successful
        let keepSyncing = true;
        let index = 0;
        const newEvents: Event[] = [initialEvent];
        while (keepSyncing) {
            try {
                const nextEventToCheck = newEvents[index++];

                const newEventToCheck = await queryEvents(api, nextEventToCheck.EventID);
                if (!newEventToCheck || !newEventToCheck.EventID) {
                    throw new Error('No event found');
                }

                keepSyncing = nextEventToCheck.More === 1 || newEventToCheck.EventID !== nextEventToCheck.EventID;
                if (keepSyncing) {
                    newEvents.push(newEventToCheck);
                }
            } catch (error: any) {
                esSentryReport('getEventFromIDB: queryEvents', { error });
                return getEventFromIDB();
            }
        }

        const { EventID } = newEvents[newEvents.length - 1];
        if (!EventID) {
            throw new Error('Last event has no ID');
        }

        const eventsToStore: EventsObject = {};
        eventsToStore[MAIL_EVENTLOOP_NAME] = EventID;

        const esEvents: ESEvent<ESBaseMessage>[] = newEvents
            .map((event) => convertEventType(event, numAddresses))
            .filter(isTruthy);

        return {
            newEvents: esEvents,
            shouldRefresh: esEvents.some((event) => {
                return hasBit(event.Refresh, EVENT_ERRORS.MAIL);
            }),
            eventsToStore,
        };
    };

    const searchKeywords = (
        keywords: string[],
        itemToSearch: CachedItem<ESBaseMessage, ESMessageContent>,
        hasApostrophe: boolean
    ) => {
        const { metadata, content } = itemToSearch;

        const recipients = transformRecipients(getRecipients(metadata));
        const sender = transformRecipients([metadata.Sender]);

        const result = testKeywords(keywords, [metadata.Subject, ...recipients, ...sender], hasApostrophe);
        if (!content) {
            return result;
        }

        const { decryptedBody, decryptedSubject } = content;
        return result || testKeywords(keywords, [decryptedSubject || '', decryptedBody || ''], hasApostrophe);
    };

    const applyFilters = (esSearchParams: NormalizedSearchParams, metadata: ESBaseMessage) => {
        const { Sender } = metadata;
        const recipients = transformRecipients(getRecipients(metadata));
        const sender = transformRecipients([Sender]);
        return testMetadata(esSearchParams, metadata, recipients, sender);
    };

    // If a message is deleted, ideally we would like to re-index all messages that have its
    // ExternalID in their In-Reply-To header (for simplicity we only check those in the same
    // conversation). However, by the time the deletion event is processed by the client, the
    // deleted message no longer exists on the server therefore we have no way of knowing its
    // ExternalID, because we don't store this information in the index. Therefore, we re-index
    // the content of all messages newer than the deleted one and within the same conversation
    // whose In-Reply-To header exists but doesn't belong to the mailbox
    const onContentDeletion = async (ID: string, indexKey: CryptoKey) => {
        const metadata = await readMetadataItem<ESBaseMessage>(userID, ID, indexKey);

        if (!metadata || ESdeletedConversationIdsCache.hasElement(metadata.ConversationID)) {
            return;
        }

        ESdeletedConversationIdsCache.addElement(metadata.ConversationID);

        const { ConversationID, Time: deletedTime, Order: deletedOrder } = metadata;

        const messages = (await queryConversation(api, ConversationID)) || []; // We fallback to [] because the conversation may not exist anymore
        const messagesToAdd: EncryptedItemWithInfo[] = (
            await Promise.all(
                messages.map(async (message) => {
                    const { ID: messageID, Time, Order } = message;
                    if (Time < deletedTime || (Time === deletedTime && Order < deletedOrder)) {
                        return;
                    }

                    // When querying a conversation, one message is already populated with all fields,
                    // while all others have only metadata
                    let contentMessage: Message;
                    if (Object.hasOwn(message, 'ParsedHeaders')) {
                        contentMessage = message as Message;
                    } else {
                        const fullMessage = await queryMessage(api, messageID);
                        if (!fullMessage) {
                            throw new Error('Failed message fetching of item to reindex');
                        }
                        contentMessage = fullMessage;
                    }

                    const ExternalID = getExternalID(contentMessage);
                    if (typeof ExternalID === 'string') {
                        const shouldReindex = !(await externalIDExists(ExternalID, ConversationID, api));

                        if (shouldReindex) {
                            const keys = await getMessageKeys(contentMessage);
                            const decryptionResult = await decryptMessage(contentMessage, keys.decryptionKeys);

                            let decryptedSubject: string | undefined;
                            let decryptedBody: string | undefined;
                            let mimetype: MIME_TYPES | undefined;
                            if (!decryptionResult.errors) {
                                ({ decryptedSubject, decryptedBody, mimetype } = decryptionResult);
                            } else {
                                return;
                            }

                            const cleanDecryptedBody =
                                typeof decryptedBody === 'string'
                                    ? (mimetype || contentMessage.MIMEType) === MIME_TYPES.DEFAULT
                                        ? cleanText(decryptedBody, true)
                                        : decryptedBody
                                    : undefined;

                            const aesGcmCiphertext = await serializeAndEncryptItem(indexKey, {
                                decryptedBody: cleanDecryptedBody,
                                decryptedSubject,
                            });
                            const timepoint: ESTimepoint = [Time, Order];
                            return { ID: messageID, timepoint, aesGcmCiphertext };
                        }
                    }
                })
            )
        ).filter(isTruthy);

        if (messagesToAdd.length) {
            await executeContentOperations({ userID, itemsToRemove: [], itemsToAdd: messagesToAdd });
        }
    };

    /**
     * When an old key is activated, try to correct any previous decryption errors
     */
    const correctDecryptionErrors = async (
        userID: string,
        indexKey: CryptoKey,
        abortIndexingRef: React.MutableRefObject<AbortController>,
        esStatus: ESStatusBooleans,
        recordProgress: RecordProgress
    ) => {
        const recoveryPoint = await findRecoveryPoint(userID);
        if (!esStatus.contentIndexingDone || !recoveryPoint) {
            // There are no items for which decryption failed
            return 0;
        }

        const { timepoint, contentLen, metadataLen } = recoveryPoint;

        const total = metadataLen - contentLen;
        void recordProgress([0, total], 'content');

        const recordProgressLocal = (progress: number) => recordProgress(progress, 'content');

        await buildContentDB({
            userID,
            indexKey,
            abortIndexingRef,
            recordProgress: recordProgressLocal,
            fetchESItemContent,
            inputrecoveryPoint: timepoint,
            isInitialIndexing: false,
        });

        const count = (await readNumContent(userID)) || 0;
        return count - contentLen;
    };

    return {
        getItemInfo,
        fetchESItemContent,
        queryItemsMetadata,
        applyFilters,
        checkIsReverse,
        shouldOnlySortResults,
        getTotalItems: getTotal(getMessageCounts),
        getKeywords,
        getSearchParams,
        resetSort: () => resetSort(history),
        getPreviousEventID,
        getEventFromIDB,
        searchKeywords,
        getSearchInterval,
        onContentDeletion,
        correctDecryptionErrors,
    };
};
