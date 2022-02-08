import { normaliseKeyword } from '@proton/encrypted-search';
import { Filter, SearchParameters, Sort } from '../../models/tools';
import { ESMessage, NormalisedSearchParams } from '../../models/encryptedSearch';

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
    let normalisedKeywords: string[] | undefined;
    if (keyword) {
        normalisedKeywords = normaliseKeyword(keyword);
    }

    const normalisedSearchParams: NormalisedSearchParams = {
        labelID,
        search: {
            from: from ? from.toLocaleLowerCase() : undefined,
            to: to ? to.toLocaleLowerCase() : undefined,
            ...otherParams,
        },
        normalisedKeywords,
        filter: filter || {},
        sort: sort || { sort: 'Time', desc: true },
    };

    return normalisedSearchParams;
};

/**
 * Test whether a given message fulfills every metadata requirement
 */
export const testMetadata = (
    normalisedSearchParams: NormalisedSearchParams,
    messageToSearch: ESMessage,
    recipients: string[],
    sender: string[]
) => {
    const { search, labelID, decryptionError, filter } = normalisedSearchParams;
    const { address, from, to, begin, end, attachments } = search || {};
    const { AddressID, Time, LabelIDs, NumAttachments, decryptionError: messageError, Unread } = messageToSearch;

    if (
        !LabelIDs.includes(labelID) ||
        (address && AddressID !== address) ||
        (begin && Time < begin) ||
        (end && Time > end) ||
        (from && !sender.some((string) => string.includes(from))) ||
        (to && !recipients.some((string) => string.includes(to))) ||
        (typeof attachments !== 'undefined' &&
            ((attachments === 0 && NumAttachments > 0) || (attachments === 1 && NumAttachments === 0))) ||
        (typeof decryptionError !== 'undefined' && decryptionError !== messageError) ||
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
    normalisedSearchParams: NormalisedSearchParams,
    previousNormSearchParams: NormalisedSearchParams
) => {
    const {
        labelID,
        filter,
        search: { address, from, to, begin, end, attachments },
        normalisedKeywords,
        decryptionError,
    } = normalisedSearchParams;
    const {
        labelID: prevLabelID,
        filter: prevFilter,
        search: {
            address: prevAddress,
            from: prevFrom,
            to: prevTo,
            begin: prevBegin,
            end: prevEnd,
            attachments: prevAttachments,
        },
        normalisedKeywords: prevNormalisedKeywords,
        decryptionError: prevDecryptionError,
    } = previousNormSearchParams;

    // In case search parameters are different, then a new search is needed
    if (
        labelID !== prevLabelID ||
        address !== prevAddress ||
        from !== prevFrom ||
        to !== prevTo ||
        begin !== prevBegin ||
        end !== prevEnd ||
        attachments !== prevAttachments ||
        decryptionError !== prevDecryptionError ||
        !!normalisedKeywords !== !!prevNormalisedKeywords ||
        filter?.Unread !== prevFilter?.Unread
    ) {
        return false;
    }

    // Same goes for keywords
    if (normalisedKeywords && prevNormalisedKeywords) {
        if (normalisedKeywords.length !== prevNormalisedKeywords.length) {
            return false;
        }
        for (let i = 0; i < normalisedKeywords.length; i++) {
            if (normalisedKeywords[i] !== prevNormalisedKeywords[i]) {
                return false;
            }
        }
    }

    return true;
};
