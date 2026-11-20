import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';

import {
    updateAttachPublicKey,
    updateAutoDelete,
    updateAutoSaveContacts,
    updateAutoresponder,
    updateBlockSenderConfirmation,
    updateByoeNewMessageReminder,
    updateComposerMode,
    updateConfirmLink,
    updateDelaySend,
    updateDisplayUnreadFavicon,
    updateDraftType,
    updateEnableFolderColor,
    updateFontFace,
    updateFontSize,
    updateHideEmbeddedImages,
    updateHideRemoteImages,
    updateHideSenderImages,
    updateImageProxy,
    updateInheritParentFolderColor,
    updateKT,
    updateMailCategoryView,
    updateMailCategoryViewCountersEnabled,
    updateNextMessageOnMove,
    updatePGPScheme,
    updatePMSignature,
    updatePMSignatureReferralLink,
    updatePageSize,
    updatePromptPin,
    updateRemoveImageMetadata,
    updateRightToLeft,
    updateShortcuts,
    updateShowAlmostAllMail,
    updateShowMoved,
    updateSign,
    updateSpamAction,
    updateStickyLabels,
    updateSwipeLeft,
    updateSwipeRight,
    updateViewLayout,
    updateViewMode,
} from '../../api/mailSettings';

/**
 * `MailSettings` fields that cannot be updated with `update(key, value)`.
 * Adding a field to `MailSettings` fails to compile until it is either added to the registry below or listed here.
 */
type NotInRegistry =
    // Legacy fields, updated per address (DisplayName, Signature) or by the core settings (Theme)
    | 'DisplayName'
    | 'Signature'
    | 'Theme'
    // No update endpoint in `@proton/mail/api/mailSettings`: read-only or server managed
    | 'MessageButtons'
    | 'NumMessagePerPage'
    | 'RecipientLimit'
    | 'ReceiveMIMEType'
    | 'ShowMIMEType'
    | 'PMSignatureContent';

/**
 * Single place mapping a mail setting to the request that updates it.
 *
 * - The key is the name of the field in `MailSettings`, the value type is inferred from the request builder.
 * - This is the only module that should import from `../../api/mailSettings`.
 * - A setting that needs several values takes an object (e.g. `ImageProxy`).
 */
export const MAIL_SETTING_UPDATERS = {
    AutoResponder: updateAutoresponder,
    AutoSaveContacts: updateAutoSaveContacts,
    AlmostAllMail: updateShowAlmostAllMail,
    AttachPublicKey: updateAttachPublicKey,
    AutoDeleteSpamAndTrashDays: updateAutoDelete,
    BlockSenderConfirmation: updateBlockSenderConfirmation,
    ByoeNewMessageReminder: updateByoeNewMessageReminder,
    ComposerMode: updateComposerMode,
    ConfirmLink: updateConfirmLink,
    DelaySendSeconds: updateDelaySend,
    DraftMIMEType: updateDraftType,
    EnableFolderColor: updateEnableFolderColor,
    FontFace: updateFontFace,
    FontSize: updateFontSize,
    HideEmbeddedImages: updateHideEmbeddedImages,
    HideRemoteImages: updateHideRemoteImages,
    HideSenderImages: updateHideSenderImages,
    ImageProxy: ({ value, action }: { value: number; action: 'add' | 'remove' }) => updateImageProxy(value, action),
    InheritParentFolderColor: updateInheritParentFolderColor,
    KT: updateKT,
    MailCategoryView: updateMailCategoryView,
    MailCategoryViewCountersEnabled: updateMailCategoryViewCountersEnabled,
    NextMessageOnMove: updateNextMessageOnMove,
    PageSize: updatePageSize,
    PGPScheme: updatePGPScheme,
    PMSignature: updatePMSignature,
    PMSignatureReferralLink: updatePMSignatureReferralLink,
    PromptPin: updatePromptPin,
    RemoveImageMetadata: updateRemoveImageMetadata,
    RightToLeft: updateRightToLeft,
    Shortcuts: updateShortcuts,
    ShowMoved: updateShowMoved,
    Sign: updateSign,
    SpamAction: updateSpamAction,
    StickyLabels: updateStickyLabels,
    SwipeLeft: updateSwipeLeft,
    SwipeRight: updateSwipeRight,
    UnreadFavicon: updateDisplayUnreadFavicon,
    ViewLayout: updateViewLayout,
    ViewMode: updateViewMode,
} as const satisfies Record<Exclude<keyof MailSettings, NotInRegistry>, (value: never) => unknown>;

export type UpdatableMailSetting = keyof typeof MAIL_SETTING_UPDATERS;

export type MailSettingValue<K extends UpdatableMailSetting> = Parameters<(typeof MAIL_SETTING_UPDATERS)[K]>[0];

export type MailSettingRequest = { url: string; method: string; data?: unknown };
