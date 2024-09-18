import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import type { OnLoginCallback } from '@proton/components';
import {
    StandardLoadErrorPage,
    UnAuthenticated,
    useActiveBreakpoint,
    useApi,
    useConfig,
    useErrorHandler,
    useGetPaymentStatus,
    useGetPlans,
    useKTActivation,
} from '@proton/components';
import { startUnAuthFlow } from '@proton/components/containers/api/unAuthenticatedApi';
import { getIsVPNPassPromotion, getIsVpn2024Deal } from '@proton/components/containers/payments/subscription/helpers';
import { useCurrencies } from '@proton/components/payments/client-extensions/useCurrencies';
import { usePaymentsTelemetry } from '@proton/components/payments/client-extensions/usePaymentsTelemetry';
import type { PaymentProcessorType } from '@proton/components/payments/react-extensions/interface';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import { useLoading } from '@proton/hooks';
import metrics, { observeApiError } from '@proton/metrics';
import { getPlansMap, isMainCurrency } from '@proton/payments';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { TelemetryAccountSignupEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { getWelcomeToText } from '@proton/shared/lib/apps/text';
import type { APP_NAMES, CLIENT_TYPES } from '@proton/shared/lib/constants';
import { CURRENCIES, CYCLE, PLANS, VPN_APP_NAME } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { getPlanFromPlanIDs, getPlanNameFromIDs, hasPlanIDs } from '@proton/shared/lib/helpers/planIDs';
import { wait } from '@proton/shared/lib/helpers/promise';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { getHas2023OfferCoupon, getIsVpnB2BPlan } from '@proton/shared/lib/helpers/subscription';
import type { Currency, Plan } from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';
import { getVPNServersCountData } from '@proton/shared/lib/vpn/serversCount';
import onboardingVPNWelcome from '@proton/styles/assets/img/onboarding/vpn-welcome.svg';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';
import unique from '@proton/utils/unique';

import type { SignupCacheResult, SubscriptionData } from '../signup/interfaces';
import { SignupType } from '../signup/interfaces';
import { getPlanIDsFromParams, getSignupSearchParams } from '../signup/searchParams';
import {
    getSubscriptionMetricsData,
    handleDone,
    handleSetPassword,
    handleSetupOrg,
    handleSetupUser,
} from '../signup/signupActions';
import { handleCreateUser } from '../signup/signupActions/handleCreateUser';
import type { SubscriptionDataCycleMapping } from '../single-signup-v2/helper';
import { getPlanCardSubscriptionData, swapCurrency } from '../single-signup-v2/helper';
import type { SignupDefaults, SubscriptionDataCycleMappingByCurrency } from '../single-signup-v2/interface';
import { Steps } from '../single-signup-v2/interface';
import { getPaymentMethodsAvailable, getSignupTelemetryData } from '../single-signup-v2/measure';
import useLocationWithoutLocale from '../useLocationWithoutLocale';
import type { MetaTags } from '../useMetaTags';
import { useMetaTags } from '../useMetaTags';
import Step1 from './Step1';
import Step2 from './Step2';
import Step3 from './Step3';
import Step4 from './Step4';
import { pushConvertGoal } from './convert';
import { getUpsellShortPlan } from './helper';
import onboardingVPNWelcome2 from './illustration.svg';
import type { VPNSignupModel } from './interface';
import type { TelemetryMeasurementData } from './measure';
import { defaultVPNSignupModel, getCycleData } from './state';
import vpnUpsellIllustration from './vpn-upsell-illustration.svg';

interface Props {
    loader: ReactNode;
    onLogin: OnLoginCallback;
    productParam: ProductParam;
    toApp?: APP_NAMES;
    toAppName?: string;
    onBack?: () => void;
    clientType: CLIENT_TYPES;
    metaTags: MetaTags;
}

const SingleSignupContainer = ({ metaTags, clientType, loader, onLogin, productParam }: Props) => {
    const ktActivation = useKTActivation();
    const unauthApi = useApi();
    const silentApi = getSilentApi(unauthApi);
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

    const { getPreferredCurrency } = useCurrencies('vpn');

    useMetaTags(metaTags);

    const [loadingDependencies, withLoadingDependencies] = useLoading(true);
    const [loadingChallenge, setLoadingChallenge] = useState(true);

    const getSearchParams = () => {
        return new URLSearchParams(location.search);
    };

    const getSignupMode = (coupon: string | undefined, currency: Currency | undefined) => {
        const searchParams = getSearchParams();

        if (searchParams?.get('plan') && (searchParams?.get('cycle') || searchParams?.get('billing'))) {
            return 'signup' as const;
        }

        if (getIsVPNPassPromotion(coupon, currency)) {
            return 'vpn-pass-promotion' as const;
        }

        return 'pricing' as const;
    };

    const [signupParameters, setSignupParameters] = useState(() => {
        const result = getSignupSearchParams(location.pathname, getSearchParams());

        const validValues = [
            'free',
            PLANS.BUNDLE,
            PLANS.VPN,
            PLANS.VPN2024,
            PLANS.VPN_PRO,
            PLANS.VPN_PASS_BUNDLE,
            PLANS.VPN_BUSINESS,
        ];
        if (result.preSelectedPlan && !validValues.includes(result.preSelectedPlan)) {
            delete result.preSelectedPlan;
        }

        return { ...result, mode: 'signup' as ReturnType<typeof getSignupMode> };
    });

    const setMode = (mode: ReturnType<typeof getSignupMode>) => {
        setSignupParameters((params) => ({
            ...params,
            mode,
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
                flow: signupParameters.mode === 'signup' ? 'vpn_signup_2step' : 'vpn_signup_3step',
            },
            values,
        }).catch(noop);
    };

    const [model, setModel] = useState<VPNSignupModel>(defaultVPNSignupModel);

    const setModelDiff = (diff: Partial<VPNSignupModel>) => {
        return setModel((model) => ({
            ...model,
            ...diff,
        }));
    };

    const vpnServersCountData = model.vpnServersCountData;
    const selectedPlan = getPlanFromPlanIDs(model.plansMap, model.subscriptionData.planIDs) || FREE_PLAN;
    const upsellShortPlan = getUpsellShortPlan(model.plansMap[PLANS.VPN], vpnServersCountData);

    const isB2bPlan = getIsVpnB2BPlan(selectedPlan?.Name as PLANS);
    const background = (() => {
        if (isB2bPlan) {
            return 'dark';
        }

        if (getHas2023OfferCoupon(signupParameters.coupon)) {
            return 'bf2023';
        }
    })();

    const checkPlans = async (
        plans: Plan[],
        preferredCurrency: Currency,
        subscriptionDataCycleMappingByCurrency: SubscriptionDataCycleMappingByCurrency,
        withModel = false
    ) => {
        const vpnPlanName = PLANS.VPN2024;

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

        const selectedPlanCurrency = plan.Currency;

        const plansMap = getPlansMap(plans, selectedPlanCurrency, true);

        const modelCycle = withModel ? model.subscriptionData.cycle : undefined;
        const cycle = modelCycle || signupParameters.cycle || defaults.cycle;

        const isVpnPassPromotion = getIsVPNPassPromotion(coupon, selectedPlanCurrency);

        const getSubscriptionDataCycleMapping = async () => {
            const originalCoupon = coupon;

            // Remove this coupon since it's only valid for VPN+Pass bundle 12M
            if (isVpnPassPromotion) {
                coupon = undefined;
            }

            const sharedOptions = {
                plansMap,
                paymentsApi,
                billingAddress: model.subscriptionData.billingAddress,
            };

            const subscriptionDataCycleMappingPromise = getPlanCardSubscriptionData({
                ...sharedOptions,
                planIDs: [planIDs, !planIDs[vpnPlanName] ? { [vpnPlanName]: 1 } : undefined].filter(isTruthy),
                cycles: unique([cycle, ...cycleData.cycles]),
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

        const updatedSubscriptionDataCycleMappingByCurrency = [...subscriptionDataCycleMappingByCurrency];
        const subscriptionDataCycleMapping = await (async () => {
            const savedMapping = subscriptionDataCycleMappingByCurrency.find(
                (it) => it.currency === selectedPlanCurrency
            );
            if (savedMapping) {
                return savedMapping.mapping;
            }

            const result = await getSubscriptionDataCycleMapping();

            updatedSubscriptionDataCycleMappingByCurrency.push({
                currency: selectedPlanCurrency,
                mapping: result,
            });

            if (isMainCurrency(selectedPlanCurrency)) {
                const otherMissingMainCurrencies = CURRENCIES.filter(
                    (currency) => isMainCurrency(currency) && currency !== selectedPlanCurrency
                );

                for (const mainCurrency of otherMissingMainCurrencies) {
                    updatedSubscriptionDataCycleMappingByCurrency.push({
                        currency: mainCurrency,
                        mapping: swapCurrency(result, mainCurrency),
                    });
                }
            }

            return result;
        })();

        const subscriptionData = (() => {
            if (
                cycle === CYCLE.YEARLY &&
                isVpnPassPromotion &&
                subscriptionDataCycleMapping[PLANS.VPN_PASS_BUNDLE]?.[cycle]
            ) {
                return subscriptionDataCycleMapping[PLANS.VPN_PASS_BUNDLE]?.[CYCLE.YEARLY];
            }
            return (
                subscriptionDataCycleMapping[plan.Name as PLANS]?.[cycle] ||
                subscriptionDataCycleMapping[vpnPlanName]?.[cycleData.upsellCycle]
            );
        })();

        const selectedPlan = getPlanFromPlanIDs(plansMap, subscriptionData?.planIDs) || FREE_PLAN;

        return {
            plansMap,
            subscriptionData,
            cycleData,
            subscriptionDataCycleMapping,
            coupon,
            selectedPlan,
            updatedSubscriptionDataCycleMappingByCurrency,
        };
    };

    const getSignupType = (
        selectedPlan: Plan,
        subscriptionData: SubscriptionData | undefined,
        coupon: string | undefined
    ) => {
        return getIsVpn2024Deal(selectedPlan.Name as PLANS, subscriptionData?.checkResult.Coupon?.Code || coupon)
            ? 'vpn2024'
            : 'default';
    };

    const updatePlans = async (currency: Currency) => {
        const plansResult = await getPlans({ api: silentApi });
        const plans = plansResult.plans;

        const preferredCurrency = getPreferredCurrency({
            paramCurrency: currency,
            status: model.paymentMethodStatusExtended,
            plans: plans,
        });

        const {
            plansMap,
            subscriptionData,
            cycleData,
            subscriptionDataCycleMapping,
            coupon,
            selectedPlan,
            updatedSubscriptionDataCycleMappingByCurrency,
        } = await checkPlans(plans, preferredCurrency, model.subscriptionDataCycleMappingByCurrency, true);

        updateMode(preferredCurrency);

        setModelDiff({
            plans,
            plansMap,
            subscriptionData,
            cycleData,
            subscriptionDataCycleMapping,
            subscriptionDataCycleMappingByCurrency: updatedSubscriptionDataCycleMappingByCurrency,
            signupType: getSignupType(selectedPlan, subscriptionData, coupon),
        });
    };

    useEffect(() => {
        const fetchDependencies = async () => {
            await startUnAuthFlow().catch(noop);

            void getVPNServersCountData(silentApi).then((vpnServersCountData) => setModelDiff({ vpnServersCountData }));

            const [{ Domains: domains }, { plans, freePlan }] = await Promise.all([
                silentApi<{ Domains: string[] }>(queryAvailableDomains('signup')),
                getPlans({ api: silentApi }),
            ]);

            const paymentMethodStatusExtended = await getPaymentStatus({ api: silentApi });

            void measure({
                event: TelemetryAccountSignupEvents.pageLoad,
                dimensions: {},
            });
            void measure({
                event: TelemetryAccountSignupEvents.bePaymentMethods,
                dimensions: getPaymentMethodsAvailable(paymentMethodStatusExtended.VendorStates),
            });

            const preferredCurrency = getPreferredCurrency({
                status: paymentMethodStatusExtended,
                plans,
                paramCurrency: signupParameters.currency,
                paramPlanName: signupParameters.preSelectedPlan,
            });

            const mode = getSignupMode(signupParameters.coupon, preferredCurrency);
            setMode(mode);

            const {
                plansMap,
                subscriptionData,
                cycleData,
                subscriptionDataCycleMapping,
                coupon,
                selectedPlan,
                updatedSubscriptionDataCycleMappingByCurrency,
            } = await checkPlans(plans, preferredCurrency, model.subscriptionDataCycleMappingByCurrency);

            setModelDiff({
                domains,
                plans,
                freePlan,
                plansMap,
                paymentMethodStatusExtended,
                subscriptionData,
                subscriptionDataCycleMapping,
                subscriptionDataCycleMappingByCurrency: updatedSubscriptionDataCycleMappingByCurrency,
                cycleData,
                signupType: getSignupType(selectedPlan, subscriptionData, coupon),
            });
        };

        void withLoadingDependencies(
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
                })
        );
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

    const loading = loadingDependencies || loadingChallenge;

    return (
        <>
            <link rel="prefetch" href={onboardingVPNWelcome} as="image" />
            <link rel="prefetch" href={onboardingVPNWelcome2} as="image" />
            <link rel="prefetch" href={vpnUpsellIllustration} as="image" />
            {loading && <>{loader}</>}
            <UnAuthenticated>
                {model.step === Steps.Account && (
                    <Step1
                        activeBreakpoint={activeBreakpoint}
                        mode={signupParameters.mode}
                        defaultEmail={signupParameters.email}
                        className={loading ? 'visibility-hidden' : undefined}
                        loading={loading}
                        selectedPlan={selectedPlan}
                        cycleData={model.cycleData}
                        isVpn2024Deal={model.signupType === 'vpn2024'}
                        isB2bPlan={isB2bPlan}
                        background={background}
                        vpnServersCountData={vpnServersCountData}
                        upsellShortPlan={upsellShortPlan}
                        model={model}
                        setModel={setModel}
                        measure={measure}
                        currencyUrlParam={signupParameters.currency}
                        onChallengeError={() => {
                            setError(new Error('Challenge error'));
                        }}
                        onChallengeLoaded={() => {
                            setLoadingChallenge(false);
                        }}
                        onComplete={async (data) => {
                            const { accountData, subscriptionData } = data;
                            const accountType =
                                accountData.signupType === SignupType.Email ? 'external_account' : 'proton_account';
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
                                    ktActivation,
                                };

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
                    />
                )}
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
                        onComplete={async (newPassword: string | undefined) => {
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
                                const keyPassword = cache.setupData.keyPassword || '';
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
