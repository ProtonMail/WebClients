import type { AuthStore } from '../auth';
import type { ExtensionEndpoint, WorkerState } from '../types';
import type { TelemetryEvent } from '../types/data/telemetry';
import type { EncryptedExtensionCache } from '../types/worker/cache';
import type * as actions from './actions';
import type { Notification } from './actions/with-notification';
import type { FeatureFlagState, rootReducer } from './reducers';
import type { ProxiedSettings } from './reducers/settings';

export type State = ReturnType<typeof rootReducer>;
export type Action = ReturnType<(typeof actions)[keyof typeof actions]>;

export interface WorkerRootSagaOptions {
    getAuth: () => AuthStore;
    getCache: () => Promise<Partial<EncryptedExtensionCache>>;
    getEventInterval: () => number;
    getLocalSettings: () => Promise<ProxiedSettings>;
    getWorkerState: () => WorkerState;
    onBoot?: (result: { ok: true } | { ok: false; clearCache: boolean }) => void;
    onFeatureFlagsUpdate?: (features: FeatureFlagState) => void;
    onImportProgress?: (progress: number, endpoint?: ExtensionEndpoint) => void;
    onItemsChange?: () => void;
    onNotification?: (notification: Notification) => void;
    onSessionLockChange?: (sessionLockToken?: string, sessionLockTTL?: number) => Promise<void>;
    onSessionLocked?: () => Promise<void>;
    onSessionUnlocked?: (sessionLockToken: string) => Promise<void>;
    onSettingUpdate?: (settings: ProxiedSettings) => Promise<void>;
    onShareEventDisabled?: (shareId: string) => void;
    onShareEventItemsDeleted?: (shareId: string, itemIds: string[]) => void;
    onSignout?: () => void;
    setCache: (encrypted: EncryptedExtensionCache) => Promise<void>;
    telemetry?: (message: TelemetryEvent) => void;
}
