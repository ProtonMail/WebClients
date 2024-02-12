import type { AuthService } from '@proton/pass/lib/auth/service';
import type { AuthStore } from '@proton/pass/lib/auth/store';
import type { AppState, ClientEndpoint, MaybeNull, MaybePromise } from '@proton/pass/types';
import type { TelemetryEvent } from '@proton/pass/types/data/telemetry';
import type { EncryptedPassCache } from '@proton/pass/types/worker/cache';

import type * as actions from './actions';
import type { Notification } from './actions/enhancers/notification';
import type { FeatureFlagState, rootReducer } from './reducers';
import type { ProxiedSettings } from './reducers/settings';

export type State = ReturnType<typeof rootReducer>;
export type Action = ReturnType<(typeof actions)[keyof typeof actions]>;
export type Telemetry = { start: () => void; stop: () => void; push: (event: TelemetryEvent) => Promise<boolean> };

export interface RootSagaOptions {
    /** defines the current client type */
    endpoint: ClientEndpoint;
    getAppState: () => AppState;
    getAuthStore: () => AuthStore;
    getAuthService: () => AuthService;
    getSettings: () => MaybePromise<ProxiedSettings>;
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

    /** Callback used when account locale is updated */
    onLocaleUpdated?: (locale: string) => void;

    /** Callback for handling notification effects */
    onNotification?: (notification: Notification) => void;

    /** Callback for propagating feature flags updates */
    onFeatureFlagsUpdated?: (features: FeatureFlagState) => void;

    /** Called whenever some changes were committed to the items state */
    onItemsUpdated?: () => void;

    /** Callback triggered when settings have been updated: leverage
     * this to persist the settings to storage if needed. */
    onSettingsUpdated?: (settings: ProxiedSettings) => MaybePromise<void>;
}
