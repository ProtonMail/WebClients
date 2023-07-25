import type { MaybeNull } from '../utils';

export enum PassFeature {
    PassSharingV1 = 'PassSharingV1',
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
