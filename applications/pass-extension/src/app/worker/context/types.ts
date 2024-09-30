import type { ActivationService } from 'proton-pass-extension/app/worker/services/activation';
import type { AliasService } from 'proton-pass-extension/app/worker/services/alias';
import type { APIProxyService } from 'proton-pass-extension/app/worker/services/api-proxy';
import type { AutoFillService } from 'proton-pass-extension/app/worker/services/autofill';
import type { AutoSaveService } from 'proton-pass-extension/app/worker/services/autosave';
import type { B2BEventsService } from 'proton-pass-extension/app/worker/services/b2b';
import type { ExportService } from 'proton-pass-extension/app/worker/services/export';
import type { FormTrackerService } from 'proton-pass-extension/app/worker/services/form.tracker';
import type { I18NService } from 'proton-pass-extension/app/worker/services/i18n';
import type { ImportService } from 'proton-pass-extension/app/worker/services/import';
import type { InjectionService } from 'proton-pass-extension/app/worker/services/injection';
import type { LoggerService } from 'proton-pass-extension/app/worker/services/logger';
import type { OnboardingService } from 'proton-pass-extension/app/worker/services/onboarding';
import type { OTPService } from 'proton-pass-extension/app/worker/services/otp';
import type { Passkeyservice } from 'proton-pass-extension/app/worker/services/passkey';
import type { SentryService } from 'proton-pass-extension/app/worker/services/sentry';
import type { SettingsService } from 'proton-pass-extension/app/worker/services/settings';
import type { StorageService } from 'proton-pass-extension/app/worker/services/storage';
import type { StoreService } from 'proton-pass-extension/app/worker/services/store';
import type { TelemetryService } from 'proton-pass-extension/app/worker/services/telemetry';
import type { VaultsService } from 'proton-pass-extension/app/worker/services/vaults';

import type { AuthService } from '@proton/pass/lib/auth/service';
import type { AuthStore } from '@proton/pass/lib/auth/store';
import type { PassCoreProxy } from '@proton/pass/lib/core/types';
import type { MonitorService } from '@proton/pass/lib/monitor/service';
import type { AppState, AppStatus, MaybeNull } from '@proton/pass/types';

export type WorkerInitOptions = {
    sync?: boolean /* will clear local storage */;
    force?: boolean /* will bypass busy state */;
};

export interface WorkerContextInterface {
    status: AppStatus;
    authStore: AuthStore;
    service: {
        activation: ActivationService;
        alias: AliasService;
        apiProxy: APIProxyService;
        auth: AuthService;
        autofill: AutoFillService;
        autosave: AutoSaveService;
        b2bEvents: MaybeNull<B2BEventsService>;
        core: PassCoreProxy;
        export: ExportService;
        formTracker: FormTrackerService;
        i18n: I18NService;
        import: ImportService;
        injection: InjectionService;
        logger: LoggerService;
        monitor: MonitorService;
        onboarding: OnboardingService;
        otp: OTPService;
        passkey: Passkeyservice;
        sentry: SentryService;
        settings: SettingsService;
        storage: StorageService;
        store: StoreService;
        telemetry: MaybeNull<TelemetryService>;
        vaults: VaultsService;
    };
    /* status update : side-effects will be triggered */
    setStatus: (status: AppStatus) => void;
    /* returns the current worker state */
    getState: () => AppState;
    /* Returned promise will resolve when worker "ready" */
    ensureReady: () => Promise<WorkerContextInterface>;
}
