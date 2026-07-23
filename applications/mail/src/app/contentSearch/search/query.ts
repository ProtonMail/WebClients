import type { NormalizedSearchParams } from '@proton/encrypted-search/lib/models';
import { Expression, Func, TermValue } from '@proton/proton-foundation-search';

function createBasicQuery(query: string): Expression {
    return Expression.attr('body', Func.Matches, TermValue.text(query)).or(
        Expression.attr('subject', Func.Matches, TermValue.text(query))
    );
}

function createExtentedQuery(params: {
    keywords: string;
    sender?: string;
    recipient?: string;
    addressId?: string;
    afterDate?: number;
    beforeDate?: number;
    labelIds?: string[];
    hasAttachments?: boolean;
}): Expression {
    let exp = undefined;
    try {
        exp = Expression.parse(params.keywords);
    } catch {
        exp = createBasicQuery(params.keywords);
    }

    if (params.sender !== undefined) {
        exp = exp.and(Expression.attr('sender', Func.Equals, TermValue.text(params.sender)));
    }
    if (params.recipient !== undefined) {
        exp = exp.and(Expression.attr('recipient', Func.Equals, TermValue.text(params.recipient)));
    }
    if (params.addressId !== undefined) {
        exp = exp.and(Expression.attr('addressId', Func.Equals, TermValue.text(params.addressId)));
    }
    if (params.afterDate !== undefined) {
        exp = exp.and(Expression.attr('time', Func.GreaterThanOrEqual, TermValue.int(BigInt(params.afterDate))));
    }
    if (params.beforeDate !== undefined) {
        exp = exp.and(Expression.attr('time', Func.LessThanOrEqual, TermValue.int(BigInt(params.beforeDate))));
    }
    if (params.labelIds !== undefined) {
        const labelsExp = params.labelIds.reduce(
            (previousExp, labelId) => {
                const exp = Expression.attr('labelId', Func.Equals, TermValue.text(labelId));
                return previousExp ? previousExp.or(exp) : exp;
            },
            undefined as Expression | undefined
        );
        if (labelsExp) {
            exp = exp.and(labelsExp);
        }
    }
    if (params.hasAttachments !== undefined) {
        exp = exp.and(Expression.attr('hasAttachments', Func.Equals, TermValue.bool(params.hasAttachments)));
    }
    return exp;
}

export const buildQuery = (params: NormalizedSearchParams) =>
    createExtentedQuery({
        keywords: params.search.keyword ?? params.normalizedKeywords?.join(' ') ?? '',
        sender: params.search.from,
        recipient: params.search.to,
        afterDate: params.search.begin,
        beforeDate: params.search.end,
        labelIds: params.labelIDs,
        addressId: params.search.address,
        hasAttachments: params.filter.Attachments === 1 ? true : undefined,
    });
