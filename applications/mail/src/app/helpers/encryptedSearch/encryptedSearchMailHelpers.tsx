import { History } from 'history';

import {
    ESCache,
    ESEvent,
    ESHelpers,
    ESItemInfo,
    ES_MAX_METADATA_BATCH,
    ES_MAX_PARALLEL_ITEMS,
    EventsObject,
    apiHelper,
    checkVersionedESDB,
    esSentryReport,
    readLastEvent,
    readMetadataRecoveryPoint,
    setMetadataRecoveryPoint,
    testKeywords,
} from '@proton/encrypted-search';
import { queryMessageMetadata } from '@proton/shared/lib/api/messages';
import { EVENT_ERRORS } from '@proton/shared/lib/errors';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { Api, LabelCount, Recipient, UserModel } from '@proton/shared/lib/interfaces';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { getRecipients } from '@proton/shared/lib/mail/messages';
import isTruthy from '@proton/utils/isTruthy';

import { MAIL_EVENTLOOP_NAME } from '../../constants';
import { GetMessageKeys } from '../../hooks/message/useGetMessageKeys';
import {
    ESBaseMessage,
    ESMessage,
    ESMessageContent,
    MetadataRecoveryPoint,
    NormalizedSearchParams,
} from '../../models/encryptedSearch';
import { Event } from '../../models/event';
import { queryEvents } from './esAPI';
import { fetchMessage, getBaseMessage } from './esBuild';
import { shouldOnlySortResults, testMetadata } from './esSearch';
import { convertEventType, getTotal } from './esSync';
import { parseSearchParams as parseSearchParamsMail, resetSort } from './esUtils';

interface Props {
    getMessageKeys: GetMessageKeys;
    getMessageCounts: () => Promise<LabelCount[]>;
    api: Api;
    user: UserModel;
    history: History;
}

export const getItemInfo = (item: ESBaseMessage | ESMessage): ESItemInfo => ({
    ID: item.ID,
    timepoint: [item.Time, item.Order],
});

export const getESHelpers = ({
    getMessageKeys,
    getMessageCounts,
    api,
    user,
    history,
}: Props): ESHelpers<ESBaseMessage, NormalizedSearchParams, ESMessageContent> => {
    const { ID: userID } = user;

    const fetchESItem = (
        itemID: string,
        abortSignal?: AbortSignal,
        esCacheRef?: React.MutableRefObject<ESCache<ESBaseMessage, unknown>>
    ) => fetchMessage(itemID, api, getMessageKeys, abortSignal, esCacheRef);

    // We need to keep the recovery point for metadata indexing in memory
    // for cases where IDB couldn't be instantiated but we still want to
    // index content
    let metadataRecoveryPoint: MetadataRecoveryPoint = {};
    const queryItemsMetadata = async (signal: AbortSignal) => {
        const messagesPromises: Promise<ESBaseMessage[] | undefined>[] = [];
        const Messages: ESBaseMessage[] = [];

        let recoveryPoint: MetadataRecoveryPoint | undefined = metadataRecoveryPoint;
        // Note that indexing, and therefore an instance of this function,
        // can exist even without an IDB, because we can index in memory only.
        // Therefore, we have to check if an IDB exists before querying it
        if (await checkVersionedESDB(userID)) {
            recoveryPoint = await readMetadataRecoveryPoint(userID);
        }

        const total = await getTotal(getMessageCounts)();
        const numPages = Math.ceil(total / ES_MAX_PARALLEL_ITEMS);

        let Page = 0;
        while (Page < ES_MAX_METADATA_BATCH && Page < numPages) {
            messagesPromises[Page] = apiHelper<{ Messages: Message[] }>(
                api,
                signal,
                queryMessageMetadata({
                    PageSize: ES_MAX_PARALLEL_ITEMS,
                    Location: '5',
                    Sort: 'Time',
                    Desc: 1,
                    Page,
                    End: recoveryPoint?.End,
                    EndID: recoveryPoint?.EndID,
                } as any),
                'queryMessageMetadata'
            ).then((result) => {
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
            setRecoveryPoint: async () => {
                metadataRecoveryPoint = newRecoveryPoint;
                return setMetadataRecoveryPoint(userID, newRecoveryPoint);
            },
        };
    };

    const searchContent = (esSearchParams: NormalizedSearchParams, itemToSearch: ESMessageContent) => {
        const { normalizedKeywords } = esSearchParams;
        if (!normalizedKeywords) {
            return false;
        }

        const { decryptedBody, decryptedSubject } = itemToSearch;

        return testKeywords(normalizedKeywords, [decryptedSubject || '', decryptedBody || '']);
    };

    const checkIsReverse = (esSearchParams: NormalizedSearchParams) => esSearchParams.sort.desc;

    const getKeywords = (esSearchParams: NormalizedSearchParams) => esSearchParams.normalizedKeywords;

    const getSearchParams = () => {
        const { isSearch, esSearchParams } = parseSearchParamsMail(history.location);
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
        let eventsToStore: EventsObject = {};
        eventsToStore[MAIL_EVENTLOOP_NAME] = event.EventID;
        return eventsToStore;
    };

    const getEventFromIDB = async (): Promise<{
        newEvents: ESEvent<ESBaseMessage>[];
        shouldRefresh: boolean;
        eventsToStore: EventsObject;
    }> => {
        const storedEventID = await readLastEvent(userID, MAIL_EVENTLOOP_NAME);
        if (!storedEventID) {
            throw new Error('Event ID from IDB not found');
        }

        const initialEvent = await queryEvents(api, storedEventID);

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

        let eventsToStore: EventsObject = {};
        eventsToStore[MAIL_EVENTLOOP_NAME] = EventID;

        const esEvents: ESEvent<ESBaseMessage>[] = newEvents.map((event) => convertEventType(event)).filter(isTruthy);

        return {
            newEvents: esEvents,
            shouldRefresh: esEvents.some((event) => {
                return hasBit(event.Refresh, EVENT_ERRORS.MAIL);
            }),
            eventsToStore,
        };
    };

    const searchMetadata = (
        esSearchParams: NormalizedSearchParams,
        metadata: ESBaseMessage,
        filterOnly: boolean = false
    ) => {
        const { Sender, Subject } = metadata;

        const transformRecipients = (recipients: Recipient[]) => [
            ...recipients.map((recipient) => recipient.Address.toLocaleLowerCase()),
            ...recipients.map((recipient) => recipient.Name.toLocaleLowerCase()),
        ];

        const recipients = transformRecipients(getRecipients(metadata));
        const sender = transformRecipients([Sender]);

        const metadataFilter = testMetadata(esSearchParams, metadata, recipients, sender);
        let keywordTest = true;
        if (!!esSearchParams.normalizedKeywords && !filterOnly) {
            keywordTest = testKeywords(esSearchParams.normalizedKeywords, [Subject, ...recipients, ...sender]);
        }

        return metadataFilter && keywordTest;
    };

    return {
        getItemInfo,
        fetchESItem,
        queryItemsMetadata,
        searchContent,
        checkIsReverse,
        shouldOnlySortResults,
        getTotalItems: getTotal(getMessageCounts),
        getKeywords,
        getSearchParams,
        resetSort: () => resetSort(history),
        getPreviousEventID,
        getEventFromIDB,
        searchMetadata,
    };
};
