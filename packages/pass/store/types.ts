import type { AuthService } from '@proton/pass/lib/auth/service';
import type { AuthStore } from '@proton/pass/lib/auth/store';
import type { AppState, ClientEndpoint, MaybeNull } from '@proton/pass/types';
import type { TelemetryEvent } from '@proton/pass/types/data/telemetry';
import type { EncryptedPassCache } from '@proton/pass/types/worker/cache';

import type * as actions from './actions';
import type { Notification } from './actions/with-notification';
import type { FeatureFlagState, rootReducer } from './reducers';
import type { ProxiedSettings } from './reducers/settings';

export type State = ReturnType<typeof rootReducer>;
export type Action = ReturnType<(typeof actions)[keyof typeof actions]>;
export type Telemetry = { start: () => void; stop: () => void; pushEvent: (event: TelemetryEvent) => Promise<boolean> };

export interface WorkerRootSagaOptions {
    endpoint: ClientEndpoint;
    getAuthStore: () => AuthStore;
    getAuthService: () => AuthService;
    getCache: () => Promise<Partial<EncryptedPassCache>>;
    getEventInterval: () => number;
    getLocalSettings: () => Promise<ProxiedSettings>;
    getTelemetry: () => MaybeNull<Telemetry>;
    getAppState: () => AppState;
    onBoot?: (result: { ok: true } | { ok: false; clearCache: boolean }) => void;
    onFeatureFlagsUpdate?: (features: FeatureFlagState) => void;
    onItemsChange?: () => void;
    onNotification?: (notification: Notification) => void;
    onSettingUpdate?: (settings: ProxiedSettings) => Promise<void>;
    onShareEventDisabled?: (shareId: string) => void;
    onShareEventItemsDeleted?: (shareId: string, itemIds: string[]) => void;
    setCache: (encrypted: EncryptedPassCache) => Promise<void>;
}
