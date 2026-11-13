import type { FeatureCode } from '../interface';

export const defaultFeatureFlagValue = {
    Code: '',
    Type: 'boolean',
    Global: false,
    DefaultValue: false,
    Value: false,
    UpdateTime: 1616511553,
    Writable: true,
};

export const getFeatureFlagsState = (features: [FeatureCode, boolean | object][], fetchedAt = Date.now()) => {
    return Object.fromEntries(
        features.map(([featureCode, value]) => {
            return [
                featureCode,
                {
                    value: {
                        ...defaultFeatureFlagValue,
                        Code: featureCode,
                        Value: value,
                    },
                    meta: {
                        fetchedAt,
                        fetchedEphemeral: true,
                    },
                },
            ];
        })
    );
};
