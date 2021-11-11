import { DBSchema, openDB } from 'idb';
import { startOfDay, sub } from 'date-fns';
import { Location } from 'history';
import { AesGcmCiphertext, EncryptedSearchFunctions, ESHelpers, UserModel } from '@proton/shared/lib/interfaces';
import { getOldestItem, normaliseKeyword, openESDB, roundMilliseconds, testKeywords } from '@proton/encrypted-search';
import { removeDiacritics } from '@proton/shared/lib/helpers/string';
import { FileLinkMeta, FolderLinkMeta, LinkMeta, LinkType } from '@proton/shared/lib/interfaces/drive/link';
import { ShareMeta, ShareMetaShort } from '@proton/shared/lib/interfaces/drive/share';

export const storeName = 'files';
export const timeIndex = 'byUploadedTime';

export interface ESFile {
    ShareID: string;
    LinkID: string;
    ID: string;
    CreateTime: number;
    decryptedName: string;
}

export interface StoredCiphertext extends Pick<ESFile, 'ID' | 'ShareID' | 'LinkID' | 'CreateTime'> {
    aesGcmCiphertext: AesGcmCiphertext;
}

export interface EncryptedSearchDB extends DBSchema {
    files: {
        key: string;
        value: StoredCiphertext;
        indexes: { byUploadedTime: number };
    };
}

export interface ESDriveSearchParams {
    normalisedKeywords: string[] | undefined;
}

export interface ESItemChangesDrive {
    newName: string;
}

export interface ESItemMetadataDrive {
    ID: string;
    ShareID: string;
    LinkID: string;
}

export interface MetadataOptionsDrive {
    shareAndLinkIDs: ESItemMetadataDrive[];
}

export interface EncryptedSearchFunctionsDrive
    extends Pick<
        EncryptedSearchFunctions<ESFile, EncryptedSearchDB, ESDriveSearchParams, ESItemChangesDrive>,
        | 'encryptedSearch'
        | 'highlightString'
        | 'highlightMetadata'
        | 'incrementSearch'
        | 'resumeIndexing'
        | 'isSearchResult'
        | 'esDelete'
        | 'getESDBStatus'
        | 'getProgressRecorderRef'
        | 'shouldHighlight'
        | 'pauseIndexing'
        | 'cacheIndexedDB'
        | 'openDropdown'
        | 'closeDropdown'
        | 'toggleEncryptedSearch'
    > {}

const getOldestTime = async (userID: string) => {
    const esDB = await openESDB<EncryptedSearchDB>(userID);
    const oldestMessage = await getOldestItem<EncryptedSearchDB>(esDB, storeName, timeIndex);
    esDB.close();
    return oldestMessage?.CreateTime || 0;
};

const getMostRecentTime = async (userID: string) => {
    const esDB = await openESDB<EncryptedSearchDB>(userID);
    const cursor = await esDB.transaction(storeName).store.index(timeIndex).openCursor(undefined, 'prev');
    const mostRecentMessage = cursor?.value;
    esDB.close();
    return mostRecentMessage ? mostRecentMessage.CreateTime : 0;
};

interface Props {
    user: UserModel;
    getLinkMeta: (shareId: string, linkId: string) => Promise<LinkMeta>;
    fetchAllFolderPages: (shareId: string, linkId: string) => Promise<void>;
    mainShares: (ShareMeta | ShareMetaShort)[];
    childLinkMetas: (shareId: string, linkId: string) => (FileLinkMeta | FolderLinkMeta)[] | undefined;
}

export const getESHelpers = ({
    user,
    getLinkMeta,
    fetchAllFolderPages,
    mainShares,
    childLinkMetas,
}: Props): ESHelpers<
    ESItemMetadataDrive,
    MetadataOptionsDrive,
    ESFile,
    EncryptedSearchDB,
    ESDriveSearchParams,
    ESItemChangesDrive
> => {
    const { ID: userID } = user;

    const getMetadataOptions = async (
        _: StoredCiphertext | undefined,
        previousMetadataOptions?: MetadataOptionsDrive
    ): Promise<MetadataOptionsDrive> => {
        const shareAndLinkIDs: ESItemMetadataDrive[] = [];

        if (!previousMetadataOptions) {
            // Initialisation step
            await Promise.all(
                mainShares.map(async ({ ShareID, LinkID }) => {
                    // Root is extracted from each share, its name is uninteresting
                    await fetchAllFolderPages(ShareID, LinkID);
                    const children = childLinkMetas(ShareID, LinkID);
                    if (children) {
                        await Promise.all(
                            children.map(async (child) => {
                                if (child.Type === LinkType.FOLDER) {
                                    await fetchAllFolderPages(ShareID, child.LinkID);
                                }
                                shareAndLinkIDs.push({
                                    ID: `${ShareID}:${child.LinkID}`,
                                    ShareID,
                                    LinkID: child.LinkID,
                                });
                            })
                        );
                    }
                })
            );
        } else {
            const { shareAndLinkIDs: previousShareAndLinkIDs } = previousMetadataOptions;
            await Promise.all(
                previousShareAndLinkIDs.map(async ({ ShareID, LinkID }) => {
                    const children = childLinkMetas(ShareID, LinkID);
                    if (children) {
                        await Promise.all(
                            children.map(async (child) => {
                                if (child.Type === LinkType.FOLDER) {
                                    await fetchAllFolderPages(ShareID, child.LinkID);
                                }
                                shareAndLinkIDs.push({
                                    ID: `${ShareID}:${child.LinkID}`,
                                    ShareID,
                                    LinkID: child.LinkID,
                                });
                            })
                        );
                    }
                })
            );
        }

        return {
            shareAndLinkIDs,
        };
    };

    const prepareCiphertext = (itemToStore: ESFile, encryptedMessage: ArrayBuffer, iv: Uint8Array) => {
        const { ShareID, LinkID, CreateTime, ID } = itemToStore;
        return {
            ID,
            ShareID,
            LinkID,
            CreateTime,
            aesGcmCiphertext: {
                ciphertext: encryptedMessage,
                iv,
            },
        };
    };

    const fetchESItem = async (itemID: string, itemMetadata?: ESItemMetadataDrive): Promise<ESFile | undefined> => {
        let ShareID: string;
        let LinkID: string;
        if (itemMetadata) {
            ({ ShareID, LinkID } = itemMetadata);
        } else {
            [ShareID, LinkID] = itemID.split(':');
        }

        const linkMeta = await getLinkMeta(ShareID, LinkID);
        return {
            ID: `${ShareID}:${LinkID}`,
            ShareID,
            LinkID,
            CreateTime: linkMeta.CreateTime,
            decryptedName: linkMeta.Name,
        };
    };

    const queryItemsMetadata = async (options: MetadataOptionsDrive): Promise<ESItemMetadataDrive[] | undefined> => {
        const { shareAndLinkIDs } = options;
        if (!shareAndLinkIDs.length) {
            return [];
        }
        const result = await Promise.all(
            shareAndLinkIDs.map(async ({ ShareID, LinkID }) => {
                const linkMeta = await getLinkMeta(ShareID, LinkID);
                if (linkMeta.Type === LinkType.FOLDER) {
                    await fetchAllFolderPages(ShareID, linkMeta.LinkID);
                }
                return {
                    ID: `${ShareID}:${LinkID}`,
                    ShareID,
                    LinkID,
                };
            })
        );
        return result;
    };

    const createESDB = () =>
        openDB<EncryptedSearchDB>(`ES:${userID}:DB`, 1, {
            upgrade(esDB) {
                esDB.createObjectStore(storeName, { keyPath: 'ID' }).createIndex(timeIndex, 'CreateTime', {
                    unique: false,
                });
            },
        });

    const initialiseTimeBounds = async (inputTimePoint: number | undefined) => {
        const oldestTime = await getOldestTime(userID);
        const mostRecentTime = inputTimePoint || (await getMostRecentTime(userID));

        const startTime = roundMilliseconds(startOfDay(sub(mostRecentTime * 1000, { days: 1 })).getTime());

        return {
            batchTimeBound: IDBKeyRange.bound(startTime, mostRecentTime),
            searchTimeBound: IDBKeyRange.bound(oldestTime, mostRecentTime),
        };
    };

    const updateBatchTimeBound = (batchTimeBound: IDBKeyRange, searchTimeBound: IDBKeyRange) => {
        let endTime = batchTimeBound.lower - 1;
        const startTime = Math.max(
            searchTimeBound.lower,
            roundMilliseconds(startOfDay(sub(endTime * 1000, { days: 1 })).getTime())
        );

        if (startTime > endTime) {
            endTime = startTime;
        }

        return IDBKeyRange.bound(startTime, endTime);
    };

    const initialiseLowerBound = async (inputTimePoint: number | undefined) => {
        const oldestTime = await getOldestTime(userID);
        const mostRecentTime = await getMostRecentTime(userID);

        const lowerBound = inputTimePoint || oldestTime;
        const batchLowerBound = IDBKeyRange.lowerBound(lowerBound, true);

        return {
            batchLowerBound,
            searchLowerBound: IDBKeyRange.bound(oldestTime, mostRecentTime),
        };
    };

    const applySearch = (esSearchParams: ESDriveSearchParams, itemToSearch: ESFile) => {
        const { normalisedKeywords } = esSearchParams;
        if (!normalisedKeywords) {
            return true;
        }

        return testKeywords(normalisedKeywords, [removeDiacritics(itemToSearch.decryptedName.toLocaleLowerCase())]);
    };

    const checkCacheTimespan = (esSearchParams: ESDriveSearchParams, esCache: ESFile[]) => {
        const { CreateTime } = esCache[esCache.length - 1];
        return {
            shouldKeepSearching: true,
            esSearchParams,
            timePoint: CreateTime,
        };
    };

    const extractSearchParameters = (location: Location): string => {
        let searchHash = location.hash;
        if (searchHash) {
            searchHash = searchHash[0] === '#' ? `?${location.hash.slice(1)}` : searchHash;
        }
        const params = new URLSearchParams(searchHash);

        const result: { [key: string]: string } = {};

        params.forEach((value, key) => {
            result[key] = value;
        });

        return result.keyword;
    };

    const parseSearchParams = (location: Location) => {
        const keyword = extractSearchParameters(location);
        return {
            isSearch: !!keyword,
            esSearchParams: { normalisedKeywords: !keyword ? undefined : normaliseKeyword(keyword) },
            page: 0,
        };
    };

    const getEventFromLS = async () => ({ newEvents: [], shouldRefresh: false, eventToStore: undefined });

    const sizeOfESItem = (esItem: ESFile) => {
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

    return {
        fetchESItem,
        getMetadataOptions,
        prepareCiphertext,
        queryItemsMetadata,
        createESDB,
        initialiseTimeBounds,
        updateBatchTimeBound,
        initialiseLowerBound,
        applySearch,
        checkCacheTimespan,
        sizeOfESItem,
        getEventFromLS,
        parseSearchParams,
        /* Almost legitimate one-liners */
        getIDFromMetadata: (itemMetadata: ESItemMetadataDrive) => itemMetadata.ID,
        stringifyESItem: (itemToStore: ESFile) => JSON.stringify(itemToStore),
        updateBatchLowerBound: (lastTimePoint: number) => IDBKeyRange.lowerBound(lastTimePoint, true),
        parseCiphertext: (storedCiphertext: StoredCiphertext) => storedCiphertext.aesGcmCiphertext,
        getTimePoint: (item: ESFile | StoredCiphertext) => item.CreateTime,
        sortCachedItems: (firstEl: ESFile, secondEl: ESFile) => secondEl.CreateTime - firstEl.CreateTime,
        checkAddToCache: (newESItem: ESFile, esCache: ESFile[]) =>
            newESItem.CreateTime < esCache[esCache.length - 1].CreateTime,
        findItemIndex: (itemID: string, esCache: ESFile[]) =>
            esCache.findIndex((cachedFile) => cachedFile.ID === itemID),
        getIDStoredItem: (storedItem: StoredCiphertext | ESFile) => storedItem.ID,
        isTimePointLessThan: (esTimeBound1: number, esTimeBound2: number) => esTimeBound1 < esTimeBound2,
        getKeywords: (esSearchParams: ESDriveSearchParams) => esSearchParams.normalisedKeywords,
        checkEndSearchReverse: (batchTimeBound: IDBKeyRange, searchTimeBound: IDBKeyRange) =>
            batchTimeBound.lower === searchTimeBound.lower,
        checkEndSearchChrono: (lastTimePoint: number, searchTimeBound: IDBKeyRange) =>
            lastTimePoint > searchTimeBound.upper,
        updateESItem: (esItemMetadata: ESItemChangesDrive, oldItem: ESFile): ESFile => ({
            ...oldItem,
            decryptedName: esItemMetadata.newName,
        }),
        /* Trivial callbacks just for PoC's sake */
        indexNewUsers: async () => false,
        getPreviousEventID: async () => '',
        resetSort: () => {},
        getDecryptionErrorParams: () => ({ normalisedKeywords: undefined }),
        insertMarks: () => '',
        highlightMetadata: () => ({ numOccurrences: 0, resultJSX: <></> }),
        getTotalItems: async () => 1, // just not to trigger mailboxEmpty
        preFilter: () => true,
        checkIsReverse: () => false,
        shouldOnlySortResults: () => false,
    };
};
