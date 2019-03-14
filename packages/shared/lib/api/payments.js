export const getSubscription = () => ({
    url: 'payments/subscription',
    method: 'get'
});

export const deleteSubscription = () => ({
    url: 'payments/subscription',
    method: 'delete'
});

export const queryInvoices = ({ Page, PageSize, Owner, State, Type }) => ({
    url: 'payments/invoices',
    method: 'get',
    params: { Page, PageSize, Owner, State, Type }
});

export const queryPlans = (Currency, Cycle) => ({
    url: 'payments/plans',
    method: 'get',
    params: { Currency, Cycle }
});

export const getInvoice = (invoiceID) => ({
    url: `payments/invoices/${invoiceID}`,
    method: 'get',
    output: 'arrayBuffer'
});

export const checkInvoice = (invoiceID, GiftCode) => ({
    url: `payments/invoices/${invoiceID}/check`,
    method: 'put',
    data: { GiftCode }
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

export const deletePaymentMethod = (methodID) => ({
    url: `payments/methods/${methodID}`,
    method: 'delete'
});

export const createBitcoinPayment = (Amount, Currency) => ({
    url: 'payments/bcinfo',
    method: 'post',
    data: { Amount, Currency }
});

export const createPayPalPayment = (Amount, Currency) => ({
    url: 'payments/paypal',
    method: 'post',
    data: { Amount, Currency }
});

export const payInvoice = (invoiceID, data) => ({
    url: `payments/invoices/${invoiceID}`,
    method: 'post',
    data
});

export const getPaymentMethodStatus = () => ({
    url: 'payments/status',
    method: 'get'
});

export const donate = (data) => ({
    url: 'payments/donate',
    method: 'post',
    data
});
