import type { AutoResponder as tsAutoResponder } from '../interfaces/AutoResponder';
import type { BLOCK_SENDER_CONFIRMATION } from '../mail/constants';
import type {
    AUTO_DELETE_SPAM_AND_TRASH_DAYS,
    DIRECTION,
    MAIL_PAGE_SIZE,
    NEXT_MESSAGE_ON_MOVE,
    PM_SIGNATURE_REFERRAL,
    REMOVE_IMAGE_METADATA,
    SPAM_ACTION,
    SWIPE_ACTION,
} from '../mail/mailSettings';

export const getMailSettings = () => ({
    url: 'mail/v4/settings',
    method: 'get',
});

export const updatePageSize = (PageSize: MAIL_PAGE_SIZE) => ({
    url: 'mail/v4/settings/pagesize',
    method: 'put',
    data: { PageSize },
});

export const updateNextMessageOnMove = (NextMessageOnMove: NEXT_MESSAGE_ON_MOVE) => ({
    url: 'mail/v4/settings/next-message-on-move',
    method: 'put',
    data: { NextMessageOnMove },
});

export const updateShowMoved = (ShowMoved: number) => ({
    url: 'mail/v4/settings/moved',
    method: 'put',
    data: { ShowMoved },
});

export const updateHideRemoteImages = (HideRemoteImages: number) => ({
    url: 'mail/v4/settings/hide-remote-images',
    method: 'put',
    data: { HideRemoteImages },
});

export const updateShowAlmostAllMail = (AlmostAllMail: number) => ({
    url: 'mail/v4/settings/almost-all-mail',
    method: 'put',
    data: { AlmostAllMail },
});

export const updateHideEmbeddedImages = (HideEmbeddedImages: number) => ({
    url: 'mail/v4/settings/hide-embedded-images',
    method: 'put',
    data: { HideEmbeddedImages },
});

export const updateAutoSaveContacts = (AutoSaveContacts: number) => ({
    url: 'mail/v4/settings/autocontacts',
    method: 'put',
    data: { AutoSaveContacts },
});

export const updateTheme = (Theme: string | number) => ({
    url: 'mail/v4/settings/theme',
    method: 'put',
    data: { Theme },
});

export const updateDisplayName = (DisplayName: string) => ({
    url: 'mail/v4/settings/display',
    method: 'put',
    data: { DisplayName },
});

export const updateSignature = (Signature: string) => ({
    url: 'mail/v4/settings/signature',
    method: 'put',
    data: { Signature },
});

export const updatePMSignature = (PMSignature: number) => ({
    url: 'mail/v4/settings/pmsignature',
    method: 'put',
    data: { PMSignature },
});

export const updatePMSignatureReferralLink = (PMSignatureReferralLink: PM_SIGNATURE_REFERRAL) => ({
    url: 'mail/v4/settings/pmsignature-referral',
    method: 'put',
    data: { PMSignatureReferralLink },
});

export const updateComposerMode = (ComposerMode: number) => ({
    url: 'mail/v4/settings/composermode',
    method: 'put',
    data: { ComposerMode },
});

export const updateMessageButtons = (MessageButtons: number) => ({
    url: 'mail/v4/settings/messagebuttons',
    method: 'put',
    data: { MessageButtons },
});

export const updateViewMode = (ViewMode: number) => ({
    url: 'mail/v4/settings/viewmode',
    method: 'put',
    data: { ViewMode },
});

export const updateStickyLabels = (StickyLabels: number) => ({
    url: 'mail/v4/settings/stickylabels',
    method: 'put',
    data: { StickyLabels },
});

export const updateDraftType = (MIMEType: string) => ({
    url: 'mail/v4/settings/drafttype',
    method: 'put',
    data: { MIMEType },
});

export const updateRightToLeft = (RightToLeft: DIRECTION) => ({
    url: 'mail/v4/settings/righttoleft',
    method: 'put',
    data: { RightToLeft },
});

export const updateViewLayout = (ViewLayout: number) => ({
    url: 'mail/v4/settings/viewlayout',
    method: 'put',
    data: { ViewLayout },
});

export const updatePromptPin = (PromptPin: number) => ({
    url: 'mail/v4/settings/promptpin',
    method: 'put',
    data: { PromptPin },
});

export const updateKT = (KT: number) => ({
    url: 'mail/v4/settings/kt',
    method: 'put',
    data: { KT },
});

export const updatePGPScheme = (PGPScheme: number) => ({
    url: 'mail/v4/settings/pgpscheme',
    method: 'put',
    data: { PGPScheme },
});

export const updateSign = (Sign: number) => ({
    url: 'mail/v4/settings/sign',
    method: 'put',
    data: { Sign },
});

export const updateAttachPublicKey = (AttachPublicKey: number) => ({
    url: 'mail/v4/settings/attachpublic',
    method: 'put',
    data: { AttachPublicKey },
});

export const updateShortcuts = (Shortcuts: number) => ({
    url: 'mail/v4/settings/shortcuts',
    method: 'put',
    data: { Shortcuts },
});

export const updateAutoresponder = (AutoResponder: tsAutoResponder) => ({
    url: 'mail/v4/settings/autoresponder',
    method: 'put',
    data: { AutoResponder },
});

export const updateConfirmLink = (ConfirmLink: number) => ({
    url: 'mail/v4/settings/confirmlink',
    method: 'put',
    data: { ConfirmLink },
});

export const updateDelaySend = (DelaySendSeconds: number) => ({
    url: 'mail/v4/settings/delaysend',
    method: 'put',
    data: { DelaySendSeconds },
});

export const updateEnableFolderColor = (EnableFolderColor: number) => ({
    url: 'mail/v4/settings/enablefoldercolor',
    method: 'put',
    data: { EnableFolderColor },
});

export const updateInheritParentFolderColor = (InheritParentFolderColor: number) => ({
    url: 'mail/v4/settings/inheritparentfoldercolor',
    method: 'put',
    data: { InheritParentFolderColor },
});

export const updateFontFace = (FontFace: string) => ({
    url: 'mail/v4/settings/fontface',
    method: 'put',
    data: { FontFace },
});

export const updateFontSize = (FontSize: number) => ({
    url: 'mail/v4/settings/fontsize',
    method: 'put',
    data: { FontSize },
});

export const updateImageProxy = (ImageProxy: number, Action: 'add' | 'remove') => ({
    url: 'mail/v4/settings/imageproxy',
    method: 'put',
    data: { ImageProxy, Action: Action === 'add' ? 1 : 0 },
});

export const updateSpamAction = (SpamAction: SPAM_ACTION | null) => ({
    url: 'mail/v4/settings/spam-action',
    method: 'put',
    data: { SpamAction },
});

export const updateBlockSenderConfirmation = (BlockSenderConfirmation: BLOCK_SENDER_CONFIRMATION | null) => ({
    url: 'mail/v4/settings/block-sender-confirmation',
    method: 'put',
    data: { BlockSenderConfirmation },
});

export const updateHideSenderImages = (HideSenderImages: number) => ({
    url: 'mail/v4/settings/hide-sender-images',
    method: 'put',
    data: { HideSenderImages },
});

export const updateDisplayUnreadFavicon = (UnreadFavicon: number) => ({
    url: 'mail/v4/settings/unread-favicon',
    method: 'put',
    data: { UnreadFavicon },
});

export const updateAutoDelete = (AutoDeleteSpamAndTrashDays: AUTO_DELETE_SPAM_AND_TRASH_DAYS) => ({
    url: 'mail/v4/settings/auto-delete-spam-and-trash-days',
    method: 'put',
    data: { Days: AutoDeleteSpamAndTrashDays },
});

export const updateSwipeLeft = (SwipeLeft: SWIPE_ACTION) => ({
    url: 'mail/v4/settings/swipeleft',
    method: 'put',
    data: { SwipeLeft },
});

export const updateSwipeRight = (SwipeRight: SWIPE_ACTION) => ({
    url: 'mail/v4/settings/swiperight',
    method: 'put',
    data: { SwipeRight },
});

export const updateRemoveImageMetadata = (RemoveImageMetadata: REMOVE_IMAGE_METADATA) => ({
    url: 'mail/v4/settings/remove-image-metadata',
    method: 'put',
    data: { RemoveImageMetadata },
});
