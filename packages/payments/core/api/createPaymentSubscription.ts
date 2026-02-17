import { type ProductParam, getProductHeaders } from '@proton/shared/lib/apps/product';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import type { Api } from '@proton/shared/lib/interfaces';

import type { PaymentTelemetryContext } from '../../telemetry/helpers';
import type { PaymentTelemetryPayload } from '../../telemetry/shared-checkout-telemetry';
import { checkoutTelemetry } from '../../telemetry/telemetry';
import { type BillingAddressProperty, getBillingAddressPayload } from '../billing-address/billing-address';
import { PAYMENT_METHOD_TYPES, PLANS } from '../constants';
import { isCountryWithRequiredPostalCode, isCountryWithStates } from '../countries';
import type {
    AmountAndCurrency,
    Currency,
    Cycle,
    FreeSubscription,
    PaymentMethodType,
    PlainPaymentMethodType,
    PlanIDs,
    TokenPaymentMethod,
    V5PaymentToken,
} from '../interface';
import { getPlanNameFromIDs, isLifetimePlanSelected } from '../plan/helpers';
import type { Subscription } from '../subscription/interface';
import { isTokenPaymentMethod, isV5PaymentToken } from '../type-guards';
import type { PaymentsVersion } from './api';

type CommonSubscribeData = {
    Plans: PlanIDs;
    Currency: Currency;
    Cycle: Cycle;
    Codes?: string[];
    StartTrial?: boolean;
    VatId?: string;
} & AmountAndCurrency;

type SubscribeDataV4 = CommonSubscribeData & TokenPaymentMethod & BillingAddressProperty;
type SubscribeDataV5 = CommonSubscribeData & V5PaymentToken & BillingAddressProperty;
type SubscribeDataNoPayment = CommonSubscribeData & BillingAddressProperty;
export type SubscribeData = SubscribeDataV4 | SubscribeDataV5 | SubscribeDataNoPayment;

function prepareSubscribeDataPayload(data: SubscribeData): SubscribeData {
    const allowedProps: (keyof SubscribeDataV4 | keyof SubscribeDataV5)[] = [
        'Plans',
        'Currency',
        'Cycle',
        'Codes',
        'PaymentToken',
        'Payment',
        'Amount',
        'Currency',
        'BillingAddress',
        'StartTrial',
        'VatId',
    ];
    const payload: any = {};
    Object.keys(data).forEach((key: any) => {
        if (allowedProps.includes(key)) {
            payload[key] = (data as any)[key];
        }
    });

    if (!payload.VatId) {
        delete payload.VatId;
    }

    return payload as SubscribeData;
}

function getPaymentTokenFromSubscribeData(data: SubscribeData): string | undefined {
    return (data as any)?.PaymentToken ?? (data as any)?.Payment?.Details?.Token;
}

export function getLifetimeProductType(data: Pick<SubscribeData, 'Plans'>) {
    const planName = getPlanNameFromIDs(data.Plans);
    if (planName === PLANS.PASS_LIFETIME) {
        return 'pass-lifetime' as const;
    }
}

const buyProduct = (rawData: SubscribeData, product: ProductParam) => {
    const sanitizedData = prepareSubscribeDataPayload(rawData) as SubscribeDataV5;

    const url = 'payments/v5/products';
    const config = {
        url,
        method: 'post',
        data: {
            Quantity: 1,
            PaymentToken: getPaymentTokenFromSubscribeData(sanitizedData),
            ProductType: getLifetimeProductType(sanitizedData),
            Amount: sanitizedData.Amount,
            Currency: sanitizedData.Currency,
            BillingAddress: sanitizedData.BillingAddress,
        },
        headers: getProductHeaders(product, {
            endpoint: url,
            product,
        }),
        timeout: 60000 * 2,
    };

    return config;
};

function isCommonSubscribeData(data: any): data is CommonSubscribeData {
    const props = ['Plans', 'Currency', 'Cycle', 'Amount'];
    return data && props.every((prop) => Object.prototype.hasOwnProperty.call(data, prop));
}

function isSubscribeDataV4(data: any): data is SubscribeDataV4 {
    return isCommonSubscribeData(data) && isTokenPaymentMethod(data as any);
}

function isSubscribeDataV5(data: any): data is SubscribeDataV5 {
    return isCommonSubscribeData(data) && isV5PaymentToken(data as any);
}

function isSubscribeDataNoPayment(data: any): data is SubscribeDataNoPayment {
    return isCommonSubscribeData(data);
}

export function isSubscribeData(data: any): data is SubscribeData {
    return isSubscribeDataV4(data) || isSubscribeDataV5(data) || isSubscribeDataNoPayment(data);
}

const createSubscriptionQuery = (
    rawData: SubscribeData,
    product: ProductParam,
    version: PaymentsVersion,
    hasZipCodeValidation: boolean
) => {
    const sanitizedData = prepareSubscribeDataPayload(rawData);

    // This covers both buyProduct + v4 and v5 createSubscription.
    if ('BillingAddress' in sanitizedData && sanitizedData.BillingAddress) {
        sanitizedData.BillingAddress = getBillingAddressPayload({
            billingAddress: sanitizedData.BillingAddress,
            vatId: sanitizedData.VatId,
            hasZipCodeValidation,
        });
    }

    if (isLifetimePlanSelected(sanitizedData.Plans)) {
        return buyProduct(sanitizedData, product);
    }

    let data: SubscribeData = sanitizedData;
    if (version === 'v5' && isSubscribeDataV4(sanitizedData)) {
        const v5Data: SubscribeDataV5 = {
            ...sanitizedData,
            PaymentToken: sanitizedData.Payment.Details.Token,
            v: 5,
        };

        data = v5Data;
        delete (data as any).Payment;
    } else if (version === 'v4' && isSubscribeDataV5(sanitizedData)) {
        const v4Data: SubscribeDataV4 = {
            ...sanitizedData,
            Payment: {
                Type: PAYMENT_METHOD_TYPES.TOKEN,
                Details: {
                    Token: sanitizedData.PaymentToken,
                },
            },
        };

        data = v4Data;
        delete (data as any).PaymentToken;
    }

    if (data.VatId) {
        (data as any).BillingAddress.VatId = data.VatId;
        delete (data as any).VatId;
    }

    const config = {
        url: `payments/${version}/subscription`,
        method: 'post',
        data,
        headers: getProductHeaders(product, {
            endpoint: `payments/${version}/subscription`,
            product,
        }),
        timeout: 60000 * 2,
    };

    return config;
};

function reportWrongBillingAddress(data: SubscribeData) {
    try {
        const extra = {
            billingAddress: data?.BillingAddress,
            CountryCode: data?.BillingAddress?.CountryCode,
            State: data?.BillingAddress?.State,
            hasZipCode: !!data?.BillingAddress?.ZipCode,
            amount: data?.Amount,
            currency: data?.Currency,
            codes: data?.Codes,
            cycle: data?.Cycle,
            plans: data?.Plans,
            startTrial: data?.StartTrial,
            hasVatId: !!data?.VatId,
            planName: data?.Plans ? getPlanNameFromIDs(data.Plans) : undefined,
        };

        if (!data?.BillingAddress?.CountryCode) {
            captureMessage('Payments: missing CountryCode in billing address', {
                level: 'warning',
                extra,
            });
        }

        if (isCountryWithStates(data?.BillingAddress?.CountryCode) && !data?.BillingAddress?.State) {
            captureMessage('Payments: missing State in billing address', {
                level: 'warning',
                extra,
            });
        }

        if (isCountryWithRequiredPostalCode(data?.BillingAddress?.CountryCode) && !data?.BillingAddress?.ZipCode) {
            captureMessage('Payments: missing ZipCode in billing address', {
                level: 'warning',
                extra,
            });
        }
    } catch {}
}

export const createPaymentSubscription = async (
    api: Api,
    data: SubscribeData,
    {
        build,
        telemetryContext,
        userCurrency,
        subscription,
        product,
        version,
        hasZipCodeValidation,
        paymentMethodType,
        paymentMethodValue,
    }: {
        build: APP_NAMES;
        telemetryContext: PaymentTelemetryContext;
        userCurrency: Currency | undefined;
        subscription: Subscription | FreeSubscription | undefined;
        product: ProductParam;
        version: PaymentsVersion;
        hasZipCodeValidation: boolean;
        paymentMethodType: PlainPaymentMethodType | undefined;
        paymentMethodValue: PaymentMethodType | undefined;
    }
) => {
    const telemetryProps: Omit<PaymentTelemetryPayload, 'stage'> = {
        userCurrency,
        subscription,
        amount: data.Amount,
        selectedCurrency: data.Currency,
        selectedPlanIDs: data.Plans,
        selectedCycle: data.Cycle,
        selectedCoupon: data.Codes?.[0] ?? null,
        build,
        product,
        context: telemetryContext,
        paymentMethodType,
        paymentMethodValue,
    };

    const createSubscriptionQueryConfig = createSubscriptionQuery(data, product, version, hasZipCodeValidation);

    reportWrongBillingAddress(data);

    try {
        reportWrongBillingAddress(data);
        const createSubscriptionResponse = await api<{ Subscription: Subscription }>(createSubscriptionQueryConfig);

        checkoutTelemetry.reportPayment({
            stage: 'payment_success',
            ...telemetryProps,
        });

        return createSubscriptionResponse;
    } catch (error) {
        checkoutTelemetry.reportPayment({
            stage: 'payment_declined',
            ...telemetryProps,
        });
        throw error;
    }
};
