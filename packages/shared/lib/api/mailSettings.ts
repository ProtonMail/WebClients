import { AutoResponder as tsAutoResponder } from '../interfaces/AutoResponder';

export const getMailSettings = () => ({
    url: 'mail/v4/settings',
    method: 'get',
});

export const updateShowMoved = (ShowMoved: number) => ({
    url: 'mail/v4/settings/moved',
    method: 'put',
    data: { ShowMoved },
});

export const updateShowImages = (ShowImages: number) => ({
    url: 'mail/v4/settings/images',
    method: 'put',
    data: { ShowImages },
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

export const updateRightToLeft = (RightToLeft: number) => ({
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

export const updateAutocrypt = (Autocrypt: any) => ({
    url: 'mail/v4/settings/autocrypt',
    method: 'put',
    data: { Autocrypt },
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

export const updateHotkeys = (Hotkeys: number) => ({
    url: 'mail/v4/settings/hotkeys',
    method: 'put',
    data: { Hotkeys },
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

export const updateAutoWildcardSearch = (AutoWildcardSearch: number) => ({
    url: 'mail/v4/settings/autowildcard',
    method: 'put',
    data: { AutoWildcardSearch },
});

export const updateDelaySend = (DelaySendSeconds: number) => ({
    url: 'mail/v4/settings/delaysend',
    method: 'put',
    data: { DelaySendSeconds },
});
