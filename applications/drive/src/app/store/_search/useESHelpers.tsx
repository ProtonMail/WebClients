import { useHistory } from 'react-router-dom';

import { PrivateKeyReference } from '@proton/crypto';
import {
    AesGcmCiphertext,
    ESEvent,
    ESHelpers,
    esStorageHelpers,
    normalizeKeyword,
    testKeywords,
} from '@proton/encrypted-search';
import { queryEvents, queryLatestEvents } from '@proton/shared/lib/api/drive/share';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { Api, User } from '@proton/shared/lib/interfaces';
import { DriveEventsResult } from '@proton/shared/lib/interfaces/drive/events';

import { driveEventsResultToDriveEvents } from '../_api';
import { DecryptedLink } from '../_links';
import { createLinkGenerator } from './indexing/createLinkGenerator';
import convertDriveEventsToSearchEvents from './indexing/processEvent';
import { FetchShareMap } from './indexing/useFetchShareMap';
import { ESDriveSearchParams, ESItemChangesDrive, ESLink, StoredCiphertextDrive } from './types';
import { extractSearchParameters, generateOrder, parseItemId } from './utils';

interface Props {
    api: Api;
    user: User;
    shareId: Promise<string>;
    fetchShareMap: FetchShareMap;
    getLink: (abortSignal: AbortSignal, shareId: string, linkId: string) => Promise<DecryptedLink>;
    getSharePrivateKey: (abortSignal: AbortSignal, shareId: string) => Promise<PrivateKeyReference>;
    getLinkPrivateKey: (abortSignal: AbortSignal, shareId: string, linkId: string) => Promise<PrivateKeyReference>;
}

let linkMapGenerator: AsyncGenerator<ESLink[]>;

export const getItemID = (item: ESLink | StoredCiphertextDrive) => item.id;

export const useESHelpers = ({
    api,
    user,
    shareId,
    fetchShareMap,
    getLink,
    getSharePrivateKey,
    getLinkPrivateKey,
}: Props): ESHelpers<ESLink, ESLink, ESDriveSearchParams, ESItemChangesDrive, StoredCiphertextDrive> => {
    const history = useHistory();

    const userID = user.ID;
    const queryItemsMetadata = async (storedItem?: StoredCiphertextDrive) => {
        if (!linkMapGenerator || storedItem === undefined) {
            const rootKey = await getSharePrivateKey(new AbortController().signal, await shareId);
            linkMapGenerator = createLinkGenerator(await shareId, rootKey, { fetchShareMap });
        }

        const items = await linkMapGenerator.next();
        return items.value || [];
    };
    const { getES } = esStorageHelpers();

    const fetchESItem = async (itemId: IDBValidKey, itemMetadata?: ESLink): Promise<ESLink | undefined> => {
        if (itemMetadata) {
            return itemMetadata;
        }

        const { shareId, linkId } = parseItemId(itemId as string);
        const link = await getLink(new AbortController().signal, shareId, linkId);

        return {
            createTime: link.createTime,
            MIMEType: link.mimeType,
            id: itemId as string,
            linkId,
            shareId,
            modifiedTime: link.fileModifyTime,
            parentLinkId: link.parentLinkId,
            size: link.size,
            decryptedName: link.name,
            order: await generateOrder(itemId as string),
        };
    };

    const prepareCiphertext = (itemToStore: ESLink, aesGcmCiphertext: AesGcmCiphertext) => {
        const { createTime, linkId, id, shareId, size, modifiedTime, parentLinkId, order } = itemToStore;
        return {
            aesGcmCiphertext,
            createTime,
            id,
            linkId,
            modifiedTime,
            parentLinkId,
            shareId,
            size,
            order,
        };
    };

    const applySearch = (esSearchParams: ESDriveSearchParams, itemToSearch: ESLink) => {
        const { normalisedKeywords } = esSearchParams;
        if (!normalisedKeywords) {
            return true;
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

    const getPreviousEventID = async () => {
        const latestEvent = await api<{ EventID: string }>(queryLatestEvents(await shareId));
        return latestEvent.EventID;
    };

    const getEventFromLS = async (): Promise<{
        newEvents: ESEvent<ESLink>[];
        shouldRefresh: boolean;
        eventToStore: string | undefined;
    }> => {
        const storedEventID = getES.Event(userID);
        if (!storedEventID) {
            throw new Error('Event ID from local storage not found');
        }

        const initialEvent = await api<DriveEventsResult>(queryEvents(await shareId, storedEventID));
        if (!initialEvent) {
            throw new Error('Event from local storage not found');
        }

        let keepSyncing = Boolean(initialEvent.More);
        let index = 0;

        const newEvents: DriveEventsResult[] = [initialEvent];
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

        return {
            newEvents: await Promise.all(
                newEvents
                    .map(driveEventsResultToDriveEvents)
                    .map(async (events) => convertDriveEventsToSearchEvents(await shareId, events, getLinkPrivateKey))
            ),
            shouldRefresh,
            eventToStore: newEvents[newEvents.length - 1].EventID,
        };
    };

    const getTimePoint = (item: ESLink | StoredCiphertextDrive): [number, number] => {
        return [item.createTime, item.order];
    };

    return {
        getItemID,
        fetchESItem,
        prepareCiphertext,
        queryItemsMetadata,
        applySearch,
        getTimePoint,
        getTotalItems: (() => {
            let total: number;
            return async () => {
                if (!total) {
                    total = (await fetchShareMap({ shareId: await shareId })).Total;
                }
                return total;
            };
        })(),
        updateESItem: (esItemMetadata: ESLink): ESLink => {
            return esItemMetadata;
        },
        getKeywords: (esSearchParams: ESDriveSearchParams) => esSearchParams.normalisedKeywords,
        getSearchParams,
        getPreviousEventID,
        getEventFromLS,
    };
};
