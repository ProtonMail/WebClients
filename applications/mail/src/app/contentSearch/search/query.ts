import type { NormalizedSearchParams } from '@proton/encrypted-search/models/mail';
import { isCategoryLabel } from '@proton/mail/helpers/location';
import { Expression, Func, TermValue } from '@proton/proton-foundation-search';

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
    sender?: string;
    recipient?: string;
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

    if (params.sender !== undefined) {
        exp = and(Expression.attr('sender', Func.Equals, TermValue.text(params.sender)));
    }
    if (params.recipient !== undefined) {
        exp = and(Expression.attr('recipient', Func.Equals, TermValue.text(params.recipient)));
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
        sender: params.search.from,
        recipient: params.search.to,
        afterDate: params.search.begin,
        beforeDate: params.search.end,
        labelIds: params.labelIDs,
        addressId: params.search.address,
        hasAttachments: params.filter.Attachments === 1 ? true : undefined,
    });
};
