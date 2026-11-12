import type { ItemUpdateFlagsRequest } from '../../types/api/pass';
import { MONITOR_CHECK_CONFIG, type MonitorCheckType } from './types';

export const buildIgnoreCheckFlags = (type: MonitorCheckType): ItemUpdateFlagsRequest => ({
    [MONITOR_CHECK_CONFIG[type].apiKey]: true,
});

export const buildExcludeAllFlags = (): ItemUpdateFlagsRequest => ({
    SkipHealthCheck: true,
    SkipWeakPasswordCheck: true,
    SkipCompromisedPasswordCheck: true,
    SkipReusedPasswordCheck: true,
    Skip2FACheck: true,
});

export const buildRestoreCheckFlags = (
    type: MonitorCheckType,
    options?: { fullyExcluded?: boolean }
): ItemUpdateFlagsRequest => ({
    ...(options?.fullyExcluded ? { ...buildExcludeAllFlags(), SkipHealthCheck: false } : {}),
    [MONITOR_CHECK_CONFIG[type].apiKey]: false,
});

export const buildIncludeAllFlags = (): ItemUpdateFlagsRequest => ({
    SkipHealthCheck: false,
    SkipWeakPasswordCheck: false,
    SkipCompromisedPasswordCheck: false,
    SkipReusedPasswordCheck: false,
    Skip2FACheck: false,
});
