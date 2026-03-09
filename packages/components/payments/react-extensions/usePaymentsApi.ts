import { useRef } from 'react';

import { createSelector } from '@reduxjs/toolkit';
import { addMonths } from 'date-fns';

import { selectPlans } from '@proton/account/plans';
import { useSubscription } from '@proton/account/subscription/hooks';
import useApi from '@proton/components/hooks/useApi';
import useConfig from '@proton/components/hooks/useConfig';
import { usePreferredPlansMap } from '@proton/components/hooks/usePreferredPlansMap';
import {
    type CheckSubscriptionData,
    DEFAULT_TAX_BILLING_ADDRESS,
    type FullBillingAddress,
    type MultiCheckOptions,
    PAYMENTS_API_ERROR_CODES,
    type PaymentStatus,
    type PaymentsApi,
    type PaymentsVersion,
    type SubscriptionEstimation,
    SubscriptionMode,
    captureWrongPlanIDs,
    getPaymentMethodStatus,
    getPlanName,
    getPlansMap,
    isLifetimePlanSelected,
    isSubscriptionCheckForbidden,
} from '@proton/payments';
import {
    putFullBillingAddress,
    putInvoiceBillingAddress,
    queryFullBillingAddress,
    queryInvoiceBillingAddress,
} from '@proton/payments/core/api/billing-information';
import { getLifetimeProductType } from '@proton/payments/core/api/createPaymentSubscription';
import { getBillingAddressPayload } from '@proton/payments/core/billing-address/billing-address';
import { getInformedOptimisticSubscriptionEstimation, getOptimisticCheckResult } from '@proton/payments/core/checkout';
import { TaxExemptionNotSupportedError, WrongBillingAddressError } from '@proton/payments/core/errors';
import type { CheckSubscriptionRequestOptions } from '@proton/payments/core/interface';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';
import { APPS } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { enrichCoupon } from './helpers';

const checkSubscriptionQuery = (data: CheckSubscriptionData, version: PaymentsVersion) => {
    const normalizedData: CheckSubscriptionData = {
        ...data,
    };

    if (normalizedData.BillingAddress) {
        normalizedData.BillingAddress = getBillingAddressPayload({
            billingAddress: normalizedData.BillingAddress,
            vatId: data.VatId,
        });
    }

    if (!normalizedData.VatId) {
        delete normalizedData.VatId;
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
            BillingAddress: data.BillingAddress,
        },
    };
};

export const useMultiCheckCache = () => {
    const cacheRef = useRef<Record<string, SubscriptionEstimation>>({});
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
            `.z-${data.BillingAddress?.ZipCode}` +
            `.trial-${data.IsTrial ?? false}`;

        return btoa(id);
    };

    const get = (data: CheckSubscriptionData): SubscriptionEstimation | undefined => {
        const id = hash(data);
        return cacheRef.current[id];
    };

    const set = (data: CheckSubscriptionData, value: SubscriptionEstimation) => {
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

function billingAddressFallback(fullBillingAddress: FullBillingAddress): FullBillingAddress {
    if (!fullBillingAddress.BillingAddress) {
        return {
            ...fullBillingAddress,
            BillingAddress: DEFAULT_TAX_BILLING_ADDRESS,
        };
    }

    return fullBillingAddress;
}

export const getFullBillingAddress = async (api: Api): Promise<FullBillingAddress> => {
    const fullBillingAddress = await api<FullBillingAddress>(queryFullBillingAddress());
    return billingAddressFallback(fullBillingAddress);
};

const getInvoiceBillingAddress = async (api: Api, invoiceId: string): Promise<FullBillingAddress> => {
    const fullBillingAddress = await api<FullBillingAddress>(queryInvoiceBillingAddress(invoiceId));
    return billingAddressFallback(fullBillingAddress);
};

const normalizeFullBillingAddress = (value: FullBillingAddress): FullBillingAddress => {
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

const updateFullBillingAddress = async (api: Api, fullBillingAddress: FullBillingAddress) => {
    await api(putFullBillingAddress(normalizeFullBillingAddress(fullBillingAddress)));
};

const updateInvoiceBillingAddress = async (api: Api, invoiceId: string, fullBillingAddress: FullBillingAddress) => {
    await api(putInvoiceBillingAddress(invoiceId, normalizeFullBillingAddress(fullBillingAddress)));
};

const plansSelector = createSelector(selectPlans, (plans) => plans.value?.plans ?? []);

export const usePaymentsApi = (
    apiOverride?: Api,
    checkV5Fallback?: (data: CheckSubscriptionData) => SubscriptionEstimation | null
): {
    paymentsApi: PaymentsApi;
    getPaymentsApi: (api: Api) => PaymentsApi;
} => {
    const regularApi = useApi();
    const apiHook = apiOverride ?? regularApi;
    const { APP_NAME } = useConfig();
    const multiCheckCache = useMultiCheckCache();
    const plans = useSelector(plansSelector);

    const getOptimisticFallback = (
        data: CheckSubscriptionData,
        requestOptions: CheckSubscriptionRequestOptions,
        error: any
    ): SubscriptionEstimation | null => {
        const optimisticSubscriptionEstimation = getOptimisticCheckResult({
            cycle: data.Cycle,
            planIDs: data.Plans,
            plansMap: getPlansMap(plans, data.Currency),
            currency: data.Currency,
        });
        optimisticSubscriptionEstimation.requestData = data;

        if (error?.data?.Code === PAYMENTS_API_ERROR_CODES.TAX_EXEMPTION_NOT_SUPPORTED) {
            optimisticSubscriptionEstimation.error = new TaxExemptionNotSupportedError();
        }

        if (error?.data?.Code === PAYMENTS_API_ERROR_CODES.WRONG_BILLING_ADDRESS) {
            optimisticSubscriptionEstimation.error = new WrongBillingAddressError(error?.data?.ValidationResult);
        }

        const hasDetectedError = !!optimisticSubscriptionEstimation.error;
        if (hasDetectedError) {
            if (requestOptions.previousEstimation) {
                return getInformedOptimisticSubscriptionEstimation(
                    optimisticSubscriptionEstimation,
                    requestOptions.previousEstimation
                );
            }

            return optimisticSubscriptionEstimation;
        }

        return null;
    };

    const getPaymentsApi = (api: Api): PaymentsApi => {
        const paymentStatus = async (): Promise<PaymentStatus> => {
            const status = await getPaymentMethodStatus(api);

            // ProtonAccountLite doesn't support cash payments
            if (APP_NAME === APPS.PROTONACCOUNTLITE) {
                status.VendorStates.Cash = false;
            }

            return status;
        };

        const checkSubscription = async (
            data: CheckSubscriptionData,
            requestOptions: CheckSubscriptionRequestOptions = {}
        ): Promise<SubscriptionEstimation> => {
            captureWrongPlanIDs(data.Plans, { source: 'check' });

            if (isLifetimePlanSelected(data.Plans)) {
                const result = await api(checkProduct(data));

                return {
                    ...result,

                    // filling in the missing properties to match the normal check response
                    Proration: 0,
                    CouponDiscount: 0,
                    Gift: 0,
                    Credit: 0,
                    UnusedCredit: 0,
                    Coupon: null,
                    SubscriptionMode: SubscriptionMode.Regular,
                    BaseRenewAmount: null,
                    RenewCycle: null,
                    // Cycle: skiping cycle for now, because it doesn't make sense in the context of lifetime plans
                    // however, if thats *really* necessary, we might put a placeholder value here e.g. CYCLE.YEARLY

                    requestData: data,
                };
            }

            // Patch for coupons compatibility v4 vs v5
            if (!data.Codes || data.Codes.length === 0) {
                data.Codes = data.CouponCode ? [data.CouponCode] : [];
            }

            const fallback = checkV5Fallback?.(data);
            try {
                const silence = !!fallback || !!requestOptions.silence;

                const result = await api({
                    ...checkSubscriptionQuery(data, 'v5'),
                    ...requestOptions,
                    silence,
                });

                if (data.ProrationMode) {
                    result.ProrationMode = data.ProrationMode;
                }

                const enrichedCheckResponse = {
                    ...result,
                    requestData: data,
                };

                enrichCoupon(enrichedCheckResponse);

                return enrichedCheckResponse;
            } catch (error: any) {
                const optimisticFallback = getOptimisticFallback(data, requestOptions, error);
                if (optimisticFallback) {
                    return optimisticFallback;
                }

                if (fallback) {
                    return {
                        ...fallback,
                        requestData: data,
                    };
                }

                throw error;
            }
        };

        const multiCheck = (
            requestData: CheckSubscriptionData[],
            { cached, signal, silence, ...optimisticFallbackOptions }: MultiCheckOptions = {}
        ): Promise<SubscriptionEstimation[]> => {
            return Promise.all(
                requestData.map(async (data) => {
                    if (cached) {
                        const cachedResult = multiCheckCache.get(data);
                        if (cachedResult) {
                            return cachedResult;
                        }
                    }

                    let result: SubscriptionEstimation;
                    try {
                        result = await checkSubscription(data, {
                            signal: signal,
                            silence: silence,
                        });
                    } catch (error: any) {
                        if (optimisticFallbackOptions.optimisticFallback) {
                            result = getOptimisticCheckResult({
                                planIDs: data.Plans,
                                plansMap: optimisticFallbackOptions.plansMap,
                                cycle: data.Cycle,
                                currency: data.Currency,
                            });
                        } else {
                            throw error;
                        }
                    }

                    if (cached) {
                        multiCheckCache.set(data, result);
                    }

                    return result;
                })
            );
        };

        const cachedCheck = async (data: CheckSubscriptionData): Promise<SubscriptionEstimation> => {
            const result = await multiCheck([data], { cached: true });
            return result[0];
        };

        const cacheMultiCheck = (data: CheckSubscriptionData, result: SubscriptionEstimation) => {
            multiCheckCache.set(data, result);
        };

        const getCachedCheck = (data: CheckSubscriptionData) => {
            return multiCheckCache.get(data);
        };

        const getCachedCheckByPlans = (plans: CheckSubscriptionData['Plans']) => {
            return multiCheckCache.getByPlans(plans);
        };

        const innerGetFullBillingAddress = async (): Promise<FullBillingAddress> => {
            return getFullBillingAddress(api);
        };

        const innerUpdateFullBillingAddress = async (fullBillingAddress: FullBillingAddress) => {
            try {
                return await updateFullBillingAddress(api, fullBillingAddress);
            } catch (error: any) {
                if (error?.data?.Code === PAYMENTS_API_ERROR_CODES.WRONG_BILLING_ADDRESS) {
                    throw new WrongBillingAddressError(error?.data?.ValidationResult);
                } else if (error?.data?.Code === PAYMENTS_API_ERROR_CODES.TAX_EXEMPTION_NOT_SUPPORTED) {
                    throw new TaxExemptionNotSupportedError();
                }

                throw error;
            }
        };

        const innerUpdateInvoiceBillingAddress = async (invoiceId: string, fullBillingAddress: FullBillingAddress) => {
            try {
                return await updateInvoiceBillingAddress(api, invoiceId, fullBillingAddress);
            } catch (error: any) {
                if (error?.data?.Code === PAYMENTS_API_ERROR_CODES.WRONG_BILLING_ADDRESS) {
                    throw new WrongBillingAddressError(error?.data?.ValidationResult);
                }

                throw error;
            }
        };

        const innerGetInvoiceBillingAddress = async (invoiceId: string): Promise<FullBillingAddress> => {
            return getInvoiceBillingAddress(api, invoiceId);
        };

        return {
            checkSubscription,
            multiCheck,
            cacheMultiCheck,
            paymentStatus,
            getFullBillingAddress: innerGetFullBillingAddress,
            updateFullBillingAddress: innerUpdateFullBillingAddress,
            updateInvoiceBillingAddress: innerUpdateInvoiceBillingAddress,
            getInvoiceBillingAddress: innerGetInvoiceBillingAddress,
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

    const checkV5Fallback = (data: CheckSubscriptionData): SubscriptionEstimation | null => {
        const { Cycle, Currency, Plans } = data;

        const checkForbidden = isSubscriptionCheckForbidden(subscription, Plans, Cycle);
        if (!checkForbidden) {
            return null;
        }

        const planName = getPlanName(subscription);
        if (!planName || plansMapLoading) {
            return null;
        }

        const amount = plansMap[planName]?.Pricing?.[Cycle] ?? 0;

        const result: SubscriptionEstimation & { __fallback: true } = {
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
