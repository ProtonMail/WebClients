import type { AuthService } from '@proton/pass/lib/auth/service';
import type { AuthStore } from '@proton/pass/lib/auth/store';
import type {
    AnyStorage,
    AppState,
    AppStatus,
    ClientEndpoint,
    ContextBridgeApi,
    LocalStoreData,
    MaybeNull,
    MaybePromise,
} from '@proton/pass/types';
import type { TelemetryEvent } from '@proton/pass/types/data/telemetry';
import type { EncryptedPassCache } from '@proton/pass/types/worker/cache';

import type { Notification } from './actions/enhancers/notification';
import type { FeatureFlagState, rootReducer } from './reducers';
import type { ProxiedSettings } from './reducers/settings';

export type State = ReturnType<typeof rootReducer>;
export type Telemetry = { start: () => void; stop: () => void; push: (event: TelemetryEvent) => Promise<boolean> };
export type PassSaga = (options: RootSagaOptions) => Generator;
export type PassBootResult =
    | { ok: true; fromCache: boolean; offline?: boolean; version?: string }
    | { ok: false; clearCache: boolean };

export interface RootSagaOptions {
    /** defines the current client type */
    endpoint: ClientEndpoint;

    getAppState: () => AppState;
    getAuthService: () => AuthService;
    getAuthStore: () => AuthStore;
    getSettings: () => MaybePromise<ProxiedSettings>;
    getTelemetry: () => MaybeNull<Telemetry>;

    setAppStatus: (status: AppStatus) => void;

    /** Fine-tune the event channel polling interval - this will
     * be called after each polling run to set the next value */
    getPollingInterval: () => number;
    /** Define the initial polling delay : this is especially useful
     * to avoid immediately spawning the event channels after the
     * service worker was killed by the browser */
    getPollingDelay?: (pollingInterval: number, lastCalledAt?: number) => number;

    /** Retrieves the encrypted cache from whatever storage
     * the current client is using for persisting data */
    getCache: () => Promise<Partial<EncryptedPassCache>>;
    /** Persists the stringified encrypted cache to whatever storage the
     * current client is using for persisting data */
    setCache: (encrypted: EncryptedPassCache) => Promise<void>;

    /** Retrieves storage for the given client */
    getStorage?: () => AnyStorage<LocalStoreData>;

    /** Retrieves the IPC bridge when running in Electron */
    getDesktopBridge?: () => ContextBridgeApi;

    /** Callback with the result of the boot sequence. The `clearCache`
     * flag indicates if the boot failure should result in a cache wipe */
    onBoot?: (result: PassBootResult) => void;

    /** Optional callback to mutate state before initial hydration */
    onBeforeHydrate?: (state: State) => State;

    /** Callback used when account locale is updated */
    onLocaleUpdated?: (locale: string) => void;

    /** Callback used when the local beta flag is updated */
    onBetaUpdated?: (enabled: boolean) => MaybePromise<void>;

    /** Callback for handling notification effects */
    onNotification?: (notification: Notification) => void;

    /** Callback for propagating feature flags updates */
    onFeatureFlags?: (features: FeatureFlagState) => void;

    /** Called whenever some changes were committed to the items state */
    onItemsUpdated?: () => void;

    /** Callback triggered when settings have been updated: leverage
     * this to persist the settings to storage if needed. */
    onSettingsUpdated?: (settings: ProxiedSettings) => MaybePromise<void>;
}
