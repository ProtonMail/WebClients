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
    PassEnableDesktopAutoUpdate = 'PassEnableDesktopAutoUpdate',
    PassExperimentalWebsiteRules = 'PassExperimentalWebsiteRules',
    PassExtensionCustomTLDs = 'PassExtensionCustomTLDs',
    PassHideShowVault = 'PassHideShowVault',
    PassIFrameKillswitch = 'PassIFrameKillswitch',
    PassItemCloning = 'PassItemCloning',
    PassProtonAnniversaryPromo2025 = 'PassProtonAnniversaryPromo2025',
    PassRenameAdminToManager = 'PassRenameAdminToManager',
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
