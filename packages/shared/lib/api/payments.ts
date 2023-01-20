// import { Payment } from '@proton/components/containers/payments/interface';
// import { Currency } from '@proton/shared/lib/interfaces';
// import { ProductParam, getProductHeaders } from '../apps/product';
// import { CYCLE, INVOICE_OWNER, INVOICE_STATE, INVOICE_TYPE } from '../constants';
// import { Api, ApiResponse, Currency, Cycle, PlanIDs } from '../interfaces';
// type QueryFunction<T> = (data?: T) => { url: string; method: string; data?: T };
// function createApiHandle<T, R>(query: QueryFunction<T>) {
//     return (api: Api, data?: T) => api<R>(query(data));
// }
// export const getSubscription = () => ({
// export const getSubscription = () => ({
//     url: 'payments/subscription',
//     url: 'payments/subscription',
//     method: 'get',
//     method: 'get',
// });
// });
// export const deleteSubscription = (data) => ({
// export interface FeedbackDowngradeData {
//     Reason?: string;
//     Feedback?: string;
//     ReasonDetails?: string;
//     Context?: 'vpn' | 'mail';
// }
// export const queryDeleteSubscription = (data?: FeedbackDowngradeData) => ({
//     url: 'payments/subscription',
//     url: 'payments/subscription',
//     method: 'delete',
//     method: 'delete',
//     data,
//     data,
// });
// });
// export const checkSubscription = (data) => ({
// export const deleteSubscription = createApiHandle<FeedbackDowngradeData | undefined, ApiResponse>(
//     queryDeleteSubscription
// );
// export interface CheckSubscriptionData {
//     Currency: Currency;
//     Cycle: CYCLE;
//     Plans: PlanIDs;
//     CouponCode?: string;
//     Codes?: string[];
// }
// export const checkSubscription = (data: CheckSubscriptionData) => ({
//     url: 'payments/subscription/check',
//     url: 'payments/subscription/check',
//     method: 'post',
//     method: 'post',
//     data,
//     data,
// });
// });
// export const subscribe = (data, product) => ({
// export interface SubscribeParams {
//     Amount: number;
//     Codes: string[];
//     Currency: Currency;
//     Cycle: Cycle;
//     Payment: unknown;
//     PaymentMethodID: string;
//     Plans: PlanIDs;
// }
// export const subscribe = (data: unknown, product: ProductParam) => ({
//     url: 'payments/subscription',
//     url: 'payments/subscription',
//     method: 'post',
//     method: 'post',
//     data,
//     data,
//     headers: getProductHeaders(product),
//     headers: getProductHeaders(product),
// });
// });
// export const queryInvoices = ({ Page, PageSize, Owner, State, Type }) => ({
// export interface QueryInvoicesParams {
//     Page: number;
//     PageSize: number;
//     Owner: INVOICE_OWNER;
//     State?: INVOICE_STATE;
//     Type?: INVOICE_TYPE;
// }
// export const queryInvoices = ({ Page, PageSize, Owner, State, Type }: QueryInvoicesParams) => ({
//     url: 'payments/invoices',
//     url: 'payments/invoices',
//     method: 'get',
//     method: 'get',
//     params: { Page, PageSize, Owner, State, Type },
//     params: { Page, PageSize, Owner, State, Type },
// });
// });
// export const queryPlans = (params) => ({
// export const queryPlans = (params: unknown) => ({
//     url: 'payments/plans',
//     url: 'payments/plans',
//     method: 'get',
//     method: 'get',
//     params,
//     params,
// });
// });
// export const getInvoice = (invoiceID) => ({
// export const getInvoice = (invoiceID: string) => ({
//     url: `payments/invoices/${invoiceID}`,
//     url: `payments/invoices/${invoiceID}`,
//     method: 'get',
//     method: 'get',
//     output: 'arrayBuffer',
//     output: 'arrayBuffer',
// });
// });
// export const checkInvoice = (invoiceID, GiftCode) => ({
// export const checkInvoice = (invoiceID: string, GiftCode?: unknown) => ({
//     url: `payments/invoices/${invoiceID}/check`,
//     url: `payments/invoices/${invoiceID}/check`,
//     method: 'put',
//     method: 'put',
//     data: { GiftCode },
//     data: { GiftCode },
// });
// });
// export const queryPaymentMethods = () => ({
// export const queryPaymentMethods = () => ({
//     url: 'payments/methods',
//     url: 'payments/methods',
//     method: 'get',
//     method: 'get',
// });
// });
// export const setPaymentMethod = (data) => ({
// export const setPaymentMethod = (data: unknown) => ({
//     url: 'payments/methods',
//     url: 'payments/methods',
//     method: 'post',
//     method: 'post',
//     data,
//     data,
// });
// });
// export const deletePaymentMethod = (methodID) => ({
// export const deletePaymentMethod = (methodID: string) => ({
//     url: `payments/methods/${methodID}`,
//     url: `payments/methods/${methodID}`,
//     method: 'delete',
//     method: 'delete',
// });
// });
// export const createBitcoinPayment = (Amount, Currency) => ({
// export const createBitcoinPayment = (Amount: number, Currency: Currency) => ({
//     url: 'payments/bitcoin',
//     url: 'payments/bitcoin',
//     method: 'post',
//     method: 'post',
//     data: { Amount, Currency },
//     data: { Amount, Currency },
// });
// });
// export const createBitcoinDonation = (Amount, Currency) => ({
// export const createBitcoinDonation = (Amount: number, Currency: Currency) => ({
//     url: 'payments/bitcoin/donate',
//     url: 'payments/bitcoin/donate',
//     method: 'post',
//     method: 'post',
//     data: { Amount, Currency },
//     data: { Amount, Currency },
// });
// });
// export const createPayPalPayment = (Amount, Currency) => ({
// export const createPayPalPayment = (Amount: number, Currency: Currency) => ({
//     url: 'payments/paypal',
//     url: 'payments/paypal',
//     method: 'post',
//     method: 'post',
//     data: { Amount, Currency },
//     data: { Amount, Currency },
// });
// });
// export const payInvoice = (invoiceID, data) => ({
// export const payInvoice = (invoiceID: string, data: unknown) => ({
//     url: `payments/invoices/${invoiceID}`,
//     url: `payments/invoices/${invoiceID}`,
//     method: 'post',
//     method: 'post',
//     data,
//     data,
// });
// });
// export const getPaymentMethodStatus = () => ({
// export const getPaymentMethodStatus = () => ({
//     url: 'payments/status',
//     url: 'payments/status',
//     method: 'get',
//     method: 'get',
// });
// });
// export const orderPaymentMethods = (PaymentMethodIDs) => ({
// export const orderPaymentMethods = (PaymentMethodIDs: unknown) => ({
//     url: 'payments/methods/order',
//     url: 'payments/methods/order',
//     method: 'put',
//     method: 'put',
//     data: { PaymentMethodIDs },
//     data: { PaymentMethodIDs },
// });
// });
// export const donate = (data) => ({
// export const donate = (data: unknown) => ({
//     url: 'payments/donate',
//     url: 'payments/donate',
//     method: 'post',
//     method: 'post',
//     data,
//     data,
// });
// });
// export const buyCredit = (data) => ({
// export const buyCredit = (data: unknown) => ({
//     url: 'payments/credit',
//     url: 'payments/credit',
//     method: 'post',
//     method: 'post',
//     data,
//     data,
// });
// });
// export const validateCredit = (data) => ({
// export const validateCredit = (data: unknown) => ({
//     url: 'payments/credit/check',
//     url: 'payments/credit/check',
//     method: 'post',
//     method: 'post',
//     data,
//     data,
// });
// });
// export const createToken = (data) => ({
// export type CreateTokenData =
//     url: 'payments/tokens',
//     | {
//     method: 'post',
//           Amount: number;
//     data,
//           Currency: Currency;
// });
//           PaymentMethodID: string;
//       }
// export const getTokenStatus = (paymentToken) => ({
//     | {
//           Amount: number;
//           Currency: Currency;
//           Payment: Payment;
//       };
// export const createToken = (data: CreateTokenData) => {
//     console.log('POST createToken', data);
//     return {
//         url: 'payments/tokens',
//         method: 'post',
//         data,
//     };
// };
// export const getTokenStatus = (paymentToken: string) => ({
//     url: `payments/tokens/${paymentToken}`,
//     url: `payments/tokens/${paymentToken}`,
//     method: 'get',
//     method: 'get',
// });
// });
// export const verifyPayment = ({ Amount, Credit, Currency, Payment, GiftCode }) => ({
// export const verifyPayment = ({ Amount, Credit, Currency, Payment, GiftCode }: any) => ({
//     url: 'payments/verify',
//     url: 'payments/verify',
//     method: 'post',
//     method: 'post',
//     data: { Amount, Credit, Currency, Payment, GiftCode },
//     data: { Amount, Credit, Currency, Payment, GiftCode },
// });
// });
// export const getLastCancelledSubscription = () => ({
// export const getLastCancelledSubscription = () => ({
//     url: 'payments/subscription/latest',
//     url: 'payments/subscription/latest',
//     method: 'get',
//     method: 'get',
// });
// });
import { getProductHeaders } from '../apps/product';
import { Currency } from '../interfaces';

export const getSubscription = () => ({
    url: 'payments/subscription',
    method: 'get',
});

export const deleteSubscription = (data?: any) => ({
    url: 'payments/subscription',
    method: 'delete',
    data,
});

export const checkSubscription = (data: any) => ({
    url: 'payments/subscription/check',
    method: 'post',
    data,
});

export const subscribe = (data: any, product: any) => ({
    url: 'payments/subscription',
    method: 'post',
    data,
    headers: getProductHeaders(product),
});

export const queryInvoices = ({ Page, PageSize, Owner, State, Type }: any) => ({
    url: 'payments/invoices',
    method: 'get',
    params: { Page, PageSize, Owner, State, Type },
});

export const queryPlans = (params: any) => ({
    url: 'payments/plans',
    method: 'get',
    params,
});

export const getInvoice = (invoiceID: string) => ({
    url: `payments/invoices/${invoiceID}`,
    method: 'get',
    output: 'arrayBuffer',
});

export const checkInvoice = (invoiceID: string, GiftCode?: any) => ({
    url: `payments/invoices/${invoiceID}/check`,
    method: 'put',
    data: { GiftCode },
});

export const queryPaymentMethods = () => ({
    url: 'payments/methods',
    method: 'get',
});

export const setPaymentMethod = (data: any) => ({
    url: 'payments/methods',
    method: 'post',
    data,
});

export const deletePaymentMethod = (methodID: string) => ({
    url: `payments/methods/${methodID}`,
    method: 'delete',
});

export const createBitcoinPayment = (Amount: number, Currency: Currency) => ({
    url: 'payments/bitcoin',
    method: 'post',
    data: { Amount, Currency },
});

export const createBitcoinDonation = (Amount: number, Currency: Currency) => ({
    url: 'payments/bitcoin/donate',
    method: 'post',
    data: { Amount, Currency },
});

export const createPayPalPayment = (Amount: number, Currency: Currency) => ({
    url: 'payments/paypal',
    method: 'post',
    data: { Amount, Currency },
});

export const payInvoice = (invoiceID: string, data: any) => ({
    url: `payments/invoices/${invoiceID}`,
    method: 'post',
    data,
});

export const queryPaymentMethodStatus = () => ({
    url: 'payments/status',
    method: 'get',
});

export const orderPaymentMethods = (PaymentMethodIDs: any) => ({
    url: 'payments/methods/order',
    method: 'put',
    data: { PaymentMethodIDs },
});

export const donate = (data: any) => ({
    url: 'payments/donate',
    method: 'post',
    data,
});

export const buyCredit = (data: any) => ({
    url: 'payments/credit',
    method: 'post',
    data,
});

export const validateCredit = (data: any) => ({
    url: 'payments/credit/check',
    method: 'post',
    data,
});

export const createToken = (data: any) => ({
    url: 'payments/tokens',
    method: 'post',
    data,
});

export const getTokenStatus = (paymentToken: string) => ({
    url: `payments/tokens/${paymentToken}`,
    method: 'get',
});

export const verifyPayment = ({ Amount, Credit, Currency, Payment, GiftCode }: any) => ({
    url: 'payments/verify',
    method: 'post',
    data: { Amount, Credit, Currency, Payment, GiftCode },
});

export const getLastCancelledSubscription = () => ({
    url: 'payments/subscription/latest',
    method: 'get',
});
