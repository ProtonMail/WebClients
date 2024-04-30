import type { Action, Reducer } from 'redux';

import { objectDelete } from '@proton/pass/utils/object/delete';
import { partialMerge } from '@proton/pass/utils/object/merge';
import { getEpoch } from '@proton/pass/utils/time/epoch';

import { requestInvalidate, requestProgress } from './actions';
import type { RequestState } from './types';
import { isActionWithRequest } from './utils';

const requestReducer: Reducer<RequestState> = (state = {}, action: Action) => {
    if (isActionWithRequest(action)) {
        const { request } = action.meta;
        const nextState = { ...state };
        const data = request.data && 'payload' in action ? action.payload : undefined;

        switch (request.status) {
            case 'start':
                nextState[request.id] = { status: 'start', progress: 0, data };
                return nextState;

            case 'progress':
                const ongoing = nextState[request.id];
                if (ongoing?.status !== 'start') return state;
                nextState[request.id] = { ...ongoing, progress: request.progress, data };
                return nextState;

            case 'failure':
                nextState[request.id] = { status: request.status, data };
                return nextState;

            case 'success':
                const now = getEpoch();
                nextState[request.id] = { status: request.status, maxAge: request.maxAge, requestedAt: now, data };
                return nextState;
        }
    }

    if (requestProgress.match(action) && state[action.payload.requestId]?.status === 'start') {
        return partialMerge(state, { [action.payload.requestId]: { progress: action.payload.progress } });
    }

    if (requestInvalidate.match(action)) return objectDelete(state, action.payload.requestId);

    return state;
};

export default requestReducer;
