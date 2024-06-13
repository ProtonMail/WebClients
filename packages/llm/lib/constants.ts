import { APPS, APPS_CONFIGURATION, MINUTE, SECOND } from '@proton/shared/lib/constants';

const { PROTONMAIL } = APPS;

export const UNLOAD_ASSISTANT_TIMEOUT = 15 * MINUTE;

export const IFRAME_COMMUNICATION_TIMEOUT = 30 * SECOND;

export const GENERAL_STOP_STRINGS = ['</s>', '<|', '[INST]', '[/INST]', '\n\n\n'];
export const STOP_STRINGS_WRITE_FULL_EMAIL = ['\n[Your Name]'];
export const STOP_STRINGS_REFINE = ['</span>', '</div>'];

export const enum AssistantStatus {
    NOT_LOADED,
    DOWNLOADING,
    DOWNLOADED,
    LOADING_GPU,
    READY,
}

export const assistantAuthorizedApps = [APPS_CONFIGURATION[PROTONMAIL].subdomain];
