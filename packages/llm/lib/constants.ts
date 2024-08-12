import { APPS, APPS_CONFIGURATION, MINUTE, SECOND } from '@proton/shared/lib/constants';

const { PROTONMAIL } = APPS;

export const ASSISTANT_PROMPT_SIZE_LIMIT = 2000;

export const ASSISTANT_CONTEXT_SIZE_LIMIT = 10000;

export const ASSISTANT_SERVER_THROTTLE_TIMEOUT = 100;

export const UNLOAD_ASSISTANT_TIMEOUT = 15 * MINUTE;

export const IFRAME_COMMUNICATION_TIMEOUT = 30 * SECOND;

export const GENERAL_STOP_STRINGS = ['</s>', '<|', '[INST]', '[/INST]', '\n\n\n', '```'];
export const STOP_STRINGS_WRITE_FULL_EMAIL = ['\n[Your Name]'];
export const STOP_STRINGS_REFINE = ['</span>', '</div>'];

export const FAILED_TO_DOWNLOAD = 'Failed to download:';
export const CACHING_FAILED = 'Caching failed';

export const assistantAuthorizedApps = [APPS_CONFIGURATION[PROTONMAIL].subdomain];
