import { History } from 'history';

import { Feature, WelcomeFlagsState } from '@proton/components';
import {
    ESEvent,
    ESHelpers,
    esSentryReport,
    esStorageHelpers,
    indexKeyExists,
    testKeywords,
} from '@proton/encrypted-search';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { EVENT_ERRORS } from '@proton/shared/lib/errors';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import { Api, LabelCount, Recipient, UserModel } from '@proton/shared/lib/interfaces';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { getRecipients } from '@proton/shared/lib/mail/messages';
import { isPaid } from '@proton/shared/lib/user/helpers';

import { GetMessageKeys } from '../../hooks/message/useGetMessageKeys';
import { ESItemChangesMail, ESMessage, NormalizedSearchParams, StoredCiphertext } from '../../models/encryptedSearch';
import { Event } from '../../models/event';
import { queryEvents, queryMessagesMetadata } from './esAPI';
import { fetchMessage, prepareCiphertext } from './esBuild';
import { normaliseSearchParams, shouldOnlySortResults, testMetadata } from './esSearch';
import { convertEventType } from './esSync';
import { getTotalMessages, parseSearchParams as parseSearchParamsMail, resetSort } from './esUtils';

interface Props {
    getMessageKeys: GetMessageKeys;
    getMessageCounts: () => Promise<LabelCount[]>;
    api: Api;
    user: UserModel;
    welcomeFlags: WelcomeFlagsState;
    updateSpotlightES: <V = any>(value: V) => Promise<Feature<V>>;
    history: History;
}

export const getTimePoint = (item: ESMessage | StoredCiphertext) => [item.Time, item.Order] as [number, number];
export const getItemID = (item: Message | StoredCiphertext | ESMessage) => item.ID;

export const getESHelpers = ({
    getMessageKeys,
    getMessageCounts,
    api,
    user,
    welcomeFlags,
    updateSpotlightES,
    history,
}: Props): ESHelpers<Message, ESMessage, NormalizedSearchParams, ESItemChangesMail, StoredCiphertext> => {
    const { ID: userID } = user;

    const fetchESItem = (itemID: string, abortSignal?: AbortSignal) =>
        fetchMessage(itemID, api, getMessageKeys, abortSignal);

    const queryItemsMetadata = async (storedItem: StoredCiphertext | undefined, signal: AbortSignal) => {
        const result = await queryMessagesMetadata(
            api,
            {
                EndID: storedItem?.ID,
                End: storedItem?.Time,
            },
            signal,
            userID
        );

        return result?.Messages;
    };

    const preFilter = (storedCiphertext: StoredCiphertext, esSearchParams: NormalizedSearchParams) =>
        storedCiphertext.LabelIDs.includes(esSearchParams.labelID);

    const applySearch = (esSearchParams: NormalizedSearchParams, itemToSearch: ESMessage) => {
        const { Sender } = itemToSearch;

        const transformRecipients = (recipients: Recipient[]) => [
            ...recipients.map((recipient) => recipient.Address.toLocaleLowerCase()),
            ...recipients.map((recipient) => recipient.Name.toLocaleLowerCase()),
        ];

        const recipients = transformRecipients(getRecipients(itemToSearch));
        const sender = transformRecipients([Sender]);

        if (!testMetadata(esSearchParams, itemToSearch, recipients, sender)) {
            return false;
        }

        const { normalizedKeywords } = esSearchParams;
        if (!normalizedKeywords) {
            return true;
        }

        const { Subject, decryptedBody, decryptedSubject } = itemToSearch;
        const subject = decryptedSubject || Subject;

        return testKeywords(normalizedKeywords, [subject, ...recipients, ...sender, decryptedBody || '']);
    };

    const checkIsReverse = (esSearchParams: NormalizedSearchParams) => esSearchParams.sort.desc;

    const getTotalItems = async () => {
        const messageCounts = await getMessageCounts();
        return getTotalMessages(messageCounts);
    };

    const updateESItem = (esItemMetadata: ESItemChangesMail, oldItem: ESMessage): ESMessage => {
        const { LabelIDsRemoved, LabelIDsAdded, ...otherChanges } = esItemMetadata;
        let { LabelIDs } = oldItem;
        if (LabelIDsRemoved) {
            LabelIDs = LabelIDs.filter((labelID) => !LabelIDsRemoved.includes(labelID));
        }
        if (LabelIDsAdded) {
            LabelIDs = LabelIDs.concat(LabelIDsAdded);
        }

        return {
            ...oldItem,
            ...otherChanges,
            LabelIDs,
        };
    };

    const getDecryptionErrorParams = (): NormalizedSearchParams => {
        return {
            ...normaliseSearchParams({}, MAILBOX_LABEL_IDS.ALL_MAIL),
            decryptionError: true,
        };
    };

    const getKeywords = (esSearchParams: NormalizedSearchParams) => esSearchParams.normalizedKeywords;

    const getSearchInterval = (esSearchParams?: NormalizedSearchParams) => ({
        begin: esSearchParams?.begin,
        end: esSearchParams?.end,
    });

    const getSearchParams = () => {
        const { isSearch, esSearchParams } = parseSearchParamsMail(history.location);
        return {
            isSearch,
            esSearchParams,
        };
    };

    const getPreviousEventID = async () => {
        const event = await queryEvents(api);
        if (!event || !event.EventID) {
            throw new Error('Last event not found');
        }
        return event.EventID;
    };

    const getEventFromLS = async (): Promise<{
        newEvents: ESEvent<ESItemChangesMail>[];
        shouldRefresh: boolean;
        eventToStore: string | undefined;
    }> => {
        const { getES } = esStorageHelpers();
        const storedEventID = getES.Event(userID);
        if (!storedEventID) {
            throw new Error('Event ID from local storage not found');
        }

        const initialEvent = await queryEvents(api, storedEventID);

        if (!initialEvent) {
            throw new Error('Event from local storage not found');
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
                esSentryReport('getEventFromLS: queryEvents', { error });
                return getEventFromLS();
            }
        }

        const shouldRefresh = newEvents.reduce((accumulator, event) => {
            return accumulator || hasBit(event.Refresh, EVENT_ERRORS.MAIL);
        }, false);

        return {
            newEvents: newEvents.map((event) => convertEventType(event)),
            shouldRefresh,
            eventToStore: newEvents[newEvents.length - 1].EventID,
        };
    };

    const indexNewUser = async () => {
        try {
            if (welcomeFlags.isWelcomeFlow && !isMobile() && !indexKeyExists(userID) && isPaid(user)) {
                // Start indexing for new users and prevent showing the spotlight on ES to them
                await updateSpotlightES(false);
                return true;
            }
        } catch (error) {
            console.log('ES effect error', error);
        }
        return false;
    };

    return {
        getItemID,
        fetchESItem,
        prepareCiphertext,
        queryItemsMetadata,
        preFilter,
        applySearch,
        checkIsReverse,
        shouldOnlySortResults,
        getTimePoint,
        getSearchInterval,
        getTotalItems,
        updateESItem,
        getDecryptionErrorParams,
        getKeywords,
        getSearchParams,
        resetSort: () => resetSort(history),
        getPreviousEventID,
        getEventFromLS,
        indexNewUser,
    };
};
