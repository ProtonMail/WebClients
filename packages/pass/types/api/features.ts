import type { MaybeNull } from '@proton/pass/types/utils';

export enum PassFeature {
    LoginAutofillTelemetry = 'LoginAutofillTelemetry',
    PassBasicAuthAutofill = 'PassBasicAuthAutofill',
    PassContentScriptPopoverKillSwitch = 'PassContentScriptPopoverKillSwitch',
    PassCustomTypeV1 = 'PassCustomTypeV1',
    PassEnableDesktopAutoUpdate = 'PassEnableDesktopAutoUpdate',
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
