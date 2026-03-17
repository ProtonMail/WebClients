import type { MaybeNull } from '@proton/pass/types/utils';

export enum PassFeature {
    LoginAutofillTelemetry = 'LoginAutofillTelemetry',
    PassAllowCreditCardFreeUsers = 'PassAllowCreditCardFreeUsers',
    PassBasicAuthAutofill = 'PassBasicAuthAutofill',
    PassContentScriptPopoverKillSwitch = 'PassContentScriptPopoverKillSwitch',
    PassContextMenu = 'PassContextMenu',
    PassCreditCardWebAutofill = 'PassCreditCardWebAutofill',
    PassCustomTypeV1 = 'PassCustomTypeV1',
    PassDesktopAutotype = 'PassDesktopAutotype',
    PassDesktopBeta = 'PassDesktopBeta',
    PassDesktopUnlock = 'PassDesktopUnlock',
    PassEnableDesktopAutoUpdate = 'PassEnableDesktopAutoUpdate',
    PassExperimentalWebsiteRules = 'PassExperimentalWebsiteRules',
    PassExtensionCustomTLDs = 'PassExtensionCustomTLDs',
    PassExtensionOfflineV1 = 'PassExtensionOfflineV1',
    PassGroupInvitesV1 = 'PassGroupInvitesV1',
    PassHideShowVault = 'PassHideShowVault',
    PassIFrameKillswitch = 'PassIFrameKillswitch',
    PassItemCloning = 'PassItemCloning',
    PassOnboardingUpgrade = 'PassOnboardingUpgrade',
    PassProtonAnniversaryPromo2025 = 'PassProtonAnniversaryPromo2025',
    PassRenameAdminToManager = 'PassRenameAdminToManager',
    PassWebDesktopLifetimeBanner = 'PassWebDesktopLifetimeBanner',
    PassWebInternalAlpha = 'PassWebInternalAlpha',
    PassWebPrfUnlock = 'PassWebPrfUnlock',
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
