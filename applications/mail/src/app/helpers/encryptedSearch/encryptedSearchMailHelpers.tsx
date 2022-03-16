import { Location } from 'history';
import { queryMessageMetadata } from '@proton/shared/lib/api/messages';
import {
    AesGcmCiphertext,
    ESEvent,
    ESHelpers,
    ES_MAX_PARALLEL_ITEMS,
    getES,
    apiHelper,
    esSentryReport,
    indexKeyExists,
    testKeywords,
    openESDB,
} from '@proton/encrypted-search';
import { Api, LabelCount, Recipient, UserModel } from '@proton/shared/lib/interfaces';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { getRecipients } from '@proton/shared/lib/mail/messages';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { EVENT_ERRORS } from '@proton/shared/lib/errors';
import { Feature, WelcomeFlagsState } from '@proton/components';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import { isPaid } from '@proton/shared/lib/user/helpers';
import { removeDiacritics } from '@proton/shared/lib/helpers/string';
import { GetMessageKeys } from '../../hooks/message/useGetMessageKeys';
import { ESItemChangesMail, ESMessage, NormalisedSearchParams, StoredCiphertext } from '../../models/encryptedSearch';
import { Event } from '../../models/event';
import { queryEvents } from './esAPI';
import { fetchMessage } from './esBuild';
import { normaliseSearchParams, shouldOnlySortResults, testMetadata } from './esSearch';
import { getTotalMessages, parseSearchParams as parseSearchParamsMail, resetSort } from './esUtils';
import { convertEventType } from './esSync';
import { LABEL_IDS_TO_HUMAN } from '../../constants';
import { getParamsFromPathname } from '../mailboxUrl';

interface Props {
    getMessageKeys: GetMessageKeys;
    getMessageCounts: () => Promise<LabelCount[]>;
    api: Api;
    user: UserModel;
    welcomeFlags: WelcomeFlagsState;
    getESFeature: <V = any>() => Promise<Feature<V>>;
    updateSpotlightES: <V = any>(value: V) => Promise<Feature<V>>;
}

export const getTimePoint = (item: ESMessage | StoredCiphertext) => [item.Time, item.Order] as [number, number];
export const getItemID = (item: Message | StoredCiphertext | ESMessage) => item.ID;

export const getESHelpers = ({
    getMessageKeys,
    getMessageCounts,
    api,
    user,
    welcomeFlags,
    getESFeature,
    updateSpotlightES,
}: Props): ESHelpers<Message, ESMessage, NormalisedSearchParams, ESItemChangesMail, StoredCiphertext> => {
    const { ID: userID } = user;

    const fetchESItem = (itemID: string, itemMetadata?: Message, abortSignal?: AbortSignal) =>
        fetchMessage(itemID, api, getMessageKeys, abortSignal, itemMetadata);

    const prepareCiphertext = (itemToStore: ESMessage, aesGcmCiphertext: AesGcmCiphertext) => {
        const { ID, Time, Order, LabelIDs } = itemToStore;
        return {
            ID,
            Time,
            Order,
            LabelIDs,
            aesGcmCiphertext,
        };
    };

    const queryItemsMetadata = async (storedItem: StoredCiphertext | undefined, signal: AbortSignal) => {
        const result = await apiHelper<{ Total: number; Messages: Message[] }>(
            api,
            signal,
            queryMessageMetadata({
                Limit: ES_MAX_PARALLEL_ITEMS,
                Location: '5',
                Sort: 'Time',
                Desc: 1,
                EndID: storedItem?.ID,
                End: storedItem?.Time,
            } as any),
            'queryMessageMetadata',
            userID
        );

        if (!result) {
            return;
        }

        const { Messages } = result;

        // Temporary fix for mailboxes with messages whose Time
        // is corrupted on DB. Upon DB intervention this can be
        // removed.
        if (storedItem && Messages.length === 1 && Messages[0].ID === storedItem.ID) {
            const esDB = await openESDB(userID);
            const storedCiphertext = await esDB.get('messages', storedItem.ID);
            esDB.close();
            if (storedCiphertext) {
                return [];
            }
        }

        return Messages;
    };

    const preFilter = (storedCiphertext: StoredCiphertext, esSearchParams: NormalisedSearchParams) =>
        storedCiphertext.LabelIDs.includes(esSearchParams.labelID);

    const applySearch = (esSearchParams: NormalisedSearchParams, itemToSearch: ESMessage) => {
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

        const { normalisedKeywords } = esSearchParams;
        if (!normalisedKeywords) {
            return true;
        }

        const { Subject, decryptedBody, decryptedSubject } = itemToSearch;
        const subject = decryptedSubject || Subject;
        const stringsToSearch = [subject, ...recipients, ...sender, decryptedBody || ''].map((string) =>
            removeDiacritics(string.toLocaleLowerCase())
        );

        return testKeywords(normalisedKeywords, stringsToSearch);
    };

    const checkIsReverse = (esSearchParams: NormalisedSearchParams) => esSearchParams.sort.desc;

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

    const getDecryptionErrorParams = (): NormalisedSearchParams => {
        return {
            ...normaliseSearchParams({}, '5'),
            decryptionError: true,
        };
    };

    const getKeywords = (esSearchParams: NormalisedSearchParams) => esSearchParams.normalisedKeywords;

    const getSearchInterval = (esSearchParams?: NormalisedSearchParams) => ({
        begin: esSearchParams?.begin,
        end: esSearchParams?.end,
    });

    const getLabelID = (location: Location) => {
        const { params } = getParamsFromPathname(location.pathname);
        const { labelID: humanLabelID } = params;

        let labelID = '';
        let label: keyof typeof LABEL_IDS_TO_HUMAN;
        for (label in LABEL_IDS_TO_HUMAN) {
            if (humanLabelID === (LABEL_IDS_TO_HUMAN[label] as any)) {
                labelID = label;
            }
        }

        if (labelID === '') {
            labelID = humanLabelID;
        }

        return labelID;
    };

    const parseSearchParams = (location: Location) => {
        const { isSearch, searchParameters, filterParameter, sortParameter } = parseSearchParamsMail(location);
        return {
            isSearch,
            esSearchParams: normaliseSearchParams(
                searchParameters,
                getLabelID(location),
                filterParameter,
                sortParameter
            ),
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
            const esFeature = await getESFeature();
            if (
                welcomeFlags.isWelcomeFlow &&
                !isMobile() &&
                !!esFeature.Value &&
                !indexKeyExists(userID) &&
                isPaid(user)
            ) {
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
        parseSearchParams,
        resetSort,
        getPreviousEventID,
        getEventFromLS,
        indexNewUser,
    };
};
