export const getMailSettings = () => ({
    url: 'settings/mail',
    method: 'get'
});

export const updateShowMoved = (ShowMoved) => ({
    url: 'settings/mail/moved',
    method: 'put',
    data: { ShowMoved }
});

export const updateShowImages = (ShowImages) => ({
    url: 'settings/mail/images',
    method: 'put',
    data: { ShowImages }
});

export const updateAutoSaveContacts = (AutoSaveContacts) => ({
    url: 'settings/mail/autocontacts',
    method: 'put',
    data: { AutoSaveContacts }
});

export const updateTheme = (Theme) => ({
    url: 'settings/mail/theme',
    method: 'put',
    data: { Theme }
});

export const updateDisplayName = (DisplayName) => ({
    url: 'settings/mail/display',
    method: 'put',
    data: { DisplayName }
});

export const updateSignature = (Signature) => ({
    url: 'settings/mail/signature',
    method: 'put',
    data: { Signature }
});

export const updatePMSignature = (PMSignature) => ({
    url: 'settings/mail/pmsignature',
    method: 'put',
    data: { PMSignature }
});

export const updateComposerMode = (ComposerMode) => ({
    url: 'settings/mail/composermode',
    method: 'put',
    data: { ComposerMode }
});

export const updateMessageButtons = (MessageButtons) => ({
    url: 'settings/mail/messagebuttons',
    method: 'put',
    data: { MessageButtons }
});

export const updateViewMode = (ViewMode) => ({
    url: 'settings/mail/viewmode',
    method: 'put',
    data: { ViewMode }
});

export const updateDraftType = (MIMEType) => ({
    url: 'settings/mail/drafttype',
    method: 'put',
    data: { MIMEType }
});

export const updateRightToLeft = (RightToLeft) => ({
    url: 'settings/mail/righttoleft',
    method: 'put',
    data: { RightToLeft }
});

export const updateViewLayout = (ViewLayout) => ({
    url: 'settings/mail/viewlayout',
    method: 'put',
    data: { ViewLayout }
});

export const updatePromptPin = (PromptPin) => ({
    url: 'settings/mail/promptpin',
    method: 'put',
    data: { PromptPin }
});

export const updateAutocrypt = (Autocrypt) => ({
    url: 'settings/mail/autocrypt',
    method: 'put',
    data: { Autocrypt }
});

export const updatePGPScheme = (PGPScheme) => ({
    url: 'settings/mail/pgpscheme',
    method: 'put',
    data: { PGPScheme }
});

export const updateSign = (Sign) => ({
    url: 'settings/mail/sign',
    method: 'put',
    data: { Sign }
});

export const updateAttachPublicKey = (AttachPublicKey) => ({
    url: 'settings/mail/attachpublic',
    method: 'put',
    data: { AttachPublicKey }
});
