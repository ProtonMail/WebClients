import type { ActivationService } from 'proton-pass-extension/app/worker/services/activation';
import type { AliasService } from 'proton-pass-extension/app/worker/services/alias';
import type { APIProxyService } from 'proton-pass-extension/app/worker/services/api-proxy';
import type { ExtensionAuthService } from 'proton-pass-extension/app/worker/services/auth';
import type { AutoFillService } from 'proton-pass-extension/app/worker/services/autofill';
import type { AutoSaveService } from 'proton-pass-extension/app/worker/services/autosave';
import type { B2BEventsService } from 'proton-pass-extension/app/worker/services/b2b';
import type { FeatureFlagService } from 'proton-pass-extension/app/worker/services/feature-flags';
import type { FormTrackerService } from 'proton-pass-extension/app/worker/services/form.tracker';
import type { I18NService } from 'proton-pass-extension/app/worker/services/i18n';
import type { ContentScriptService } from 'proton-pass-extension/app/worker/services/injection';
import type { InlineService } from 'proton-pass-extension/app/worker/services/inline';
import type { LoggerService } from 'proton-pass-extension/app/worker/services/logger';
import type { OTPService } from 'proton-pass-extension/app/worker/services/otp';
import type { Passkeyservice } from 'proton-pass-extension/app/worker/services/passkey';
import type { SentryService } from 'proton-pass-extension/app/worker/services/sentry';
import type { SettingsService } from 'proton-pass-extension/app/worker/services/settings';
import type { SpotlightService } from 'proton-pass-extension/app/worker/services/spotlight';
import type { StorageService } from 'proton-pass-extension/app/worker/services/storage';
import type { StoreService } from 'proton-pass-extension/app/worker/services/store';
import type { TelemetryService } from 'proton-pass-extension/app/worker/services/telemetry';
import type { VaultsService } from 'proton-pass-extension/app/worker/services/vaults';

import type { AuthStore } from '@proton/pass/lib/auth/store';
import type { ClipboardService } from '@proton/pass/lib/clipboard/types';
import type { PassCoreProxy } from '@proton/pass/lib/core/core.types';
import type { MonitorService } from '@proton/pass/lib/monitor/service';
import type { ConnectivityService } from '@proton/pass/lib/network/connectivity.service';
import type { MaybeNull } from '@proton/pass/types/utils/index';
import type { AppState, AppStatus } from '@proton/pass/types/worker/state';

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
