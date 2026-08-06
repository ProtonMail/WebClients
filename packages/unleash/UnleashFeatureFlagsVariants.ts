import type { useVariant as useUnleashVariant } from '@unleash/proxy-client-react';

import type { FeatureFlag } from './UnleashFeatureFlags';

/**
 * List of feature flags with a variant.
 */
export const FLAGS_WITH_VARIANT = [
    'VPNDashboard',
    'DriveDashboard',
    'InboxBringYourOwnEmailSignup',
    'WebApiRateLimiter',
    'MaxContactsImport',
    'ShowLiteAppCheckoutV2',
    'Vpn2024AddonsExperiment',
    'MeetSpotlightType',
    'OrganizationLevelEasySwitch',
    'VPNReferralWithoutTrial',
    'B2BAlwaysOnWindowsRelease',
    'CategoryViewVariant',
] satisfies FeatureFlag[];

/**
 * Flags with variants.
 * @description Union type of the list of feature flags with a variant.
 *
 * Naming convention: `${FlagName}Variant`
 */
export type VPNDashboardVariant = 'Control' | 'A' | 'B';
export type DriveDashboardVariant = 'A' | 'B';
export type MeetSpotlightTypeVariant = 'no-cta' | 'cta';
export type InboxBringYourOwnEmailSignupVariant = 'Control' | 'Bold' | 'Light';
export type WebApiRateLimiterVariant = 'Config';
export type MaxContactsImportVariant = 'Config';
export type ShowLiteAppCheckoutV2Variant = 'A' | 'B';
export type OrganizationLevelEasySwitchVariant = 'Config';
export type VPNReferralWithoutTrialVariant = 'A' | 'B';
export type B2BAlwaysOnWindowsReleaseVariant = 'version';
export type EnableVpn2024AddonsExperimentVariant =
    'lumo-addon-only' | 'meet-addon-only' | 'pass-addon-only' | 'no-addon';
/**
 * The important variant for the client is `RecategorizationButton`. Users with this variant will see the move to primary badge.
 * The other variants are used for other experiments and are here for reference.
 */
export type CategoryViewVariantVariant =
    | 'FeatureAccessOn'
    | 'FeatureAccessOff'
    | 'PrimaryFiltering45'
    | 'PrimaryFiltering60'
    | 'RecategorizationButton'
    | 'RecategorizationNoButton'
    | 'BackBucket'
    | 'GradualRollout'
    | 'NoAccess';

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
    VPNDashboard: VariantReturnType<VPNDashboardVariant>;
    DriveDashboard: VariantReturnType<DriveDashboardVariant>;
    InboxBringYourOwnEmailSignup: VariantReturnType<InboxBringYourOwnEmailSignupVariant>;
    WebApiRateLimiter: VariantReturnType<WebApiRateLimiterVariant>;
    MaxContactsImport: VariantReturnType<MaxContactsImportVariant>;
    ShowLiteAppCheckoutV2: VariantReturnType<ShowLiteAppCheckoutV2Variant>;
    OrganizationLevelEasySwitch: VariantReturnType<OrganizationLevelEasySwitchVariant>;
    Vpn2024AddonsExperiment: VariantReturnType<EnableVpn2024AddonsExperimentVariant>;
    MeetSpotlightType: VariantReturnType<MeetSpotlightTypeVariant>;
    VPNReferralWithoutTrial: VariantReturnType<VPNReferralWithoutTrialVariant>;
    B2BAlwaysOnWindowsRelease: VariantReturnType<B2BAlwaysOnWindowsReleaseVariant>;
    CategoryViewVariant: VariantReturnType<CategoryViewVariantVariant>;
};

/**
 * @param FlagName - The feature flag name
 * @description Returns the Unleash variant value based on the declared `FeatureFlagsWithVariant` names
 */
export type FeatureFlagVariant<FlagName extends FeatureFlagsWithVariant> = FlagName extends keyof FeatureFlagVariantMap
    ? FeatureFlagVariantMap[FlagName]
    : unknown;
