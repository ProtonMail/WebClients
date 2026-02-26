import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { useGetPaymentStatus } from '@proton/account/paymentStatus/hooks';
import { useGetPlans } from '@proton/account/plans/hooks';
import type { OnLoginCallback } from '@proton/components';
import {
    StandardLoadErrorPage,
    UnAuthenticated,
    useActiveBreakpoint,
    useApi,
    useConfig,
    useErrorHandler,
} from '@proton/components';
import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import { usePaymentsTelemetry } from '@proton/components/payments/client-extensions';
import { useCurrencies } from '@proton/components/payments/client-extensions/useCurrencies';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import metrics, { observeApiError } from '@proton/metrics';
import {
    ADDON_NAMES,
    type BillingAddress,
    CYCLE,
    type Currency,
    FREE_PLAN,
    PLANS,
    type PaymentProcessorType,
    type Plan,
    type PlanIDs,
    SubscriptionMode,
    getBillingAddressFromPaymentStatus,
    getHas2025OfferCoupon,
    getIsVPNPassPromotion,
    getIsVpnB2BPlan,
    getPlanFromPlanIDs,
    getPlanIDs,
    getPlanNameFromIDs,
    getPlansMap,
    hasPlanIDs,
} from '@proton/payments';
import { checkoutTelemetry } from '@proton/payments/telemetry/telemetry';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { TelemetryAccountSignupEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { getWelcomeToText } from '@proton/shared/lib/apps/text';
import type { APP_NAMES, CLIENT_TYPES } from '@proton/shared/lib/constants';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { wait } from '@proton/shared/lib/helpers/promise';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { getVPNServersCountData } from '@proton/shared/lib/vpn/serversCount';
import onboardingVPNWelcome from '@proton/styles/assets/img/onboarding/vpn-welcome.svg';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';
import unique from '@proton/utils/unique';

import { cachedPlans, cachedPlansMap } from '../defaultPlans';
import { getOptimisticDomains } from '../signup/helper';
import { type SignupCacheResult, SignupType } from '../signup/interfaces';
import { getPlanIDsFromParams, getSignupSearchParams } from '../signup/searchParams';
import {
    getSubscriptionMetricsData,
    handleDone,
    handleSetPassword,
    handleSetupOrg,
    handleSetupUser,
} from '../signup/signupActions';
import { handleCreateUser } from '../signup/signupActions/handleCreateUser';
import {
    sendSignupAccountCreationTelemetry,
    sendSignupLoadTelemetry,
    sendSignupSubscriptionTelemetryEvent,
} from '../signup/signupTelemetry';
import { defaultSignupModel } from '../single-signup-v2/constants';
import type { SubscriptionDataCycleMapping } from '../single-signup-v2/helper';
import {
    getOptimisticPlanCardSubscriptionData,
    getOptimisticPlanCardsSubscriptionData,
    getPlanCardSubscriptionData,
    getSubscriptionData,
} from '../single-signup-v2/helper';
import type { SignupDefaults } from '../single-signup-v2/interface';
import { Steps } from '../single-signup-v2/interface';
import { getPaymentMethodsAvailable, getSignupTelemetryData } from '../single-signup-v2/measure';
import { useGetAccountKTActivation } from '../useGetAccountKTActivation';
import useLocationWithoutLocale from '../useLocationWithoutLocale';
import type { MetaTags } from '../useMetaTags';
import { useMetaTags } from '../useMetaTags';
import Step1 from './Step1';
import Step1B from './Step1B';
import Step2 from './Step2';
import Step3 from './Step3';
import Step4 from './Step4';
import { pushConvertGoal } from './convert';
import { getUpsellShortPlan } from './helper';
import onboardingVPNWelcome2 from './illustration.svg';
import type { VPNSignupMode, VPNSignupModel } from './interface';
import type { TelemetryMeasurementData } from './measure';
import { filterCycleDataByPlan, getCycleData } from './state';
import vpnUpsellIllustration from './vpn-upsell-illustration.svg';

interface Props {
    loader: ReactNode;
    onLogin: OnLoginCallback;
    productParam: ProductParam;
    toApp: APP_NAMES;
    toAppName: string;
    onBack?: () => void;
    clientType: CLIENT_TYPES;
    metaTags: MetaTags;
    onPreSubmit?: () => Promise<void>;
    onStartAuth: () => Promise<void>;
}

interface CheckPlansArgs {
    plans: Plan[];
    preferredCurrency: Currency;
    withModel?: boolean;
    billingAddress?: BillingAddress;
}

const vpnPlanName = PLANS.VPN2024;

const getSearchParams = () => {
    return new URLSearchParams(window.location.search);
};

/**
 * Applies minimum required addons for VPN_PASS_BUNDLE_BUSINESS plan
 *  Sets minimum 3 members (plan includes 1, so adds 2 member addons)
 *  Sets 1 dedicated IP by default
 */
const maybeApplyVpnPassBundleDefaults = (planIDs: PlanIDs): void => {
    if (!planIDs[PLANS.VPN_PASS_BUNDLE_BUSINESS]) {
        return;
    }

    if (!planIDs[ADDON_NAMES.MEMBER_VPN_PASS_BUNDLE_BUSINESS]) {
        planIDs[ADDON_NAMES.MEMBER_VPN_PASS_BUNDLE_BUSINESS] = 2;
    }

    if (!planIDs[ADDON_NAMES.IP_VPN_PASS_BUNDLE_BUSINESS]) {
        planIDs[ADDON_NAMES.IP_VPN_PASS_BUNDLE_BUSINESS] = 1;
    }
};

const getSignupMode = (coupon: string | undefined, currency: Currency | undefined): VPNSignupMode => {
    const searchParams = getSearchParams();

    if (searchParams?.get('plan') && (searchParams?.get('cycle') || searchParams?.get('billing'))) {
        return 'signup' as const;
    }

    if (getIsVPNPassPromotion(coupon, currency)) {
        return 'vpn-pass-promotion' as const;
    }

    return 'pricing' as const;
};

const SingleSignupContainer = ({
    onPreSubmit,
    onStartAuth,
    metaTags,
    clientType,
    onLogin,
    productParam,
    toApp,
    toAppName,
}: Props) => {
    const getKtActivation = useGetAccountKTActivation();
    const unauthApi = useApi();
    const silentApi = useSilentApi();
    const { paymentsApi } = usePaymentsApi(silentApi);
    const { APP_NAME } = useConfig();
    const [error, setError] = useState<any>();
    const handleError = useErrorHandler();
    const location = useLocationWithoutLocale();
    const getPaymentStatus = useGetPaymentStatus();
    const { reportPaymentSuccess, reportPaymentFailure } = usePaymentsTelemetry({
        flow: 'signup-vpn',
    });
    const activeBreakpoint = useActiveBreakpoint();

    const getPlans = useGetPlans();

    const { getPreferredCurrency } = useCurrencies();

    useMetaTags(metaTags);

    const isVariantB = getSearchParams().get('v') === 'b' || getSearchParams().get('v') === 'aff';

    const [signupParameters, setSignupParameters] = useState(() => {
        const result = getSignupSearchParams(location.pathname, getSearchParams());

        const validValues = [
            'free',
            PLANS.BUNDLE,
            PLANS.VPN2024,
            PLANS.VPN_PRO,
            PLANS.VPN_PASS_BUNDLE,
            PLANS.VPN_BUSINESS,
            PLANS.VPN_PASS_BUNDLE_BUSINESS,
        ];
        if (result.preSelectedPlan && !validValues.includes(result.preSelectedPlan)) {
            delete result.preSelectedPlan;
        }

        return result;
    });

    const [model, setModel] = useState<VPNSignupModel>(() => {
        // Add free plan
        const plans = cachedPlans;
        const plansMap = cachedPlansMap;
        const currency = 'CHF';

        const cycleData = getCycleData({
            plan: vpnPlanName,
            currency,
        });

        const defaults: SignupDefaults = {
            plan: vpnPlanName,
            cycle: cycleData.upsellCycle,
        };
        const planParameters = getPlanIDsFromParams(plans, currency, signupParameters, defaults) || {};
        const planIDs = planParameters.planIDs;
        maybeApplyVpnPassBundleDefaults(planIDs);
        const selectedPlan = getPlanFromPlanIDs(plansMap, planIDs) || FREE_PLAN;
        const filteredCycleData = filterCycleDataByPlan(cycleData, selectedPlan);
        const cycle = signupParameters.cycle || filteredCycleData.upsellCycle;
        const billingAddress = {
            CountryCode: '',
            State: '',
        };

        const mode = getSignupMode(signupParameters.coupon, currency);

        const subscriptionData = getOptimisticPlanCardSubscriptionData({
            currency,
            cycle,
            planIDs,
            plansMap,
            billingAddress,
        });
        const subscriptionDataCycleMapping = getOptimisticPlanCardsSubscriptionData({
            plansMap,
            planIDs: [planIDs, { [vpnPlanName]: 1 }, { [PLANS.VPN_PASS_BUNDLE]: 1 }],
            cycles: unique([cycle, ...filteredCycleData.cycles]),
            billingAddress,
        });

        return {
            ...defaultSignupModel,
            cycleData: filteredCycleData,
            planParameters,
            subscriptionData,
            subscriptionDataCycleMapping,
            domains: getOptimisticDomains(),
            signupType: 'default',
            plansMap,
            plans,
            mode,
        };
    });

    const setModelDiff = (diff: Partial<VPNSignupModel>) => {
        return setModel((model) => ({
            ...model,
            ...diff,
        }));
    };

    const setMode = (mode: ReturnType<typeof getSignupMode>) => {
        setModelDiff({ mode });
        setSignupParameters((params) => ({
            ...params,
            hideFreePlan: params.hideFreePlan || mode === 'vpn-pass-promotion',
        }));
    };

    const updateMode = (currency: Currency | undefined) => {
        setMode(getSignupMode(signupParameters.coupon, currency));
    };

    const measure = (data: TelemetryMeasurementData) => {
        const values = 'values' in data ? data.values : {};
        return sendTelemetryReport({
            api: unauthApi,
            measurementGroup: TelemetryMeasurementGroups.accountSignup,
            event: data.event,
            dimensions: {
                ...data.dimensions,
                flow: model.mode === 'signup' ? 'vpn_signup_2step' : 'vpn_signup_3step',
            },
            values,
            delay: false,
        }).catch(noop);
    };

    const vpnServersCountData = model.vpnServersCountData;
    const selectedPlan = getPlanFromPlanIDs(model.plansMap, model.subscriptionData.planIDs) || FREE_PLAN;
    const upsellShortPlan = getUpsellShortPlan(selectedPlan, vpnServersCountData);

    const isB2bPlan = getIsVpnB2BPlan(selectedPlan?.Name as PLANS);
    const background = (() => {
        if (isB2bPlan) {
            return 'dark';
        }

        if (getHas2025OfferCoupon(signupParameters.coupon)) {
            return 'bf2025';
        }
    })();

    const checkPlans = async ({
        plans,
        preferredCurrency,
        billingAddress: maybeBillingAddress,
        withModel = false,
    }: CheckPlansArgs) => {
        let coupon = withModel ? model.subscriptionData.checkResult.Coupon?.Code : signupParameters.coupon;

        const cycleData = getCycleData({
            plan: vpnPlanName,
            coupon,
            currency: preferredCurrency,
        });

        const defaults: SignupDefaults = {
            plan: vpnPlanName,
            cycle: cycleData.upsellCycle,
        };
        const { plan, planIDs } = getPlanIDsFromParams(plans, preferredCurrency, signupParameters, defaults) || {};
        maybeApplyVpnPassBundleDefaults(planIDs);

        const selectedPlanCurrency = plan.Currency;

        const plansMap = getPlansMap(plans, selectedPlanCurrency, true);
        const filteredCycleData = filterCycleDataByPlan(cycleData, plan);

        const modelCycle = withModel ? model.subscriptionData.cycle : undefined;
        const cycle = modelCycle || signupParameters.cycle || filteredCycleData.upsellCycle;

        const isVpnPassPromotion = getIsVPNPassPromotion(coupon, selectedPlanCurrency);
        const billingAddress = maybeBillingAddress ?? model.subscriptionData.billingAddress;

        // true iff trial detected through check result (if present) or signupParameters otherwise
        const checkSignupTrial = withModel
            ? model.subscriptionData.checkResult.SubscriptionMode === SubscriptionMode.Trial
            : signupParameters.trial;

        const getSubscriptionDataCycleMapping = async () => {
            const originalCoupon = coupon;

            // Remove this coupon since it's only valid for VPN+Pass bundle 12M
            if (isVpnPassPromotion) {
                coupon = undefined;
            }

            const sharedOptions = {
                plansMap,
                paymentsApi,
                billingAddress,
            };

            const subscriptionDataCycleMappingPromise = getPlanCardSubscriptionData({
                ...sharedOptions,
                planIDs: [planIDs, !planIDs[vpnPlanName] ? { [vpnPlanName]: 1 } : undefined].filter(isTruthy),
                cycles: unique([cycle, ...filteredCycleData.cycles]),
                coupon,
            });

            let vpnPassPromotionMapping: SubscriptionDataCycleMapping = {};
            if (cycle === CYCLE.YEARLY && isVpnPassPromotion) {
                const vpnPassPromotionMappingPromise = getPlanCardSubscriptionData({
                    ...sharedOptions,
                    planIDs: [{ [PLANS.VPN_PASS_BUNDLE]: 1 }],
                    cycles: [CYCLE.YEARLY],
                    coupon: originalCoupon,
                });
                vpnPassPromotionMapping = await vpnPassPromotionMappingPromise;
            }

            const result = await subscriptionDataCycleMappingPromise;
            if (vpnPassPromotionMapping[PLANS.VPN_PASS_BUNDLE]?.[CYCLE.YEARLY]) {
                result[PLANS.VPN_PASS_BUNDLE] = {
                    ...result[PLANS.VPN_PASS_BUNDLE],
                    [CYCLE.YEARLY]: vpnPassPromotionMapping[PLANS.VPN_PASS_BUNDLE][CYCLE.YEARLY],
                };
            }

            return result;
        };

        const subscriptionDataCycleMapping = await getSubscriptionDataCycleMapping();

        let subscriptionData = (() => {
            // If it's the vpn pass promotion we change the default selected plan to vpn pass bundle 12m
            if (cycle === CYCLE.YEARLY && isVpnPassPromotion) {
                return subscriptionDataCycleMapping[PLANS.VPN_PASS_BUNDLE]?.[cycle];
            }
            return subscriptionDataCycleMapping[plan.Name as PLANS]?.[cycle];
        })();

        if (!subscriptionData || subscriptionData.checkResult.optimistic) {
            subscriptionData = await getSubscriptionData(paymentsApi, {
                plansMap,
                planIDs,
                currency: selectedPlanCurrency,
                cycle,
                coupon,
                billingAddress,
                trial: checkSignupTrial,
                ValidateBillingAddress: true,
                VatId: model.subscriptionData.vatNumber,
            });
        }

        const selectedPlan = getPlanFromPlanIDs(plansMap, subscriptionData?.planIDs) || FREE_PLAN;

        return {
            plansMap,
            subscriptionData,
            cycleData: filteredCycleData,
            subscriptionDataCycleMapping,
            coupon,
            selectedPlan,
        };
    };

    const updatePlans = async (currency: Currency) => {
        const plansResult = await getPlans({ api: silentApi });
        const plans = plansResult.plans;

        const preferredCurrency = getPreferredCurrency({
            paramCurrency: currency,
            paymentStatus: model.paymentStatus,
            plans: plans,
        });

        const { plansMap, subscriptionData, cycleData, subscriptionDataCycleMapping } = await checkPlans({
            plans,
            preferredCurrency,
            withModel: true,
        });

        updateMode(preferredCurrency);

        setModelDiff({
            plans,
            plansMap,
            subscriptionData,
            cycleData,
            subscriptionDataCycleMapping,
            signupType: 'default' as const,
        });
    };

    const telemetryContext = 'v1-signup';

    useEffect(() => {
        const fetchDependencies = async () => {
            await onStartAuth().catch(noop);

            void getVPNServersCountData(silentApi).then((vpnServersCountData) => setModelDiff({ vpnServersCountData }));

            const [{ Domains: domains }, { plans, freePlan }, paymentStatus] = await Promise.all([
                silentApi<{ Domains: string[] }>(queryAvailableDomains('signup')),
                getPlans({ api: silentApi }),
                getPaymentStatus({ api: silentApi }),
            ]);

            void measure({
                event: TelemetryAccountSignupEvents.pageLoad,
                dimensions: {},
            });
            void measure({
                event: TelemetryAccountSignupEvents.bePaymentMethods,
                dimensions: getPaymentMethodsAvailable(paymentStatus.VendorStates),
            });

            const preferredCurrency = getPreferredCurrency({
                paymentStatus,
                plans,
                paramCurrency: signupParameters.currency,
                paramPlanName: signupParameters.preSelectedPlan,
            });

            const mode = getSignupMode(signupParameters.coupon, preferredCurrency);
            setModelDiff({ mode });

            const { plansMap, subscriptionData, cycleData, subscriptionDataCycleMapping } = await checkPlans({
                plans,
                preferredCurrency,
                billingAddress: getBillingAddressFromPaymentStatus(paymentStatus),
            });

            sendSignupLoadTelemetry({
                planIDs: subscriptionData.planIDs,
                flowId: 'single-page-signup-vpn',
                productIntent: toApp,
                currency: preferredCurrency,
                cycle: subscriptionData.cycle,
            });

            checkoutTelemetry.reportInitialization({
                context: telemetryContext,
                userCurrency: undefined,
                subscription: undefined,
                selectedCurrency: subscriptionData.currency,
                selectedPlanIDs: subscriptionData.planIDs,
                selectedCycle: subscriptionData.cycle,
                selectedCoupon: subscriptionData.checkResult.Coupon?.Code,
                selectedStep: null,
                build: APP_NAME,
                product: toApp,
            });

            setModelDiff({
                domains,
                plans,
                freePlan,
                plansMap,
                paymentStatus,
                subscriptionData,
                subscriptionDataCycleMapping,
                cycleData,
                signupType: 'default' as const,
                loadingDependencies: false,
            });
        };

        fetchDependencies()
            .then(() => {
                metrics.core_vpn_single_signup_fetchDependencies_2_total.increment({
                    status: 'success',
                    flow: getIsVpnB2BPlan(signupParameters.preSelectedPlan as PLANS) ? 'b2b' : 'b2c',
                });
            })
            .catch((error) => {
                observeApiError(error, (status) =>
                    metrics.core_vpn_single_signup_fetchDependencies_2_total.increment({
                        status,
                        flow: getIsVpnB2BPlan(signupParameters.preSelectedPlan as PLANS) ? 'b2b' : 'b2c',
                    })
                );
                setError(error);
            });
    }, []);

    const handleSetupNewUser = async (cache: SignupCacheResult): Promise<SignupCacheResult> => {
        const getTelemetryParams = () => {
            const subscriptionData = cache.subscriptionData;

            const method: PaymentProcessorType | 'n/a' = subscriptionData.payment?.paymentProcessorType ?? 'n/a';
            const plan = getPlanNameFromIDs(subscriptionData.planIDs);

            return {
                method,
                overrides: {
                    plan,
                    cycle: subscriptionData.cycle,
                    amount: subscriptionData.checkResult.AmountDue,
                },
            };
        };

        const [result] = await Promise.all([
            handleSetupUser({
                cache,
                api: silentApi,
                ignoreVPN: true,
                setupKeys: false,
                canGenerateMnemonic: false,
                telemetryContext,
                reportPaymentSuccess: () => {
                    const { method, overrides } = getTelemetryParams();
                    reportPaymentSuccess(method, overrides);
                },
                reportPaymentFailure: () => {
                    const { method, overrides } = getTelemetryParams();
                    reportPaymentFailure(method, overrides);
                },
            }),
            wait(3500),
        ]);

        const { subscription, userData } = result.cache;
        if (subscription && userData) {
            const planIDs = getPlanIDs(subscription);

            sendSignupSubscriptionTelemetryEvent({
                planIDs,
                flowId: 'single-page-signup-vpn',
                currency: subscription.Currency,
                cycle: subscription.Cycle,
                userCreateTime: userData.User.CreateTime,
                invoiceID: subscription.InvoiceID,
                coupon: subscription.CouponCode,
                amount: subscription.Amount,
            });
        }

        const signupFinishEvents = getSignupTelemetryData(model.plansMap, cache);
        if (signupFinishEvents.dimensions.type === 'free') {
            pushConvertGoal(['triggerConversion', '100464858']);
        } else {
            pushConvertGoal(['triggerConversion', '100464856']);
            pushConvertGoal([
                'pushRevenue',
                `${signupFinishEvents.values.amount_charged}`,
                `${signupFinishEvents.dimensions.plan}-${signupFinishEvents.dimensions.cycle}`,
                '100464860',
            ]);
        }

        void measure(signupFinishEvents);

        return result.cache;
    };

    if (error) {
        return <StandardLoadErrorPage errorMessage={error.message} />;
    }

    const cache = model.cache;

    const done = async (cache: (typeof model)['cache']) => {
        if (cache?.type !== 'signup') {
            throw new Error('wrong cache type');
        }

        const { session } = handleDone({ cache });

        metrics.core_vpn_single_signup_step4_setup_2_total.increment({
            status: 'success',
            flow: isB2bPlan ? 'b2b' : 'b2c',
        });

        await Promise.all([
            measure({
                event: TelemetryAccountSignupEvents.onboardFinish,
                dimensions: {},
            }),
            metrics.processAllRequests(),
        ]).catch(noop);

        await onLogin(session);
    };

    return (
        <>
            <link rel="prefetch" href={onboardingVPNWelcome} as="image" />
            <link rel="prefetch" href={onboardingVPNWelcome2} as="image" />
            <link rel="prefetch" href={vpnUpsellIllustration} as="image" />
            <UnAuthenticated>
                {model.step === Steps.Account &&
                    (isVariantB ? (
                        <Step1B
                            activeBreakpoint={activeBreakpoint}
                            mode={model.mode}
                            defaultEmail={signupParameters.email}
                            selectedPlan={selectedPlan}
                            cycleData={model.cycleData}
                            isB2bPlan={isB2bPlan}
                            background={background}
                            upsellShortPlan={upsellShortPlan}
                            model={model}
                            setModel={setModel}
                            measure={measure}
                            currencyUrlParam={signupParameters.currency}
                            onComplete={async (data) => {
                                const { accountData, subscriptionData } = data;
                                const accountType =
                                    accountData.signupType === SignupType.External
                                        ? 'external_account'
                                        : 'proton_account';
                                try {
                                    const cache: SignupCacheResult = {
                                        type: 'signup',
                                        appName: APP_NAME,
                                        appIntent: undefined,
                                        productParam,
                                        // Internal app or oauth app or vpn
                                        ignoreExplore: true,
                                        accountData,
                                        subscriptionData,
                                        inviteData: model.inviteData,
                                        referralData: model.referralData,
                                        persistent: false,
                                        trusted: false,
                                        clientType,
                                        ktActivation: await getKtActivation(),
                                    };

                                    await onPreSubmit?.();
                                    const result = await handleCreateUser({
                                        cache,
                                        api: silentApi,
                                        mode: 'cro',
                                    });
                                    setModelDiff({
                                        subscriptionData: result.cache.subscriptionData,
                                        cache: result.cache,
                                        step: Steps.Loading,
                                    });

                                    metrics.core_vpn_single_signup_step1_accountCreation_2_total.increment({
                                        status: 'success',
                                        account_type: accountType,
                                        flow: isB2bPlan ? 'b2b' : 'b2c',
                                    });
                                } catch (error) {
                                    handleError(error);
                                    observeApiError(error, (status) =>
                                        metrics.core_vpn_single_signup_step1_accountCreation_2_total.increment({
                                            status,
                                            account_type: accountType,
                                            flow: isB2bPlan ? 'b2b' : 'b2c',
                                        })
                                    );
                                }
                            }}
                            onCurrencyChange={updatePlans}
                            hideFreePlan={signupParameters.hideFreePlan}
                            upsellImg={<img src={vpnUpsellIllustration} alt={upsellShortPlan?.description || ''} />}
                            signupTrial={signupParameters.trial}
                            toAppName={toAppName}
                            couponUrlParam={signupParameters.coupon}
                            telemetryContext={telemetryContext}
                            toApp={toApp}
                        />
                    ) : (
                        <Step1
                            activeBreakpoint={activeBreakpoint}
                            mode={model.mode}
                            defaultEmail={signupParameters.email}
                            selectedPlan={selectedPlan}
                            cycleData={model.cycleData}
                            isB2bPlan={isB2bPlan}
                            background={background}
                            upsellShortPlan={upsellShortPlan}
                            model={model}
                            setModel={setModel}
                            measure={measure}
                            currencyUrlParam={signupParameters.currency}
                            signupTrial={signupParameters.trial}
                            onComplete={async (data) => {
                                const { accountData, subscriptionData } = data;
                                const accountType =
                                    accountData.signupType === SignupType.External
                                        ? 'external_account'
                                        : 'proton_account';
                                try {
                                    const cache: SignupCacheResult = {
                                        type: 'signup',
                                        appName: APP_NAME,
                                        appIntent: undefined,
                                        productParam,
                                        // Internal app or oauth app or vpn
                                        ignoreExplore: true,
                                        accountData,
                                        subscriptionData,
                                        inviteData: model.inviteData,
                                        referralData: model.referralData,
                                        persistent: false,
                                        trusted: false,
                                        clientType,
                                        ktActivation: await getKtActivation(),
                                    };

                                    await onPreSubmit?.();
                                    const result = await handleCreateUser({
                                        cache,
                                        api: silentApi,
                                        mode: 'cro',
                                    });
                                    setModelDiff({
                                        subscriptionData: result.cache.subscriptionData,
                                        cache: result.cache,
                                        step: Steps.Loading,
                                    });

                                    metrics.core_vpn_single_signup_step1_accountCreation_2_total.increment({
                                        status: 'success',
                                        account_type: accountType,
                                        flow: isB2bPlan ? 'b2b' : 'b2c',
                                    });
                                } catch (error) {
                                    handleError(error);
                                    observeApiError(error, (status) =>
                                        metrics.core_vpn_single_signup_step1_accountCreation_2_total.increment({
                                            status,
                                            account_type: accountType,
                                            flow: isB2bPlan ? 'b2b' : 'b2c',
                                        })
                                    );
                                }
                            }}
                            onCurrencyChange={updatePlans}
                            hideFreePlan={signupParameters.hideFreePlan}
                            upsellImg={<img src={vpnUpsellIllustration} alt={upsellShortPlan?.description || ''} />}
                            couponUrlParam={signupParameters.coupon}
                            telemetryContext={telemetryContext}
                            toApp={toApp}
                        />
                    ))}
                {model.step === Steps.Loading && (
                    <Step2
                        hasPayment={
                            hasPlanIDs(model.subscriptionData.planIDs) &&
                            model.subscriptionData.checkResult.AmountDue > 0
                        }
                        product={VPN_APP_NAME}
                        isB2bPlan={isB2bPlan}
                        background={background}
                        img={<img src={onboardingVPNWelcome} alt={getWelcomeToText(VPN_APP_NAME)} />}
                        onSetup={async () => {
                            if (!cache || cache.type !== 'signup') {
                                throw new Error('Missing cache');
                            }
                            const subscriptionMetricsData = getSubscriptionMetricsData(cache.subscriptionData);
                            try {
                                /**
                                 * Stop the metrics batching process. This prevents a race condition where
                                 * handleSetupUser sets an auth cookie before the metrics batch request
                                 */
                                metrics.stopBatchingProcess();

                                if (cache.type === 'signup') {
                                    const result = await handleSetupNewUser(cache);
                                    setModelDiff({
                                        cache: result,
                                        step: Steps.Custom,
                                    });

                                    metrics.core_vpn_single_signup_step2_setup_3_total.increment({
                                        status: 'success',
                                        ...subscriptionMetricsData,
                                        flow: isB2bPlan ? 'b2b' : 'b2c',
                                    });
                                }

                                sendSignupAccountCreationTelemetry({
                                    planIDs: cache.subscriptionData.planIDs,
                                    flowId: 'single-page-signup-vpn',
                                    productIntent: toApp,
                                    currency: cache.subscriptionData.currency,
                                    cycle: cache.subscriptionData.cycle,
                                    signupType: cache.accountData.signupType,
                                    amount: cache.subscriptionData.checkResult.AmountDue,
                                });
                            } catch (error: any) {
                                observeApiError(error, (status) =>
                                    metrics.core_vpn_single_signup_step2_setup_3_total.increment({
                                        status,
                                        ...subscriptionMetricsData,
                                        flow: isB2bPlan ? 'b2b' : 'b2c',
                                    })
                                );

                                if (error?.config?.url?.endsWith?.('keys/setup')) {
                                    captureMessage(`Signup setup failure`);
                                }

                                handleError(error);
                                setModelDiff({
                                    cache: undefined,
                                    step: Steps.Account,
                                });
                            } finally {
                                /**
                                 * Batch process can now resume since the auth cookie will have been set
                                 */
                                metrics.startBatchingProcess();
                            }
                        }}
                    />
                )}
                {model.step === Steps.Custom && cache?.type === 'signup' && (
                    <Step3
                        email={cache?.accountData.email || ''}
                        password={cache?.accountData.password || ''}
                        product={VPN_APP_NAME}
                        isB2bPlan={isB2bPlan}
                        background={background}
                        onComplete={async (newPassword: string) => {
                            if (!cache || cache.type !== 'signup') {
                                throw new Error('Missing cache');
                            }

                            let newCache = model.cache;

                            if (newPassword) {
                                try {
                                    const result = await handleSetPassword({
                                        cache,
                                        api: silentApi,
                                        newPassword,
                                    });
                                    newCache = result.cache;
                                } catch (error) {
                                    observeApiError(error, (status) =>
                                        metrics.core_vpn_single_signup_step3_complete_2_total.increment({
                                            status,
                                            flow: isB2bPlan ? 'b2b' : 'b2c',
                                        })
                                    );
                                    handleError(error);
                                    return;
                                }
                            }

                            metrics.core_vpn_single_signup_step3_complete_2_total.increment({
                                status: 'success',
                                flow: isB2bPlan ? 'b2b' : 'b2c',
                            });

                            const gotoB2bSetup = isB2bPlan && signupParameters.orgName;
                            if (gotoB2bSetup) {
                                setModelDiff({ cache: newCache, step: Steps.SetupOrg });
                            } else {
                                setModelDiff({ cache: newCache, step: Steps.Custom });
                                await done(newCache);
                            }
                        }}
                        measure={measure}
                    />
                )}
                {model.step === Steps.SetupOrg && (
                    <Step4
                        product={VPN_APP_NAME}
                        isB2bPlan={isB2bPlan}
                        background={background}
                        onSetup={async () => {
                            if (!cache || cache.type !== 'signup' || !cache.setupData?.api) {
                                throw new Error('Missing cache');
                            }

                            try {
                                const password = cache.accountData.password;
                                const user = cache.setupData.user;
                                const keyPassword = cache.setupData.session.keyPassword;
                                const orgName = signupParameters.orgName || '';

                                await handleSetupOrg({
                                    api: silentApi,
                                    password,
                                    keyPassword,
                                    orgName,
                                    user,
                                }).catch(noop);

                                metrics.core_vpn_single_signup_step4_orgSetup_total.increment({
                                    status: 'success',
                                    flow: isB2bPlan ? 'b2b' : 'b2c',
                                });
                            } catch (error) {
                                handleError(error);
                                observeApiError(error, (status) =>
                                    metrics.core_vpn_single_signup_step4_orgSetup_total.increment({
                                        status,
                                        flow: isB2bPlan ? 'b2b' : 'b2c',
                                    })
                                );
                            }

                            await done(cache);
                        }}
                    />
                )}
            </UnAuthenticated>
        </>
    );
};

export default SingleSignupContainer;
