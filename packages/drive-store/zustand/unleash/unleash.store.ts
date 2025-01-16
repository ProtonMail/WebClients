import type { UnleashClient } from 'unleash-proxy-client';
import { createStore } from 'zustand/vanilla';

import type { FeatureFlag } from '@proton/unleash/UnleashFeatureFlags';
import type { FeatureFlagVariant, FeatureFlagsWithVariant } from '@proton/unleash/UnleashFeatureFlagsVariants';

interface UnleashState {
    client: UnleashClient | null;
    isEnabled: (toggleName: FeatureFlag) => boolean;
    getVariant: <TFlagName extends FeatureFlagsWithVariant>(toggleName: TFlagName) => FeatureFlagVariant<TFlagName>;
    setClient: (client: UnleashClient) => void;
}

export const unleashVanillaStore = createStore<UnleashState>()((set, get) => ({
    client: null,

    isEnabled: (toggleName: FeatureFlag) => {
        const client = get().client;
        if (!client) {
            throw new Error('Unleash Client not initialized [unleashVanillaStore]');
        }
        return client.isEnabled(toggleName);
    },

    getVariant: <TFlagName extends FeatureFlagsWithVariant>(toggleName: TFlagName): FeatureFlagVariant<TFlagName> => {
        const client = get().client;
        if (!client) {
            throw new Error('Unleash Client not initialized [unleashVanillaStore]');
        }
        return client.getVariant(toggleName) as FeatureFlagVariant<TFlagName>;
    },

    setClient: (client: UnleashClient | null) => {
        set({ client });
    },
}));
