type FeatureFlagVariant = {
    name: string;
    enabled: boolean;
    // Type when we will want to play with payloads
    payload?: unknown;
};

export type FeatureFlagToggle = {
    name: string;
    enabled: boolean;
    variant?: FeatureFlagVariant | null;
};
