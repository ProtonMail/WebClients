import { withContext } from 'proton-pass-extension/app/worker/context/inject';

import { PassFeature } from '@proton/pass/types/api/features';
import type { RequiredProps } from '@proton/pass/types/utils';
import type { ExtensionForkPayload } from '@proton/shared/lib/authentication/fork/extension';

export const shouldForceLock = withContext<() => Promise<boolean>>(async (ctx) => {
    try {
        return (await ctx.service.storage.local.getItem('forceLock')) ?? false;
    } catch {
        return false;
    }
});

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
