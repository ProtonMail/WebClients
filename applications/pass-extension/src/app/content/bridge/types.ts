import type { MessageFailure, Unpack, WorkerMessage, WorkerResponse } from '@proton/pass/types';

import type { ALLOWED_MESSAGES, BRIDGE_REQUEST, BRIDGE_RESPONSE } from './constants';

export type BridgeMessageType = Unpack<typeof ALLOWED_MESSAGES>;
export type BridgeMessage<T extends BridgeMessageType = BridgeMessageType> = Extract<WorkerMessage, { type: T }>;

export type BridgeRequest<T extends BridgeMessageType = BridgeMessageType> = {
    request: BridgeMessage<T>;
    token: string;
    type: typeof BRIDGE_REQUEST;
};

export type BridgeResponse<T extends BridgeMessageType = BridgeMessageType> = {
    response: WorkerResponse<BridgeMessage<T>> | MessageFailure;
    token: string;
    type: typeof BRIDGE_RESPONSE;
};
