import { MINUTE } from '@proton/shared/lib/constants';

export const ASSISTANT_FEATURE_NAME = 'AI Assistant';

export const UNLOAD_ASSISTANT_TIMEOUT = 15 * MINUTE;

export const ASSISTANT_TRIAL_TIME_DAYS = 14;

export const enum ASSISTANT_STATUS {
    NOT_LOADED,
    DOWNLOADING,
    DOWNLOADED,
    LOADING_GPU,
    READY,
}
