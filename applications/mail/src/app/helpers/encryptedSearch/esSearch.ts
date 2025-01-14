import { normalizeKeyword } from '@proton/encrypted-search';
import type { NormalizedSearchParams } from '@proton/encrypted-search/lib/models/mail';
import type { Recipient } from '@proton/shared/lib/interfaces';
import type { Filter, SearchParameters, Sort } from '@proton/shared/lib/mail/search';

import type { ESMessage } from '../../models/encryptedSearch';
import { isExpired } from '../expiration';

/**
 * Remove wildcard, normalise keyword and recipients
 */
export const normaliseSearchParams = (
    searchParams: SearchParameters,
    labelID: string,
    filter?: Filter,
    sort?: Sort
) => {
    const { wildcard, keyword, to, from, ...otherParams } = searchParams;
    let normalizedKeywords: string[] | undefined;
    if (keyword) {
        normalizedKeywords = normalizeKeyword(keyword);
    }

    const normalisedSearchParams: NormalizedSearchParams = {
        labelID,
        search: {
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
    const { search, labelID, filter } = normalisedSearchParams;
    const { address, from, to, begin, end } = search || {};
    const { AddressID, Time, LabelIDs, NumAttachments, Unread } = messageToSearch;

    if (
        !LabelIDs.includes(labelID) ||
        (address && AddressID !== address) ||
        isExpired(messageToSearch) ||
        (begin && Time < begin) ||
        (end && Time > end) ||
        (from && !sender.some((string) => string.includes(from))) ||
        (to && !recipients.some((string) => string.includes(to))) ||
        (filter?.Attachments && NumAttachments === 0) ||
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
        labelID,
        filter,
        search: { address, from, to, begin, end },
        normalizedKeywords,
    } = normalisedSearchParams;
    const {
        labelID: prevLabelID,
        filter: prevFilter,
        search: { address: prevAddress, from: prevFrom, to: prevTo, begin: prevBegin, end: prevEnd },
        normalizedKeywords: prevNormalisedKeywords,
    } = previousNormSearchParams;

    // In case search parameters are different, then a new search is needed
    if (
        labelID !== prevLabelID ||
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
