import { withContext } from 'proton-pass-extension/app/worker/context/inject';

import { requiresLaunchPasswordUnlock } from '@proton/pass/lib/auth/session';
import { PassFeature } from '@proton/pass/types/api/features';
import type { RequiredProps } from '@proton/pass/types/utils';
import { epochToMs, getEpoch } from '@proton/pass/utils/time/epoch';
import type { ExtensionForkPayload } from '@proton/shared/lib/authentication/fork/extension';

export const shouldForceLock = withContext<() => Promise<boolean>>(async (ctx) => {
    try {
        const now = getEpoch();

        /** Explicit `forceLock` intent. Set by `onLocked`, the auto-lock
         * alarm listener, and permission-revocation paths. Survives browser restart. */
        if (await ctx.service.storage.local.getItem('forceLock')) return true;

        /** Fallback to persisted deadline surviving SW-death via `storage.session`.
         * Defends against auto-lock alarm being dropped entirely (eg: Safari start-page) */
        const lockLastExtendTime = ctx.authStore.getLockLastExtendTime();
        const lockTTL = ctx.authStore.getLockTTL();

        if (lockLastExtendTime && lockTTL && lockLastExtendTime + lockTTL <= now) {
            await ctx.service.storage.local.setItem('forceLock', true);
            return true;
        }

        /** Alarm record exists with past `when` but never fired. */
        const when = await ctx.service.auth.alarms.autoLockAlarm.when();
        if (when !== undefined && when <= epochToMs(now)) {
            await ctx.service.storage.local.setItem('forceLock', true);
            return true;
        }

        return false;
    } catch {
        return false;
    }
});

/** Builds auth init options from the protected session launch-lock flag.
 * Unknown state is treated as enabled; only an explicit `false` disables it. */
export const getForceLockOptions = withContext(
    async (ctx): Promise<{ forceLock: boolean; forcePasswordLock?: boolean }> => {
        const authStore = ctx.authStore ?? ctx.service.auth?.config?.authStore;
        const localID = authStore?.getLocalID?.();
        const persistedSession = await ctx.service.auth?.config?.getPersistedSession?.(localID).catch(() => undefined);
        const persistedForcePasswordLock = persistedSession
            ? requiresLaunchPasswordUnlock(persistedSession)
            : undefined;
        const memoryForcePasswordLock = authStore?.hasOfflineComponents?.()
            ? authStore.getLockPasswordOnLaunch?.() !== false
            : true;
        const forcePasswordLock = persistedForcePasswordLock ?? memoryForcePasswordLock;
        const forceLock = (await shouldForceLock()) || forcePasswordLock;

        return {
            forceLock,
            ...(forcePasswordLock ? { forcePasswordLock: true } : {}),
        };
    }
);

export const isOfflineModeEnabled = withContext<() => Promise<boolean>>(async (ctx) => {
    try {
        const { features } = await ctx.service.featureFlags.resolve();
        return features[PassFeature.PassExtensionOfflineV1] === true;
    } catch {
        return false;
    }
});

export const validateExtensionForkPayload = (
    payload: ExtensionForkPayload
): payload is RequiredProps<ExtensionForkPayload, 'keyPassword'> => Boolean(payload.keyPassword);
