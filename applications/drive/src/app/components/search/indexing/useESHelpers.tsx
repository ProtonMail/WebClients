import { Location } from 'history';

import { NodeKeys } from '@proton/shared/lib/interfaces/drive/node';
import { AesGcmCiphertext, ESHelpers, ESEvent, getES, normaliseKeyword, testKeywords } from '@proton/encrypted-search';
import { removeDiacritics } from '@proton/shared/lib/helpers/string';
import { LinkMeta } from '@proton/shared/lib/interfaces/drive/link';
import { Api, User } from '@proton/shared/lib/interfaces';
import { queryEvents, queryLatestEvents } from '@proton/shared/lib/api/drive/share';
import { hasBit } from '@proton/shared/lib/helpers/bitset';

import { ESDriveSearchParams, ESItemChangesDrive, ESLink, StoredCiphertextDrive } from '../types';
import { FetchLinkConfig } from '../../../hooks/drive/useDrive';
import { createLinkGenerator } from './createLinkGenerator';
import { extractSearchParameters, generateOrder } from '../utils';
import { DriveEventsPayload } from '../../driveEventManager/interface';
import { convertDriveEventToSearchEvent } from '../processEvent';
import { LinkKeys } from '../../DriveCache/DriveCacheProvider';
import { parseItemId } from '../utils';
import { FetchShareMap } from '../useSearchAPI';

interface Props {
    api: Api;
    user: User;
    shareId: string;

    fetchShareMap: FetchShareMap;
    getLinkMeta: (shareId: string, linkId: string) => Promise<LinkMeta>;

    getShareKeys: (shareId: string) => Promise<NodeKeys>;
    getLinkKeys: (shareId: string, linkId: string, config?: FetchLinkConfig) => Promise<LinkKeys>;
}

let linkMapGenerator: AsyncGenerator<ESLink[]>;

export const getItemID = (item: ESLink | StoredCiphertextDrive) => item.id;

export const useESHelpers = ({
    api,
    user,
    fetchShareMap,
    getLinkMeta,
    shareId,
    getShareKeys,
    getLinkKeys,
}: Props): ESHelpers<ESLink, ESLink, ESDriveSearchParams, ESItemChangesDrive, StoredCiphertextDrive> => {
    const userID = user.ID;
    const queryItemsMetadata = async (storedItem?: StoredCiphertextDrive) => {
        if (!linkMapGenerator || storedItem === undefined) {
            const rootKey = await getShareKeys(shareId);
            linkMapGenerator = createLinkGenerator(shareId, rootKey, { fetchShareMap });
        }

        const items = await linkMapGenerator.next();
        return items.value || [];
    };

    const fetchESItem = async (itemId: IDBValidKey, itemMetadata?: ESLink): Promise<ESLink | undefined> => {
        if (itemMetadata) {
            return itemMetadata;
        }

        const { shareId, linkId } = parseItemId(itemId as string);
        const linkMeta = await getLinkMeta(shareId, linkId);

        return {
            createTime: linkMeta.CreateTime,
            MIMEType: linkMeta.MIMEType,
            id: itemId as string,
            linkId,
            shareId,
            modifiedTime: linkMeta.RealModifyTime,
            parentLinkId: linkMeta.ParentLinkID,
            size: linkMeta.Size,
            decryptedName: linkMeta.Name,
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

        return testKeywords(normalisedKeywords, [removeDiacritics(itemToSearch.decryptedName.toLocaleLowerCase())]);
    };

    const parseSearchParams = (location: Location) => {
        const keyword = extractSearchParameters(location);
        return {
            isSearch: !!keyword,
            esSearchParams: { normalisedKeywords: !keyword ? undefined : normaliseKeyword(keyword) },
            page: 0,
        };
    };

    const getPreviousEventID = async () => {
        const latestEvent = await api<{ EventID: string }>(queryLatestEvents(shareId));
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

        const initialEvent = await api<DriveEventsPayload>(queryEvents(shareId, storedEventID));

        if (!initialEvent) {
            throw new Error('Event from local storage not found');
        }

        let keepSyncing = Boolean(initialEvent.More);
        let index = 0;

        const newEvents: DriveEventsPayload[] = [initialEvent];
        while (keepSyncing) {
            try {
                const lastEventId = newEvents[index++].EventID;

                const newEventToCheck = await api<DriveEventsPayload>(queryEvents(shareId, lastEventId));
                if (!newEventToCheck || !newEventToCheck.EventID) {
                    throw new Error('No event found');
                }

                keepSyncing = Boolean(newEventToCheck.More) || newEventToCheck.EventID !== lastEventId;
                if (keepSyncing) {
                    newEvents.push(newEventToCheck);
                }
            } catch (error: any) {
                return getEventFromLS();
            }
        }

        const shouldRefresh = newEvents.some((event) => {
            return hasBit(event.Refresh, 1);
        });

        const res = {
            newEvents: await convertDriveEventToSearchEvent(shareId, newEvents, getLinkKeys),
            shouldRefresh,
            eventToStore: newEvents[newEvents.length - 1].EventID,
        };

        return res;
    };

    const sizeOfESItem = (esItem: ESLink) => {
        let bytes = 0;
        let key: keyof typeof esItem;

        for (key in esItem) {
            if (Object.prototype.hasOwnProperty.call(esItem, key)) {
                const value = esItem[key];
                if (!value) {
                    continue;
                }

                bytes += key.length * 2;

                if (typeof value === 'string') {
                    bytes += value.length * 2;
                } else if (typeof value === 'number') {
                    bytes += 8;
                }
            }
        }

        return bytes;
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
        sizeOfESItem,
        getTotalItems: (() => {
            let total: number;
            return async () => {
                if (!total) {
                    total = (await fetchShareMap({ shareId })).Total;
                }
                return total;
            };
        })(),
        updateESItem: (esItemMetadata: ESLink): ESLink => {
            return esItemMetadata;
        },
        getKeywords: (esSearchParams: ESDriveSearchParams) => esSearchParams.normalisedKeywords,
        parseSearchParams,
        getPreviousEventID,
        getEventFromLS,
    };
};
