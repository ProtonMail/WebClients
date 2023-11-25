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

export interface RootSagaOptions {
    /** defines the current client type */
    endpoint: ClientEndpoint;
    getAppState: () => AppState;
    getAuthStore: () => AuthStore;
    getAuthService: () => AuthService;
    getLocalSettings: () => Promise<ProxiedSettings>;
    getTelemetry: () => MaybeNull<Telemetry>;

    /** Fine-tune the event channel polling interval - this will
     * be called after each polling run to set the next value */
    getEventInterval: () => number;

    /** Retrieves the encrypted cache from whatever storage
     * the current client is using for persisting data */
    getCache: () => Promise<Partial<EncryptedPassCache>>;
    /** Persists the stringified encrypted cache to whatever storage the
     * current client is using for persisting data */
    setCache: (encrypted: EncryptedPassCache) => Promise<void>;

    /** Callback with the result of the boot sequence. The `clearCache`
     * flag indicates if the boot failure should result in a cache wipe */
    onBoot?: (result: { ok: true } | { ok: false; clearCache: boolean }) => void;
    /** Callback for handling notification effects */
    onNotification?: (notification: Notification) => void;
    /** Callback for propagating feature flags updates */
    onFeatureFlagsUpdated?: (features: FeatureFlagState) => void;
    /** Called whenever some changes were committed to the items state */
    onItemsUpdated?: () => void;
    /** Callback used when deleted items are detected through event polling */
    onItemsDeleted?: (shareId: string, itemIds: string[]) => void;
    /**  Callback triggered when settings have been updates: leverage
     * this to persist the settings to storage if needed. */
    onSettingsUpdated?: (settings: ProxiedSettings) => Promise<void>;
    /** Callback used when a disabled share is detected through event polling.
     * This can happen if a user loses access to a share or if it was deleted
     * in another client. */
    onShareDeleted?: (shareId: string) => void;
}
