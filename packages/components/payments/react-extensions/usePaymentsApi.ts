import { useRef, useState } from 'react';

import { addMonths } from 'date-fns';

import { useSubscription } from '@proton/account/subscription/hooks';
import useApi from '@proton/components/hooks/useApi';
import useConfig from '@proton/components/hooks/useConfig';
import { usePreferredPlansMap } from '@proton/components/hooks/usePreferredPlansMap';
import {
    type CheckSubscriptionData,
    type CheckWithAutomaticOptions,
    type FullBillingAddress,
    type MultiCheckOptions,
    type MultiCheckSubscriptionData,
    PAYMENTS_API_ERROR_CODES,
    type PaymentMethodStatus,
    type PaymentMethodStatusExtended,
    type PaymentsApi,
    type PaymentsVersion,
    type RequestOptions,
    captureWrongPlanIDs,
    extendStatus,
    getLifetimeProductType,
    getPaymentsVersion,
    getPlanName,
    isCheckForbidden,
    isCheckWithAutomaticOptions,
    isLifetimePlanSelected,
    isPaymentMethodStatusExtended,
    normalizeBillingAddress,
    normalizePaymentMethodStatus,
    queryPaymentMethodStatus,
} from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';
import { type EnrichedCheckResponse } from '@proton/shared/lib/helpers/checkout';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { type Api, ChargebeeEnabled, SubscriptionMode } from '@proton/shared/lib/interfaces';
import { getSentryError } from '@proton/shared/lib/keys';
import { useFlag } from '@proton/unleash';
import isTruthy from '@proton/utils/isTruthy';

import { useChargebeeContext, useChargebeeEnabledCache } from '../client-extensions/useChargebeeContext';
import { InvalidZipCodeError } from './errors';

const checkSubscription = (data: CheckSubscriptionData, version: PaymentsVersion, hasZipCodeValidation: boolean) => {
    let normalizedData: CheckSubscriptionData = {
        ...data,
    };

    if (normalizedData.BillingAddress && normalizedData.BillingAddress.ZipCode) {
        normalizedData.BillingAddress = normalizeBillingAddress(normalizedData.BillingAddress, hasZipCodeValidation);
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

    const hash = (data: CheckSubscriptionData, options?: CheckWithAutomaticOptions) => {
        const plans = getPlanID(data.Plans);

        const id =
            `p-${plans}` +
            `.cur-${data.Currency}` +
            `.cyc-${data.Cycle}` +
            `.codes-${data.Codes?.join(',') ?? ''}` +
            `.cc-${data.BillingAddress?.CountryCode}` +
            `.s-${data.BillingAddress?.State}` +
            `.z-${data.BillingAddress?.ZipCode}` +
            `.v-${options?.forcedVersion ?? ''}`;

        return btoa(id);
    };

    const get = (
        data: CheckSubscriptionData,
        options?: CheckWithAutomaticOptions
    ): EnrichedCheckResponse | undefined => {
        const id = hash(data, options);
        return cacheRef.current[id];
    };

    const set = (
        data: CheckSubscriptionData,
        options: CheckWithAutomaticOptions | undefined,
        value: EnrichedCheckResponse
    ) => {
        const id = hash(data, options);
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
    getPaymentsApi: (api: Api, chargebeeEnabled?: ChargebeeEnabled) => PaymentsApi;
} => {
    const regularApi = useApi();
    const apiHook = apiOverride ?? regularApi;
    const chargebeeEnabledCache = useChargebeeEnabledCache();
    const { APP_NAME } = useConfig();
    const reportRoutingError = useReportRoutingError();
    const multiCheckCache = useMultiCheckCache();
    const zipCodeValidation = useFlag('PaymentsZipCodeValidation');

    const getPaymentsApi = (api: Api, chargebeeEnabledOverride?: ChargebeeEnabled): PaymentsApi => {
        const getChargebeeEnabled = (): ChargebeeEnabled => chargebeeEnabledOverride ?? chargebeeEnabledCache();

        const statusExtended = (version: PaymentsVersion): Promise<PaymentMethodStatusExtended> => {
            return api<PaymentMethodStatusExtended | PaymentMethodStatus>(queryPaymentMethodStatus(version))
                .then((result) => {
                    // If that's already the extended status, aka v5 status, then we just return it,
                    // or set the country code to the default one if it's missing
                    if (isPaymentMethodStatusExtended(result)) {
                        return result;
                    }

                    // if that's the v4 status, we extend it to mimic the v5 status.
                    // It will simplify all further interactions with the status.
                    return extendStatus(result);
                })
                .then((status) => normalizePaymentMethodStatus(status))
                .then((status) => {
                    // ProtonAccountLite doesn't support cash payments
                    if (APP_NAME === APPS.PROTONACCOUNTLITE) {
                        status.VendorStates.Cash = false;
                    }

                    return status;
                });
        };

        const statusExtendedAutomatic = async (): Promise<PaymentMethodStatusExtended> => {
            const chargebeeEnabled = getChargebeeEnabled();

            if (chargebeeEnabled === ChargebeeEnabled.INHOUSE_FORCED) {
                return statusExtended('v4');
            }

            return statusExtended('v5');
        };

        const checkV4 = async (
            data: CheckSubscriptionData,
            requestOptions: RequestOptions = {},
            additionalContext?: any
        ): Promise<EnrichedCheckResponse> => {
            try {
                const result = await api({
                    ...checkSubscription(data, 'v4', zipCodeValidation),
                    ...requestOptions,
                });

                return {
                    ...result,
                    requestData: data,
                };
            } catch (error) {
                reportRoutingError(error, additionalContext);
                throw error;
            }
        };

        const checkV5 = async (
            data: CheckSubscriptionData,
            requestOptions: RequestOptions = {},
            additionalContext?: any
        ): Promise<EnrichedCheckResponse> => {
            // Patch for coupons compatibility v4 vs v5
            if (!data.Codes || data.Codes.length === 0) {
                data.Codes = data.CouponCode ? [data.CouponCode] : [];
            }

            const fallback = checkV5Fallback?.(data);
            try {
                const silence = !!fallback || !!requestOptions.silence;

                const result = await api({
                    ...checkSubscription(data, 'v5', zipCodeValidation),
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

                reportRoutingError(error, additionalContext);
                throw error;
            }
        };

        const checkWithAutomaticVersion = async (
            data: CheckSubscriptionData,
            requestOptions: RequestOptions = {},
            options?: CheckWithAutomaticOptions
        ): Promise<EnrichedCheckResponse> => {
            captureWrongPlanIDs(data.Plans, { source: 'checkWithAutomaticVersion' });

            if (isLifetimePlanSelected(data.Plans)) {
                return api(checkProduct(data));
            }

            const chargebeeEnabled = getChargebeeEnabled();
            if (chargebeeEnabled === ChargebeeEnabled.INHOUSE_FORCED) {
                return checkV4(data, requestOptions, { system: 'inhouse', reason: 'forced' });
            }

            if (options?.forcedVersion === 'v4') {
                return checkV4(data, requestOptions, { system: 'inhouse', reason: options.reason });
            }

            if (chargebeeEnabled === ChargebeeEnabled.CHARGEBEE_FORCED) {
                return checkV5(data, requestOptions, { system: 'chargebee', reason: 'forced' });
            }

            if (options?.forcedVersion === 'v5') {
                return checkV5(data, requestOptions, { system: 'chargebee', reason: options.reason });
            }

            return checkV5(data, requestOptions, { system: 'chargebee', reason: 'default' });
        };

        const multiCheck = (
            multiCheckData: MultiCheckSubscriptionData[],
            { cached, ...requestOptions }: MultiCheckOptions = {}
        ): Promise<EnrichedCheckResponse[]> => {
            const requestData: {
                data: CheckSubscriptionData;
                options: CheckWithAutomaticOptions | undefined;
            }[] = multiCheckData.map((data) => {
                if (isCheckWithAutomaticOptions(data)) {
                    const { forcedVersion, reason, ...rest } = data;

                    return {
                        data: rest,
                        options: {
                            forcedVersion,
                            reason,
                        },
                    };
                }

                return {
                    data: data,
                    options: undefined,
                };
            });

            return Promise.all(
                requestData.map(async ({ data, options }) => {
                    if (cached) {
                        const cachedResult = multiCheckCache.get(data, options);
                        if (cachedResult) {
                            return cachedResult;
                        }
                    }

                    const result = await checkWithAutomaticVersion(data, requestOptions, options);
                    if (cached) {
                        multiCheckCache.set(data, options, result);
                    }

                    return result;
                })
            );
        };

        const cachedCheck = async (data: MultiCheckSubscriptionData): Promise<EnrichedCheckResponse> => {
            const result = await multiCheck([data], { cached: true });
            return result[0];
        };

        const cacheMultiCheck = (
            data: CheckSubscriptionData,
            options: CheckWithAutomaticOptions | undefined,
            result: EnrichedCheckResponse
        ) => {
            multiCheckCache.set(data, options, result);
        };

        const formatFullBillingAddress = (response: FullBillingAddressResponse): FullBillingAddress => {
            return {
                ...response.BillingAddress,
                VatId: response.VatId ?? null,
            };
        };

        const getFullBillingAddress = async (): Promise<FullBillingAddress> => {
            const response = await api<FullBillingAddressResponse>(queryFullBillingAddress());

            return formatFullBillingAddress(response);
        };

        const updateFullBillingAddress = async (fullBillingAddress: FullBillingAddress) => {
            await api(putFullBillingAddress(fullBillingAddress));
        };

        const updateInvoiceBillingAddress = async (invoiceId: string, fullBillingAddress: FullBillingAddress) => {
            await api(putInvoiceBillingAddress(invoiceId, fullBillingAddress));
        };

        const getInvoiceBillingAddress = async (invoiceId: string): Promise<FullBillingAddress> => {
            const response = await api<FullBillingAddressResponse>(queryInvoiceBillingAddress(invoiceId));
            return formatFullBillingAddress(response);
        };

        const getCachedCheck = (data: CheckSubscriptionData) => {
            return multiCheckCache.get(data, undefined);
        };

        const getCachedCheckByPlans = (plans: CheckSubscriptionData['Plans']) => {
            return multiCheckCache.getByPlans(plans);
        };

        return {
            checkWithAutomaticVersion,
            multiCheck,
            cacheMultiCheck,
            statusExtendedAutomatic,
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
