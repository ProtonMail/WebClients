import initWasm, { App, MeetCoreErrorEnum } from '@proton-meet/proton-meet-core';

import type {
    MeetCoreCookieAckMessage,
    MeetCoreInitFailureResponseMessage,
    MeetCoreInitRequestMessage,
    MeetCoreInitSuccessResponseMessage,
    MeetCoreRpcFailureResponseMessage,
    MeetCoreRpcRequestMessage,
    MeetCoreRpcResult,
    MeetCoreRpcSuccessResponseMessage,
    MeetCoreWorkerError,
    MeetCoreWorkerEventMessage,
    MeetCoreWorkerFailureMessage,
    MeetCoreWorkerRequestMessage,
} from './meetCoreWorkerProtocol';

interface WorkerCallbackGlobals extends DedicatedWorkerGlobalScope {
    newGroupKeyEvent?: {
        new_group_key_for: () => Promise<void>;
    };
    livekitAdminChangeEvent?: {
        on_livekit_admin_changed: (
            roomId: string,
            participantUid: string,
            participantType: number
        ) => Promise<void>;
    };
    disconnectionEvent?: {
        disconnection_handler: () => Promise<void>;
    };
    mlsSyncStateChangeEvent?: {
        on_mls_sync_state_changed: (state: number, failedReason?: number) => Promise<void>;
    };
}

const workerGlobal = self as WorkerCallbackGlobals;

const meetCoreErrorEnumValues = new Set<number>(
    Object.values(MeetCoreErrorEnum).filter((value): value is number => typeof value === 'number')
);

let wasmInitialized = false;
let app: App | null = null;

const ensureWasmInitialized = async () => {
    if (wasmInitialized) {
        return;
    }
    await initWasm();
    wasmInitialized = true;
};

const getApp = () => {
    if (!app) {
        throw new Error('Meet core worker app is not initialized');
    }
    return app;
};

const toWorkerError = (error: Error | string | number | null | undefined): MeetCoreWorkerError => {
    if (typeof error === 'number' && meetCoreErrorEnumValues.has(error)) {
        return { kind: 'meet-core-error-enum', value: error };
    }

    if (error instanceof Error) {
        return {
            kind: 'error',
            message: error.message,
            stack: error.stack,
        };
    }

    return {
        kind: 'error',
        message: String(error ?? 'Unknown meet-core worker error'),
    };
};

const toFailureMessage = (error: Error | string | number | null | undefined): MeetCoreWorkerFailureMessage => {
    const workerError = toWorkerError(error);
    return {
        type: 'meet-core:worker-failure',
        message: workerError.kind === 'error' ? workerError.message : `MeetCoreErrorEnum:${workerError.value}`,
    };
};

const installWorkerCallbackNamespaces = () => {
    workerGlobal.newGroupKeyEvent = {
        new_group_key_for: async () => {
            const message: MeetCoreWorkerEventMessage = { type: 'meet-core:event:new-group-key' };
            workerGlobal.postMessage(message);
        },
    };

    workerGlobal.livekitAdminChangeEvent = {
        on_livekit_admin_changed: async (roomId: string, participantUid: string, participantType: number) => {
            const message: MeetCoreWorkerEventMessage = {
                type: 'meet-core:event:livekit-admin-change',
                roomId,
                participantUid,
                participantType,
            };
            workerGlobal.postMessage(message);
        },
    };

    workerGlobal.disconnectionEvent = {
        disconnection_handler: async () => {
            const message: MeetCoreWorkerEventMessage = { type: 'meet-core:event:disconnection' };
            workerGlobal.postMessage(message);
        },
    };

    workerGlobal.mlsSyncStateChangeEvent = {
        on_mls_sync_state_changed: async (state: number, failedReason?: number) => {
            const message: MeetCoreWorkerEventMessage = {
                type: 'meet-core:event:mls-sync-state',
                state,
                reason: failedReason,
            };
            workerGlobal.postMessage(message);
        },
    };
};

const handleInit = async (request: MeetCoreInitRequestMessage) => {
    await ensureWasmInitialized();
    installWorkerCallbackNamespaces();

    const { env, appVersion, userAgent, dbPath, httpHost, wsHost, userId, uid } = request.params;

    app = await new App(env, appVersion, userAgent, dbPath, httpHost, wsHost, userId, uid);
    app.setWorkerCookieBridgeEnabled(true);
};

const handleRpcRequest = async (request: MeetCoreRpcRequestMessage): Promise<MeetCoreRpcResult> => {
    const activeApp = getApp();

    switch (request.method) {
        case 'ping':
            return activeApp.ping();
        case 'joinMeetingWithAccessToken':
            return activeApp.joinMeetingWithAccessToken(...request.params);
        case 'joinMeetingWithAccessTokenWithSwitchJoinType':
            return activeApp.joinMeetingWithAccessTokenWithSwitchJoinType(...request.params);
        case 'joinRoomWithProposal':
            return activeApp.joinRoomWithProposal(...request.params);
        case 'leaveMeeting':
            return activeApp.leaveMeeting();
        case 'triggerWebSocketReconnect':
            return activeApp.triggerWebSocketReconnect();
        case 'getJoinType':
            return activeApp.getJoinType(...request.params);
        case 'getGroupKey': {
            const groupKeyInfo = await activeApp.getGroupKey();
            return { key: groupKeyInfo.key, epoch: groupKeyInfo.epoch };
        }
        case 'getGroupDisplayCode': {
            const groupDisplayCode = await activeApp.getGroupDisplayCode();
            return { full_code: groupDisplayCode.full_code };
        }
        case 'isMlsUpToDate':
            return activeApp.isMlsUpToDate();
        case 'isWebsocketHasReconnected':
            return activeApp.isWebsocketHasReconnected();
        case 'getWsState':
            return activeApp.getWsState();
        case 'setMlsGroupUpdateHandler':
            return activeApp.setMlsGroupUpdateHandler();
        case 'setMlsSyncStateUpdateHandler':
            return activeApp.setMlsSyncStateUpdateHandler();
        case 'setLiveKitAdminChangeHandler':
            return activeApp.setLiveKitAdminChangeHandler();
        case 'setDisconnectionHandler':
            return activeApp.setDisconnectionHandler();
        case 'setLivekitActiveUuids':
            return activeApp.setLivekitActiveUuids(...request.params);
        case 'setWebsocketPingInterval':
            return activeApp.setWebsocketPingInterval(...request.params);
        case 'setWebsocketPongTimeout':
            return activeApp.setWebsocketPongTimeout(...request.params);
        case 'setWebsocketMaxPingFailures':
            return activeApp.setWebsocketMaxPingFailures(...request.params);
        case 'encryptMessage': {
            const encryptedMessage = await activeApp.encryptMessage(...request.params);
            return new Uint8Array(encryptedMessage);
        }
        case 'decryptMessage': {
            const decryptedMessage = await activeApp.decryptMessage(...request.params);
            return {
                message: decryptedMessage.message,
                sender_participant_id: decryptedMessage.sender_participant_id,
            };
        }
        case 'logStartToJoinRoom':
            return activeApp.logStartToJoinRoom();
        case 'logJoinedRoom':
            return activeApp.logJoinedRoom(...request.params);
        case 'logJoinedRoomFailed':
            return activeApp.logJoinedRoomFailed(...request.params);
        case 'logConnectionLost':
            return activeApp.logConnectionLost();
        case 'logUserEpochHealth':
            return activeApp.logUserEpochHealth(...request.params);
        case 'logUserRejoin':
            return activeApp.logUserRejoin(...request.params);
        case 'tryLogDesignatedCommitter':
            return activeApp.tryLogDesignatedCommitter(...request.params);
        case 'removeParticipant':
            return activeApp.removeParticipant(...request.params);
        case 'updateParticipantTrackSettings': {
            const settings = await activeApp.updateParticipantTrackSettings(...request.params);
            return {
                audio: settings.audio,
                video: settings.video,
            };
        }
        case 'endMeeting':
            return activeApp.endMeeting();
    }
};

const isCookieAckMessage = (message: MeetCoreWorkerRequestMessage): message is MeetCoreCookieAckMessage =>
    message.type === 'meet-core:cookie-ack';

workerGlobal.addEventListener('error', (event: ErrorEvent) => {
    workerGlobal.postMessage(toFailureMessage(event.message));
});

workerGlobal.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    workerGlobal.postMessage(toFailureMessage(event.reason as Error | string | number | null | undefined));
});

workerGlobal.addEventListener('message', async (event: MessageEvent<MeetCoreWorkerRequestMessage>) => {
    const message = event.data;
    if (isCookieAckMessage(message)) {
        return;
    }

    if (message.type === 'meet-core:init') {
        try {
            await handleInit(message);
            const response: MeetCoreInitSuccessResponseMessage = {
                type: 'meet-core:init-result',
                id: message.id,
                ok: true,
            };
            workerGlobal.postMessage(response);
        } catch (error) {
            const response: MeetCoreInitFailureResponseMessage = {
                type: 'meet-core:init-result',
                id: message.id,
                ok: false,
                error: toWorkerError(error as Error | string | number | null | undefined),
            };
            workerGlobal.postMessage(response);
        }
        return;
    }

    try {
        const result = await handleRpcRequest(message);
        const response: MeetCoreRpcSuccessResponseMessage = {
            type: 'meet-core:rpc-result',
            id: message.id,
            method: message.method,
            ok: true,
            result,
        } as MeetCoreRpcSuccessResponseMessage;
        workerGlobal.postMessage(response);
    } catch (error) {
        const response: MeetCoreRpcFailureResponseMessage = {
            type: 'meet-core:rpc-result',
            id: message.id,
            method: message.method,
            ok: false,
            error: toWorkerError(error as Error | string | number | null | undefined),
        };
        workerGlobal.postMessage(response);
    }
});
