import { History, Location } from 'history';

import { getOldestTime } from '@proton/encrypted-search';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { LabelCount } from '@proton/shared/lib/interfaces';

import { LABEL_IDS_TO_HUMAN, indexName, storeName } from '../../constants';
import { StoredCiphertext } from '../../models/encryptedSearch';
import { isSearch as checkIsSearch } from '../elements';
import {
    extractSearchParameters,
    filterFromUrl,
    getParamsFromPathname,
    pageFromUrl,
    setSortInUrl,
    sortFromUrl,
} from '../mailboxUrl';
import { getTimePoint } from './encryptedSearchMailHelpers';
import { normaliseSearchParams } from './esSearch';

/**
 * Read the current total amount of messages
 */
export const getTotalMessages = async (messageCounts: LabelCount[]) => {
    return messageCounts.find((labelCount) => labelCount?.LabelID === MAILBOX_LABEL_IDS.ALL_MAIL)?.Total || 0;
};

/**
 * Determine the label ID of the folders specified in the URL
 */
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

/**
 * Parse search parameters from URL
 */
export const parseSearchParams = (location: Location) => {
    const searchParameters = extractSearchParameters(location);
    const isSearch = checkIsSearch(searchParameters);

    return {
        isSearch,
        page: pageFromUrl(location),
        esSearchParams: isSearch
            ? normaliseSearchParams(
                  searchParameters,
                  getLabelID(location),
                  filterFromUrl(location),
                  sortFromUrl(location)
              )
            : undefined,
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
