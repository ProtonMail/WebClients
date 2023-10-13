import type { AnyAction, Reducer } from 'redux';

import { invalidateRequest, setRequestProgress } from '@proton/pass/store/actions';
import type { RequestType } from '@proton/pass/store/actions/with-request';
import { isActionWithRequest } from '@proton/pass/store/actions/with-request';
import { objectDelete } from '@proton/pass/utils/object/delete';
import { partialMerge } from '@proton/pass/utils/object/merge';
import { getEpoch } from '@proton/pass/utils/time/get-epoch';

export type RequestEntry<T extends RequestType = RequestType> = Extract<
    | { status: 'start'; progress?: number }
    | { status: 'success'; expiresAt?: number }
    | { status: 'failure'; expiresAt?: number },
    { status: T }
>;

export type RequestState = { [requestId: string]: RequestEntry };

export const sanitizeRequestState = (state: RequestState): RequestState => {
    if (Object.keys(state).length === 0) {
        return state;
    }

    return Object.fromEntries(
        Object.entries(state).filter(([, { status }]) => status !== 'success' && status !== 'failure')
    );
};

const requestReducer: Reducer<RequestState> = (state = {}, action: AnyAction) => {
    if (isActionWithRequest(action)) {
        const { request } = action.meta;
        const nextState = { ...state };

        const entry: RequestEntry = (() => {
            switch (request.type) {
                case 'start':
                    return { status: request.type, progress: 0 };
                case 'failure':
                case 'success':
                    return {
                        status: request.type,
                        ...(request.maxAge ? { expiresAt: getEpoch() + request.maxAge } : { expiresAt: undefined }),
                    };
            }
        })();

        nextState[request.id] = entry;
        return nextState;
    }

    if (setRequestProgress.match(action) && state[action.payload.requestId]?.status === 'start') {
        return partialMerge(state, { [action.payload.requestId]: { progress: action.payload.progress } });
    }

    if (invalidateRequest.match(action)) return objectDelete(state, action.payload.requestId);

    return state;
};

export default requestReducer;
