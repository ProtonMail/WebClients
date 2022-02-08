import { Location, History } from 'history';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { LabelCount } from '@proton/shared/lib/interfaces';
import { getOldestTime } from '@proton/encrypted-search';
import { extractSearchParameters, filterFromUrl, pageFromUrl, setSortInUrl, sortFromUrl } from '../mailboxUrl';
import { isSearch } from '../elements';
import { StoredCiphertext } from '../../models/encryptedSearch';
import { indexName, storeName } from '../../constants';
import { getTimePoint } from './encryptedSearchMailHelpers';

/**
 * Read the current total amount of messages
 */
export const getTotalMessages = async (messageCounts: LabelCount[]) => {
    return messageCounts.find((labelCount) => labelCount?.LabelID === MAILBOX_LABEL_IDS.ALL_MAIL)?.Total || 0;
};

/**
 * Parse search parameters from URL
 */
export const parseSearchParams = (location: Location) => {
    const searchParameters = extractSearchParameters(location);
    return {
        filterParameter: filterFromUrl(location),
        sortParameter: sortFromUrl(location),
        isSearch: isSearch(searchParameters),
        page: pageFromUrl(location),
        searchParameters,
    };
};

/**
 * Reset sort in URL, e.g because ES doesn't support SIZE sort
 */
export const resetSort = (history: History) => {
    history.push(setSortInUrl(history.location, { sort: 'Time', desc: true }));
};

/**
 * Fetch Time of the oldest message from IDB, eventually corrected by a given factor
 */
export const getOldestTimeMail = (userID: string, correctionFactor?: number) => {
    return getOldestTime<StoredCiphertext>(userID, storeName, indexName, getTimePoint, correctionFactor);
};
