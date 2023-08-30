import { ReactNode, useEffect, useState } from 'react';

import { c } from 'ttag';

import {
    OnLoginCallback,
    StandardLoadErrorPage,
    UnAuthenticated,
    useApi,
    useConfig,
    useErrorHandler,
    useVPNServersCount,
} from '@proton/components';
import { startUnAuthFlow } from '@proton/components/containers/api/unAuthenticatedApi';
import useKTActivation from '@proton/components/containers/keyTransparency/useKTActivation';
import { PaymentMethodStatus } from '@proton/components/payments/core';
import { useLoading } from '@proton/hooks';
import metrics, { observeApiError } from '@proton/metrics';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { queryPaymentMethodStatus, queryPlans } from '@proton/shared/lib/api/payments';
import { TelemetryAccountSignupEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { ProductParam } from '@proton/shared/lib/apps/product';
import { APP_NAMES, CLIENT_TYPES, CYCLE, DEFAULT_CURRENCY, PLANS, VPN_APP_NAME } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { toMap } from '@proton/shared/lib/helpers/object';
import { hasPlanIDs } from '@proton/shared/lib/helpers/planIDs';
import { wait } from '@proton/shared/lib/helpers/promise';
import { getIsVpnB2BPlan, getNormalCycleFromCustomCycle } from '@proton/shared/lib/helpers/subscription';
import { Api, Cycle, CycleMapping, Plan, PlansMap } from '@proton/shared/lib/interfaces';
import { FREE_PLAN, getFreeCheckResult } from '@proton/shared/lib/subscription/freePlans';
import onboardingVPNWelcome from '@proton/styles/assets/img/onboarding/vpn-welcome.svg';
import noop from '@proton/utils/noop';

import { getPlanFromPlanIDs, getSubscriptionPrices } from '../signup/helper';
import { SignupCacheResult, SignupType, SubscriptionData } from '../signup/interfaces';
import { SignupParameters, getPlanIDsFromParams, getSignupSearchParams } from '../signup/searchParams';
import {
    getSubscriptionMetricsData,
    handleDone,
    handleSetPassword,
    handleSetupOrg,
    handleSetupUser,
} from '../signup/signupActions';
import { handleCreateUser } from '../signup/signupActions/handleCreateUser';
import { defaultSignupModel } from '../single-signup-v2/SingleSignupContainerV2';
import { SignupModelV2, Steps } from '../single-signup-v2/interface';
import { getPaymentMethodsAvailable, getSignupTelemetryData } from '../single-signup-v2/measure';
import useLocationWithoutLocale from '../useLocationWithoutLocale';
import { MetaTags, useMetaTags } from '../useMetaTags';
import Step1 from './Step1';
import Step2 from './Step2';
import Step3 from './Step3';
import Step4 from './Step4';
import { getUpsellShortPlan } from './helper';
import onboardingVPNWelcome2 from './illustration.svg';
import { TelemetryMeasurementData } from './measure';
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
    const { APP_NAME } = useConfig();
    const [error, setError] = useState<any>();
    const [vpnServersCountData] = useVPNServersCount();
    const handleError = useErrorHandler();
    const location = useLocationWithoutLocale();

    useMetaTags(metaTags);

    const [loadingDependencies, withLoadingDependencies] = useLoading(true);
    const [loadingChallenge, setLoadingChallenge] = useState(true);

    const [signupParameters] = useState(() => {
        const searchParams = new URLSearchParams(location.search);
        const result = getSignupSearchParams(location.pathname, searchParams, {
            preSelectedPlan: PLANS.VPN,
        });

        const validValues = ['free', PLANS.BUNDLE, PLANS.VPN, PLANS.VPN_PRO, PLANS.VPN_BUSINESS];
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

    const [model, setModel] = useState<SignupModelV2>(defaultSignupModel);

    const setModelDiff = (diff: Partial<SignupModelV2>) => {
        return setModel((model) => ({
            ...model,
            ...diff,
        }));
    };

    const selectedPlan = getPlanFromPlanIDs(model.plans, model.subscriptionData.planIDs) || FREE_PLAN;
    const upsellShortPlan = getUpsellShortPlan(selectedPlan, vpnServersCountData);

    const isB2bPlan = getIsVpnB2BPlan(selectedPlan?.Name as PLANS);
    const isDarkBg = isB2bPlan;

    useEffect(() => {
        const getSubscriptionData = async (
            api: Api,
            plans: Plan[],
            signupParameters: SignupParameters,
            cycle: Cycle
        ): Promise<SubscriptionData> => {
            const prePlanIDs = getPlanIDsFromParams(plans, signupParameters);
            const currency = signupParameters.currency || plans?.[0]?.Currency || DEFAULT_CURRENCY;
            const { planIDs, checkResult } = await getSubscriptionPrices(
                api,
                prePlanIDs || {},
                currency,
                cycle,
                signupParameters.coupon
            )
                .then((checkResult) => {
                    return {
                        checkResult,
                        planIDs: prePlanIDs,
                    };
                })
                .catch(() => {
                    // If the check call fails, just reset everything
                    return {
                        checkResult: getFreeCheckResult(
                            signupParameters.currency,
                            // "Reset" the cycle because the custom cycles are only valid with a coupon
                            getNormalCycleFromCustomCycle(cycle)
                        ),
                        planIDs: undefined,
                    };
                });
            return {
                cycle: checkResult.Cycle,
                minimumCycle: signupParameters.minimumCycle,
                currency: checkResult.Currency,
                checkResult,
                planIDs: planIDs || {},
                skipUpsell: !!planIDs,
            };
        };

        const getInitialSubscriptionDataForAllCycles = async (Plans: Plan[]) => {
            const [subscriptionDataMonthly, subscriptionDataYearly, subscriptionDataTwoYears] = await Promise.all(
                [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS].map((cycle) =>
                    getSubscriptionData(silentApi, Plans, signupParameters, cycle)
                )
            );

            const subscriptionDataCycleMapping: CycleMapping<SubscriptionData> = {
                [CYCLE.MONTHLY]: subscriptionDataMonthly,
                [CYCLE.YEARLY]: subscriptionDataYearly,
                [CYCLE.TWO_YEARS]: subscriptionDataTwoYears,
            };

            const subscriptionData: SubscriptionData =
                subscriptionDataCycleMapping[signupParameters.cycle] ?? subscriptionDataCycleMapping[CYCLE.TWO_YEARS];

            return {
                subscriptionData,
                subscriptionDataCycleMapping,
            };
        };

        const fetchDependencies = async () => {
            await startUnAuthFlow().catch(noop);

            const [{ Domains: domains }, paymentMethodStatus, Plans] = await Promise.all([
                silentApi<{ Domains: string[] }>(queryAvailableDomains('signup')),
                silentApi<PaymentMethodStatus>(queryPaymentMethodStatus()),
                silentApi<{ Plans: Plan[] }>(
                    queryPlans(
                        signupParameters.currency
                            ? {
                                  Currency: signupParameters.currency,
                              }
                            : undefined
                    )
                ).then(({ Plans }) => Plans),
            ]);

            const updatedPlans = Plans.map((Plan) => {
                if (Plan.Name === PLANS.VPN) {
                    return {
                        ...Plan,
                        Pricing: {
                            ...Plan.Pricing,
                            [CYCLE.MONTHLY]: 1149,
                        },
                    };
                }
                return Plan;
            });

            const { subscriptionData, subscriptionDataCycleMapping } = await getInitialSubscriptionDataForAllCycles(
                updatedPlans
            );
            const plansMap = toMap(updatedPlans, 'Name') as PlansMap;

            void measure({
                event: TelemetryAccountSignupEvents.pageLoad,
                dimensions: {},
            });
            void measure({
                event: TelemetryAccountSignupEvents.bePaymentMethods,
                dimensions: getPaymentMethodsAvailable(paymentMethodStatus),
            });

            // Disable bitcoin in this signup because it doesn't handle signed in state
            paymentMethodStatus.Bitcoin = false;

            setModelDiff({
                domains,
                plans: updatedPlans,
                plansMap,
                paymentMethodStatus,
                subscriptionData,
                subscriptionDataCycleMapping,
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
        const [result] = await Promise.all([
            handleSetupUser({
                cache,
                api: silentApi,
                ignoreVPN: true,
            }),
            wait(3500),
        ]);

        void measure(getSignupTelemetryData(model.plans, cache));

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
                        mode={signupParameters.mode}
                        defaultEmail={signupParameters.email}
                        className={loading ? 'visibility-hidden' : undefined}
                        loading={loading}
                        selectedPlan={selectedPlan}
                        isB2bPlan={isB2bPlan}
                        isDarkBg={isDarkBg}
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

                                const result = await handleCreateUser({ cache, api: silentApi, mode: 'cro' });
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
                        isDarkBg={isDarkBg}
                        img={<img src={onboardingVPNWelcome} alt={c('Onboarding').t`Welcome to ${VPN_APP_NAME}`} />}
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
                            } catch (error) {
                                observeApiError(error, (status) =>
                                    metrics.core_vpn_single_signup_step2_setup_3_total.increment({
                                        status,
                                        ...subscriptionMetricsData,
                                        flow: isB2bPlan ? 'b2b' : 'b2c',
                                    })
                                );

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
                        isDarkBg={isDarkBg}
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
                        isDarkBg={isDarkBg}
                        onSetup={async () => {
                            if (!cache || cache.type !== 'signup') {
                                throw new Error('Missing cache');
                            }

                            try {
                                const password = cache.accountData.password;
                                const keyPassword = cache.setupData?.keyPassword || '';
                                const orgName = signupParameters.orgName || '';

                                await handleSetupOrg({ api: silentApi, password, keyPassword, orgName }).catch(noop);

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
