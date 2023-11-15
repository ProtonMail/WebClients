import type { AuthService } from '@proton/pass/lib/auth/service';
import type { AuthStore } from '@proton/pass/lib/auth/store';
import type { AppState, AppStatus, MaybeNull } from '@proton/pass/types';

import type { ActivationService } from '../services/activation';
import type { AliasService } from '../services/alias';
import type { AutoFillService } from '../services/autofill';
import type { AutoSaveService } from '../services/autosave';
import type { CacheProxyService } from '../services/cache-proxy';
import type { ExportService } from '../services/export';
import type { FormTrackerService } from '../services/form.tracker';
import type { I18NService } from '../services/i18n';
import type { InjectionService } from '../services/injection';
import type { LoggerService } from '../services/logger';
import type { OnboardingService } from '../services/onboarding';
import type { OTPService } from '../services/otp';
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
        auth: AuthService;
        activation: ActivationService;
        alias: AliasService;
        autofill: AutoFillService;
        autosave: AutoSaveService;
        cacheProxy: CacheProxyService;
        export: ExportService;
        formTracker: FormTrackerService;
        i18n: I18NService;
        injection: InjectionService;
        logger: LoggerService;
        onboarding: OnboardingService;
        otp: OTPService;
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
