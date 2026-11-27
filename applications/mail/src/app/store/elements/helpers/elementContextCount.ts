import type { Draft } from 'immer';

import {
    filterElementsInState,
    getContextIdentifierFromParams,
    getSearchParameters,
    parseElementContextIdentifier,
} from '../../../helpers/elements';
import type { ElementsState } from '../elementsTypes';

export const computeContextTotals = (state: Draft<ElementsState>): Record<string, number> => {
    const currentContextIdentifier = getContextIdentifierFromParams(state.params);
    const elements = Object.values(state.elements);
    const counts: Record<string, number> = {};

    Object.keys(state.total).forEach((contextIdentifier) => {
        // The total of an ordered search result is derived from the list itself (see `contextTotal`)
        if (state.orderedSearchResultIDs[contextIdentifier]) {
            return;
        }

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

export const updateDeletedSinceLastLoadFromContextTotals = ({
    state,
    countsBeforeAction,
    countsAfterAction,
}: {
    state: Draft<ElementsState>;
    countsBeforeAction: Record<string, number>;
    countsAfterAction: Record<string, number>;
}) => {
    const currentContextIdentifier = getContextIdentifierFromParams(state.params);

    const removedCount =
        (countsBeforeAction[currentContextIdentifier] ?? 0) - (countsAfterAction[currentContextIdentifier] ?? 0);

    if (removedCount > 0) {
        state.deletedSinceLastLoad += removedCount;
    }
};
