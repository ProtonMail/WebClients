import type { MessageFailure, Unpack, WorkerMessage, WorkerResponse } from '@proton/pass/types';

import type { ALLOWED_MESSAGES, BRIDGE_REQUEST, BRIDGE_RESPONSE } from './constants';

export type BridgeMessage = Extract<WorkerMessage, { type: Unpack<typeof ALLOWED_MESSAGES> }>;

export type BridgeRequest<T extends BridgeMessage = BridgeMessage> = {
    request: T;
    token: string;
    type: typeof BRIDGE_REQUEST;
};

export type BridgeResponse<T extends BridgeMessage = BridgeMessage> = {
    response: WorkerResponse<T> | MessageFailure;
    token: string;
    type: typeof BRIDGE_RESPONSE;
};
