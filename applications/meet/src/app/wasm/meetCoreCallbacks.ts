type NewGroupKeyCallback = () => Promise<void> | void;
type LivekitAdminChangeCallback = (
    roomId: string,
    participantUid: string,
    participantType: number
) => Promise<void> | void;
type DisconnectionCallback = () => Promise<void> | void;
type MlsSyncStateCallback = (state: number, failedReason?: number) => Promise<void> | void;

interface MeetCoreCallbackRegistry {
    onNewGroupKey?: NewGroupKeyCallback;
    onLivekitAdminChange?: LivekitAdminChangeCallback;
    onDisconnection?: DisconnectionCallback;
    onMlsSyncStateChanged?: MlsSyncStateCallback;
}

const callbackRegistry: MeetCoreCallbackRegistry = {};

export const setMeetCoreCallbacks = (callbacks: MeetCoreCallbackRegistry) => {
    callbackRegistry.onNewGroupKey = callbacks.onNewGroupKey;
    callbackRegistry.onLivekitAdminChange = callbacks.onLivekitAdminChange;
    callbackRegistry.onDisconnection = callbacks.onDisconnection;
    callbackRegistry.onMlsSyncStateChanged = callbacks.onMlsSyncStateChanged;
};

export const setMeetCoreLivekitAdminChangeCallback = (callback: LivekitAdminChangeCallback) => {
    callbackRegistry.onLivekitAdminChange = callback;
};

export const resetMeetCoreCallbacks = () => {
    callbackRegistry.onNewGroupKey = undefined;
    callbackRegistry.onLivekitAdminChange = undefined;
    callbackRegistry.onDisconnection = undefined;
    callbackRegistry.onMlsSyncStateChanged = undefined;
};

export const emitMeetCoreNewGroupKeyEvent = async () => {
    if (!callbackRegistry.onNewGroupKey) {
        return;
    }
    await callbackRegistry.onNewGroupKey();
};

export const emitMeetCoreLivekitAdminChangeEvent = async (
    roomId: string,
    participantUid: string,
    participantType: number
) => {
    if (!callbackRegistry.onLivekitAdminChange) {
        return;
    }
    await callbackRegistry.onLivekitAdminChange(roomId, participantUid, participantType);
};

export const emitMeetCoreDisconnectionEvent = async () => {
    if (!callbackRegistry.onDisconnection) {
        return;
    }
    await callbackRegistry.onDisconnection();
};

export const emitMeetCoreMlsSyncStateEvent = async (state: number, failedReason?: number) => {
    if (!callbackRegistry.onMlsSyncStateChanged) {
        return;
    }
    await callbackRegistry.onMlsSyncStateChanged(state, failedReason);
};
