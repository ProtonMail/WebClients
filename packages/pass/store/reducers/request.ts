import type { AnyAction, Reducer } from 'redux';

import { requestInvalidate, requestProgress } from '@proton/pass/store/actions';
import type { RequestType } from '@proton/pass/store/actions/with-request';
import { isActionWithRequest } from '@proton/pass/store/actions/with-request';
import { objectDelete } from '@proton/pass/utils/object/delete';
import { partialMerge } from '@proton/pass/utils/object/merge';
import { getEpoch } from '@proton/pass/utils/time/epoch';

export type RequestEntry<Type extends RequestType = RequestType, Data = undefined> = Extract<
    | { status: 'start'; progress?: number }
    | { status: 'success'; expiresAt?: number }
    | { status: 'failure'; expiresAt?: number },
    { status: Type }
> & { data: Data };

export type RequestState = { [requestId: string]: RequestEntry };

const requestReducer: Reducer<RequestState> = (state = {}, action: AnyAction) => {
    if (isActionWithRequest(action)) {
        const { request } = action.meta;
        const nextState = { ...state };

        const entry = ((): RequestEntry<RequestType, any> => {
            switch (request.type) {
                case 'start':
                    return { status: request.type, progress: 0, data: undefined };
                default:
                    return {
                        status: request.type,
                        data: 'data' in request ? request.data : undefined,
                        ...(request.maxAge ? { expiresAt: getEpoch() + request.maxAge } : { expiresAt: undefined }),
                    };
            }
        })();

        nextState[request.id] = entry;
        return nextState;
    }

    if (requestProgress.match(action) && state[action.payload.requestId]?.status === 'start') {
        return partialMerge(state, { [action.payload.requestId]: { progress: action.payload.progress } });
    }

    if (requestInvalidate.match(action)) return objectDelete(state, action.payload.requestId);

    return state;
};

export default requestReducer;
