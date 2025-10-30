export const loadWasmModule = async () => {
    return import('@proton-meet/proton-meet-core');
};

// Type declarations for window properties
declare global {
    interface Window {
        newGroupKeyEvent: {
            new_group_key_for: () => Promise<void>;
        };
        livekitAdminChangeEvent: {
            on_livekit_admin_changed: (room_id: string, new_admin_participant_uid: string) => Promise<void>;
        };
    }
}

interface SetupWasmDependenciesParameters {
    getGroupKeyInfo: () => Promise<{ key: string; epoch: bigint }>;
    onNewGroupKeyInfo: (key: string, epoch: bigint) => Promise<void>;
}

export const setupWasmDependencies = ({ getGroupKeyInfo, onNewGroupKeyInfo }: SetupWasmDependenciesParameters) => {
    // Initialize window.new_group_key_event
    window.newGroupKeyEvent = {
        new_group_key_for: async function () {
            const groupKeyInfo = await getGroupKeyInfo();

            if (groupKeyInfo) {
                await onNewGroupKeyInfo(groupKeyInfo.key, groupKeyInfo.epoch);
            }
        },
    };
};

interface SetupLiveKitAdminChangeEventParameters {
    onLiveKitAdminChanged: (roomId: string, newAdminParticipantUid: string) => Promise<void>;
}

export const setupLiveKitAdminChangeEvent = ({ onLiveKitAdminChanged }: SetupLiveKitAdminChangeEventParameters) => {
    // Initialize window.livekitAdminChangeEvent
    window.livekitAdminChangeEvent = {
        on_livekit_admin_changed: async function (room_id: string, new_admin_participant_uid: string) {
            await onLiveKitAdminChanged(room_id, new_admin_participant_uid);
        },
    };
};
