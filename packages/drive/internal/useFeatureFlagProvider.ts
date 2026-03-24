import { useRef } from 'react';

import type { FeatureFlagProvider, FeatureFlags } from '@protontech/drive-sdk';

import type { FeatureFlag } from '@proton/unleash/Flags';
import { useUnleashClient } from '@proton/unleash/proxy';

export function useFeatureFlagProvider(): FeatureFlagProvider {
    const unleashClient = useUnleashClient();

    const isEnabled = async (flagName: FeatureFlags, signal?: AbortSignal): Promise<boolean> => {
        if (signal?.aborted) {
            return false;
        }
        return unleashClient.isEnabled(flagName as FeatureFlag);
    };

    const featureFlagProvider = useRef<FeatureFlagProvider>({ isEnabled });
    featureFlagProvider.current.isEnabled = isEnabled;

    return featureFlagProvider.current;
}
