export const getSubscription = () => ({
    url: 'payments/subscription',
    method: 'get'
});

export const queryInvoices = ({ Page, PageSize, Owner, State, Type }) => ({
    url: 'payments/invoices',
    method: 'get',
    params: { Page, PageSize, Owner, State, Type }
});

export const getInvoice = (ID) => ({
    url: `payments/invoices/${ID}`,
    method: 'get',
    output: 'arrayBuffer'
});

export const queryPaymentMethods = () => ({
    url: 'payments/methods',
    method: 'get'
});

export const setPaymentMethod = (data) => ({
    url: 'payments/methods',
    method: 'post',
    data
});

export const deletePaymentMethod = (ID) => ({
    url: `payments/methods/${ID}`,
    method: 'delete'
});