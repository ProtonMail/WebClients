import type { Reducer } from 'redux';

import { assignedModelIdUpdated } from '@proton/pass/store/actions/creators/assigned-model-id';
import type { MaybeNull } from '@proton/pass/types';

/** Assigned model ID — distinct from the model actually used for a given page load. */
export type AssignedModelIdState = MaybeNull<string>;

const reducer: Reducer<AssignedModelIdState> = (state = null, action) => {
    if (assignedModelIdUpdated.match(action)) return action.payload;
    return state;
};

export default reducer;
