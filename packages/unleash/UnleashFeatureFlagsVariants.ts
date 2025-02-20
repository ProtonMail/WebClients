import { type useVariant as useUnleashVariant } from '@unleash/proxy-client-react';

import { type FeatureFlag } from './UnleashFeatureFlags';

/**
 * List of feature flags with a variant.
 */
export const FLAGS_WITH_VARIANT = [
    'InboxNewUpsellModals',
    'DriveWebDownloadMechanismParameters',
    'MailPlusSubscribersNudgeExperiment',
] satisfies FeatureFlag[];

/**
 * Flags with variants variants.
 * @description Union type of the list of feature flags with a variant.
 *
 * Naming convention: `${FlagName}Variant`
 */
export type InboxNewUpsellModalsVariant = 'old' | 'new';
export type DriveWebDownloadMechanismParametersVariant = 'low-memory' | 'base-memory' | 'high-memory';
export type MailPlusSubscribersNudgeExperimentVariants = 'money' | 'percentage';

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
    InboxNewUpsellModals: VariantReturnType<InboxNewUpsellModalsVariant>;
    DriveWebDownloadMechanismParameters: VariantReturnType<DriveWebDownloadMechanismParametersVariant>;
    MailPlusSubscribersNudgeExperiment: VariantReturnType<MailPlusSubscribersNudgeExperimentVariants>;
};

/**
 * @param FlagName - The feature flag name
 * @description Returns the Unleash variant value based on the declared `FeatureFlagsWithVariant` names
 */
export type FeatureFlagVariant<FlagName extends FeatureFlagsWithVariant> = FlagName extends keyof FeatureFlagVariantMap
    ? FeatureFlagVariantMap[FlagName]
    : unknown;
