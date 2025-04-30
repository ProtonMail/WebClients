import type { MaybeNull } from '@proton/pass/types/utils';

export enum PassFeature {
    PassEnableDesktopAutoUpdate = 'PassEnableDesktopAutoUpdate',
    PassWebInternalAlpha = 'PassWebInternalAlpha',
    PassContentScriptPopoverKillSwitch = 'PassContentScriptPopoverKillSwitch',
    PassWebPrfUnlock = 'PassWebPrfUnlock',
    PassFileAttachments = 'PassFileAttachmentsV1',
    PassFileAttachmentEncryptionV2 = 'PassFileAttachmentEncryptionV2',
    PassRenameAdminToManager = 'PassRenameAdminToManager',
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
