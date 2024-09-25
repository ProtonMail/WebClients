import type { MaybeNull } from '@proton/pass/types/utils';

export enum PassFeature {
    PassAccountSwitchV1 = 'PassAccountSwitchV1',
    PassDesktopBiometrics = 'PassDesktopBiometrics',
    PassEnableDesktopAutoUpdate = 'PassEnableDesktopAutoUpdate',
    PassIdentityV1 = 'PassIdentityV1',
    PassSimpleLoginAliasesSync = 'PassSimpleLoginAliasesSync',
    PassWebInternalAlpha = 'PassWebInternalAlpha',
    PassWebOfflineMode = 'PassWebOfflineMode',
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
