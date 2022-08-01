import { useHistory } from 'react-router-dom';

import { PrivateKeyReference } from '@proton/crypto';
import {
    ESEvent,
    ESHelpers,
    EventsObject,
    normalizeKeyword,
    readAllLastEvents,
    testKeywords,
} from '@proton/encrypted-search';
import { queryEvents, queryLatestEvents } from '@proton/shared/lib/api/drive/share';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { Api, User } from '@proton/shared/lib/interfaces';
import { DriveEventsResult } from '@proton/shared/lib/interfaces/drive/events';

import { driveEventsResultToDriveEvents } from '../_api';
import { createLinkGenerator } from './indexing/createLinkGenerator';
import convertDriveEventsToSearchEvents from './indexing/processEvent';
import { FetchShareMap } from './indexing/useFetchShareMap';
import { ESDriveSearchParams, ESLink } from './types';
import { extractSearchParameters } from './utils';

interface Props {
    api: Api;
    user: User;
    shareId: Promise<string>;
    fetchShareMap: FetchShareMap;
    getSharePrivateKey: (abortSignal: AbortSignal, shareId: string) => Promise<PrivateKeyReference>;
    getLinkPrivateKey: (abortSignal: AbortSignal, shareId: string, linkId: string) => Promise<PrivateKeyReference>;
}

let linkMapGenerator: AsyncGenerator<ESLink[]>;

export const useESHelpers = ({
    api,
    user,
    shareId,
    fetchShareMap,
    getSharePrivateKey,
    getLinkPrivateKey,
}: Props): ESHelpers<ESLink, ESDriveSearchParams> => {
    const history = useHistory();

    const userID = user.ID;
    const queryItemsMetadata = async (signal: AbortSignal) => {
        if (!linkMapGenerator) {
            const rootKey = await getSharePrivateKey(signal, await shareId);
            linkMapGenerator = createLinkGenerator(await shareId, rootKey, { fetchShareMap });
        }

        const items = await linkMapGenerator.next();
        return { resultMetadata: items.value || [] };
    };

    const getItemInfo = (item: ESLink): { ID: string; timepoint: [number, number] } => ({
        ID: item.id,
        timepoint: [item.createTime, item.order],
    });

    const searchMetadata = (esSearchParams: ESDriveSearchParams, itemToSearch: ESLink) => {
        const { normalisedKeywords } = esSearchParams;
        if (!normalisedKeywords) {
            return false;
        }

        return testKeywords(normalisedKeywords, [itemToSearch.decryptedName]);
    };

    const getSearchParams = () => {
        const keyword = extractSearchParameters(history.location);
        return {
            isSearch: !!keyword,
            esSearchParams: keyword ? { normalisedKeywords: normalizeKeyword(keyword) } : undefined,
        };
    };

    const getPreviousEventID = async (): Promise<EventsObject> => {
        const latestEvent = await api<{ EventID: string }>(queryLatestEvents(await shareId));
        let eventsToStore: EventsObject = {};
        eventsToStore[await shareId] = latestEvent.EventID;
        return eventsToStore;
    };

    const getEventFromIDB = async (): Promise<{
        newEvents: ESEvent<ESLink>[];
        shouldRefresh: boolean;
        eventsToStore: EventsObject;
    }> => {
        const storedEventIDs = await readAllLastEvents(userID);
        if (!storedEventIDs) {
            throw new Error('No event stored');
        }

        const initialShareEvent = await api<DriveEventsResult>(
            queryEvents(await shareId, storedEventIDs[await shareId])
        );

        let keepSyncing = Boolean(initialShareEvent.More);
        let index = 0;

        const newEvents: DriveEventsResult[] = [initialShareEvent];
        while (keepSyncing) {
            const lastEventId = newEvents[index++].EventID;

            const newEventToCheck = await api<DriveEventsResult>(queryEvents(await shareId, lastEventId));
            if (!newEventToCheck || !newEventToCheck.EventID) {
                throw new Error('No event found');
            }

            keepSyncing = Boolean(newEventToCheck.More);
            if (newEventToCheck.EventID !== lastEventId) {
                newEvents.push(newEventToCheck);
            }
        }

        const shouldRefresh = newEvents.some((event) => {
            return hasBit(event.Refresh, 1);
        });

        let eventsToStore: EventsObject = {};
        eventsToStore[await shareId] = newEvents[newEvents.length - 1].EventID;

        return {
            newEvents: await Promise.all(
                newEvents
                    .map(driveEventsResultToDriveEvents)
                    .map(async (events) => convertDriveEventsToSearchEvents(await shareId, events, getLinkPrivateKey))
            ),
            shouldRefresh,
            eventsToStore,
        };
    };

    return {
        getItemInfo,
        queryItemsMetadata,
        searchMetadata,
        getTotalItems: (() => {
            let total: number;
            return async () => {
                if (!total) {
                    // The Total property counts all files and folders, including the root
                    // folder which is neither indexed nor shown to users. For ES purposes
                    // it should not be counted toward the total, therefore the -1
                    total = (await fetchShareMap({ shareId: await shareId })).Total - 1;
                }
                return total;
            };
        })(),
        getKeywords: (esSearchParams: ESDriveSearchParams) => esSearchParams.normalisedKeywords,
        getSearchParams,
        getPreviousEventID,
        getEventFromIDB,
    };
};
