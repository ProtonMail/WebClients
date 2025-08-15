import { useRef, useState } from 'react';

import { addMonths } from 'date-fns';

import { useSubscription } from '@proton/account/subscription/hooks';
import useApi from '@proton/components/hooks/useApi';
import useConfig from '@proton/components/hooks/useConfig';
import { usePreferredPlansMap } from '@proton/components/hooks/usePreferredPlansMap';
import {
    type CheckSubscriptionData,
    type FullBillingAddress,
    type MultiCheckOptions,
    PAYMENTS_API_ERROR_CODES,
    type PaymentStatus,
    type PaymentsApi,
    type PaymentsVersion,
    type RequestOptions,
    SubscriptionMode,
    captureWrongPlanIDs,
    getLifetimeProductType,
    getPaymentsVersion,
    getPlanName,
    isCheckForbidden,
    isLifetimePlanSelected,
    normalizeBillingAddress,
    normalizePaymentMethodStatus,
    queryPaymentMethodStatus,
} from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';
import { type EnrichedCheckResponse } from '@proton/shared/lib/helpers/checkout';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { type Api } from '@proton/shared/lib/interfaces';
import { getSentryError } from '@proton/shared/lib/keys';
import { useGetFlag } from '@proton/unleash';
import isTruthy from '@proton/utils/isTruthy';

import { useChargebeeContext } from '../client-extensions/useChargebeeContext';
import { InvalidZipCodeError } from './errors';

const checkSubscriptionQuery = (
    data: CheckSubscriptionData,
    version: PaymentsVersion,
    hasZipCodeValidation: boolean
) => {
    let normalizedData: CheckSubscriptionData = {
        ...data,
    };

    if (normalizedData.BillingAddress && normalizedData.BillingAddress.ZipCode) {
        normalizedData.BillingAddress = normalizeBillingAddress(normalizedData.BillingAddress, hasZipCodeValidation);
    }

    if (!hasZipCodeValidation) {
        delete normalizedData.ValidateZipCode;
    }

    return {
        url: `payments/${version}/subscription/check`,
        method: 'post',
        data: normalizedData,
    };
};

const checkProduct = (data: CheckSubscriptionData) => {
    return {
        url: 'payments/v5/products/check',
        method: 'post',
        data: {
            Quantity: 1,
            Currency: data.Currency,
            ProductType: getLifetimeProductType(data),
            BillingAddress: data.BillingAddress ?? {
                CountryCode: 'CH',
                State: null,
                ZipCode: null,
            },
        },
    };
};

const queryFullBillingAddress = () => ({
    url: 'payments/v5/account/billing-information',
    method: 'GET',
});

const putFullBillingAddress = (data: FullBillingAddress) => {
    const { VatId, ...BillingAddress } = data;

    return {
        url: 'payments/v5/account/billing-information',
        method: 'PUT',
        data: {
            VatId,
            BillingAddress,
        },
    };
};

const putInvoiceBillingAddress = (invoiceId: string, data: FullBillingAddress) => {
    const { VatId, ...BillingAddress } = data;

    return {
        url: `payments/v5/invoices/${invoiceId}/billing-information`,
        method: 'PUT',
        data: {
            VatId,
            BillingAddress,
        },
    };
};

const queryInvoiceBillingAddress = (invoiceId: string) => ({
    url: `payments/v5/invoices/${invoiceId}/billing-information`,
    method: 'GET',
});

type FullBillingAddressResponse = {
    BillingAddress: FullBillingAddress;
    VatId: string | null;
};

export const useReportRoutingError = () => {
    const errorsToReport: string[] = [
        'This operation is not supported for users without a legacy subscription',
        'This operation is not supported for users on a legacy subscription',
    ];

    const chargebeeContext = useChargebeeContext();
    const { APP_NAME } = useConfig();

    const [alreadyReported, setAlreadyReported] = useState(false);

    const isRoutingError = (error: string) => {
        return errorsToReport.some((reportable) => error?.includes(reportable));
    };

    return (error: any, additionalContext: any) => {
        const message: unknown = error?.data?.Error;
        if (alreadyReported || typeof message !== 'string' || !isRoutingError(message)) {
            return;
        }

        const context = {
            app: APP_NAME,
            paymentsVersion: getPaymentsVersion(),
            chargebeeEnabled: chargebeeContext.enableChargebeeRef.current,
            ...additionalContext,
        };

        const sentryError = getSentryError(error);
        captureMessage('Payments: routing error', {
            level: 'error',
            extra: {
                error: sentryError,
                message,
                context,
            },
        });

        setAlreadyReported(true);
    };
};

export const useMultiCheckCache = () => {
    const cacheRef = useRef<Record<string, EnrichedCheckResponse>>({});
    const cacheByPlanRef = useRef<Record<string, Set<string> | undefined>>({});

    const getPlanID = (plans: CheckSubscriptionData['Plans']) => {
        return Object.entries(plans)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .reduce((acc, [key, value]) => {
                return `${acc}-${key}-${value}`;
            }, '');
    };

    const hash = (data: CheckSubscriptionData) => {
        const plans = getPlanID(data.Plans);

        const id =
            `p-${plans}` +
            `.cur-${data.Currency}` +
            `.cyc-${data.Cycle}` +
            `.codes-${data.Codes?.join(',') ?? ''}` +
            `.cc-${data.BillingAddress?.CountryCode}` +
            `.s-${data.BillingAddress?.State}` +
            `.z-${data.BillingAddress?.ZipCode}`;

        return btoa(id);
    };

    const get = (data: CheckSubscriptionData): EnrichedCheckResponse | undefined => {
        const id = hash(data);
        return cacheRef.current[id];
    };

    const set = (data: CheckSubscriptionData, value: EnrichedCheckResponse) => {
        const id = hash(data);
        cacheRef.current[id] = value;

        const planID = getPlanID(data.Plans);
        cacheByPlanRef.current[planID] = cacheByPlanRef.current[planID] ?? new Set<string>();
        cacheByPlanRef.current[planID].add(id);
    };

    const getByPlans = (plans: CheckSubscriptionData['Plans']) => {
        const planID = getPlanID(plans);
        return Array.from(cacheByPlanRef.current[planID] ?? [])
            .map((id) => cacheRef.current[id])
            .filter(isTruthy);
    };

    return {
        get,
        set,
        getByPlans,
    };
};

export const usePaymentsApi = (
    apiOverride?: Api,
    checkV5Fallback?: (data: CheckSubscriptionData) => EnrichedCheckResponse | null
): {
    paymentsApi: PaymentsApi;
    getPaymentsApi: (api: Api) => PaymentsApi;
} => {
    const regularApi = useApi();
    const apiHook = apiOverride ?? regularApi;
    const { APP_NAME } = useConfig();
    const reportRoutingError = useReportRoutingError();
    const multiCheckCache = useMultiCheckCache();
    const getFlag = useGetFlag();

    const getPaymentsApi = (api: Api): PaymentsApi => {
        const paymentStatus = (): Promise<PaymentStatus> => {
            return api<PaymentStatus>(queryPaymentMethodStatus())
                .then((status) => normalizePaymentMethodStatus(status))
                .then((status) => {
                    // ProtonAccountLite doesn't support cash payments
                    if (APP_NAME === APPS.PROTONACCOUNTLITE) {
                        status.VendorStates.Cash = false;
                    }

                    return status;
                });
        };

        const checkSubscription = async (
            data: CheckSubscriptionData,
            requestOptions: RequestOptions = {}
        ): Promise<EnrichedCheckResponse> => {
            captureWrongPlanIDs(data.Plans, { source: 'check' });

            if (isLifetimePlanSelected(data.Plans)) {
                return api(checkProduct(data));
            }

            // Patch for coupons compatibility v4 vs v5
            if (!data.Codes || data.Codes.length === 0) {
                data.Codes = data.CouponCode ? [data.CouponCode] : [];
            }

            const fallback = checkV5Fallback?.(data);
            try {
                // These functions get stale, so need to ensure the flag is up-to-date
                const hasZipCodeValidation = getFlag('PaymentsZipCodeValidation');

                const silence = !!fallback || !!requestOptions.silence;

                const result = await api({
                    ...checkSubscriptionQuery(data, 'v5', hasZipCodeValidation),
                    ...requestOptions,
                    silence,
                });

                if (data.ProrationMode) {
                    result.ProrationMode = data.ProrationMode;
                }

                return {
                    ...result,
                    requestData: data,
                };
            } catch (error: any) {
                if (error?.data?.Code === PAYMENTS_API_ERROR_CODES.WRONG_ZIP_CODE) {
                    throw new InvalidZipCodeError();
                }

                if (fallback) {
                    return {
                        ...fallback,
                        requestData: data,
                    };
                }

                reportRoutingError(error, { system: 'chargebee', reason: 'default' });
                throw error;
            }
        };

        const multiCheck = (
            requestData: CheckSubscriptionData[],
            { cached, ...requestOptions }: MultiCheckOptions = {}
        ): Promise<EnrichedCheckResponse[]> => {
            return Promise.all(
                requestData.map(async (data) => {
                    if (cached) {
                        const cachedResult = multiCheckCache.get(data);
                        if (cachedResult) {
                            return cachedResult;
                        }
                    }

                    const result = await checkSubscription(data, requestOptions);
                    if (cached) {
                        multiCheckCache.set(data, result);
                    }

                    return result;
                })
            );
        };

        const cachedCheck = async (data: CheckSubscriptionData): Promise<EnrichedCheckResponse> => {
            const result = await multiCheck([data], { cached: true });
            return result[0];
        };

        const cacheMultiCheck = (data: CheckSubscriptionData, result: EnrichedCheckResponse) => {
            multiCheckCache.set(data, result);
        };

        const formatFullBillingAddress = (response: FullBillingAddressResponse): FullBillingAddress => {
            return {
                ...response.BillingAddress,
                VatId: response.VatId ?? null,
            };
        };

        const normalizeBillingAddress = (value: FullBillingAddress): FullBillingAddress => {
            // The API expects null over empty string for all optional values (all except CountryCode).
            return Object.fromEntries(
                Object.entries(value).map(([key, value]) => {
                    if (key === 'CountryCode') {
                        return [key, value];
                    }
                    return [key, value === '' ? null : value];
                })
            ) as FullBillingAddress;
        };

        const getFullBillingAddress = async (): Promise<FullBillingAddress> => {
            const response = await api<FullBillingAddressResponse>(queryFullBillingAddress());

            return formatFullBillingAddress(response);
        };

        const updateFullBillingAddress = async (fullBillingAddress: FullBillingAddress) => {
            await api(putFullBillingAddress(normalizeBillingAddress(fullBillingAddress)));
        };

        const updateInvoiceBillingAddress = async (invoiceId: string, fullBillingAddress: FullBillingAddress) => {
            await api(putInvoiceBillingAddress(invoiceId, normalizeBillingAddress(fullBillingAddress)));
        };

        const getInvoiceBillingAddress = async (invoiceId: string): Promise<FullBillingAddress> => {
            const response = await api<FullBillingAddressResponse>(queryInvoiceBillingAddress(invoiceId));
            return formatFullBillingAddress(response);
        };

        const getCachedCheck = (data: CheckSubscriptionData) => {
            return multiCheckCache.get(data);
        };

        const getCachedCheckByPlans = (plans: CheckSubscriptionData['Plans']) => {
            return multiCheckCache.getByPlans(plans);
        };

        return {
            checkSubscription,
            multiCheck,
            cacheMultiCheck,
            paymentStatus,
            getFullBillingAddress,
            updateFullBillingAddress,
            updateInvoiceBillingAddress,
            getInvoiceBillingAddress,
            cachedCheck,
            getCachedCheck,
            getCachedCheckByPlans,
        };
    };

    return {
        paymentsApi: getPaymentsApi(apiHook),
        getPaymentsApi,
    };
};

/**
 * Do not use this hook in unauth context.
 * This hook can be useful for getting multiple subscription/check calls at once.
 * A good example is fetching multiple prices with and without coupon to compare them.
 * Typically there is a plan with coupon, the same plan without coupon and
 * a monthly plan as a base for comparison. If user already has one of the plans then v5/subscription/check
 * will throw an error for this plan. To prevent this, checkV5Fallback intercepts the error and returns
 * an optimistic result.
 */
export const usePaymentsApiWithCheckFallback = () => {
    const [subscription] = useSubscription();
    const { plansMap, plansMapLoading } = usePreferredPlansMap();

    const checkV5Fallback = (data: CheckSubscriptionData): EnrichedCheckResponse | null => {
        const { Cycle, Currency, Plans } = data;

        const checkForbidden = isCheckForbidden(subscription, Plans, Cycle);
        if (!checkForbidden) {
            return null;
        }

        const planName = getPlanName(subscription);
        if (!planName || plansMapLoading) {
            return null;
        }

        const amount = plansMap[planName]?.Pricing?.[Cycle] ?? 0;

        const result: EnrichedCheckResponse & { __fallback: true } = {
            Cycle,
            Currency,
            Amount: amount,
            AmountDue: amount,
            Coupon: null,
            PeriodEnd: Math.floor(+addMonths(new Date(), Cycle) / 1000),
            SubscriptionMode: SubscriptionMode.Regular,
            BaseRenewAmount: null,
            RenewCycle: null,
            __fallback: true,
            requestData: data,
        };

        return result;
    };

    return usePaymentsApi(undefined, checkV5Fallback);
};
