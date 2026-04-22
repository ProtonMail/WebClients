import type { Draft } from 'immer';

import {
    filterElementsInState,
    getElementContextIdentifier,
    getSearchParameters,
    parseElementContextIdentifier,
} from 'proton-mail/helpers/elements';

import type { ElementsState } from '../elementsTypes';

export const computeContextTotals = (state: Draft<ElementsState>): Record<string, number> => {
    const currentContextIdentifier = getElementContextIdentifier({
        labelID: state.params.labelID,
        categoryIDs: state.params.categoryIDs,
        conversationMode: state.params.conversationMode,
        filter: state.params.filter,
        sort: state.params.sort,
        from: state.params.search?.from,
        to: state.params.search?.to,
        address: state.params.search?.address,
        begin: state.params.search?.begin,
        end: state.params.search?.end,
        keyword: state.params.search?.keyword,
    });
    const elements = Object.values(state.elements);
    const counts: Record<string, number> = {};

    Object.keys(state.total).forEach((contextIdentifier) => {
        const context = parseElementContextIdentifier(contextIdentifier);
        if (!context) {
            return;
        }

        counts[contextIdentifier] = filterElementsInState({
            elements,
            bypassFilter: currentContextIdentifier === contextIdentifier ? state.bypassFilter : [],
            labelID: context.labelID,
            categoryIDs: context.categoryIDs,
            filter: context.filter || {},
            conversationMode: context.conversationMode,
            search: getSearchParameters(context),
            newsletterSubscriptionID: context.newsletterSubscriptionID,
        }).length;
    });

    return counts;
};

export const updateContextTotals = ({
    state,
    countsBeforeAction,
    countsAfterAction,
}: {
    state: Draft<ElementsState>;
    countsBeforeAction: Record<string, number>;
    countsAfterAction: Record<string, number>;
}) => {
    Object.keys(state.total).forEach((contextIdentifier) => {
        const countBefore = countsBeforeAction[contextIdentifier] ?? 0;
        const countAfter = countsAfterAction[contextIdentifier] ?? 0;
        const totalBefore = state.total[contextIdentifier] || 0;
        state.total[contextIdentifier] = totalBefore - (countBefore - countAfter);
    });
};
