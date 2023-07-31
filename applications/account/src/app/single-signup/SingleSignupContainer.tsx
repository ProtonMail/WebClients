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
import { APP_NAMES, CLIENT_TYPES, DEFAULT_CURRENCY, PLANS, VPN_APP_NAME } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { toMap } from '@proton/shared/lib/helpers/object';
import { wait } from '@proton/shared/lib/helpers/promise';
import { getNormalCycleFromCustomCycle } from '@proton/shared/lib/helpers/subscription';
import { Api, Plan, PlansMap } from '@proton/shared/lib/interfaces';
import { FREE_PLAN, getFreeCheckResult } from '@proton/shared/lib/subscription/freePlans';
import onboardingVPNWelcome from '@proton/styles/assets/img/onboarding/vpn-welcome.svg';
import noop from '@proton/utils/noop';

import { getPlanFromPlanIDs, getSubscriptionPrices } from '../signup/helper';
import { SignupCacheResult, SignupType, SubscriptionData } from '../signup/interfaces';
import { SignupParameters, getPlanIDsFromParams, getSignupSearchParams } from '../signup/searchParams';
import { getSubscriptionMetricsData, handleDone, handleSetPassword, handleSetupUser } from '../signup/signupActions';
import { handleCreateUser } from '../signup/signupActions/handleCreateUser';
import { defaultSignupModel } from '../single-signup-v2/SingleSignupContainerV2';
import { SignupModelV2, Steps } from '../single-signup-v2/interface';
import { getPaymentMethodsAvailable, getSignupTelemetryData } from '../single-signup-v2/measure';
import useLocationWithoutLocale from '../useLocationWithoutLocale';
import { MetaTags, useMetaTags } from '../useMetaTags';
import Step1 from './Step1';
import Step2 from './Step2';
import Step3 from './Step3';
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

        const validValues = ['free', PLANS.BUNDLE, PLANS.VPN];
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

    useEffect(() => {
        const getSubscriptionData = async (
            api: Api,
            plans: Plan[],
            signupParameters: SignupParameters
        ): Promise<SubscriptionData> => {
            const prePlanIDs = getPlanIDsFromParams(plans, signupParameters);
            const currency = signupParameters.currency || plans?.[0]?.Currency || DEFAULT_CURRENCY;
            const { planIDs, checkResult } = await getSubscriptionPrices(
                api,
                prePlanIDs || {},
                currency,
                signupParameters.cycle,
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
                            getNormalCycleFromCustomCycle(signupParameters.cycle)
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

            const subscriptionData = await getSubscriptionData(silentApi, Plans, signupParameters);
            const plansMap = toMap(Plans, 'Name') as PlansMap;

            measure({
                event: TelemetryAccountSignupEvents.pageLoad,
                dimensions: {},
            });
            measure({
                event: TelemetryAccountSignupEvents.bePaymentMethods,
                dimensions: getPaymentMethodsAvailable(paymentMethodStatus),
            });

            // Disable bitcoin in this signup because it doesn't handle signed in state
            paymentMethodStatus.Bitcoin = false;

            setModelDiff({
                domains,
                plans: Plans,
                plansMap,
                paymentMethodStatus,
                subscriptionData,
            });
        };

        void withLoadingDependencies(
            fetchDependencies()
                .then(() => {
                    metrics.core_vpn_single_signup_fetchDependencies_total.increment({ status: 'success' });
                })
                .catch((error) => {
                    observeApiError(error, (status) =>
                        metrics.core_vpn_single_signup_fetchDependencies_total.increment({ status })
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

        measure(getSignupTelemetryData(model.plans, cache));

        return result.cache;
    };

    if (error) {
        return <StandardLoadErrorPage errorMessage={error.message} />;
    }

    const cache = model.cache;

    return (
        <>
            <link rel="prefetch" href={onboardingVPNWelcome} as="image" />
            <link rel="prefetch" href={onboardingVPNWelcome2} as="image" />
            <link rel="prefetch" href={vpnUpsellIllustration} as="image" />
            {(loadingDependencies || loadingChallenge) && <>{loader}</>}
            <UnAuthenticated>
                {model.step === Steps.Account && (
                    <Step1
                        mode={signupParameters.mode}
                        className={loadingDependencies || loadingChallenge ? 'visibility-hidden' : undefined}
                        selectedPlan={selectedPlan}
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

                                metrics.core_vpn_single_signup_step1_accountCreation_total.increment({
                                    status: 'success',
                                    account_type: accountType,
                                });
                            } catch (error) {
                                handleError(error);
                                observeApiError(error, (status) =>
                                    metrics.core_vpn_single_signup_step1_accountCreation_total.increment({
                                        status,
                                        account_type: accountType,
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
                        product={VPN_APP_NAME}
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

                                    metrics.core_vpn_single_signup_step2_setup_2_total.increment({
                                        status: 'success',
                                        ...subscriptionMetricsData,
                                    });
                                }
                            } catch (error) {
                                observeApiError(error, (status) =>
                                    metrics.core_vpn_single_signup_step2_setup_2_total.increment({
                                        status,
                                        ...subscriptionMetricsData,
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
                        onComplete={async (newPassword: string | undefined) => {
                            if (!cache || cache.type !== 'signup') {
                                throw new Error('Missing cache');
                            }
                            const done = async (cache: (typeof model)['cache']) => {
                                if (cache?.type !== 'signup') {
                                    throw new Error('wrong cache type');
                                }
                                const [result] = await Promise.all([await handleDone({ cache })]);

                                metrics.core_vpn_single_signup_step4_setup_total.increment({
                                    status: 'success',
                                });

                                await Promise.all([
                                    measure({
                                        event: TelemetryAccountSignupEvents.onboardFinish,
                                        dimensions: {},
                                    }),
                                    metrics.processAllRequests(),
                                ]);

                                await onLogin(result.session);
                            };
                            if (newPassword) {
                                try {
                                    const result = await handleSetPassword({
                                        cache,
                                        api: silentApi,
                                        newPassword,
                                    });
                                    setModelDiff({ cache: result.cache, step: Steps.Custom });
                                    metrics.core_vpn_single_signup_step3_complete_total.increment({
                                        status: 'success',
                                    });
                                    await done(result.cache);
                                } catch (error) {
                                    observeApiError(error, (status) =>
                                        metrics.core_vpn_single_signup_step3_complete_total.increment({ status })
                                    );

                                    handleError(error);
                                }
                            } else {
                                metrics.core_vpn_single_signup_step3_complete_total.increment({
                                    status: 'success',
                                });
                                setModelDiff({ step: Steps.Custom });
                                await done(model.cache);
                            }
                        }}
                        measure={measure}
                    />
                )}
            </UnAuthenticated>
        </>
    );
};

export default SingleSignupContainer;
