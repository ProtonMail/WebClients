import type { NormalizedSearchParams } from '@proton/encrypted-search/models/mail';
import { isCategoryLabel } from '@proton/mail/helpers/location';
import { Expression, Func, TermValue } from '@proton/proton-foundation-search';

import { normalizeIndexedEmail } from '../engine/addresses';

/**
 * Matches the input against every address of the given attributes: its email (tag or text) and display name.
 * Fuzzy (`Matches`) and order-free, like keywords: content search results are ordered results (see
 * `providesOrderedResults`), which the element list doesn't filter again on sender and recipients, so whatever the
 * engine finds is listed.
 */
function createAddressQuery(attributeNames: [string, ...string[]], input: string | undefined): Expression | undefined {
    // Normalized like the indexed emails, so that a full address hits the email tag regardless of case.
    const term = normalizeIndexedEmail(input);
    if (!term) {
        return undefined;
    }
    return attributeNames
        .map((attributeName) => {
            return Expression.attr(attributeName, Func.Matches, TermValue.text(term));
        })
        .reduce((previousExp, exp) => {
            return previousExp.or(exp);
        });
}

function createBasicQuery(query: string): Expression {
    return Expression.attr('body', Func.Matches, TermValue.text(query))
        .or(Expression.attr('subject', Func.Matches, TermValue.text(query)))
        .or(Expression.attr('attachment', Func.Matches, TermValue.text(query)));
}

function anyLabel(labelIds: string[]): Expression | undefined {
    return labelIds.reduce(
        (previousExp, labelId) => {
            const exp = Expression.attr('labelId', Func.Equals, TermValue.text(labelId));
            return previousExp ? previousExp.or(exp) : exp;
        },
        undefined as Expression | undefined
    );
}

function createExtentedQuery(params: {
    keywords?: string;
    from?: string;
    to?: string;
    addressId?: string;
    afterDate?: number;
    beforeDate?: number;
    labelIds?: string[];
    hasAttachments?: boolean;
}): Expression {
    let exp: Expression | undefined = undefined;
    const and = (partialExp: Expression): Expression => {
        return exp ? exp.and(partialExp) : partialExp;
    };

    if (params.keywords !== undefined) {
        try {
            exp = and(Expression.parse(params.keywords));
        } catch {
            exp = and(createBasicQuery(params.keywords));
        }
    }

    const fromExp = createAddressQuery(['from'], params.from);
    if (fromExp) {
        exp = and(fromExp);
    }
    const toExp = createAddressQuery(['to', 'cc', 'bcc'], params.to);
    if (toExp) {
        exp = and(toExp);
    }
    if (params.addressId !== undefined) {
        exp = and(Expression.attr('addressId', Func.Equals, TermValue.text(params.addressId)));
    }
    if (params.afterDate !== undefined) {
        exp = and(Expression.attr('time', Func.GreaterThanOrEqual, TermValue.int(BigInt(params.afterDate))));
    }
    if (params.beforeDate !== undefined) {
        exp = and(Expression.attr('time', Func.LessThanOrEqual, TermValue.int(BigInt(params.beforeDate))));
    }
    if (params.labelIds !== undefined) {
        // A category narrows the mailbox down rather than widening it: Primary means in the inbox AND in the
        // Primary category, so a message moved out of the inbox, which keeps its category, must not match.
        const mailboxLabelIds = params.labelIds.filter((id) => {
            return !isCategoryLabel(id);
        });
        const categoryLabelIds = params.labelIds.filter((id) => {
            return isCategoryLabel(id);
        });
        for (const labelsExp of [anyLabel(mailboxLabelIds), anyLabel(categoryLabelIds)]) {
            if (labelsExp) {
                exp = and(labelsExp);
            }
        }
    }
    if (params.hasAttachments !== undefined) {
        exp = and(Expression.attr('hasAttachments', Func.Equals, TermValue.bool(params.hasAttachments)));
    }
    if (exp) {
        return exp;
    } else {
        // this won't match anything
        return Expression.parse('');
    }
}

export const buildQuery = (params: NormalizedSearchParams) => {
    return createExtentedQuery({
        keywords: params.search.keyword,
        from: params.search.from,
        to: params.search.to,
        afterDate: params.search.begin,
        beforeDate: params.search.end,
        labelIds: params.labelIDs,
        addressId: params.search.address,
        hasAttachments: params.filter.Attachments === 1 ? true : undefined,
    });
};
