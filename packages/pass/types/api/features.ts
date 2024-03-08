import type { MaybeNull } from '../utils';

export enum PassFeature {
    PassSharingV1 = 'PassSharingV1',
    PassRemovePrimaryVault = 'PassRemovePrimaryVault',
    PassSharingNewUsers = 'PassSharingNewUsers',
    PassPinningV1 = 'PassPinningV1',
    PassEnableDesktopAutoUpdate = 'PassEnableDesktopAutoUpdate',
    PassItemHistoryV1 = 'PassItemHistoryV1',
    PassEnableOrganizationSharing = 'PassEnableOrganizationSharing',
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
