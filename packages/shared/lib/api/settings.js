export const TOTP_WRONG_ERROR = 12060;

export const getSettings = () => ({
    url: 'settings',
    method: 'get'
});

export const updatePassword = (data) => ({
    url: 'settings/password',
    method: 'put',
    data
});

export const upgradePassword = (data) => ({
    url: 'settings/password/upgrade',
    method: 'put',
    data
});

export const updateLocale = (Locale) => ({
    url: 'settings/locale',
    method: 'put',
    data: { Locale }
});

export const updateNews = (News) => ({
    url: 'settings/news',
    method: 'put',
    data: { News }
});

export const updateInvoiceText = (InvoiceText) => ({
    url: 'settings/invoicetext',
    method: 'put',
    data: { InvoiceText }
});

export const updateLogAuth = (LogAuth) => ({
    url: 'settings/logauth',
    method: 'put',
    data: { LogAuth }
});

export const updateDensity = (Density) => ({
    url: 'settings/density',
    method: 'put',
    data: { Density }
});

export const updateEmail = (data) => ({
    url: 'settings/email',
    method: 'put',
    data
});

export const updateNotifyEmail = (Notify) => ({
    url: 'settings/email/notify',
    method: 'put',
    data: { Notify }
});

export const updateResetEmail = (Reset) => ({
    url: 'settings/email/reset',
    method: 'put',
    data: { Reset }
});

export const verifyEmail = (Token) => ({
    url: 'settings/email/verify',
    method: 'post',
    data: { Token }
});

export const updatePhone = (data) => ({
    url: 'settings/phone',
    method: 'put',
    data
});

export const updateNotifyPhone = (Notify) => ({
    url: 'settings/phone/notify',
    method: 'put',
    data: { Notify }
});

export const updateResetPhone = (data) => ({
    url: 'settings/phone/reset',
    method: 'put',
    data
});

export const verifyPhone = (Token) => ({
    url: 'settings/phone/verify',
    method: 'post',
    data: { Token }
});

export const setupTotp = (TOTPSharedSecret, TOTPConfirmation) => ({
    url: 'settings/2fa/totp',
    method: 'post',
    data: { TOTPSharedSecret, TOTPConfirmation }
});

export const disableTotp = () => ({
    url: 'settings/2fa/totp',
    method: 'put'
});
