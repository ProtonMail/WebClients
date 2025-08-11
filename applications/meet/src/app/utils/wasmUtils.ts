export const isWasmSupported = () => {
    try {
        if (typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function') {
            const module = new WebAssembly.Module(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
            if (module instanceof WebAssembly.Module) {
                return new WebAssembly.Instance(module) instanceof WebAssembly.Instance;
            }
        }
    } catch (e) {}

    return false;
};

export const loadWasmModule = async () => {
    return import('@proton-meet/proton-meet-core');
};

// Type declarations for window properties
declare global {
    interface Window {
        muon_storage: {
            get_auth: () => string | null;
            set_auth: (auth: string) => void;
        };
        newGroupKeyEvent: {
            new_group_key_for: () => Promise<void>;
        };
    }
}

export const setupMounStorage = () => {
    window.muon_storage = {
        get_auth: function () {
            return localStorage.getItem('proton_meet_auth'); // or null
        },
        set_auth: function (authData) {
            localStorage.setItem('proton_meet_auth', authData);
        },
    };
};

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
