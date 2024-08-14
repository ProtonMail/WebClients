export type FeatureFlagPayload = {
    type: string;
    value: string;
};

export type FeatureFlagVariant = {
    name: string;
    enabled: boolean;
    payload?: FeatureFlagPayload;
};

export type FeatureFlagToggle = {
    name: string;
    enabled: boolean;
    variant: FeatureFlagVariant;
};

export type FeatureFlagsResponse = {
    Code: number;
    toggles: FeatureFlagToggle[];
};
