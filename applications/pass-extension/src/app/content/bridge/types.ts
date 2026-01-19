import type { MessageFailure, WorkerMessage, WorkerResponse } from 'proton-pass-extension/types/messages';

import type { Unpack } from '@proton/pass/types/utils/index';

import type { ALLOWED_MESSAGES, BRIDGE_REQUEST, BRIDGE_RESPONSE } from './constants';

export type BridgeMessageType = Unpack<typeof ALLOWED_MESSAGES>;
export type BridgeMessage<T extends BridgeMessageType = BridgeMessageType> = Extract<WorkerMessage, { type: T }>;
export type AbstractBridgeMessage<T extends string = string> = { token: string; type: T };

export type BridgeRequest<T extends BridgeMessageType = BridgeMessageType> = AbstractBridgeMessage<
    typeof BRIDGE_REQUEST
> & { request: BridgeMessage<T> };

export type BridgeResponse<T extends BridgeMessageType = BridgeMessageType> = AbstractBridgeMessage<
    typeof BRIDGE_RESPONSE
> & { response: WorkerResponse<BridgeMessage<T>> | MessageFailure };
