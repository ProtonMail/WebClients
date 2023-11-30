import type { AuthService } from '@proton/pass/lib/auth/service';
import type { AuthStore } from '@proton/pass/lib/auth/store';
import type { PassCoreService } from '@proton/pass/lib/core/service';
import type { AppState, AppStatus, MaybeNull } from '@proton/pass/types';

import type { ActivationService } from '../services/activation';
import type { AliasService } from '../services/alias';
import type { APIProxyService } from '../services/api-proxy';
import type { AutoFillService } from '../services/autofill';
import type { AutoSaveService } from '../services/autosave';
import type { ExportService } from '../services/export';
import type { FormTrackerService } from '../services/form.tracker';
import type { I18NService } from '../services/i18n';
import type { ImportService } from '../services/import';
import type { InjectionService } from '../services/injection';
import type { LoggerService } from '../services/logger';
import type { MonitorService } from '../services/monitor';
import type { OnboardingService } from '../services/onboarding';
import type { OTPService } from '../services/otp';
import type { Passkeyservice } from '../services/passkey';
import type { SettingsService } from '../services/settings';
import type { StorageService } from '../services/storage';
import type { StoreService } from '../services/store';
import type { TelemetryService } from '../services/telemetry';

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
        core: PassCoreService;
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
        settings: SettingsService;
        storage: StorageService;
        store: StoreService;
        telemetry: MaybeNull<TelemetryService>;
    };
    /* status update : side-effects will be triggered */
    setStatus: (status: AppStatus) => void;
    /* returns the current worker state */
    getState: () => AppState;
    /* Returned promise will resolve when worker "ready" */
    ensureReady: () => Promise<WorkerContextInterface>;
}
