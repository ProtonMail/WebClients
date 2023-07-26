import type { AuthenticationStore } from '@proton/shared/lib/authentication/createAuthenticationStore';

import type { ExtensionEndpoint } from '../types';
import type { TelemetryEvent } from '../types/data/telemetry';
import type * as actions from './actions';
import type { Notification } from './actions/with-notification';
import type { rootReducer } from './reducers';
import type { ProxiedSettings } from './reducers/settings';

export type State = ReturnType<typeof rootReducer>;
export type Action = ReturnType<(typeof actions)[keyof typeof actions]>;

export interface WorkerRootSagaOptions {
    getAuth: () => AuthenticationStore;
    getEventInterval: () => number;
    onBoot?: (result: { ok: true } | { ok: false; clearCache: boolean }) => void;
    onCacheRequest: () => boolean;
    onItemsChange?: () => void;
    onImportProgress?: (progress: number, endpoint?: ExtensionEndpoint) => void;
    onNotification?: (notification: Notification) => void;
    onSessionLocked?: (storageToken: string) => void;
    onSessionUnlocked?: (storageToken: string) => void;
    onSessionLockChange?: (registered: boolean) => void;
    onSettingUpdate?: (settings: ProxiedSettings) => Promise<void>;
    onShareEventDisabled?: (shareId: string) => void;
    onShareEventItemsDeleted?: (shareId: string, itemIds: string[]) => void;
    onSignout?: () => void;
    telemetry?: (message: TelemetryEvent) => void;
}
