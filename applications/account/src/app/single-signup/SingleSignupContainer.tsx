import { ReactNode, useEffect, useState } from 'react';

import {
    OnLoginCallback,
    StandardLoadErrorPage,
    UnAuthenticated,
    useActiveBreakpoint,
    useApi,
    useConfig,
    useErrorHandler,
} from '@proton/components';
import { startUnAuthFlow } from '@proton/components/containers/api/unAuthenticatedApi';
import useKTActivation from '@proton/components/containers/keyTransparency/useKTActivation';
import { DEFAULT_TAX_BILLING_ADDRESS } from '@proton/components/containers/payments/TaxCountrySelector';
import { getIsVpn2024Deal } from '@proton/components/containers/payments/subscription/helpers';
import { usePaymentsTelemetry } from '@proton/components/payments/client-extensions/usePaymentsTelemetry';
import { PaymentProcessorType } from '@proton/components/payments/react-extensions/interface';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import { useLoading } from '@proton/hooks';
import metrics, { observeApiError } from '@proton/metrics';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getFreePlan, queryPlans } from '@proton/shared/lib/api/payments';
import { TelemetryAccountSignupEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { ProductParam } from '@proton/shared/lib/apps/product';
import { getWelcomeToText } from '@proton/shared/lib/apps/text';
import { APP_NAMES, CLIENT_TYPES, DEFAULT_CURRENCY, PLANS, VPN_APP_NAME } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { toMap } from '@proton/shared/lib/helpers/object';
import { getPlanFromPlanIDs, hasPlanIDs } from '@proton/shared/lib/helpers/planIDs';
import { wait } from '@proton/shared/lib/helpers/promise';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { getHas2023OfferCoupon, getIsVpnB2BPlan, getPlanNameFromIDs } from '@proton/shared/lib/helpers/subscription';
import { Plan, PlansMap } from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';
import { getVPNServersCountData } from '@proton/shared/lib/vpn/serversCount';
import onboardingVPNWelcome from '@proton/styles/assets/img/onboarding/vpn-welcome.svg';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';
import unique from '@proton/utils/unique';

import { SignupCacheResult, SignupType } from '../signup/interfaces';
import { getPlanIDsFromParams, getSignupSearchParams } from '../signup/searchParams';
import {
    getSubscriptionMetricsData,
    handleDone,
    handleSetPassword,
    handleSetupOrg,
    handleSetupUser,
} from '../signup/signupActions';
import { handleCreateUser } from '../signup/signupActions/handleCreateUser';
import { getPlanCardSubscriptionData } from '../single-signup-v2/helper';
import { SignupDefaults, Steps } from '../single-signup-v2/interface';
import { getPaymentMethodsAvailable, getSignupTelemetryData } from '../single-signup-v2/measure';
import useLocationWithoutLocale from '../useLocationWithoutLocale';
import { MetaTags, useMetaTags } from '../useMetaTags';
import Step1 from './Step1';
import Step2 from './Step2';
import Step3 from './Step3';
import Step4 from './Step4';
import { getUpsellShortPlan } from './helper';
import onboardingVPNWelcome2 from './illustration.svg';
import { VPNSignupModel } from './interface';
import { TelemetryMeasurementData } from './measure';
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
    const { reportPaymentSuccess, reportPaymentFailure } = usePaymentsTelemetry({
        flow: 'signup-vpn',
    });
    const activeBreakpoint = useActiveBreakpoint();

    useMetaTags(metaTags);

    const [loadingDependencies, withLoadingDependencies] = useLoading(true);
    const [loadingChallenge, setLoadingChallenge] = useState(true);

    const [signupParameters] = useState(() => {
        const searchParams = new URLSearchParams(location.search);
        const result = getSignupSearchParams(location.pathname, searchParams);

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

        return {
            ...result,
            mode:
                searchParams.get('plan') && (searchParams.get('cycle') || searchParams.get('billing'))
                    ? ('signup' as const)
                    : ('pricing' as const),
        };
    });

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

    useEffect(() => {
        const fetchDependencies = async () => {
            await startUnAuthFlow().catch(noop);

            void getVPNServersCountData(silentApi).then((vpnServersCountData) => setModelDiff({ vpnServersCountData }));

            const [{ Domains: domains }, paymentMethodStatusExtended, Plans, freePlan] = await Promise.all([
                silentApi<{ Domains: string[] }>(queryAvailableDomains('signup')),
                paymentsApi.statusExtendedAutomatic(),
                silentApi<{ Plans: Plan[] }>(
                    queryPlans(
                        signupParameters.currency
                            ? {
                                  Currency: signupParameters.currency,
                              }
                            : undefined
                    )
                ).then(({ Plans }) => Plans),
                getFreePlan({ api: silentApi }),
            ]);

            const plansMap = toMap(Plans, 'Name') as PlansMap;
            const vpnPlanName = PLANS.VPN2024;

            const coupon = signupParameters.coupon;

            const cycleData = getCycleData({
                plan: vpnPlanName,
                coupon,
            });

            const defaults: SignupDefaults = {
                plan: vpnPlanName,
                cycle: cycleData.upsellCycle,
            };

            const cycle = signupParameters.cycle || defaults.cycle;
            const currency = signupParameters.currency || Plans?.[0]?.Currency || DEFAULT_CURRENCY;
            const { plan, planIDs } = getPlanIDsFromParams(Plans, signupParameters, defaults) || {};
            const subscriptionDataCycleMapping = await getPlanCardSubscriptionData({
                plansMap,
                planIDs: [planIDs, !planIDs[vpnPlanName] ? { [vpnPlanName]: 1 } : undefined].filter(isTruthy),
                cycles: unique([cycle, ...cycleData.cycles]),
                paymentsApi,
                currency,
                coupon,
                billingAddress: DEFAULT_TAX_BILLING_ADDRESS,
            });

            void measure({
                event: TelemetryAccountSignupEvents.pageLoad,
                dimensions: {},
            });
            void measure({
                event: TelemetryAccountSignupEvents.bePaymentMethods,
                dimensions: getPaymentMethodsAvailable(paymentMethodStatusExtended.VendorStates),
            });

            // Disable bitcoin in this signup because it doesn't handle signed in state
            paymentMethodStatusExtended.VendorStates.Bitcoin = false;

            const subscriptionData =
                subscriptionDataCycleMapping[plan.Name as PLANS]?.[cycle] ||
                subscriptionDataCycleMapping[vpnPlanName]?.[cycleData.upsellCycle];

            const selectedPlan = getPlanFromPlanIDs(plansMap, subscriptionData?.planIDs) || FREE_PLAN;

            setModelDiff({
                domains,
                plans: Plans,
                freePlan,
                plansMap,
                paymentMethodStatusExtended,
                subscriptionData,
                subscriptionDataCycleMapping,
                cycleData,
                signupType: getIsVpn2024Deal(
                    selectedPlan.Name as PLANS,
                    subscriptionData?.checkResult.Coupon?.Code || coupon
                )
                    ? 'vpn2024'
                    : 'default',
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

        void measure(getSignupTelemetryData(model.plansMap, cache));

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
