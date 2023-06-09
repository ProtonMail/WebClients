import type { AnyAction, Reducer } from 'redux';

import { merge, objectDelete } from '@proton/pass/utils/object';
import { getEpoch } from '@proton/pass/utils/time';

import { acknowledgeRequest } from '../actions';
import { type RequestType, type WithRequest, isActionWithRequest } from '../actions/with-request';

export type RequestEntry = { status: RequestType; requestedAt: number };
export type RequestState = { [requestId: string]: RequestEntry };

export const sanitizeRequestState = (state: RequestState): RequestState => {
    if (Object.keys(state).length === 0) {
        return state;
    }

    return Object.fromEntries(
        Object.entries(state).filter(([, { status }]) => status !== 'success' && status !== 'failure')
    );
};

const requestReducer: Reducer<RequestState> = (state = {}, action: AnyAction | WithRequest<AnyAction>) => {
    if (isActionWithRequest(action)) {
        const { request } = action.meta;
        return merge<RequestState, Record<string, Partial<RequestEntry>>>(state, {
            [request.id]: {
                status: request.type,
                ...(request.type === 'start' ? { requestedAt: getEpoch() } : {}),
            },
        });
    }

    if (acknowledgeRequest.match(action)) {
        return objectDelete(state, action.payload.requestId);
    }

    return state;
};

export default requestReducer;
