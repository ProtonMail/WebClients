import type { Action, Reducer } from 'redux';

import { requestInvalidate, requestProgress } from '@proton/pass/store/actions';
import type { RequestType } from '@proton/pass/store/actions/enhancers/request';
import { isActionWithRequest } from '@proton/pass/store/actions/enhancers/request';
import { objectDelete } from '@proton/pass/utils/object/delete';
import { partialMerge } from '@proton/pass/utils/object/merge';
import { getEpoch } from '@proton/pass/utils/time/epoch';

export type RequestEntry<Type extends RequestType = RequestType, Data = any> = Extract<
    | { status: 'start'; progress?: number }
    | { status: 'success'; expiresAt?: number }
    | { status: 'failure'; expiresAt?: number },
    { status: Type }
> & { data: Data };

export type RequestState = { [requestId: string]: RequestEntry };

const requestReducer: Reducer<RequestState> = (state = {}, action: Action) => {
    if (isActionWithRequest(action)) {
        const { request } = action.meta;
        const nextState = { ...state };

        switch (request.type) {
            case 'start':
                nextState[request.id] = {
                    status: request.type,
                    progress: 0,
                    data: 'data' in request ? request.data : undefined,
                };
                return nextState;

            case 'progress':
                const ongoing = nextState[request.id];
                if (ongoing?.status !== 'start') return state;
                nextState[request.id] = { ...ongoing, progress: request.progress };
                return nextState;

            case 'failure':
            case 'success':
                nextState[request.id] = {
                    status: request.type,
                    data: 'data' in request ? request.data : undefined,
                    ...(request.maxAge ? { expiresAt: getEpoch() + request.maxAge } : { expiresAt: undefined }),
                };
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
