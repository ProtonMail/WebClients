import type { App, ConnectionStateInfo } from '@proton-meet/proton-meet-core';

import type {
    DecryptedMessageInfoData,
    GroupDisplayCodeData,
    GroupKeyInfoData,
    MeetCoreClient,
    ParticipantTrackSettingsInfoData,
} from './MeetCoreClient';

export class DirectMeetCoreClient implements MeetCoreClient {
    public constructor(private readonly app: App) {}

    public ping(): Promise<bigint> {
        return this.app.ping();
    }

    public joinMeetingWithAccessToken(...args: Parameters<App['joinMeetingWithAccessToken']>): Promise<void> {
        return this.app.joinMeetingWithAccessToken(...args);
    }

    public joinMeetingWithAccessTokenWithSwitchJoinType(
        ...args: Parameters<App['joinMeetingWithAccessTokenWithSwitchJoinType']>
    ): Promise<void> {
        return this.app.joinMeetingWithAccessTokenWithSwitchJoinType(...args);
    }

    public joinRoomWithProposal(...args: Parameters<App['joinRoomWithProposal']>): Promise<void> {
        return this.app.joinRoomWithProposal(...args);
    }

    public leaveMeeting(): Promise<void> {
        return this.app.leaveMeeting();
    }

    public triggerWebSocketReconnect(): Promise<void> {
        return this.app.triggerWebSocketReconnect();
    }

    public getJoinType(...args: Parameters<App['getJoinType']>) {
        return Promise.resolve(this.app.getJoinType(...args));
    }

    public async getGroupKey(): Promise<GroupKeyInfoData> {
        const groupKeyInfo = await this.app.getGroupKey();
        return { key: groupKeyInfo.key, epoch: groupKeyInfo.epoch };
    }

    public async getGroupDisplayCode(): Promise<GroupDisplayCodeData> {
        const groupDisplayCode = await this.app.getGroupDisplayCode();
        return { full_code: groupDisplayCode.full_code };
    }

    public isMlsUpToDate(): Promise<boolean> {
        return this.app.isMlsUpToDate();
    }

    public isWebsocketHasReconnected(): Promise<boolean> {
        return this.app.isWebsocketHasReconnected();
    }

    public getWsState(): Promise<ConnectionStateInfo> {
        return this.app.getWsState();
    }

    public setMlsGroupUpdateHandler(): Promise<void> {
        return this.app.setMlsGroupUpdateHandler();
    }

    public setMlsSyncStateUpdateHandler(): Promise<void> {
        return this.app.setMlsSyncStateUpdateHandler();
    }

    public setLiveKitAdminChangeHandler(): Promise<void> {
        return this.app.setLiveKitAdminChangeHandler();
    }

    public setDisconnectionHandler(): Promise<void> {
        return this.app.setDisconnectionHandler();
    }

    public setLivekitActiveUuids(...args: Parameters<App['setLivekitActiveUuids']>): Promise<void> {
        return this.app.setLivekitActiveUuids(...args);
    }

    public setWebsocketPingInterval(...args: Parameters<App['setWebsocketPingInterval']>): Promise<void> {
        return this.app.setWebsocketPingInterval(...args);
    }

    public setWebsocketPongTimeout(...args: Parameters<App['setWebsocketPongTimeout']>): Promise<void> {
        return this.app.setWebsocketPongTimeout(...args);
    }

    public setWebsocketMaxPingFailures(...args: Parameters<App['setWebsocketMaxPingFailures']>): Promise<void> {
        return this.app.setWebsocketMaxPingFailures(...args);
    }

    public async encryptMessage(...args: Parameters<App['encryptMessage']>): Promise<Uint8Array<ArrayBuffer>> {
        const encryptedMessage = await this.app.encryptMessage(...args);
        return new Uint8Array(encryptedMessage);
    }

    public async decryptMessage(...args: Parameters<App['decryptMessage']>): Promise<DecryptedMessageInfoData> {
        const decryptedMessage = await this.app.decryptMessage(...args);
        return {
            message: decryptedMessage.message,
            sender_participant_id: decryptedMessage.sender_participant_id,
        };
    }

    public logStartToJoinRoom(): Promise<void> {
        return this.app.logStartToJoinRoom();
    }

    public logJoinedRoom(...args: Parameters<App['logJoinedRoom']>): Promise<void> {
        return this.app.logJoinedRoom(...args);
    }

    public logJoinedRoomFailed(...args: Parameters<App['logJoinedRoomFailed']>): Promise<void> {
        return this.app.logJoinedRoomFailed(...args);
    }

    public logConnectionLost(): Promise<void> {
        return this.app.logConnectionLost();
    }

    public logUserEpochHealth(...args: Parameters<App['logUserEpochHealth']>): Promise<void> {
        return this.app.logUserEpochHealth(...args);
    }

    public logUserRejoin(...args: Parameters<App['logUserRejoin']>): Promise<void> {
        return this.app.logUserRejoin(...args);
    }

    public tryLogDesignatedCommitter(...args: Parameters<App['tryLogDesignatedCommitter']>): Promise<void> {
        return this.app.tryLogDesignatedCommitter(...args);
    }

    public removeParticipant(...args: Parameters<App['removeParticipant']>): Promise<void> {
        return this.app.removeParticipant(...args);
    }

    public async updateParticipantTrackSettings(
        ...args: Parameters<App['updateParticipantTrackSettings']>
    ): Promise<ParticipantTrackSettingsInfoData> {
        const settings = await this.app.updateParticipantTrackSettings(...args);
        return {
            audio: settings.audio,
            video: settings.video,
        };
    }

    public endMeeting(): Promise<void> {
        return this.app.endMeeting();
    }

    private disposed = false;

    public dispose(): void {
        if (this.disposed) {
            return;
        }
        this.disposed = true;
        this.app.free();
    }
}
