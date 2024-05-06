import { useState } from 'react';

import { addMonths } from 'date-fns';

import { DEFAULT_TAX_BILLING_ADDRESS } from '@proton/components/containers/payments/TaxCountrySelector';
import { isSubscriptionUnchanged } from '@proton/components/containers/payments/helper';
import { CheckSubscriptionData, PaymentsVersion, getPaymentsVersion } from '@proton/shared/lib/api/payments';
import { APPS, PLANS } from '@proton/shared/lib/constants';
import { toMap } from '@proton/shared/lib/helpers/object';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { getPlanName } from '@proton/shared/lib/helpers/subscription';
import { Api, ChargebeeEnabled, SubscriptionCheckResponse } from '@proton/shared/lib/interfaces';
import { getSentryError } from '@proton/shared/lib/keys';

import { useApi, useConfig, usePlans, useSubscription } from '../../hooks';
import { useChargebeeContext, useChargebeeEnabledCache } from '../client-extensions/useChargebeeContext';
import { useChargebeeKillSwitch } from '../client-extensions/useChargebeeKillSwitch';
import {
    PaymentMethodStatus,
    PaymentMethodStatusExtended,
    PaymentsApi,
    extendStatus,
    isPaymentMethodStatusExtended,
} from '../core';

const checkSubscription = (data: CheckSubscriptionData, version: PaymentsVersion) => ({
    url: `payments/${version}/subscription/check`,
    method: 'post',
    data,
});

const queryPaymentMethodStatus = (version: PaymentsVersion) => ({
    url: `payments/${version}/status`,
    method: 'get',
});

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

export const usePaymentsApi = (
    apiOverride?: Api,
    checkV5Fallback?: (data: CheckSubscriptionData) => SubscriptionCheckResponse | null
): {
    paymentsApi: PaymentsApi;
    getPaymentsApi: (api: Api, chargebeeEnabled?: ChargebeeEnabled) => PaymentsApi;
} => {
    const regularApi = useApi();
    const apiHook = apiOverride ?? regularApi;
    const { chargebeeKillSwitch } = useChargebeeKillSwitch();
    const chargebeeEnabledCache = useChargebeeEnabledCache();
    const { APP_NAME } = useConfig();
    const reportRoutingError = useReportRoutingError();

    const getPaymentsApi = (api: Api, chargebeeEnabledOverride?: ChargebeeEnabled): PaymentsApi => {
        const getChargebeeEnabled = (): ChargebeeEnabled => chargebeeEnabledOverride ?? chargebeeEnabledCache();

        const statusExtended = (version: PaymentsVersion): Promise<PaymentMethodStatusExtended> => {
            return api<PaymentMethodStatusExtended | PaymentMethodStatus>(queryPaymentMethodStatus(version))
                .then((result) => {
                    // If that's already the extended status, aka v5 status, then we just return it,
                    // or set the country code to the default one if it's missing
                    if (isPaymentMethodStatusExtended(result)) {
                        if (!result.CountryCode) {
                            result.CountryCode = DEFAULT_TAX_BILLING_ADDRESS.CountryCode;
                        }

                        return result;
                    }

                    // if that's the v4 status, we extend it to mimic the v5 status.
                    // It will simplify all further interactions with the status.
                    return extendStatus(result);
                })
                .then((status) => {
                    const keys = Object.keys(
                        status.VendorStates
                    ) as (keyof PaymentMethodStatusExtended['VendorStates'])[];

                    // Normalizing the boolean values, converting them from 0 or 1 to false or true
                    for (const key of keys) {
                        status.VendorStates[key] = !!status.VendorStates[key];
                    }

                    // The backend doesn't return the Cash key. We still use it in the frontend,
                    // so we synthetize it here.
                    if (!Object.hasOwn(status.VendorStates, 'Cash')) {
                        status.VendorStates.Cash = true;
                    }

                    return status;
                })
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

            if (chargebeeEnabled === ChargebeeEnabled.CHARGEBEE_FORCED) {
                return statusExtended('v5');
            }

            try {
                return await statusExtended('v5');
            } catch (error) {
                if (
                    chargebeeKillSwitch({
                        reason: 'status call failed',
                        error,
                    })
                ) {
                    return await statusExtended('v4');
                }

                throw error;
            }
        };

        const checkV4 = async (
            data: CheckSubscriptionData,
            signal: AbortSignal | undefined,
            additionalContext?: any
        ): Promise<SubscriptionCheckResponse> => {
            try {
                return await api({
                    ...checkSubscription(data, 'v4'),
                    signal,
                });
            } catch (error) {
                reportRoutingError(error, additionalContext);
                throw error;
            }
        };

        const checkV5 = async (
            data: CheckSubscriptionData,
            signal: AbortSignal | undefined,
            additionalContext?: any
        ): Promise<SubscriptionCheckResponse> => {
            // Patch for coupons compatibility v4 vs v5
            if (!data.Codes || data.Codes.length === 0) {
                data.Codes = data.CouponCode ? [data.CouponCode] : [];
            }

            const fallback = checkV5Fallback?.(data);
            try {
                const silence = !!fallback;

                return await api({
                    ...checkSubscription(data, 'v5'),
                    signal,
                    silence,
                });
            } catch (error) {
                if (fallback) {
                    return fallback;
                }

                reportRoutingError(error, additionalContext);
                throw error;
            }
        };

        const checkWithAutomaticVersion = async (
            data: CheckSubscriptionData,
            signal?: AbortSignal
        ): Promise<SubscriptionCheckResponse> => {
            const chargebeeEnabled = getChargebeeEnabled();

            if (chargebeeEnabled === ChargebeeEnabled.INHOUSE_FORCED) {
                return checkV4(data, signal, { system: 'inhouse', reason: 'forced' });
            }

            if (chargebeeEnabled === ChargebeeEnabled.CHARGEBEE_FORCED) {
                return checkV5(data, signal, { system: 'chargebee', reason: 'forced' });
            }

            const passB2bPlans = [PLANS.PASS_PRO, PLANS.PASS_BUSINESS];
            const isPassB2b = passB2bPlans.some((plan) => data.Plans[plan] > 0);
            if (isPassB2b) {
                return checkV4(data, signal, {
                    reason: 'pass b2b',
                    system: 'inhouse',
                });
            }

            try {
                return await checkV5(data, signal, { system: 'chargebee', reason: 'default' });
            } catch (error) {
                if (
                    chargebeeKillSwitch({
                        reason: 'check call failed',
                        data,
                        error,
                    })
                ) {
                    return await checkV4(data, signal, {
                        reason: 'killswitch',
                        system: 'inhouse',
                    });
                }

                throw error;
            }
        };

        return {
            checkWithAutomaticVersion,
            statusExtendedAutomatic,
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
    const [plansResult] = usePlans();
    const [subscription] = useSubscription();

    const checkV5Fallback = (data: CheckSubscriptionData): SubscriptionCheckResponse | null => {
        const { Cycle, Currency, Plans } = data;

        const samePlan = isSubscriptionUnchanged(subscription, Plans, Currency, Cycle);
        if (!samePlan) {
            return null;
        }

        const planName = getPlanName(subscription);
        if (!planName) {
            return null;
        }

        const plansMap = toMap(plansResult?.plans, 'Name');
        const plan = plansMap[planName];

        const result: SubscriptionCheckResponse = {
            Cycle,
            Currency,
            Amount: plan.Amount,
            AmountDue: plan.Amount,
            Coupon: null,
            PeriodEnd: +addMonths(new Date(), Cycle) / 1000,
        };

        return result;
    };

    return usePaymentsApi(undefined, checkV5Fallback);
};
