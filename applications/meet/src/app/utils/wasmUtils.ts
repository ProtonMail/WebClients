import {
    resetMeetCoreCallbacks,
    setMeetCoreCallbacks,
    setMeetCoreLivekitAdminChangeCallback,
} from '../wasm/meetCoreCallbacks';

export const loadWasmModule = async () => {
    return import('@proton-meet/proton-meet-core');
};

declare global {
    interface Window {
        newGroupKeyEvent: {
            new_group_key_for: () => Promise<void>;
        };
        livekitAdminChangeEvent: {
            on_livekit_admin_changed: (
                room_id: string,
                participant_uid: string,
                participant_type: number
            ) => Promise<void>;
        };
        disconnectionEvent: {
            disconnection_handler: () => Promise<void>;
        };
        mlsSyncStateChangeEvent: {
            on_mls_sync_state_changed: (state: number, failedReason?: number) => Promise<void>;
        };
    }
}

interface SetupWasmDependenciesParameters {
    getGroupKeyInfo: () => Promise<{ key: string; epoch: bigint }>;
    onNewGroupKeyInfo: (key: string, epoch: bigint) => Promise<void>;
    onMlsSyncStateChanged?: (state: number, failedReason?: number) => void;
}

let keyPollIntervalId: ReturnType<typeof setInterval> | null = null;

export const cleanupWasmDependencies = () => {
    if (keyPollIntervalId !== null) {
        clearInterval(keyPollIntervalId);
        keyPollIntervalId = null;
    }

    window.newGroupKeyEvent = { new_group_key_for: async () => {} };
    window.livekitAdminChangeEvent = {
        on_livekit_admin_changed: async () => {},
    };
    window.disconnectionEvent = { disconnection_handler: async () => {} };
    window.mlsSyncStateChangeEvent = { on_mls_sync_state_changed: async () => {} };

    resetMeetCoreCallbacks();
};

export const setupWasmDependencies = ({
    getGroupKeyInfo,
    onNewGroupKeyInfo,
    onMlsSyncStateChanged,
}: SetupWasmDependenciesParameters) => {
    let lastEpoch: bigint | undefined;

    cleanupWasmDependencies();

    const onNewGroupKey = async () => {
        const groupKeyInfo = await getGroupKeyInfo();

        if (groupKeyInfo && groupKeyInfo.epoch !== lastEpoch) {
            lastEpoch = groupKeyInfo.epoch;
            await onNewGroupKeyInfo(groupKeyInfo.key, groupKeyInfo.epoch);
        }
    };

    const onDisconnection = async () => {};

    const onMlsSyncStateChangedInternal = async (state: number, failedReason?: number) => {
        onMlsSyncStateChanged?.(state, failedReason);
    };

    window.newGroupKeyEvent = {
        new_group_key_for: onNewGroupKey,
    };

    window.disconnectionEvent = {
        disconnection_handler: onDisconnection,
    };

    window.mlsSyncStateChangeEvent = {
        on_mls_sync_state_changed: onMlsSyncStateChangedInternal,
    };

    setMeetCoreCallbacks({
        onNewGroupKey,
        onDisconnection,
        onMlsSyncStateChanged: onMlsSyncStateChangedInternal,
        onLivekitAdminChange: undefined,
    });

    keyPollIntervalId = setInterval(async () => {
        const groupKeyInfo = await getGroupKeyInfo().catch(() => null);
        if (groupKeyInfo && groupKeyInfo.epoch !== lastEpoch) {
            lastEpoch = groupKeyInfo.epoch;
            await onNewGroupKeyInfo(groupKeyInfo.key, groupKeyInfo.epoch);
        }
    }, 5_000);
};

interface SetupLiveKitAdminChangeEventParameters {
    onLiveKitAdminChanged: (roomId: string, participantUid: string, participantType: number) => Promise<void>;
}

export const setupLiveKitAdminChangeEvent = ({ onLiveKitAdminChanged }: SetupLiveKitAdminChangeEventParameters) => {
    const callback = async (room_id: string, participant_uid: string, participant_type: number) => {
        await onLiveKitAdminChanged(room_id, participant_uid, participant_type);
    };

    window.livekitAdminChangeEvent = {
        on_livekit_admin_changed: callback,
    };

    setMeetCoreLivekitAdminChangeCallback(callback);
};
