import type { MaybeNull } from '../utils';

export enum PassFeature {
    PassEnableDesktopAutoUpdate = 'PassEnableDesktopAutoUpdate',
    PassEnableOrganizationExport = 'PassEnableOrganizationExport',
    PassEnableOrganizationSharing = 'PassEnableOrganizationSharing',
    PassItemHistoryV1 = 'PassItemHistoryV1',
    PassPinningV1 = 'PassPinningV1',
    PassRemovePrimaryVault = 'PassRemovePrimaryVault',
    PassSharingNewUsers = 'PassSharingNewUsers',
    PassSharingV1 = 'PassSharingV1',
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
