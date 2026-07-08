import type { MeetCoreErrorEnum } from '@proton-meet/proton-meet-core';

import type { MeetCoreClient } from './MeetCoreClient';

export interface MeetCoreInitParams {
    env: string;
    appVersion: string;
    userAgent: string;
    dbPath: string;
    httpHost: string;
    wsHost: string;
    userId: string;
    uid: string;
}

export interface MeetCoreCookieAckMessage {
    type: 'meet-core:cookie-ack';
    id: number;
    ok: boolean;
    error?: string;
}

export type MeetCoreCookieBridgeRequestMessage =
    | { type: 'meet-core:set-ws-cookie'; id: number; cookie: string }
    | { type: 'meet-core:clear-ws-cookie'; id: number; cookie: string };

export type MeetCoreWorkerEventMessage =
    | { type: 'meet-core:event:new-group-key' }
    | {
          type: 'meet-core:event:livekit-admin-change';
          roomId: string;
          participantUid: string;
          participantType: number;
      }
    | { type: 'meet-core:event:disconnection' }
    | {
          type: 'meet-core:event:mls-sync-state';
          state: number;
          reason?: number;
      };

export interface MeetCoreWorkerFailureMessage {
    type: 'meet-core:worker-failure';
    message: string;
}

export type MeetCoreRpcMethod = Exclude<keyof MeetCoreClient, 'dispose'>;

export type MeetCoreRpcMethodMap = {
    [Method in MeetCoreRpcMethod]: {
        params: Parameters<MeetCoreClient[Method]>;
        result: Awaited<ReturnType<MeetCoreClient[Method]>>;
    };
};

export type MeetCoreRpcResult = MeetCoreRpcMethodMap[MeetCoreRpcMethod]['result'];

export interface MeetCoreInitRequestMessage {
    type: 'meet-core:init';
    id: number;
    params: MeetCoreInitParams;
}

export type MeetCoreRpcRequestMessage = {
    [Method in MeetCoreRpcMethod]: {
        type: 'meet-core:rpc';
        id: number;
        method: Method;
        params: MeetCoreRpcMethodMap[Method]['params'];
    };
}[MeetCoreRpcMethod];

export interface MeetCoreInitSuccessResponseMessage {
    type: 'meet-core:init-result';
    id: number;
    ok: true;
}

export interface MeetCoreWorkerErrorEnumPayload {
    kind: 'meet-core-error-enum';
    value: MeetCoreErrorEnum;
}

export interface MeetCoreWorkerGenericErrorPayload {
    kind: 'error';
    message: string;
    stack?: string;
}

export type MeetCoreWorkerError = MeetCoreWorkerErrorEnumPayload | MeetCoreWorkerGenericErrorPayload;

export interface MeetCoreInitFailureResponseMessage {
    type: 'meet-core:init-result';
    id: number;
    ok: false;
    error: MeetCoreWorkerError;
}

export type MeetCoreRpcSuccessResponseMessage = {
    [Method in MeetCoreRpcMethod]: {
        type: 'meet-core:rpc-result';
        id: number;
        method: Method;
        ok: true;
        result: MeetCoreRpcMethodMap[Method]['result'];
    };
}[MeetCoreRpcMethod];

export interface MeetCoreRpcFailureResponseMessage {
    type: 'meet-core:rpc-result';
    id: number;
    method: MeetCoreRpcMethod;
    ok: false;
    error: MeetCoreWorkerError;
}

export type MeetCoreWorkerRequestMessage =
    | MeetCoreInitRequestMessage
    | MeetCoreRpcRequestMessage
    | MeetCoreCookieAckMessage;

export type MeetCoreWorkerResponseMessage =
    | MeetCoreInitSuccessResponseMessage
    | MeetCoreInitFailureResponseMessage
    | MeetCoreRpcSuccessResponseMessage
    | MeetCoreRpcFailureResponseMessage
    | MeetCoreCookieBridgeRequestMessage
    | MeetCoreWorkerEventMessage
    | MeetCoreWorkerFailureMessage;
