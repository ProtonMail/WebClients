import type { FullBillingAddress } from '../billing-address/billing-address';

export const queryFullBillingAddress = () => ({
    url: 'payments/v5/account/billing-information',
    method: 'GET',
});

export const putFullBillingAddress = (data: FullBillingAddress) => {
    return {
        url: 'payments/v5/account/billing-information',
        method: 'PUT',
        data,
    };
};

export const putInvoiceBillingAddress = (invoiceId: string, data: FullBillingAddress) => {
    return {
        url: `payments/v5/invoices/${invoiceId}/billing-information`,
        method: 'PUT',
        data,
    };
};

export const queryInvoiceBillingAddress = (invoiceId: string) => ({
    url: `payments/v5/invoices/${invoiceId}/billing-information`,
    method: 'GET',
});
