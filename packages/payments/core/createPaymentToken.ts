import type {
    ChargebeeSubmitEventPayload,
    ChargebeeVerifySavedCardEventPayload,
    PaymentIntent,
} from '@proton/chargebee/lib';
import {
    type BackendPaymentIntent,
    type CreatePaymentIntentData,
    type CreateTokenData,
    type FetchPaymentIntentV5Response,
    createTokenV4,
    fetchPaymentIntentForExistingV5,
    fetchPaymentIntentV5,
} from '@proton/shared/lib/api/payments';
import { isProduction } from '@proton/shared/lib/helpers/sentry';
import type { Api } from '@proton/shared/lib/interfaces';

import { PAYMENT_METHOD_TYPES, PAYMENT_TOKEN_STATUS } from './constants';
import type {
    AmountAndCurrency,
    AuthorizedV5PaymentToken,
    CardPayment,
    ChargeablePaymentToken,
    ChargeableV5PaymentToken,
    ChargebeeFetchedPaymentToken,
    ChargebeeIframeEvents,
    ChargebeeIframeHandles,
    ExistingPayment,
    ExistingPaymentMethod,
    ForceEnableChargebee,
    NonAuthorizedV5PaymentToken,
    NonChargeablePaymentToken,
    NonChargeableV5PaymentToken,
    PaymentTokenResult,
    PaypalPayment,
    PlainPaymentMethodType,
    RemoveEventListener,
    V5PaymentToken,
    WrappedCardPayment,
} from './interface';
import { toV5PaymentToken } from './utils';

/**
 * Prepares the parameters and makes the API call to create the payment token.
 *
 * @param params
 * @param api
 * @param amountAndCurrency
 */
const fetchPaymentToken = async (
    params: WrappedCardPayment | ExistingPayment,
    api: Api,
    amountAndCurrency?: AmountAndCurrency
): Promise<PaymentTokenResult> => {
    const data: CreateTokenData = { ...amountAndCurrency, ...params };

    return api<PaymentTokenResult>({
        ...createTokenV4(data),
        notificationExpiration: 10000,
    });
};

export const formatToken = (
    { Token, Status, ApprovalURL, ReturnHost }: PaymentTokenResult,
    type: PlainPaymentMethodType,
    amountAndCurrency?: AmountAndCurrency
): ChargeablePaymentToken | NonChargeablePaymentToken => {
    const chargeable = Status === PAYMENT_TOKEN_STATUS.STATUS_CHARGEABLE;
    const paymentToken = toV5PaymentToken(Token);

    const base = {
        type,
        chargeable,
        ...amountAndCurrency,
        ...paymentToken,
    };

    if (chargeable) {
        return base as ChargeablePaymentToken;
    } else {
        return {
            ...base,
            status: Status,
            approvalURL: ApprovalURL,
            returnHost: ReturnHost,
        } as NonChargeablePaymentToken;
    }
};

export const createPaymentTokenForCard = async (
    params: WrappedCardPayment,
    api: Api,
    amountAndCurrency?: AmountAndCurrency
): Promise<ChargeablePaymentToken | NonChargeablePaymentToken> => {
    const paymentTokenResult = await fetchPaymentToken(params, api, amountAndCurrency);
    return formatToken(paymentTokenResult, PAYMENT_METHOD_TYPES.CARD, amountAndCurrency);
};

function convertPaymentIntentData(paymentIntentData: BackendPaymentIntent): PaymentIntent;
function convertPaymentIntentData(paymentIntentData: BackendPaymentIntent | null): PaymentIntent | null;
function convertPaymentIntentData(paymentIntentData: BackendPaymentIntent | null): PaymentIntent | null {
    if (!paymentIntentData) {
        return null;
    }

    const Data: PaymentIntent = {
        id: paymentIntentData.ID,
        status: paymentIntentData.Status,
        amount: paymentIntentData.Amount,
        gateway_account_id: paymentIntentData.GatewayAccountID,
        expires_at: paymentIntentData.ExpiresAt,
        payment_method_type: paymentIntentData.PaymentMethodType,
        created_at: paymentIntentData.CreatedAt,
        modified_at: paymentIntentData.ModifiedAt,
        updated_at: paymentIntentData.UpdatedAt,
        resource_version: paymentIntentData.ResourceVersion,
        object: paymentIntentData.Object,
        customer_id: paymentIntentData.CustomerID,
        currency_code: paymentIntentData.CurrencyCode,
        gateway: paymentIntentData.Gateway,
        reference_id: paymentIntentData.ReferenceID,
    };

    return Data;
}

export const createPaymentTokenForExistingPayment = async (
    PaymentMethodID: ExistingPaymentMethod,
    type: PAYMENT_METHOD_TYPES.CARD | PAYMENT_METHOD_TYPES.PAYPAL,
    api: Api,
    amountAndCurrency: AmountAndCurrency
): Promise<ChargeablePaymentToken | NonChargeablePaymentToken> => {
    const paymentTokenResult = await fetchPaymentToken(
        {
            PaymentMethodID,
        },
        api,
        amountAndCurrency
    );

    return formatToken(paymentTokenResult, type, amountAndCurrency);
};

export type PaymentVerificator = (params: {
    addCardMode?: boolean;
    Payment?: CardPayment | PaypalPayment;
    Token: string;
    ApprovalURL?: string;
    ReturnHost?: string;
}) => Promise<V5PaymentToken>;

export type PaymentVerificatorV5Params = {
    token: ChargebeeFetchedPaymentToken;
    v: 5;
    events: ChargebeeIframeEvents;
    addCardMode?: boolean;
};

export type PaymentVerificatorV5 = (params: PaymentVerificatorV5Params) => Promise<V5PaymentToken>;

export type ChargebeeCardParams = {
    type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD;
    amountAndCurrency: AmountAndCurrency;
    countryCode: string;
    zip: string;
};

type ChargebeePaypalParams = {
    type: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL;
    amountAndCurrency: AmountAndCurrency;
};

type Dependencies = {
    api: Api;
    handles: ChargebeeIframeHandles;
    events: ChargebeeIframeEvents;
    forceEnableChargebee: ForceEnableChargebee;
};

function submitChargebeeCard(
    handles: ChargebeeIframeHandles,
    events: ChargebeeIframeEvents,
    payload: ChargebeeSubmitEventPayload
) {
    const removeEventListeners: RemoveEventListener[] = [];

    const challenge = new Promise<{
        authorized: false;
        approvalUrl: string;
    }>((resolve) => {
        const listener = events.onThreeDsChallenge((data) =>
            resolve({
                authorized: false,
                approvalUrl: data.url,
            })
        );
        removeEventListeners.push(listener);
    });

    const finalResult = handles.submitCreditCard(payload).then((result) => result.data);
    const challengeOrAuthorizedPaymentIntent = Promise.race([challenge, finalResult]);

    void challengeOrAuthorizedPaymentIntent.finally(() => {
        removeEventListeners.forEach((removeListener) => removeListener());
    });

    return challengeOrAuthorizedPaymentIntent;
}

function submitSavedChargebeeCard(
    handles: ChargebeeIframeHandles,
    events: ChargebeeIframeEvents,
    payload: ChargebeeVerifySavedCardEventPayload
) {
    const removeEventListeners: RemoveEventListener[] = [];

    const challenge = new Promise<{
        authorized: false;
        approvalUrl: string;
    }>((resolve) => {
        const listener = events.onCardVeririfcation3dsChallenge((data) => {
            resolve({
                authorized: false,
                approvalUrl: data.url,
            });
        });
        removeEventListeners.push(listener);
    });

    const finalResult = handles.validateSavedCreditCard(payload).then((result) => result.data);
    const challengeOrAuthorizedPaymentIntent = Promise.race([challenge, finalResult]);

    void challengeOrAuthorizedPaymentIntent.finally(() => {
        removeEventListeners.forEach((removeListener) => removeListener());
    });

    return challengeOrAuthorizedPaymentIntent;
}

export async function createPaymentTokenV5CreditCard(
    params: ChargebeeCardParams,
    { api, handles, events, forceEnableChargebee }: Dependencies,
    abortController?: AbortController
): Promise<ChargebeeFetchedPaymentToken> {
    const { type, amountAndCurrency } = params;

    const binResponse = await handles.getBin();
    // Can the response even be a failure? Wouldn't it throw an error?
    if (binResponse.status === 'failure') {
        throw new Error(binResponse.error);
    }

    let Bin: string | undefined = binResponse.data?.bin;
    const allowBinFallback = !isProduction(window.location.host);
    if (!Bin && allowBinFallback) {
        Bin = '424242';
    }

    const data: CreatePaymentIntentData = {
        ...amountAndCurrency,
        Payment: {
            Type: 'card',
            Details: {
                Bin: Bin as string,
            },
        },
    };

    const {
        Token: PaymentToken,
        Status,
        Data: paymentIntentData,
    } = await fetchPaymentIntentV5(api, data, abortController?.signal);
    forceEnableChargebee();

    let Data = convertPaymentIntentData(paymentIntentData);
    let authorizedStatus: AuthorizedV5PaymentToken | NonAuthorizedV5PaymentToken;
    const result = await submitChargebeeCard(handles, events, {
        paymentIntent: Data,
        countryCode: params.countryCode,
        zip: params.zip,
    });

    if (!result.authorized) {
        authorizedStatus = {
            authorized: false,
            approvalUrl: result.approvalUrl,
        };
    } else {
        authorizedStatus = {
            authorized: true,
        };
    }

    const chargeable = Status === PAYMENT_TOKEN_STATUS.STATUS_CHARGEABLE;

    return {
        ...amountAndCurrency,
        ...authorizedStatus,
        type,
        v: 5,
        PaymentToken,
        chargeable,
    };
}

export async function createPaymentTokenV5Paypal(
    params: ChargebeePaypalParams,
    { api, forceEnableChargebee }: Dependencies,
    abortController?: AbortController
): Promise<
    {
        paymentIntent: PaymentIntent;
    } & ChargebeeFetchedPaymentToken
> {
    const { type, amountAndCurrency } = params;

    let data: CreatePaymentIntentData = {
        ...amountAndCurrency,
        Payment: {
            Type: 'paypal',
        },
    };

    const {
        Token: PaymentToken,
        Status,
        Data: paymentIntentData,
    } = await fetchPaymentIntentV5(api, data, abortController?.signal);
    forceEnableChargebee();

    let paymentIntent = convertPaymentIntentData(paymentIntentData);
    let authorizedStatus: AuthorizedV5PaymentToken = {
        authorized: true,
    };

    const chargeable = Status === PAYMENT_TOKEN_STATUS.STATUS_CHARGEABLE;

    return {
        ...amountAndCurrency,
        ...authorizedStatus,
        type,
        v: 5,
        PaymentToken,
        chargeable,
        paymentIntent,
    };
}

export const formatTokenV5 = (
    { Token, Status }: FetchPaymentIntentV5Response,
    type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD | PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
    amountAndCurrency: AmountAndCurrency
): ChargeableV5PaymentToken | NonChargeableV5PaymentToken => {
    const chargeable = Status === PAYMENT_TOKEN_STATUS.STATUS_CHARGEABLE;
    const paymentToken = toV5PaymentToken(Token);

    const base: ChargeableV5PaymentToken | NonChargeableV5PaymentToken = {
        ...paymentToken,
        ...amountAndCurrency,
        chargeable,
        type,
    };

    return base;
};

export const createPaymentTokenForExistingChargebeePayment = async (
    PaymentMethodID: ExistingPaymentMethod,
    type:
        | PAYMENT_METHOD_TYPES.CHARGEBEE_CARD
        | PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL
        | PAYMENT_METHOD_TYPES.CARD
        | PAYMENT_METHOD_TYPES.PAYPAL,
    api: Api,
    handles: ChargebeeIframeHandles,
    events: ChargebeeIframeEvents,
    amountAndCurrency: AmountAndCurrency
    // or ChargebeeFetchedPaymentToken
): Promise<
    ChargeableV5PaymentToken | NonChargeableV5PaymentToken // | ChargebeeFetchedPaymentToken
> => {
    const {
        Data: paymentIntentBackend,
        Status,
        Token: PaymentToken,
    } = await fetchPaymentIntentForExistingV5(api, {
        ...amountAndCurrency,
        PaymentMethodID,
    });

    const paymentIntent = convertPaymentIntentData(paymentIntentBackend);
    let authorizedStatus: AuthorizedV5PaymentToken | NonAuthorizedV5PaymentToken;

    // CARD is allowed for v4-v5 migration
    if (type === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD || type === PAYMENT_METHOD_TYPES.CARD) {
        const result = await submitSavedChargebeeCard(handles, events, {
            paymentIntent: paymentIntent as PaymentIntent,
        });

        if (!result.authorized) {
            authorizedStatus = {
                authorized: false,
                approvalUrl: result.approvalUrl,
            };
        } else {
            authorizedStatus = {
                authorized: true,
            };
        }
    } else {
        authorizedStatus = {
            authorized: true,
        };
    }

    const chargeable = Status === PAYMENT_TOKEN_STATUS.STATUS_CHARGEABLE;

    let convertedType: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD | PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL;
    if (type === PAYMENT_METHOD_TYPES.CARD) {
        convertedType = PAYMENT_METHOD_TYPES.CHARGEBEE_CARD;
    } else if (type === PAYMENT_METHOD_TYPES.PAYPAL) {
        convertedType = PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL;
    } else {
        convertedType = type;
    }

    return {
        ...amountAndCurrency,
        ...authorizedStatus,
        type: convertedType,
        v: 5,
        PaymentToken,
        chargeable,
    };
};
