import { addApiMock } from '@proton/test-api/api';

import type { FeatureCode } from '../interface';

const defaultFeatureFlagValue = {
    Code: '',
    Type: 'boolean',
    Global: false,
    DefaultValue: false,
    Value: false,
    UpdateTime: 1616511553,
    Writable: true,
};

const featureFlags: { [code: string]: any } = {};

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

export const registerFeatureFlagsApiMock = () => {
    addApiMock(
        'core/v4/features',
        (args) => {
            const { Code } = args.params;
            const features: string[] = Code.split(',');
            return {
                Features: features.map((code) =>
                    featureFlags[code] ? featureFlags[code] : { ...defaultFeatureFlagValue, Code: code }
                ),
            };
        },
        'get'
    );
};
