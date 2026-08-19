import type {
    BinData,
    ChargebeeSubmitEventPayload,
    ChargebeeVerifySavedCardEventPayload,
    MessageBusResponse,
    PaymentIntent,
} from '@proton/chargebee/lib/types';
import { isProduction } from '@proton/shared/lib/helpers/sentry';
import type { Api } from '@proton/shared/lib/interfaces';

import { capturePaymentMessage } from '../sentry/capture';
import {
    type BackendPaymentIntent,
    type CreatePaymentIntentData,
    fetchPaymentIntentForExistingV5,
    fetchPaymentIntentV5,
} from './api/api';
import { PAYMENT_METHOD_TYPES, PAYMENT_TOKEN_STATUS } from './constants';
import type {
    AmountAndCurrency,
    AuthorizedV5PaymentToken,
    ChargeableV5PaymentToken,
    ChargebeeFetchedPaymentToken,
    ChargebeeIframeEvents,
    ChargebeeIframeHandles,
    ExistingPaymentMethod,
    NonAuthorizedV5PaymentToken,
    NonChargeableV5PaymentToken,
    PaymentMethodType,
    PlainPaymentMethodType,
    RemoveEventListener,
    V5PaymentToken,
} from './interface';

export function convertPaymentIntentData(paymentIntentData: BackendPaymentIntent): PaymentIntent;
export function convertPaymentIntentData(paymentIntentData: BackendPaymentIntent | null): PaymentIntent | null;
export function convertPaymentIntentData(paymentIntentData: BackendPaymentIntent | null): PaymentIntent | null {
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
        email: paymentIntentData.Email,
    };

    return Data;
}

export type PaymentVerificator = (params: {
    addCardMode?: boolean;
    Token: string;
    ApprovalURL?: string;
    ReturnHost?: string;
}) => Promise<V5PaymentToken>;

export type PaymentVerificatorV5Params = {
    token: ChargebeeFetchedPaymentToken;
    v: 5;
    events: ChargebeeIframeEvents;
    addCardMode?: boolean;
    abortController?: AbortController;
    onCancelled?: () => void;
    onError?: (error: any) => void;
    paymentMethodType: PlainPaymentMethodType;
    paymentMethodValue: PaymentMethodType;
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

type ChargebeeIdealParams = {
    type: PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL;
    amountAndCurrency: AmountAndCurrency;
};

type Dependencies = {
    api: Api;
    handles: ChargebeeIframeHandles;
    events: ChargebeeIframeEvents;
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
        const listener = events.onThreeDsChallenge((data) =>
            resolve({
                authorized: false,
                approvalUrl: data.url,
            })
        );
        removeEventListeners.push(listener);
    });

    const finalResult = handles.validateSavedCreditCard(payload).then((result) => result.data);
    const challengeOrAuthorizedPaymentIntent = Promise.race([challenge, finalResult]);

    void challengeOrAuthorizedPaymentIntent.finally(() => {
        removeEventListeners.forEach((removeListener) => removeListener());
    });

    return challengeOrAuthorizedPaymentIntent;
}

// it contains a little excessive error handling to narrow down the problem with BINs.
async function getBin(handles: ChargebeeIframeHandles): Promise<string> {
    let binResponse: MessageBusResponse<BinData | null>;
    try {
        binResponse = await handles.getBin();

        // this should be unreachable. I keep it for the time being to observe the behavior.
        if (binResponse.status === 'failure') {
            const error = binResponse.error;
            capturePaymentMessage(
                'Payments: BIN response failure',
                {
                    level: 'error' as const,
                    extra: {
                        error,
                        host: window.location.host,
                        originalError: binResponse?.error?.error,
                        errorData: binResponse?.data,
                    },
                },
                error
            );

            throw new Error(binResponse.error?.error ?? binResponse.error);
        }
    } catch (error: any) {
        capturePaymentMessage(
            'Payments: BIN response error',
            {
                level: 'error' as const,
                extra: {
                    host: window.location.host,
                    error,
                    originalError: error?.error,
                    errorData: error?.data,
                },
            },
            error
        );

        throw error;
    }

    let Bin = binResponse.data?.bin;

    const allowBinFallback = !isProduction(window.location.host);
    const binFallback = '424242';
    if (!Bin && allowBinFallback) {
        Bin = binFallback;
    }

    if (Bin === binFallback) {
        const message = `Payments: BIN problem. FallbackEnabled: ${allowBinFallback}`;

        capturePaymentMessage(message, {
            level: allowBinFallback ? 'error' : 'warning',
            extra: {
                Bin,
                allowBinFallback,
                host: window.location.host,
            },
        });
    }

    if (!Bin) {
        // If this happens, then it most likely means that the current domain name isn't whitelisted in Chargebee.
        capturePaymentMessage('Payments: BIN is not found.', {
            level: 'error',
            extra: {
                host: window.location.host,
            },
        });
    }

    return Bin as string;
}

export async function createPaymentTokenV5CreditCard(
    params: ChargebeeCardParams,
    { api, handles, events }: Dependencies,
    abortController?: AbortController
): Promise<ChargebeeFetchedPaymentToken> {
    const Bin = await getBin(handles);

    const data: CreatePaymentIntentData = {
        ...params.amountAndCurrency,
        Payment: {
            Type: 'card',
            Details: {
                Bin,
            },
        },
    };

    const {
        Token: PaymentToken,
        Status,
        Data: paymentIntentData,
    } = await fetchPaymentIntentV5(api, data, abortController?.signal);

    const paymentIntent = convertPaymentIntentData(paymentIntentData);
    const result = await submitChargebeeCard(handles, events, {
        paymentIntent,
        countryCode: params.countryCode,
        zip: params.zip,
    });

    let authorizedStatus: AuthorizedV5PaymentToken | NonAuthorizedV5PaymentToken;
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

    const chargeable = Status === PAYMENT_TOKEN_STATUS.CHARGEABLE;

    return {
        ...params.amountAndCurrency,
        ...authorizedStatus,
        type: params.type,
        v: 5,
        PaymentToken,
        chargeable,
    };
}

export async function createPaymentTokenV5Paypal(
    params: ChargebeePaypalParams,
    { api }: Dependencies,
    abortController?: AbortController
): Promise<
    {
        paymentIntent: PaymentIntent;
    } & ChargebeeFetchedPaymentToken
> {
    const { type, amountAndCurrency } = params;

    const data: CreatePaymentIntentData = {
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

    const paymentIntent = convertPaymentIntentData(paymentIntentData);
    const authorizedStatus: AuthorizedV5PaymentToken = {
        authorized: true,
    };

    const chargeable = Status === PAYMENT_TOKEN_STATUS.CHARGEABLE;

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

export async function createPaymentTokenV5Ideal(
    params: ChargebeeIdealParams,
    { api }: Dependencies,
    abortSignal?: AbortSignal
): Promise<
    {
        paymentIntent: PaymentIntent;
    } & ChargebeeFetchedPaymentToken
> {
    const { type, amountAndCurrency } = params;

    const data: CreatePaymentIntentData = {
        ...amountAndCurrency,
        Payment: {
            Type: 'ideal',
        },
    };

    const { Token: PaymentToken, Status, Data: paymentIntentData } = await fetchPaymentIntentV5(api, data, abortSignal);

    const paymentIntent = convertPaymentIntentData(paymentIntentData);
    const authorizedStatus: AuthorizedV5PaymentToken = {
        authorized: true,
    };

    const chargeable = Status === PAYMENT_TOKEN_STATUS.CHARGEABLE;

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

export function savedMethodRequires3DS(type: PAYMENT_METHOD_TYPES): boolean {
    return (
        type === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD ||
        // saved GOOGLE_PAY behaves like a card: it also sometimes needs 3DS; and even
        // if 3DS isn't required then the payment intent must be authorized by chargebee.js
        type === PAYMENT_METHOD_TYPES.GOOGLE_PAY
    );
}

export const createPaymentTokenForExistingChargebeePayment = async (
    PaymentMethodID: ExistingPaymentMethod,
    type:
        | PAYMENT_METHOD_TYPES.CHARGEBEE_CARD
        | PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL
        | PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT
        | PAYMENT_METHOD_TYPES.APPLE_PAY
        | PAYMENT_METHOD_TYPES.GOOGLE_PAY
        | PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL,
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

    if (savedMethodRequires3DS(type)) {
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

    const chargeable = Status === PAYMENT_TOKEN_STATUS.CHARGEABLE;

    return {
        ...amountAndCurrency,
        ...authorizedStatus,
        type,
        v: 5,
        PaymentToken,
        chargeable,
    };
};
