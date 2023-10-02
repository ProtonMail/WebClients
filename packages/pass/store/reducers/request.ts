import type { AnyAction, Reducer } from 'redux';

import { objectDelete } from '@proton/pass/utils/object';
import { getEpoch } from '@proton/pass/utils/time';

import { invalidateRequest } from '../actions';
import { type RequestType, isActionWithRequest } from '../actions/with-request';

export type RequestEntry<T extends RequestType = RequestType> = Extract<
    { status: 'start' } | { status: 'success'; expiresAt?: number } | { status: 'failure'; expiresAt?: number },
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
                    return { status: request.type };
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

    if (invalidateRequest.match(action)) {
        return objectDelete(state, action.payload.requestId);
    }

    return state;
};

export default requestReducer;
