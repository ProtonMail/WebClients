import type { History, Location } from 'history';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import type { LabelCount, UserModel } from '@proton/shared/lib/interfaces';
import { LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';

import { isSearch as checkIsSearch } from '../elements';
import {
    extractSearchParameters,
    filterFromUrl,
    getParamsFromPathname,
    pageFromUrl,
    setSortInUrl,
    sortFromUrl,
} from '../mailboxUrl';
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
export const parseSearchParams = (location: Location, disabledCategoriesIDs: string[]) => {
    const searchParameters = extractSearchParameters(location);
    const isSearch = checkIsSearch(searchParameters);

    return {
        isSearch,
        page: pageFromUrl(location),
        esSearchParams: isSearch
            ? normaliseSearchParams({
                  disabledCategoriesIDs,
                  searchParams: searchParameters,
                  labelID: getLabelID(location),
                  filter: filterFromUrl(location),
                  sort: sortFromUrl(location),
              })
            : undefined,
    };
};

/**
 * Reset sort in URL, e.g because ES doesn't support SIZE sort
 */
export const resetSort = (history: History) => {
    history.push(setSortInUrl(history.location, { sort: 'Time', desc: true }));
};

export const isEncryptedSearchAvailable = (user: UserModel, isESUserInterfaceAvailable: boolean) => {
    if (isMobile()) {
        return false;
    }

    if (user.isPaid) {
        return true;
    }

    return isESUserInterfaceAvailable;
};

// Do not prefix with ES: to not be cleared by removeESFlags function
export const getESFreeBlobKey = (userID: string) => `${userID}:InitialIndexing`;
