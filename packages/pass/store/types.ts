import type { AuthStore } from '@proton/pass/lib/auth/store';
import type { AppState, MaybeNull } from '@proton/pass/types';
import type { TelemetryEvent } from '@proton/pass/types/data/telemetry';
import type { EncryptedExtensionCache } from '@proton/pass/types/worker/cache';

import type * as actions from './actions';
import type { Notification } from './actions/with-notification';
import type { FeatureFlagState, rootReducer } from './reducers';
import type { ProxiedSettings } from './reducers/settings';

export type State = ReturnType<typeof rootReducer>;
export type Action = ReturnType<(typeof actions)[keyof typeof actions]>;
export type Telemetry = { start: () => void; stop: () => void; pushEvent: (event: TelemetryEvent) => Promise<boolean> };

export interface WorkerRootSagaOptions {
    getAuth: () => AuthStore;
    getCache: () => Promise<Partial<EncryptedExtensionCache>>;
    getEventInterval: () => number;
    getLocalSettings: () => Promise<ProxiedSettings>;
    getTelemetry: () => MaybeNull<Telemetry>;
    getWorkerState: () => AppState;
    onBoot?: (result: { ok: true } | { ok: false; clearCache: boolean }) => void;
    onFeatureFlagsUpdate?: (features: FeatureFlagState) => void;
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
}
