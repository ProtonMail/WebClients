import { AutoResponder } from '../interfaces/AutoResponder';

export const getMailSettings = () => ({
    url: 'settings/mail',
    method: 'get'
});

export const updateShowMoved = (ShowMoved: number) => ({
    url: 'settings/mail/moved',
    method: 'put',
    data: { ShowMoved }
});

export const updateShowImages = (ShowImages: number) => ({
    url: 'settings/mail/images',
    method: 'put',
    data: { ShowImages }
});

export const updateAutoSaveContacts = (AutoSaveContacts: number) => ({
    url: 'settings/mail/autocontacts',
    method: 'put',
    data: { AutoSaveContacts }
});

export const updateTheme = (Theme: string | number) => ({
    url: 'settings/mail/theme',
    method: 'put',
    data: { Theme }
});

export const updateDisplayName = (DisplayName: string) => ({
    url: 'settings/mail/display',
    method: 'put',
    data: { DisplayName }
});

export const updateSignature = (Signature: string) => ({
    url: 'settings/mail/signature',
    method: 'put',
    data: { Signature }
});

export const updatePMSignature = (PMSignature: string) => ({
    url: 'settings/mail/pmsignature',
    method: 'put',
    data: { PMSignature }
});

export const updateComposerMode = (ComposerMode: number) => ({
    url: 'settings/mail/composermode',
    method: 'put',
    data: { ComposerMode }
});

export const updateMessageButtons = (MessageButtons: number) => ({
    url: 'settings/mail/messagebuttons',
    method: 'put',
    data: { MessageButtons }
});

export const updateViewMode = (ViewMode: number) => ({
    url: 'settings/mail/viewmode',
    method: 'put',
    data: { ViewMode }
});

export const updateStickyLabels = (StickyLabels: number) => ({
    url: 'settings/mail/stickylabels',
    method: 'put',
    data: { StickyLabels }
});

export const updateDraftType = (MIMEType: string) => ({
    url: 'settings/mail/drafttype',
    method: 'put',
    data: { MIMEType }
});

export const updateRightToLeft = (RightToLeft: number) => ({
    url: 'settings/mail/righttoleft',
    method: 'put',
    data: { RightToLeft }
});

export const updateViewLayout = (ViewLayout: number) => ({
    url: 'settings/mail/viewlayout',
    method: 'put',
    data: { ViewLayout }
});

export const updatePromptPin = (PromptPin: number) => ({
    url: 'settings/mail/promptpin',
    method: 'put',
    data: { PromptPin }
});

export const updateAutocrypt = (Autocrypt: any) => ({
    url: 'settings/mail/autocrypt',
    method: 'put',
    data: { Autocrypt }
});

export const updatePGPScheme = (PGPScheme: number) => ({
    url: 'settings/mail/pgpscheme',
    method: 'put',
    data: { PGPScheme }
});

export const updateSign = (Sign: number) => ({
    url: 'settings/mail/sign',
    method: 'put',
    data: { Sign }
});

export const updateAttachPublicKey = (AttachPublicKey: number) => ({
    url: 'settings/mail/attachpublic',
    method: 'put',
    data: { AttachPublicKey }
});

export const updateHotkeys = (Hotkeys: number) => ({
    url: 'settings/mail/hotkeys',
    method: 'put',
    data: { Hotkeys }
});

export const updateAutoresponder = (AutoResponder: AutoResponder) => ({
    url: 'settings/mail/autoresponder',
    method: 'put',
    data: { AutoResponder }
});

export const updateConfirmLink = (ConfirmLink: number) => ({
    url: 'settings/mail/confirmlink',
    method: 'put',
    data: { ConfirmLink }
});

export const updateAutoWildcardSearch = (AutoWildcardSearch: number) => ({
    url: 'settings/mail/autowildcard',
    method: 'put',
    data: { AutoWildcardSearch }
});
