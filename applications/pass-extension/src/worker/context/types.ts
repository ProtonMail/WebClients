import type { MaybeNull, WorkerStatus } from '@proton/pass/types';
import { type WorkerState } from '@proton/pass/types';

import { type ActivationService } from '../services/activation';
import { type AliasService } from '../services/alias';
import { type AuthService } from '../services/auth';
import { type AutoFillService } from '../services/autofill';
import { type AutoSaveService } from '../services/autosave';
import { type CacheProxyService } from '../services/cache-proxy';
import { type ExportService } from '../services/export';
import { type FormTrackerService } from '../services/form.tracker';
import { type InjectionService } from '../services/injection';
import { type LoggerService } from '../services/logger';
import { type OnboardingService } from '../services/onboarding';
import { type OTPService } from '../services/otp';
import { type SettingsService } from '../services/settings';
import { type StoreService } from '../services/store';
import { type TelemetryService } from '../services/telemetry';

export type WorkerInitOptions = {
    sync?: boolean /* will clear local storage */;
    force?: boolean /* will bypass busy state */;
};

export interface WorkerContextInterface {
    status: WorkerStatus;
    service: {
        auth: AuthService;
        activation: ActivationService;
        alias: AliasService;
        autofill: AutoFillService;
        autosave: AutoSaveService;
        cacheProxy: CacheProxyService;
        export: ExportService;
        formTracker: FormTrackerService;
        injection: InjectionService;
        logger: LoggerService;
        onboarding: OnboardingService;
        otp: OTPService;
        settings: SettingsService;
        store: StoreService;
        telemetry: MaybeNull<TelemetryService>;
    };
    /* status update : side-effects will be triggered */
    setStatus: (status: WorkerStatus) => void;
    /* returns the current worker state */
    getState: () => WorkerState;
    /* init the worker - or force re-init using sync|force parameters */
    init: (options: WorkerInitOptions) => Promise<WorkerContextInterface>;
    /* Returned promise will resolve when worker "ready" */
    ensureReady: () => Promise<WorkerContextInterface>;
}
