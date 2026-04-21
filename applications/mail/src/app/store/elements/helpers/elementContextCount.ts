import type { Draft } from 'immer';

import {
    filterElementsInState,
    getElementContextIdentifier,
    getSearchParameters,
    parseElementContextIdentifier,
} from 'proton-mail/helpers/elements';

import type { ElementsState } from '../elementsTypes';

/**
 * Compute the number of elements matching each cached context filter.
 * Called before mutations to snapshot the counts without cloning the entire store.
 */
export const computeFilteredCounts = (state: Draft<ElementsState>): Record<string, number> => {
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

/**
 * Update all the context of the store to reflect the change that was just made.
 * Compares the element counts before and after the action to compute the new total for each cached context.
 */
export const updateContextTotal = ({
    state,
    countsBeforeAction,
}: {
    state: Draft<ElementsState>;
    countsBeforeAction: Record<string, number>;
}) => {
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

    Object.keys(state.total).forEach((contextIdentifier) => {
        const context = parseElementContextIdentifier(contextIdentifier);
        if (!context) {
            return;
        }

        const countBefore = countsBeforeAction[contextIdentifier] ?? 0;

        const countAfter = filterElementsInState({
            elements,
            bypassFilter: currentContextIdentifier === contextIdentifier ? state.bypassFilter : [],
            labelID: context.labelID,
            categoryIDs: context.categoryIDs,
            filter: context.filter || {},
            conversationMode: context.conversationMode,
            search: getSearchParameters(context),
            newsletterSubscriptionID: context.newsletterSubscriptionID,
        }).length;

        const totalBefore = state.total[contextIdentifier] || 0;

        // The new total is the current total minus the difference between the number of elements before and after filtering
        state.total[contextIdentifier] = totalBefore - (countBefore - countAfter);
    });
};
