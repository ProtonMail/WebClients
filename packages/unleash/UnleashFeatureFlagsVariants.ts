import { type useVariant as useUnleashVariant } from '@unleash/proxy-client-react';

import { type FeatureFlag } from './UnleashFeatureFlags';

/**
 * List of feature flags with a variant.
 */
export const FLAGS_WITH_VARIANT = ['MailOnboarding', 'ABTestInboxUpsellOneDollar'] satisfies FeatureFlag[];

/**
 * Flags with variants variants.
 * @description Union type of the list of feature flags with a variant.
 *
 * Naming convention: `${FlagName}Variant`
 */
export type MailOnboardingVariant = 'none' | 'old' | 'new';

/**
 * @description Union type of the list of feature flags with a variant.
 *
 * Based on `FLAG_VARIANTS` list.
 */
export type FeatureFlagsWithVariant = (typeof FLAGS_WITH_VARIANT)[number];

type VariantReturnType<TVariantNameValue extends string> = Partial<
    Omit<ReturnType<typeof useUnleashVariant>, 'name'> & { name?: TVariantNameValue }
>;

/**
 * @param FlagName - The feature flag name
 * @description Returns the Unleash variant value based on the declared `FeatureFlagsWithVariant` names
 */
export type FeatureFlagVariant<FlagName extends FeatureFlagsWithVariant> = FlagName extends 'MailOnboarding'
    ? VariantReturnType<MailOnboardingVariant>
    : unknown;
