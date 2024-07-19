import { useHistory } from 'react-router-dom';

import type { PrivateKeyReference } from '@proton/crypto';
import type { CachedItem, ESCallbacks, ESEvent, ESTimepoint, EventsObject } from '@proton/encrypted-search';
import { normalizeKeyword, readAllLastEvents, testKeywords } from '@proton/encrypted-search';
import { queryEvents, queryLatestEvents } from '@proton/shared/lib/api/drive/share';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import type { Api, User } from '@proton/shared/lib/interfaces';
import type { DriveEventsResult } from '@proton/shared/lib/interfaces/drive/events';

import { driveEventsResultToDriveEvents } from '../_api';
import { createLinkGenerator } from './indexing/createLinkGenerator';
import convertDriveEventsToSearchEvents from './indexing/processEvent';
import type { FetchShareMap } from './indexing/useFetchShareMap';
import type { ESDriveSearchParams, ESLink } from './types';
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

export const useESCallbacks = ({
    api,
    user,
    shareId,
    fetchShareMap,
    getSharePrivateKey,
    getLinkPrivateKey,
}: Props): ESCallbacks<ESLink, ESDriveSearchParams> => {
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

    const getItemInfo = (item: ESLink): { ID: string; timepoint: ESTimepoint } => ({
        ID: item.id,
        timepoint: [item.createTime, item.order],
    });

    const searchKeywords = (keywords: string[], itemToSearch: CachedItem<ESLink, void>, hasApostrophe: boolean) =>
        testKeywords(keywords, [itemToSearch.metadata.decryptedName], hasApostrophe);

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

    const getEventFromIDB = async (
        previousEventsObject?: EventsObject
    ): Promise<{
        newEvents: ESEvent<ESLink>[];
        shouldRefresh: boolean;
        eventsToStore: EventsObject;
    }> => {
        let eventsObject: EventsObject;
        if (previousEventsObject) {
            eventsObject = previousEventsObject;
        } else {
            const storedEventIDs = await readAllLastEvents(userID);
            if (!storedEventIDs) {
                throw new Error('No event stored');
            }
            eventsObject = storedEventIDs;
        }

        const initialShareEvent = await api<DriveEventsResult>(queryEvents(await shareId, eventsObject[await shareId]));

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

        const resolvedShareId = await shareId;

        const shouldRefresh = newEvents.some((event) => {
            return hasBit(event.Refresh, 1);
        });

        let eventsToStore: EventsObject = {};
        eventsToStore[await shareId] = newEvents[newEvents.length - 1].EventID;

        return {
            newEvents: await Promise.all(
                newEvents
                    // Encrypted seach can search only in my files through
                    // events per share which do not include ContextShareID.
                    .map((event) => ({
                        ...event,
                        Events: event.Events.map((item) => ({
                            ...item,
                            ContextShareID: resolvedShareId,
                        })),
                    }))
                    .map((event) => driveEventsResultToDriveEvents(event))
                    .map((events) => convertDriveEventsToSearchEvents(resolvedShareId, events, getLinkPrivateKey))
            ),
            shouldRefresh,
            eventsToStore,
        };
    };

    return {
        getItemInfo,
        queryItemsMetadata,
        searchKeywords,
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
