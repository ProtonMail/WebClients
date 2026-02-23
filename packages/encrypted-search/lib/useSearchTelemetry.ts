import useApi from '@proton/components/hooks/useApi';
import useConfig from '@proton/components/hooks/useConfig';
import type { IndexingMetrics } from '@proton/encrypted-search/lib/esHelpers';
import type { ESCalendarSearchParams } from '@proton/encrypted-search/lib/models/calendar';
import type { ESDriveSearchParams } from '@proton/encrypted-search/lib/models/drive';
import type { NormalizedSearchParams } from '@proton/encrypted-search/lib/models/mail';
import { getLabelNameAnonymised } from '@proton/mail/helpers/location';
import { TelemetryEncryptedSearchEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import type { Filter, SearchParameters, Sort } from '@proton/shared/lib/mail/search';

export const enum SEARCH_TYPE {
    BACKEND_SIDE = 'BACKEND_SIDE',
    ENCRYPTED = 'ENCRYPTED',
}

export interface NormalSearchArgs {
    type: SEARCH_TYPE.BACKEND_SIDE;
    searchParams: SearchParameters & {
        sort: Sort;
        filter: Filter;
        page: number;
        pageSize: number;
        labelID: string;
    };
    hasReachedAPILimit?: boolean;
}

export interface EncryptedSearchArgs {
    type: SEARCH_TYPE.ENCRYPTED;
    searchParams: NormalizedSearchParams | ESCalendarSearchParams | ESDriveSearchParams;
    isCacheLimited?: boolean;
    isSearchPartial?: boolean;
    isDBLimited?: boolean;
}

export type SearchArgs = NormalSearchArgs | EncryptedSearchArgs;

const getFilterType = (filter?: Filter) => {
    if (!filter) {
        return undefined;
    }

    if (filter.Unread !== undefined) {
        if (filter.Unread) {
            return 'unread';
        }
        return 'read';
    }
    if (filter.Attachments !== undefined) {
        if (filter.Attachments) {
            return 'attachments';
        }
    }

    return undefined;
};

const getSortOrder = (sort: Sort) => {
    if (sort) {
        if (sort.desc) {
            return 'descending';
        }
        return 'ascending';
    }
    return undefined;
};

// Depending on the search type (encrypted or normal search) and the app, the search params are different
const getSearchParams = (app: APP_NAMES, searchArgs: SearchArgs) => {
    const isES = searchArgs.type === SEARCH_TYPE.ENCRYPTED;

    if (isES) {
        const { searchParams, isSearchPartial, isCacheLimited, isDBLimited } = searchArgs;
        let params = {};

        if (app === APPS.PROTONMAIL) {
            const { sort, filter, search, normalizedKeywords, labelIDs } = searchParams as NormalizedSearchParams;

            const { begin, end, from, to, address } = search;

            params = {
                sortType: sort ? sort.sort : undefined,
                sortOrder: getSortOrder(sort),
                filterType: getFilterType(filter),
                hasBegin: (!!begin).toString(),
                hasEnd: (!!end).toString(),
                hasKeyword: ((normalizedKeywords?.length || 0) > 0).toString(),
                hasAddress: (!!address).toString(),
                hasFrom: (!!from).toString(),
                hasTo: (!!to).toString(),
                // The first item of the labelsIDs list is the current labelID.
                // We have a list of IDs when performing a search against the default category.
                labelID: getLabelNameAnonymised(labelIDs[0]),
            };
        } else if (app === APPS.PROTONCALENDAR) {
            const { begin, end, keyword, calendarID, page } = searchParams as ESCalendarSearchParams;

            params = {
                hasBegin: (!!begin).toString(),
                hasEnd: (!!end).toString(),
                hasKeyword: (!!keyword).toString(),
                hasCalendarID: (!!calendarID).toString(),
                hasPage: (!!page).toString(),
            };
        } else if (app === APPS.PROTONDRIVE) {
            const { normalisedKeywords } = searchParams as ESDriveSearchParams;

            params = {
                hasKeyword: ((normalisedKeywords?.length || 0) > 0).toString(),
            };
        }

        return {
            ...params,
            isEncryptedSearch: 'true',
            isCacheLimited: (!!isCacheLimited).toString(),
            isSearchPartial: (!!isSearchPartial).toString(),
            isDBLimited: (!!isDBLimited).toString(),
        };
    } else {
        const { searchParams, hasReachedAPILimit } = searchArgs;
        let params = {};

        if (app === APPS.PROTONMAIL) {
            const { sort, filter, begin, end, from, to, address, keyword, labelID } = searchParams;

            params = {
                sortType: sort ? sort.sort : undefined,
                sortOrder: getSortOrder(sort),
                filterType: getFilterType(filter),
                hasBegin: (!!begin).toString(),
                hasEnd: (!!end).toString(),
                hasKeyword: (!!keyword).toString(),
                hasAddress: (!!address).toString(),
                hasFrom: (!!from).toString(),
                hasTo: (!!to).toString(),
                labelID: getLabelNameAnonymised(labelID),
            };
        }

        return {
            ...params,
            isEncryptedSearch: 'false',
            hasReachedApiLimit: (!!hasReachedAPILimit).toString(),
        };
    }
};

const getItemsToIndexRange = (itemsToIndex: number) => {
    if (itemsToIndex <= 0) {
        return 'none';
    } else if (itemsToIndex <= 1000) {
        // 1 - 1k
        return 'S';
    } else if (itemsToIndex <= 10000) {
        // 1k - 10k
        return 'M';
    } else if (itemsToIndex <= 50000) {
        // 10k - 50k
        return 'L';
    } else if (itemsToIndex <= 250000) {
        // 50k - 250k
        return 'XL';
    } else {
        // > 250k
        return 'XXL';
    }
};

const getIndexSizeRange = (indexSize: number) => {
    const sizeInMB = indexSize / (1024 * 1024);
    if (indexSize <= 0) {
        return 'none';
    } else if (sizeInMB <= 10) {
        // < 10Mb
        return 'S';
    } else if (sizeInMB <= 50) {
        // 10Mb - 50Mb
        return 'M';
    } else if (sizeInMB <= 250) {
        // 50Mb - 250Mb
        return 'L';
    } else if (sizeInMB <= 1000) {
        // 250Mb - 1Gb
        return 'XL';
    } else {
        // > 1Gb
        return 'XXL';
    }
};

const getCacheSizeRange = (cacheSize: number) => {
    const sizeInMB = cacheSize / (1024 * 1024);
    if (cacheSize <= 0) {
        return 'none';
    } else if (sizeInMB <= 15) {
        // < 15Mb
        return 'S';
    } else if (sizeInMB <= 50) {
        // 15Mb - 50Mb
        return 'M';
    } else if (sizeInMB <= 150) {
        // 50Mb - 150Mb
        return 'L';
    } else if (sizeInMB <= 300) {
        // 150Mb - 300Mb
        return 'XL';
    } else if (sizeInMB <= 650) {
        // 300Mb - 650Mb
        return 'XXL';
    } else {
        // Normally, ES_MAX_CACHE is 600Mb, the cache should not be bigger.
        // But on the previous metric endpoint some data where above this limit.
        // We want to track that in case some users would face this, since it could cause issues
        return 'above cache limit';
    }
};

export const useSearchTelemetry = () => {
    const api = useApi();
    const { APP_NAME } = useConfig();

    const isDesktopAppString = isElectronApp.toString();

    const sendStartESIndexingReport = (type: 'metadata' | 'content') => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.clientSearch,
            event: TelemetryEncryptedSearchEvents.start_es_indexing,
            dimensions: {
                app: APP_NAME,
                isDesktopApp: isDesktopAppString,
                indexingType: type,
            },
            delay: false,
        });
    };

    const sendEndESIndexingReport = ({ type, metrics }: { type: 'metadata' | 'content'; metrics: IndexingMetrics }) => {
        const { indexTime, totalItems, numPauses, numInterruptions, originalEstimate, isRefreshed, indexSize } =
            metrics;

        const isContentIndexing = type === 'content';

        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.clientSearch,
            event: TelemetryEncryptedSearchEvents.end_es_indexing,
            values: {
                indexingTime: indexTime,
                originalEstimate,
                numPauses: isContentIndexing ? numPauses : undefined,
                numInterruptions: isContentIndexing ? numInterruptions : undefined,
            },
            dimensions: {
                app: APP_NAME,
                isDesktopApp: isDesktopAppString,
                indexingType: type,
                isRefreshed: isRefreshed.toString(),
                itemsToIndex: getItemsToIndexRange(totalItems),
                indexSize: getIndexSizeRange(indexSize),
            },
            delay: false,
        });
    };

    const sendPauseESIndexingReport = () => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.clientSearch,
            event: TelemetryEncryptedSearchEvents.pause_es_indexing,
            dimensions: {
                app: APP_NAME,
                isDesktopApp: isDesktopAppString,
            },
            delay: false,
        });
    };

    const sendPerformSearchReport = (args: SearchArgs) => {
        const parameters = getSearchParams(APP_NAME, args);

        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.clientSearch,
            event: TelemetryEncryptedSearchEvents.perform_search,
            dimensions: {
                app: APP_NAME,
                isDesktopApp: isDesktopAppString,
                ...parameters,
            },
            // We want to delay search events so that we cannot correlate search results with user actions
            delay: true,
        });
    };

    const sendESSearchCompleteReport = ({
        searchTime,
        isFirstSearch,
        isSearchPartial,
        isCacheLimited,
        isDBLimited,
        itemsFound,
        uncachedItemsFound,
        indexSize,
        cacheSize,
    }: {
        searchTime: number;
        isUncachedSearch?: boolean;
        isFirstSearch: boolean;
        isSearchPartial: boolean;
        isCacheLimited: boolean;
        isDBLimited: boolean;
        itemsFound: number;
        uncachedItemsFound?: number;
        indexSize: number;
        cacheSize: number;
    }) => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.clientSearch,
            event: TelemetryEncryptedSearchEvents.es_search_complete,
            values: {
                searchTime,
            },
            dimensions: {
                app: APP_NAME,
                isDesktopApp: isDesktopAppString,
                isUncachedSearch: (!!uncachedItemsFound).toString(),
                isFirstSearch: isFirstSearch.toString(),
                isSearchPartial: isSearchPartial.toString(),
                isCacheLimited: isCacheLimited.toString(),
                isDBLimited: isDBLimited.toString(),
                indexSize: getIndexSizeRange(indexSize),
                cacheSize: getCacheSizeRange(cacheSize),
                /*
                 * We want to protect the user from "leaking" information about search results
                 * in case where the server would become compromised.
                 * Since the search params are inside the URL, a compromised server could technically
                 * inject params in the URL and initiate a search, and by analyzing search results,
                 * it could get some users information if emails are matching or not.
                 *
                 * So, the two information below can be sent ONLY when we are sure that the search
                 * has been initiated by the user, which is the case today.
                 */
                hasItemsFound: (!!itemsFound).toString(),
                hasUncachedItemsFound: (!!uncachedItemsFound).toString(),
            },
            // We want to delay search events so that we cannot correlate search results with user actions
            delay: true,
        });
    };

    const sendClearSearchFieldsReport = (isEncryptedSearch: boolean) => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.clientSearch,
            event: TelemetryEncryptedSearchEvents.clear_search_fields,
            dimensions: {
                app: APP_NAME,
                isEncryptedSearch: isEncryptedSearch.toString(),
                isDesktopApp: isDesktopAppString,
            },
            // We want to delay search events so that we cannot correlate search results with user actions
            delay: true,
        });
    };

    const sendDeleteESDataReport = () => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.clientSearch,
            event: TelemetryEncryptedSearchEvents.delete_es_data,
            dimensions: {
                app: APP_NAME,
                isDesktopApp: isDesktopAppString,
            },
            delay: false,
        });
    };

    const sendSwitchSearchTypeReport = (isESEnabled: boolean) => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.clientSearch,
            event: TelemetryEncryptedSearchEvents.switch_search_type,
            dimensions: {
                app: APP_NAME,
                isDesktopApp: isDesktopAppString,
                searchType: isESEnabled ? SEARCH_TYPE.ENCRYPTED : SEARCH_TYPE.BACKEND_SIDE,
            },
            // We want to delay search events so that we cannot correlate search results with user actions
            delay: true,
        });
    };

    return {
        sendStartESIndexingReport,
        sendEndESIndexingReport,
        sendPauseESIndexingReport,
        sendPerformSearchReport,
        sendESSearchCompleteReport,
        sendClearSearchFieldsReport,
        sendDeleteESDataReport,
        sendSwitchSearchTypeReport,
    };
};
