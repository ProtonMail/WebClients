import type { Reducer } from 'redux';

import { partialMerge } from '../../../utils/object/merge';
import { promptDismissed, promptsReset } from './actions';
import type { PromptId, PromptsState } from './types';

const reducer: Reducer<PromptsState> = (state = {}, action) => {
    if (promptDismissed.match(action)) {
        const { id, dismissedAt } = action.payload;
        const prev = state[id];

        return partialMerge<PromptsState>(state, {
            [id as PromptId]: { count: (prev?.count ?? 0) + 1, lastDismissedAt: dismissedAt },
        });
    }

    if (promptsReset.match(action)) return {};

    return state;
};

export default reducer;
