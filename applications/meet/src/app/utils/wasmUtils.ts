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
            on_livekit_admin_changed: (
                room_id: string,
                participant_uid: string,
                participant_type: Number
            ) => Promise<void>;
        };
        disconnectionEvent: {
            disconnection_handler: () => Promise<void>;
        };
    }
}

interface SetupWasmDependenciesParameters {
    getGroupKeyInfo: () => Promise<{ key: string; epoch: bigint }>;
    onNewGroupKeyInfo: (key: string, epoch: bigint) => Promise<void>;
}

// Store interval ID to allow cleanup
let keyPollIntervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Cleanup function to stop the polling interval when leaving a meeting
 */
export const cleanupWasmDependencies = () => {
    if (keyPollIntervalId !== null) {
        clearInterval(keyPollIntervalId);
        keyPollIntervalId = null;
    }
};

export const setupWasmDependencies = ({ getGroupKeyInfo, onNewGroupKeyInfo }: SetupWasmDependenciesParameters) => {
    let lastEpoch: bigint | undefined;

    // Clear existing interval if setupWasmDependencies was called before, generally happened when user joins the meeting multiple times
    cleanupWasmDependencies();

    // Initialize window.new_group_key_event
    window.newGroupKeyEvent = {
        new_group_key_for: async function () {
            const groupKeyInfo = await getGroupKeyInfo();

            if (groupKeyInfo) {
                lastEpoch = groupKeyInfo.epoch;
                await onNewGroupKeyInfo(groupKeyInfo.key, groupKeyInfo.epoch);
            }
        },
    };
    // Initialize window.disconnectionEvent
    window.disconnectionEvent = {
        disconnection_handler: async function () {
            // Empty function for now
        },
    };

    // Fallback poll in case newGroupKeyEvent is not triggered
    keyPollIntervalId = setInterval(async () => {
        const groupKeyInfo = await getGroupKeyInfo().catch(() => null);
        if (groupKeyInfo && groupKeyInfo.epoch !== lastEpoch) {
            lastEpoch = groupKeyInfo.epoch;
            await onNewGroupKeyInfo(groupKeyInfo.key, groupKeyInfo.epoch);
        }
    }, 5_000);
};

interface SetupLiveKitAdminChangeEventParameters {
    onLiveKitAdminChanged: (roomId: string, participantUid: string, participantType: Number) => Promise<void>;
}

export const setupLiveKitAdminChangeEvent = ({ onLiveKitAdminChanged }: SetupLiveKitAdminChangeEventParameters) => {
    // Initialize window.livekitAdminChangeEvent
    window.livekitAdminChangeEvent = {
        on_livekit_admin_changed: async function (room_id: string, participant_uid: string, participant_type: Number) {
            await onLiveKitAdminChanged(room_id, participant_uid, participant_type);
        },
    };
};
