import { addApiMock } from '@proton/test-api/api';

import { defaultFeatureFlagValue, getFeatureFlagsState } from './featureFlagsState';

export { getFeatureFlagsState };

const featureFlags: { [code: string]: any } = {};

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
