import { useVariant as useUnleashVariant } from '@unleash/proxy-client-react';

import type { FeatureFlagVariant, FeatureFlagsWithVariant } from './UnleashFeatureFlagsVariants';

/**
 * useVariant
 * @param name - Feature flag name
 * @description Returns the Unleash variant value based on the feature flag name
 * 1. In `UnleashFeatureFlagsVariants.ts` register the flag name your want to add variants on in `FLAG_VARIANTS` const
 * 2. In the same file add feature flag variant condition to the `UnleashVariant` type
 * 3. Use the `useVariant` hook to get your flag variant value
 */
function useVariant<TFlagName extends FeatureFlagsWithVariant>(name: TFlagName): FeatureFlagVariant<TFlagName> {
    const variant = useUnleashVariant(name) as FeatureFlagVariant<TFlagName>;

    return variant;
}

export default useVariant;
