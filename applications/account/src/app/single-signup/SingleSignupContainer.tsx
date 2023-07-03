import { ReactNode, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import {
    OnLoginCallback,
    StandardLoadErrorPage,
    UnAuthenticated,
    useApi,
    useConfig,
    useErrorHandler,
    useLoading,
    useVPNServersCount,
} from '@proton/components';
import { startUnAuthFlow } from '@proton/components/containers/api/unAuthenticatedApi';
import { PaymentMethodStatus } from '@proton/components/payments/core';
import metrics, { observeApiError } from '@proton/metrics';
import { update as updateRoute } from '@proton/shared/lib/api/core/update';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { queryPaymentMethodStatus, queryPlans } from '@proton/shared/lib/api/payments';
import { ProductParam } from '@proton/shared/lib/apps/product';
import {
    APP_NAMES,
    BRAND_NAME,
    CLIENT_TYPES,
    CYCLE,
    DEFAULT_CURRENCY,
    PLANS,
    VPN_APP_NAME,
} from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import { getNormalCycleFromCustomCycle } from '@proton/shared/lib/helpers/subscription';
import { Api, Audience, Plan } from '@proton/shared/lib/interfaces';
import { getFreeCheckResult } from '@proton/shared/lib/subscription/freePlans';
import onboardingVPNWelcome from '@proton/styles/assets/img/onboarding/vpn-welcome.svg';
import noop from '@proton/utils/noop';

import { getPlanFromPlanIDs, getSubscriptionPrices } from '../signup/helper';
import {
    SignupActionResponse,
    SignupCacheResult,
    SignupModel,
    SignupSteps,
    SubscriptionData,
} from '../signup/interfaces';
import { SignupParameters, getPlanIDsFromParams, getSignupSearchParams } from '../signup/searchParams';
import { handleDone, handleSetPassword, handleSetupUser } from '../signup/signupActions';
import { useFlowRef } from '../useFlowRef';
import Step1 from './Step1';
import Step2 from './Step2';
import Step3 from './Step3';
import Step4 from './Step4';
import { getUpsellShortPlan } from './helper';
import onboardingVPNWelcome2 from './illustration.svg';
import vpnUpsellIllustration from './vpn-upsell-illustration.svg';

export const defaultSignupModel: SignupModel = {
    domains: [],
    subscriptionData: {
        skipUpsell: false,
        currency: 'EUR',
        cycle: CYCLE.YEARLY,
        planIDs: {},
        checkResult: getFreeCheckResult(),
    },
    paymentMethodStatus: {
        Card: false,
        Paypal: false,
        Apple: false,
        Cash: false,
        Bitcoin: false,
    },
    humanVerificationMethods: [],
    humanVerificationToken: '',
    selectedProductPlans: {
        [Audience.B2C]: PLANS.MAIL,
        [Audience.B2B]: PLANS.MAIL_PRO,
        [Audience.FAMILY]: PLANS.FAMILY,
    },
    inviteData: undefined,
    plans: [],
    referralData: undefined,
};

const enum Steps {
    One,
    Two,
    Three,
    Four,
}

interface Props {
    loader: ReactNode;
    onLogin: OnLoginCallback;
    productParam: ProductParam;
    toApp?: APP_NAMES;
    toAppName?: string;
    onBack?: () => void;
    clientType: CLIENT_TYPES;
}

const SingleSignupContainer = ({ loader, onLogin, productParam }: Props) => {
    const normalApi = useApi();
    const silentApi = getSilentApi(normalApi);
    const [error, setError] = useState<any>();
    const [vpnServersCountData] = useVPNServersCount();
    const { CLIENT_TYPE } = useConfig();
    const cacheRef = useRef<SignupCacheResult>();
    const createFlow = useFlowRef();
    const handleError = useErrorHandler();

    const update = (params: any) => {
        silentApi(updateRoute(params)).catch(noop);
    };

    const [loadingDependencies, withLoadingDependencies] = useLoading(true);

    const [signupParameters] = useState(() => {
        return getSignupSearchParams(new URLSearchParams(location.search), { preSelectedPlan: PLANS.VPN });
    });

    const [model, setModel] = useState<SignupModel>(defaultSignupModel);

    const setModelDiff = (diff: Partial<SignupModel>) => {
        return setModel((model) => ({
            ...model,
            ...diff,
        }));
    };

    const [step, setStep] = useState(Steps.One);

    const plan = getPlanFromPlanIDs(model.plans, model.subscriptionData.planIDs);
    const upsellShortPlan = getUpsellShortPlan(plan, vpnServersCountData);
    const upsellPlanName = upsellShortPlan?.title || '';

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
                normalApi<{ Domains: string[] }>(queryAvailableDomains('signup')),
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

            setModelDiff({
                domains,
                plans: Plans,
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

    const handleResult = async (result: SignupActionResponse, step: Steps) => {
        createFlow.reset();
        if (result.to === SignupSteps.Done) {
            return onLogin(result.session);
        }
        cacheRef.current = result.cache;
        setStep(step);
    };

    if (loadingDependencies) {
        return <>{loader}</>;
    }

    if (error) {
        return <StandardLoadErrorPage errorMessage={error.message} />;
    }

    const cache = cacheRef.current;

    return (
        <>
            <link rel="prefetch" href={onboardingVPNWelcome} as="image" />
            <link rel="prefetch" href={onboardingVPNWelcome2} as="image" />
            <link rel="prefetch" href={vpnUpsellIllustration} as="image" />
            <UnAuthenticated>
                {step === Steps.One && (
                    <Step1
                        plan={plan}
                        vpnServersCountData={vpnServersCountData}
                        upsellShortPlan={upsellShortPlan}
                        clientType={CLIENT_TYPE}
                        model={model}
                        setModel={setModelDiff}
                        onUpdate={update}
                        productParam={productParam}
                        onComplete={async (result) => {
                            await handleResult(result, Steps.Two);
                        }}
                        hideFreePlan={signupParameters.hideFreePlan}
                        upsellImg={<img src={vpnUpsellIllustration} alt={upsellShortPlan?.description || ''} />}
                    />
                )}
                {step === Steps.Two && (
                    <Step2
                        product={VPN_APP_NAME}
                        img={<img src={onboardingVPNWelcome} alt={c('Onboarding').t`Welcome to ${VPN_APP_NAME}`} />}
                        onSetup={async () => {
                            if (!cache) {
                                throw new Error('Missing cache');
                            }
                            try {
                                const [result] = await Promise.all([
                                    handleSetupUser({
                                        cache,
                                        api: silentApi,
                                        ignoreVPN: true,
                                    }),
                                    wait(3500),
                                ]);
                                await handleResult(result, Steps.Three);

                                metrics.core_vpn_single_signup_step2_setup_total.increment({ status: 'success' });
                            } catch (error) {
                                observeApiError(error, (status) =>
                                    metrics.core_vpn_single_signup_step2_setup_total.increment({ status })
                                );

                                handleError(error);
                                setStep(Steps.One);
                            }
                        }}
                    />
                )}
                {step === Steps.Three && (
                    <Step3
                        email={cache?.accountData.email || ''}
                        password={cache?.accountData.password || ''}
                        onComplete={async (newPassword: string | undefined) => {
                            if (!cache) {
                                throw new Error('Missing cache');
                            }
                            if (newPassword) {
                                try {
                                    const result = await handleSetPassword({
                                        cache,
                                        api: silentApi,
                                        newPassword,
                                    });
                                    await handleResult(result, Steps.Four);
                                    metrics.core_vpn_single_signup_step3_complete_total.increment({
                                        status: 'success',
                                    });
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
                                setStep(Steps.Four);
                            }
                        }}
                        onUpdate={update}
                    />
                )}
                {step === Steps.Four && (
                    <Step4
                        onSetup={async () => {
                            if (!cache) {
                                throw new Error('Missing cache');
                            }

                            try {
                                const [result] = await Promise.all([await handleDone({ cache }), wait(3500)]);
                                await handleResult(result, Steps.Four);

                                metrics.core_vpn_single_signup_step4_setup_total.increment({ status: 'success' });
                            } catch (error) {
                                observeApiError(error, (status) =>
                                    metrics.core_vpn_single_signup_step4_setup_total.increment({ status })
                                );
                            }
                        }}
                        planName={`${BRAND_NAME} ${upsellPlanName}`}
                        img={<img src={onboardingVPNWelcome2} alt={c('Onboarding').t`Welcome to ${VPN_APP_NAME}`} />}
                        steps={[
                            c('Info').t`Saving your password`,
                            c('Info').t`You will be redirected to the VPN download page`,
                        ]}
                    />
                )}
            </UnAuthenticated>
        </>
    );
};

export default SingleSignupContainer;
