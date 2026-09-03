import type { MaybeNull } from '../utils';

export enum PassFeature {
    PassAccessTokens = 'PassAccessTokens',
    PassAutofillUrlAdvancedModes = 'PassAutofillUrlAdvancedModes',
    PassAutofillUrlRegex = 'PassAutofillUrlRegex',
    PassAllowCreditCardFreeUsers = 'PassAllowCreditCardFreeUsers',
    PassAutofillModelExperimentGroup = 'PassAutofillModelExperimentGroup',
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

export type AutofillModelExperimentGroup = 'control' | 'challenger';

const AutofillModelExperimentGroupValues: string[] = ['control', 'challenger'] satisfies AutofillModelExperimentGroup[];

export const isAutofillModelExperimentGroup = (name: string): name is AutofillModelExperimentGroup =>
    AutofillModelExperimentGroupValues.includes(name);

/** Used whenever the flag/variant is unavailable (disabled, not yet fetched,
 * or the features request failed/timed out). */
export const DEFAULT_AUTOFILL_MODEL_EXPERIMENT_GROUP: AutofillModelExperimentGroup = 'control';
