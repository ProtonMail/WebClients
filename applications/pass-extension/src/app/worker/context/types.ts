import type { AuthStore } from '@proton/pass/lib/auth/store';
import type { ClipboardService } from '@proton/pass/lib/clipboard/types';
import type { PassCoreProxy } from '@proton/pass/lib/core/core.types';
import type { MonitorService } from '@proton/pass/lib/monitor/service';
import type { NativeMessagingService } from '@proton/pass/lib/native-messaging/native-messaging.extension';
import type { ConnectivityService } from '@proton/pass/lib/network/connectivity.service';
import type { MaybeNull } from '@proton/pass/types/utils/index';
import type { AppState, AppStatus } from '@proton/pass/types/worker/state';

import type { ActivationService } from '../services/activation';
import type { AliasService } from '../services/alias';
import type { APIProxyService } from '../services/api-proxy';
import type { ExtensionAuthService } from '../services/auth/auth.service';
import type { AutoFillService } from '../services/autofill';
import type { AutoSaveService } from '../services/autosave';
import type { B2BEventsService } from '../services/b2b';
import type { FeatureFlagService } from '../services/feature-flags';
import type { FormTrackerService } from '../services/form.tracker';
import type { I18NService } from '../services/i18n';
import type { ContentScriptService } from '../services/injection';
import type { InlineService } from '../services/inline';
import type { LoggerService } from '../services/logger';
import type { OTPService } from '../services/otp';
import type { Passkeyservice } from '../services/passkey';
import type { SentryService } from '../services/sentry';
import type { SettingsService } from '../services/settings';
import type { SpotlightService } from '../services/spotlight';
import type { StorageService } from '../services/storage';
import type { StoreService } from '../services/store';
import type { TelemetryService } from '../services/telemetry';
import type { VaultsService } from '../services/vaults';

export type WorkerInitOptions = {
    /** will clear local storage */
    sync?: boolean;
    /** will bypass busy state */
    force?: boolean;
};

export interface WorkerContextInterface {
    status: AppStatus;
    booted: boolean;
    authStore: AuthStore;
    service: {
        activation: ActivationService;
        alias: AliasService;
        apiProxy: APIProxyService;
        auth: ExtensionAuthService;
        autofill: AutoFillService;
        autosave: AutoSaveService;
        b2bEvents: MaybeNull<B2BEventsService>;
        clipboard: ClipboardService;
        core: PassCoreProxy;
        connectivity: ConnectivityService;
        featureFlags: FeatureFlagService;
        formTracker: FormTrackerService;
        i18n: I18NService;
        injection: ContentScriptService;
        inline: InlineService;
        logger: LoggerService;
        monitor: MonitorService;
        nativeMessaging: NativeMessagingService;
        otp: OTPService;
        passkey: Passkeyservice;
        sentry: SentryService;
        settings: SettingsService;
        spotlight: SpotlightService;
        storage: StorageService;
        store: StoreService;
        telemetry: MaybeNull<TelemetryService>;
        vaults: VaultsService;
    };
    /** `status` update : side-effects will be triggered */
    setStatus: (status: AppStatus) => void;
    /** `booted` flag update  */
    setBooted: (booted: boolean) => void;
    /** Returns the current worker state */
    getState: () => AppState;
    /** Returned promise will resolve when worker "ready" */
    ensureReady: () => Promise<WorkerContextInterface>;
}
