import type { TelemetryEvent } from '../types/data/telemetry';
import * as actions from './actions';
import type { Notification } from './actions/with-notification';
import { rootReducer } from './reducers';
import { ProxiedSettings } from './reducers/settings';

export type State = ReturnType<typeof rootReducer>;
export type Action = ReturnType<(typeof actions)[keyof typeof actions]>;

export interface WorkerRootSagaOptions {
    onBoot?: (result: { ok: true } | { ok: false; clearCache: boolean }) => void;
    onSignout?: () => void;
    onSessionLocked?: (storageToken: string) => void;
    onSessionUnlocked?: (storageToken: string) => void;
    onNotification?: (notification: Notification) => void;
    onItemsChange?: () => void;
    onShareEventDisabled?: (shareId: string) => void;
    onShareEventItemsDeleted?: (shareId: string, itemIds: string[]) => void;
    onSettingUpdate?: (settings: ProxiedSettings) => Promise<void>;
    telemetry?: (message: TelemetryEvent) => void;
}
