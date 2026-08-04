import type { ConnectionStateInfo, MeetCoreErrorEnum } from '@proton-meet/proton-meet-core';

import type { CreateJoinRequestResult, MeetCoreClient } from './MeetCoreClient';
import {
    emitMeetCoreDisconnectionEvent,
    emitMeetCoreLivekitAdminChangeEvent,
    emitMeetCoreMlsSyncStateEvent,
    emitMeetCoreNewGroupKeyEvent,
} from './meetCoreCallbacks';
import type {
    MeetCoreCookieAckMessage,
    MeetCoreCookieBridgeRequestMessage,
    MeetCoreInitParams,
    MeetCoreRpcMethod,
    MeetCoreRpcMethodMap,
    MeetCoreRpcRequestMessage,
    MeetCoreRpcResult,
    MeetCoreWorkerError,
    MeetCoreWorkerEventMessage,
    MeetCoreWorkerRequestMessage,
    MeetCoreWorkerResponseMessage,
} from './meetCoreWorkerProtocol';
import { emitWaitingRoomJoinDecision, emitWaitingRoomJoinRequest } from './waitingRoomCallbacks';

interface PendingRequest {
    resolve: (value: MeetCoreRpcResult | null) => void;
    reject: (reason: Error | MeetCoreErrorEnum) => void;
}

const isCookieBridgeRequestMessage = (
    message: MeetCoreWorkerResponseMessage
): message is MeetCoreCookieBridgeRequestMessage =>
    message.type === 'meet-core:set-ws-cookie' || message.type === 'meet-core:clear-ws-cookie';

const isWorkerEventMessage = (message: MeetCoreWorkerResponseMessage): message is MeetCoreWorkerEventMessage =>
    message.type.startsWith('meet-core:event:');

const toWorkerError = (error: MeetCoreWorkerError): Error | MeetCoreErrorEnum => {
    if (error.kind === 'meet-core-error-enum') {
        return error.value;
    }

    const err = new Error(error.message);
    if (error.stack) {
        err.stack = error.stack;
    }
    return err;
};

export class MeetCoreWorkerClient implements MeetCoreClient {
    private readonly pendingRequests = new Map<number, PendingRequest>();
    private nextRequestId = 1;
    private worker: Worker | null;
    private disposed = false;
    private unavailableReason: Error | MeetCoreErrorEnum | null = null;

    public constructor() {
        this.worker = new Worker(new URL('./meet-core.worker.ts', import.meta.url), { type: 'module' });
        this.worker.addEventListener('message', this.handleWorkerMessage);
        this.worker.addEventListener('error', this.handleWorkerError);
        this.worker.addEventListener('messageerror', this.handleWorkerMessageError);
    }

    public async init(params: MeetCoreInitParams): Promise<void> {
        const id = this.nextRequestId++;
        const worker = this.getWorker();
        const request: MeetCoreWorkerRequestMessage = {
            type: 'meet-core:init',
            id,
            params,
        };

        return new Promise<void>((resolve, reject) => {
            this.pendingRequests.set(id, {
                resolve: () => resolve(),
                reject,
            });
            worker.postMessage(request);
        });
    }

    public ping(): Promise<bigint> {
        return this.request('ping', []);
    }

    public joinMeetingWithAccessToken(
        ...args: Parameters<MeetCoreClient['joinMeetingWithAccessToken']>
    ): Promise<void> {
        return this.request('joinMeetingWithAccessToken', args);
    }

    public joinMeetingWithAccessTokenWithSwitchJoinType(
        ...args: Parameters<MeetCoreClient['joinMeetingWithAccessTokenWithSwitchJoinType']>
    ): Promise<void> {
        return this.request('joinMeetingWithAccessTokenWithSwitchJoinType', args);
    }

    public joinRoomWithProposal(...args: Parameters<MeetCoreClient['joinRoomWithProposal']>): Promise<void> {
        return this.request('joinRoomWithProposal', args);
    }

    public leaveMeeting(): Promise<void> {
        return this.request('leaveMeeting', []);
    }

    public triggerWebSocketReconnect(): Promise<void> {
        return this.request('triggerWebSocketReconnect', []);
    }

    public getJoinType(...args: Parameters<MeetCoreClient['getJoinType']>) {
        return this.request('getJoinType', args);
    }

    public getGroupKey() {
        return this.request('getGroupKey', []);
    }

    public getGroupDisplayCode() {
        return this.request('getGroupDisplayCode', []);
    }

    public isMlsUpToDate(): Promise<boolean> {
        return this.request('isMlsUpToDate', []);
    }

    public isWebsocketHasReconnected(): Promise<boolean> {
        return this.request('isWebsocketHasReconnected', []);
    }

    public getWsState(): Promise<ConnectionStateInfo> {
        return this.request('getWsState', []);
    }

    public setMlsGroupUpdateHandler(): Promise<void> {
        return this.request('setMlsGroupUpdateHandler', []);
    }

    public setMlsSyncStateUpdateHandler(): Promise<void> {
        return this.request('setMlsSyncStateUpdateHandler', []);
    }

    public setLiveKitAdminChangeHandler(): Promise<void> {
        return this.request('setLiveKitAdminChangeHandler', []);
    }

    public setDisconnectionHandler(): Promise<void> {
        return this.request('setDisconnectionHandler', []);
    }

    public setLivekitActiveUuids(...args: Parameters<MeetCoreClient['setLivekitActiveUuids']>): Promise<void> {
        return this.request('setLivekitActiveUuids', args);
    }

    public setWebsocketPingInterval(...args: Parameters<MeetCoreClient['setWebsocketPingInterval']>): Promise<void> {
        return this.request('setWebsocketPingInterval', args);
    }

    public setWebsocketPongTimeout(...args: Parameters<MeetCoreClient['setWebsocketPongTimeout']>): Promise<void> {
        return this.request('setWebsocketPongTimeout', args);
    }

    public setWebsocketMaxPingFailures(
        ...args: Parameters<MeetCoreClient['setWebsocketMaxPingFailures']>
    ): Promise<void> {
        return this.request('setWebsocketMaxPingFailures', args);
    }

    public encryptMessage(...args: Parameters<MeetCoreClient['encryptMessage']>): Promise<Uint8Array<ArrayBuffer>> {
        return this.request('encryptMessage', args);
    }

    public decryptMessage(...args: Parameters<MeetCoreClient['decryptMessage']>) {
        return this.request('decryptMessage', args);
    }

    public logStartToJoinRoom(): Promise<void> {
        return this.request('logStartToJoinRoom', []);
    }

    public logJoinedRoom(...args: Parameters<MeetCoreClient['logJoinedRoom']>): Promise<void> {
        return this.request('logJoinedRoom', args);
    }

    public logJoinedRoomFailed(...args: Parameters<MeetCoreClient['logJoinedRoomFailed']>): Promise<void> {
        return this.request('logJoinedRoomFailed', args);
    }

    public logConnectionLost(): Promise<void> {
        return this.request('logConnectionLost', []);
    }

    public logUserEpochHealth(...args: Parameters<MeetCoreClient['logUserEpochHealth']>): Promise<void> {
        return this.request('logUserEpochHealth', args);
    }

    public logUserRejoin(...args: Parameters<MeetCoreClient['logUserRejoin']>): Promise<void> {
        return this.request('logUserRejoin', args);
    }

    public tryLogDesignatedCommitter(...args: Parameters<MeetCoreClient['tryLogDesignatedCommitter']>): Promise<void> {
        return this.request('tryLogDesignatedCommitter', args);
    }

    public removeParticipant(...args: Parameters<MeetCoreClient['removeParticipant']>): Promise<void> {
        return this.request('removeParticipant', args);
    }

    public updateParticipantTrackSettings(...args: Parameters<MeetCoreClient['updateParticipantTrackSettings']>) {
        return this.request('updateParticipantTrackSettings', args);
    }

    public endMeeting(): Promise<void> {
        return this.request('endMeeting', []);
    }

    public composeChatMessage(
        ...args: Parameters<MeetCoreClient['composeChatMessage']>
    ): ReturnType<MeetCoreClient['composeChatMessage']> {
        return this.request('composeChatMessage', args);
    }

    public composeChatReaction(
        ...args: Parameters<MeetCoreClient['composeChatReaction']>
    ): ReturnType<MeetCoreClient['composeChatReaction']> {
        return this.request('composeChatReaction', args);
    }

    public composeChatUnreact(
        ...args: Parameters<MeetCoreClient['composeChatUnreact']>
    ): ReturnType<MeetCoreClient['composeChatUnreact']> {
        return this.request('composeChatUnreact', args);
    }

    public decodeChat(...args: Parameters<MeetCoreClient['decodeChat']>): ReturnType<MeetCoreClient['decodeChat']> {
        return this.request('decodeChat', args);
    }

    public hasMlsGroupInfo(): Promise<boolean> {
        return this.request('hasMlsGroupInfo', []);
    }

    public prepareMlsSessionForWaitingRoom(
        ...args: Parameters<MeetCoreClient['prepareMlsSessionForWaitingRoom']>
    ): Promise<void> {
        return this.request('prepareMlsSessionForWaitingRoom', args);
    }

    public refreshWaitingRoomGuestSessionForJoinRequest(
        ...args: Parameters<MeetCoreClient['refreshWaitingRoomGuestSessionForJoinRequest']>
    ): Promise<void> {
        return this.request('refreshWaitingRoomGuestSessionForJoinRequest', args);
    }

    public createJoinRequest(meetLinkName: string, meetingSessionKey: string): Promise<CreateJoinRequestResult> {
        return this.request('createJoinRequest', [meetLinkName, meetingSessionKey]);
    }

    public waitForWaitingRoomWelcome(meetLinkName: string): Promise<void> {
        return this.request('waitForWaitingRoomWelcome', [meetLinkName]);
    }

    public cancelWaitingRoomJoinRequest(meetLinkName: string): Promise<void> {
        return this.request('cancelWaitingRoomJoinRequest', [meetLinkName]);
    }

    public clearWaitingRoomJoinRequest(): Promise<void> {
        return this.request('clearWaitingRoomJoinRequest', []);
    }

    public setJoinDecisionHandler(): Promise<void> {
        return this.request('setJoinDecisionHandler', []);
    }

    public clearJoinDecisionHandler(): Promise<void> {
        return this.request('clearJoinDecisionHandler', []);
    }

    public setJoinRequestHandler(): Promise<void> {
        return this.request('setJoinRequestHandler', []);
    }

    public clearJoinRequestHandler(): Promise<void> {
        return this.request('clearJoinRequestHandler', []);
    }

    public updateWaitingRoomSetting(meetLinkName: string, enable: boolean, sessionKeyBase64: string): Promise<void> {
        return this.request('updateWaitingRoomSetting', [meetLinkName, enable, sessionKeyBase64]);
    }

    public admitWaitingRoomJoinRequest(
        meetLinkName: string,
        requestId: string,
        sessionKeyBase64: string
    ): Promise<void> {
        return this.request('admitWaitingRoomJoinRequest', [meetLinkName, requestId, sessionKeyBase64]);
    }

    public admitAllWaitingRoomJoinRequests(meetLinkName: string, sessionKeyBase64: string): Promise<string[]> {
        return this.request('admitAllWaitingRoomJoinRequests', [meetLinkName, sessionKeyBase64]);
    }

    public rejectWaitingRoomJoinRequest(
        meetLinkName: string,
        requestId: string,
        participantUid: string
    ): Promise<void> {
        return this.request('rejectWaitingRoomJoinRequest', [meetLinkName, requestId, participantUid]);
    }

    public dispose(): void {
        if (this.disposed) {
            return;
        }

        this.disposed = true;
        this.unavailableReason = new Error('Meet core worker client disposed');
        this.rejectAllPending(this.unavailableReason);
        this.terminateWorker();
    }

    private terminateWorker() {
        if (!this.worker) {
            return;
        }

        this.worker.removeEventListener('message', this.handleWorkerMessage);
        this.worker.removeEventListener('error', this.handleWorkerError);
        this.worker.removeEventListener('messageerror', this.handleWorkerMessageError);
        this.worker.terminate();
        this.worker = null;
    }

    private getWorker(): Worker {
        if (!this.worker || this.disposed) {
            throw this.unavailableReason ?? new Error('Meet core worker client is not available');
        }
        return this.worker;
    }

    private request<Method extends MeetCoreRpcMethod>(
        method: Method,
        params: MeetCoreRpcMethodMap[Method]['params']
    ): Promise<MeetCoreRpcMethodMap[Method]['result']> {
        const id = this.nextRequestId++;
        let worker: Worker;
        try {
            worker = this.getWorker();
        } catch (error) {
            return Promise.reject(error);
        }
        const request = {
            type: 'meet-core:rpc',
            id,
            method,
            params,
        } as MeetCoreRpcRequestMessage;

        return new Promise<MeetCoreRpcMethodMap[Method]['result']>((resolve, reject) => {
            this.pendingRequests.set(id, {
                resolve: resolve as (value: MeetCoreRpcResult | null) => void,
                reject,
            });
            worker.postMessage(request);
        });
    }

    private rejectAllPending(reason: Error | MeetCoreErrorEnum) {
        for (const pending of this.pendingRequests.values()) {
            pending.reject(reason);
        }
        this.pendingRequests.clear();
    }

    private failWorker(reason: Error | MeetCoreErrorEnum) {
        if (this.disposed) {
            return;
        }

        this.disposed = true;
        this.unavailableReason = reason;
        this.rejectAllPending(reason);
        this.terminateWorker();
    }

    private readonly handleWorkerError = (event: ErrorEvent) => {
        this.failWorker(new Error(event.message || 'Meet core worker error'));
    };

    private readonly handleWorkerMessageError = () => {
        this.failWorker(new Error('Meet core worker messageerror'));
    };

    private readonly handleWorkerMessage = (event: MessageEvent<MeetCoreWorkerResponseMessage>) => {
        const message = event.data;

        if (isCookieBridgeRequestMessage(message)) {
            void this.handleCookieBridgeRequest(message);
            return;
        }

        if (isWorkerEventMessage(message)) {
            void this.handleWorkerEvent(message);
            return;
        }

        if (message.type === 'meet-core:worker-failure') {
            this.failWorker(new Error(message.message));
            return;
        }

        const pendingRequest = this.pendingRequests.get(message.id);
        if (!pendingRequest) {
            return;
        }

        this.pendingRequests.delete(message.id);

        if (message.ok) {
            pendingRequest.resolve('result' in message ? message.result : null);
            return;
        }

        pendingRequest.reject(toWorkerError(message.error));
    };

    private async handleWorkerEvent(message: MeetCoreWorkerEventMessage) {
        switch (message.type) {
            case 'meet-core:event:new-group-key':
                await emitMeetCoreNewGroupKeyEvent();
                return;
            case 'meet-core:event:livekit-admin-change':
                await emitMeetCoreLivekitAdminChangeEvent(
                    message.roomId,
                    message.participantUid,
                    message.participantType
                );
                return;
            case 'meet-core:event:disconnection':
                await emitMeetCoreDisconnectionEvent();
                return;
            case 'meet-core:event:mls-sync-state':
                await emitMeetCoreMlsSyncStateEvent(message.state, message.reason);
                return;
            case 'meet-core:event:join-decision':
                emitWaitingRoomJoinDecision(message.requestId, message.admitted);
                return;
            case 'meet-core:event:join-request':
                emitWaitingRoomJoinRequest(
                    message.change,
                    message.requestId,
                    message.participantUid,
                    message.expiresAt
                );
                return;
        }
    }

    private async handleCookieBridgeRequest(message: MeetCoreCookieBridgeRequestMessage) {
        if (!this.worker || this.disposed) {
            return;
        }

        let response: MeetCoreCookieAckMessage = {
            type: 'meet-core:cookie-ack',
            id: message.id,
            ok: true,
        };

        try {
            document.cookie = message.cookie;
        } catch (error) {
            response = {
                type: 'meet-core:cookie-ack',
                id: message.id,
                ok: false,
                error: String(error),
            };
        }

        this.worker.postMessage(response);
    }
}
