import { type useVariant as useUnleashVariant } from '@unleash/proxy-client-react';

import { type FeatureFlag } from './UnleashFeatureFlags';

/**
 * List of feature flags with a variant.
 */
export const FLAGS_WITH_VARIANT = [
    'DriveWebDownloadMechanismParameters',
    'VPNDashboard',
    'InboxBringYourOwnEmailSignup',
] satisfies FeatureFlag[];

/**
 * Flags with variants.
 * @description Union type of the list of feature flags with a variant.
 *
 * Naming convention: `${FlagName}Variant`
 */
export type DriveWebDownloadMechanismParametersVariant = 'low-memory' | 'base-memory' | 'high-memory';
export type VPNDashboardVariant = 'Control' | 'A' | 'B';
export type InboxBringYourOwnEmailSignupVariant = 'Control' | 'Bold' | 'Light';

/**
 * @description Union type of the list of feature flags with a variant.
 *
 * Based on `FLAG_VARIANTS` list.
 */
export type FeatureFlagsWithVariant = (typeof FLAGS_WITH_VARIANT)[number];

type VariantReturnType<TVariantNameValue extends string> = Partial<
    // If flag is disabled, the variant name is 'disabled'
    Omit<ReturnType<typeof useUnleashVariant>, 'name'> & { name?: TVariantNameValue | 'disabled' }
>;

/**
 * @description Map of feature flags with a variant.
 * Register your new variant here.
 */
type FeatureFlagVariantMap = {
    DriveWebDownloadMechanismParameters: VariantReturnType<DriveWebDownloadMechanismParametersVariant>;
    VPNDashboard: VariantReturnType<VPNDashboardVariant>;
    InboxBringYourOwnEmailSignup: VariantReturnType<InboxBringYourOwnEmailSignupVariant>;
};

/**
 * @param FlagName - The feature flag name
 * @description Returns the Unleash variant value based on the declared `FeatureFlagsWithVariant` names
 */
export type FeatureFlagVariant<FlagName extends FeatureFlagsWithVariant> = FlagName extends keyof FeatureFlagVariantMap
    ? FeatureFlagVariantMap[FlagName]
    : unknown;
