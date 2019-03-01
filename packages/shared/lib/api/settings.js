export const getSettings = () => ({
    url: 'settings',
    method: 'get'
});

export const passwordUpgrade = () => ({
    url: 'settings/password/upgrade',
    method: 'put'
});

export const updateLocale = () => ({
    url: 'settings/locale',
    method: 'put'
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