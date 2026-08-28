import type { MaybeNull } from '@proton/pass/types/utils';

export enum PassFeature {
    LoginAutofillTelemetry = 'LoginAutofillTelemetry',
    PassAccessTokens = 'PassAccessTokens',
    PassAutofillUrlAdvancedModes = 'PassAutofillUrlAdvancedModes',
    PassAutofillUrlRegex = 'PassAutofillUrlRegex',
    PassAllowCreditCardFreeUsers = 'PassAllowCreditCardFreeUsers',
    PassBasicAuthAutofill = 'PassBasicAuthAutofill',
    PassCompromisedPasswords = 'PassCompromisedPasswords',
    PassContentScriptPopoverKillSwitch = 'PassContentScriptPopoverKillSwitch',
    PassContextMenu = 'PassContextMenu',
    PassCreditCardWebAutofill = 'PassCreditCardWebAutofill',
    PassCustomTypeV1 = 'PassCustomTypeV1',
    PassDesktopAutotype = 'PassDesktopAutotype',
    PassDesktopBeta = 'PassDesktopBeta',
    PassDesktopSSHAgent = 'PassDesktopSSHAgent',
    PassDesktopUnlock = 'PassDesktopUnlock',
    PassEnableDesktopAutoUpdate = 'PassEnableDesktopAutoUpdate',
    PassExperimentalWebsiteRules = 'PassExperimentalWebsiteRules',
    PassExtensionCustomTLDs = 'PassExtensionCustomTLDs',
    PassExtensionOfflineV1 = 'PassExtensionOfflineV1',
    PassFileAttachmentsEssentialsUpsell = 'PassFileAttachmentsEssentialsUpsell',
    PassGroupInvitesV1 = 'PassGroupInvitesV1',
    PassHideShowVault = 'PassHideShowVault',
    PassIFrameExtendedAutofill = 'PassIFrameExtendedAutofill',
    PassIFrameKillswitch = 'PassIFrameKillswitch',
    PassItemCloning = 'PassItemCloning',
    PassMLAutofill = 'PassMLAutofill',
    PassNavbarUpgradeToAccount = 'PassNavbarUpgradeToAccount',
    PassOnboardingUpgrade = 'PassOnboardingUpgrade',
    PassProtonAnniversaryPromo2025 = 'PassProtonAnniversaryPromo2025',
    PassRenameAdminToManager = 'PassRenameAdminToManager',
    PassUserEventsV1 = 'PassUserEventsV1',
    PassWebDesktopLifetimeBanner = 'PassWebDesktopLifetimeBanner',
    PassWebInternalAlpha = 'PassWebInternalAlpha',
    PassWebPrfUnlock = 'PassWebPrfUnlock',
    PassWeb__V1_41__RelevantSort = 'PassWeb__V1_41__RelevantSort',
}

export const PassFeaturesValues = Object.values(PassFeature);

/* Unleash response types */
export type FeatureFlagPayload = {
    type: string;
    value: string;
};

export type FeatureFlagVariant = {
    name: string;
    enabled: boolean;
    payload: MaybeNull<FeatureFlagPayload>;
};

export type FeatureFlagToggle = {
    name: string;
    variant: FeatureFlagVariant;
};

export type FeatureFlagsResponse = {
    Code: number;
    toggles: FeatureFlagToggle[];
};
