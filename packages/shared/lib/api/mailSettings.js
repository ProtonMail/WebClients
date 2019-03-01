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
