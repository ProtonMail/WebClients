import type {
    MaybeMessage,
    MessageFailure,
    WorkerMessage,
    WorkerMessageType,
    WorkerResponse,
} from 'proton-pass-extension/types/messages';

import type { PasskeyCreateBridgeResponse, PasskeyGetResponse } from '@proton/pass/lib/passkeys/types';
import type { Unpack } from '@proton/pass/types/utils/index';

import type { ALLOWED_MESSAGES, BRIDGE_REQUEST, BRIDGE_RESPONSE } from './constants';

export type BridgeMessageType = Unpack<typeof ALLOWED_MESSAGES>;
export type BridgeMessage<T extends BridgeMessageType = BridgeMessageType> = Extract<WorkerMessage, { type: T }>;
export type AbstractBridgeMessage<T extends string = string> = { token: string; type: T };

type AssertExhaustiveBridgeMessageResponseMap<M extends Record<BridgeMessageType, unknown>> = M;

type BridgeMessageResponseMap = AssertExhaustiveBridgeMessageResponseMap<{
    [WorkerMessageType.PASSKEY_CREATE]: PasskeyCreateBridgeResponse;
    [WorkerMessageType.PASSKEY_GET]: PasskeyGetResponse;
    [WorkerMessageType.PASSKEY_INTERCEPT]: { intercept: boolean };
}>;

export type BridgeWorkerResponse<T extends BridgeMessage> = T extends { type: infer U }
    ? U extends keyof BridgeMessageResponseMap
        ? MaybeMessage<BridgeMessageResponseMap[U]>
        : WorkerResponse<T>
    : never;

export type BridgeRequest<T extends BridgeMessageType = BridgeMessageType> = AbstractBridgeMessage<
    typeof BRIDGE_REQUEST
> & { request: BridgeMessage<T> };

export type BridgeResponse<T extends BridgeMessageType = BridgeMessageType> = AbstractBridgeMessage<
    typeof BRIDGE_RESPONSE
> & { response: BridgeWorkerResponse<BridgeMessage<T>> | MessageFailure };
