import type { Maybe } from '@proton/pass/types';

import type { OptimisticFailedHistoryItem, WrappedOptimisticState } from '../types';
import { isOptimisticHistoryItemWithId } from '../utils/assertions';

const selectFailedAction: (
    optimisticId: string
) => <T extends WrappedOptimisticState = WrappedOptimisticState>(state: T) => Maybe<OptimisticFailedHistoryItem> =
    (optimisticId) => (state) => {
        const { optimistic } = state;
        const { history } = optimistic;

        const failedHistoryItemIndex = history.findIndex(isOptimisticHistoryItemWithId(optimisticId, { failed: true }));

        return failedHistoryItemIndex !== -1
            ? (history[failedHistoryItemIndex] as OptimisticFailedHistoryItem)
            : undefined;
    };

export default selectFailedAction;
