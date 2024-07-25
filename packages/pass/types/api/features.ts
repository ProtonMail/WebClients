import type { MaybeNull } from '@proton/pass/types/utils';

export enum PassFeature {
    PassEnableDesktopAutoUpdate = 'PassEnableDesktopAutoUpdate',
    PassUsernameSplit = 'PassUsernameSplit',
    PassWebInternalAlpha = 'PassWebInternalAlpha',
    PassWebOfflineMode = 'PassWebOfflineMode',
    PassIdentityV1 = 'PassIdentityV1',
}

export const PassFeaturesValues = Object.values(PassFeature);

/* Unleash response types */
export type FeatureFlagPayload = {
    type: string;
    value: string;
};

export type FeatureFlagVariant = {
    name: string;
    enabled: boolean;
    payload: MaybeNull<FeatureFlagPayload>;
};

export type FeatureFlagToggle = {
    name: string;
    variant: FeatureFlagVariant;
};

export type FeatureFlagsResponse = {
    Code: number;
    toggles: FeatureFlagToggle[];
};
