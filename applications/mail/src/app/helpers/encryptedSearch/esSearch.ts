import { normalizeKeyword } from '@proton/encrypted-search/esHelpers';
import type { NormalizedSearchParams } from '@proton/encrypted-search/models';
import type { CategoryLabelID } from '@proton/shared/lib/constants';
import { CATEGORY_LABEL_IDS_SET } from '@proton/shared/lib/constants';
import type { Recipient } from '@proton/shared/lib/interfaces';
import type { Filter, SearchParameters, Sort } from '@proton/shared/lib/mail/search';

import type { ESMessage } from '../../models/encryptedSearch';
import { isExpired } from '../expiration';

interface NormalizeProps {
    searchParams: SearchParameters;
    labelID: string;
    categoryIDs: CategoryLabelID[];
    filter?: Filter;
    sort?: Sort;
}

/**
 * Remove wildcard, normalize keyword and recipients
 */
export const normaliseSearchParams = ({ searchParams, labelID, categoryIDs, filter, sort }: NormalizeProps) => {
    const { wildcard, keyword, to, from, ...otherParams } = searchParams;
    let normalizedKeywords: string[] | undefined;
    if (keyword) {
        normalizedKeywords = normalizeKeyword(keyword);
    }

    const labelIDs = [labelID, ...categoryIDs];

    const normalisedSearchParams: NormalizedSearchParams = {
        labelIDs,
        search: {
            keyword,
            from: from ? from.toLocaleLowerCase() : undefined,
            to: to ? to.toLocaleLowerCase() : undefined,
            ...otherParams,
        },
        normalizedKeywords,
        filter: filter || {},
        sort: sort || { sort: 'Time', desc: true },
    };

    return normalisedSearchParams;
};

/**
 * Test whether a given message fulfills every metadata requirement
 */
export const testMetadata = (
    normalisedSearchParams: NormalizedSearchParams,
    messageToSearch: ESMessage,
    recipients: string[],
    sender: string[]
) => {
    const { search, labelIDs: searchedLabelIDs, filter } = normalisedSearchParams;
    const { AddressID, Time, LabelIDs: messageLabelIDs, NumAttachments, Unread } = messageToSearch;

    const categoriesInSearch: string[] = [];
    const mailboxLabelInSearch: string[] = [];
    searchedLabelIDs.forEach((id) => {
        if (CATEGORY_LABEL_IDS_SET.has(id as CategoryLabelID)) {
            categoriesInSearch.push(id);
        } else {
            mailboxLabelInSearch.push(id);
        }
    });

    // The message must be in the label we're searching
    const matchesMailbox = mailboxLabelInSearch.some((id) => messageLabelIDs.includes(id));
    const hasNoCategory = categoriesInSearch.length === 0;
    // and in the searched category. When no category is searched, this requirement doesn't apply.
    const matchesCategory = hasNoCategory || categoriesInSearch.some((id) => messageLabelIDs.includes(id));

    if (
        !matchesMailbox ||
        !matchesCategory ||
        (search.address && AddressID !== search.address) ||
        isExpired(messageToSearch) ||
        (search.begin && Time < search.begin) ||
        (search.end && Time > search.end) ||
        (search.from && !sender.some((string) => string.includes(search.from!))) ||
        (search.to && !recipients.some((string) => string.includes(search.to!))) ||
        // In some cases NumAttachment is undefined for some reason, and are returned in search results.
        (filter?.Attachments && (NumAttachments ?? 0) === 0) ||
        (typeof filter?.Unread !== 'undefined' && filter?.Unread !== Unread)
    ) {
        return false;
    }

    return true;
};

/**
 * Check whether only sorting changed and, if so, only sort existing results
 * rather than executing a new search
 */
export const shouldOnlySortResults = (
    normalisedSearchParams: NormalizedSearchParams,
    previousNormSearchParams: NormalizedSearchParams
) => {
    const {
        labelIDs,
        filter,
        search: { address, from, to, begin, end },
        normalizedKeywords,
    } = normalisedSearchParams;
    const {
        labelIDs: prevLabelIDs,
        filter: prevFilter,
        search: { address: prevAddress, from: prevFrom, to: prevTo, begin: prevBegin, end: prevEnd },
        normalizedKeywords: prevNormalisedKeywords,
    } = previousNormSearchParams;

    // In case search parameters are different, then a new search is needed
    if (
        labelIDs.length !== prevLabelIDs.length ||
        // The first label of the list is the current category. Disabled categories are appended after it
        labelIDs[0] !== prevLabelIDs[0] ||
        address !== prevAddress ||
        from !== prevFrom ||
        to !== prevTo ||
        begin !== prevBegin ||
        end !== prevEnd ||
        !!normalizedKeywords !== !!prevNormalisedKeywords ||
        filter?.Attachments !== prevFilter?.Attachments ||
        filter?.Unread !== prevFilter?.Unread
    ) {
        return false;
    }

    // Same goes for keywords
    if (normalizedKeywords && prevNormalisedKeywords) {
        if (normalizedKeywords.length !== prevNormalisedKeywords.length) {
            return false;
        }
        for (let i = 0; i < normalizedKeywords.length; i++) {
            if (normalizedKeywords[i] !== prevNormalisedKeywords[i]) {
                return false;
            }
        }
    }

    return true;
};

/**
 * Serialize a recipient
 */
export const transformRecipients = (recipients: Recipient[]) => [
    ...recipients.map((recipient) => recipient.Address.toLocaleLowerCase()),
    ...recipients.map((recipient) => recipient.Name.toLocaleLowerCase()),
];
