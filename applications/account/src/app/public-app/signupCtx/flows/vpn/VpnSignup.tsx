import { useEffect, useState } from 'react';

import isDeepEqual from 'lodash/isEqual';
import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import StandardLoadErrorPage from '@proton/components/containers/app/StandardLoadErrorPage';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { useNotifyErrorHandler } from '@proton/components/hooks/useErrorHandler';
import metrics from '@proton/metrics/metricsInstance';
import observeApiError from '@proton/metrics/observeApiError';
import {
    PaymentsContextOptimisticProvider,
    type PaymentsContextOptimisticType,
    usePaymentOptimistic,
} from '@proton/payments-ui/ui/context/PaymentContextOptimistic';
import { ADDON_NAMES, CYCLE, PLANS } from '@proton/payments/core/constants';
import type { Currency, PlanIDs } from '@proton/payments/core/interface';
import { hasPlanIDs } from '@proton/payments/core/planIDs';
import { FREE_PLAN } from '@proton/payments/core/subscription/freePlans';
import { getHas2025OfferCoupon, getIsVPNPassPromotion } from '@proton/payments/core/subscription/helpers';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { TelemetryAccountSignupEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { getWelcomeToText } from '@proton/shared/lib/apps/text';
import { type APP_NAMES, SSO_PATHS, VPN_APP_NAME } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { wait } from '@proton/shared/lib/helpers/promise';
import {
    getIsB2BAudienceFromPlan,
    getIsVpnB2BPlan,
    getPlanFromPlanIDs,
} from '@proton/shared/lib/payments/plan/helpers';
import { SubscriptionMode } from '@proton/shared/lib/payments/subscription/constants';
import onboardingVPNWelcome from '@proton/styles/assets/img/onboarding/vpn-welcome.svg';
import noop from '@proton/utils/noop';

import type { OnLoginCallback } from '../../../authSession';
import useLocationWithoutLocale from '../../../hooks/useLocationWithoutLocale';
import type { MetaTags } from '../../../hooks/useMetaTags';
import { useMetaTags } from '../../../hooks/useMetaTags';
import { cachedPlans } from '../../../signup/defaultPlans';
import {
    type AccountData,
    SignupHumanVerification,
    SignupType,
    type SubscriptionData,
} from '../../../signup/interfaces';
import { getPlanIDsFromParams } from '../../../signup/searchParams';
import { getSubscriptionMetricsData } from '../../../signup/signupActions';
import { getFreeSubscriptionData } from '../../../single-signup-v2/helper';
import { Steps } from '../../../single-signup-v2/interface';
import { getPaymentMethodsAvailable, getSignupTelemetryData } from '../../../single-signup-v2/measure';
import { SignupContextProvider, useSignup } from '../../context/SignupContext';
import type { SignupContextSubscriptionData } from '../../context/helpers/handleSetupUser';
import Step1 from './Step1';
import Step2 from './Step2';
import Step3 from './Step3';
import Step4 from './Step4';
import { getUpsellShortPlan } from './helper';
import onboardingVPNWelcome2 from './illustration.svg';
import type { Measure, VPNSignupMode, VPNSignupModel } from './interface';
import type { TelemetryMeasurementData } from './measure';
import { getVpnAvailablePlans, getVpnCoupon, getVpnPlanToCheck } from './pricing';
import { getVpnSignupParameters } from './signupParameters';
import { filterCycleDataByPlan, getCycleData } from './state';
import { useVpnSignupThreePlans } from './useVpnSignupThreePlans';
import vpnUpsellIllustration from './vpn-upsell-illustration.svg';

interface Props {
    onLogin: OnLoginCallback;
    toApp: APP_NAMES;
    toAppName: string;
    metaTags: MetaTags;
    onPreSubmit?: () => Promise<void>;
    onStartAuth: () => Promise<void>;
    onSessionExpired?: (listener: () => void) => () => void;
}

type SignupParameters = ReturnType<typeof getVpnSignupParameters>;

const flowId = 'single-page-signup-vpn';
const telemetryContext = 'v1-signup';

/** The signup machine's subscription data, from the selection the user pays for. */
const getSignupSubscriptionData = (subscriptionData: SubscriptionData): SignupContextSubscriptionData => ({
    currency: subscriptionData.currency,
    cycle: subscriptionData.cycle,
    planIDs: subscriptionData.planIDs,
    checkResult: subscriptionData.checkResult,
    paymentToken: subscriptionData.payment,
    billingAddress: subscriptionData.billingAddress,
    vatNumber: subscriptionData.vatNumber,
    trial: subscriptionData.checkResult.SubscriptionMode === SubscriptionMode.Trial,
});

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

/** The selection the page opens with, from the link. The promotion selects the VPN+Pass bundle on 12 months. */
const getInitialSelection = (signupParameters: SignupParameters) => {
    const { coupon, currency } = signupParameters;
    const cycleData = getCycleData({ plan: vpnPlanName, coupon, currency });
    const { plan, planIDs } = getPlanIDsFromParams(cachedPlans, 'CHF', signupParameters, { plan: vpnPlanName });
    maybeApplyVpnPassBundleDefaults(planIDs);
    const { cycles, upsellCycle } = filterCycleDataByPlan(cycleData, plan);
    const cycle = signupParameters.cycle || upsellCycle;
    const isPromotionBundle = cycle === CYCLE.YEARLY && getIsVPNPassPromotion(coupon, currency);

    return {
        /** The plan of the link, whose cycles the page offers */
        plan,
        /** The plan of the link, which a currency without the promotion goes back to */
        planIDs,
        selectedPlanIDs: isPromotionBundle ? { [PLANS.VPN_PASS_BUNDLE]: 1 } : planIDs,
        cycle,
        /** The cycles the page offers */
        cycles,
    };
};

type InitialSelection = ReturnType<typeof getInitialSelection>;

interface InnerProps extends Pick<Props, 'toAppName' | 'metaTags'> {
    signupParameters: SignupParameters;
    initialSelection: InitialSelection;
    threePlans: ReturnType<typeof useVpnSignupThreePlans>;
}

/** The selection: the payments context's, or the link's until the payments context starts. */
const useSelection = (initialSelection: InitialSelection, signupParameters: SignupParameters) => {
    const payments = usePaymentOptimistic();
    if (payments.initializationStatus.triggered) {
        return payments.options;
    }
    const planToCheck = {
        planIDs: initialSelection.selectedPlanIDs,
        cycle: initialSelection.cycle,
        currency: 'CHF' as const,
        trial: signupParameters.trial,
    };
    return {
        ...planToCheck,
        checkResult: payments.getOptimisticCheckResult(planToCheck),
        billingAddress: { CountryCode: '', State: '' },
        vatNumber: undefined,
    } satisfies PaymentsContextOptimisticType['options'];
};

const VpnSignupInner = ({
    metaTags,
    toAppName,
    signupParameters,
    initialSelection,
    threePlans: { variant: threePlansVariant, showThreePlans },
}: InnerProps) => {
    const signup = useSignup();
    const payments = usePaymentOptimistic();
    const unauthApi = useApi();
    const [model, setModel] = useState<VPNSignupModel>({ step: Steps.Account, subscriptionData: undefined });
    const [setupError, setSetupError] = useState<string>();
    const notifyError = useNotifyErrorHandler();
    const activeBreakpoint = useActiveBreakpoint();
    /** What the user signed up with: the password step shows the email and the generated password. */
    const [accountData, setAccountData] = useState<AccountData>();
    const options = useSelection(initialSelection, signupParameters);
    const { pricingInitialized, error: loadError } = payments.initializationStatus;

    useMetaTags(metaTags);

    const setModelDiff = (diff: Partial<VPNSignupModel>) => {
        return setModel((model) => ({
            ...model,
            ...diff,
        }));
    };

    const mode = getSignupMode(signupParameters.coupon, options.currency);
    // The loaded plan, whose prices can differ from the bundled plans the page starts with
    const linkPlan = getPlanFromPlanIDs(payments.plansMap, initialSelection.planIDs) || initialSelection.plan;
    const cycleData = filterCycleDataByPlan(
        getCycleData({ plan: vpnPlanName, coupon: signupParameters.coupon, currency: options.currency }),
        linkPlan
    );
    const selectedPlan = getPlanFromPlanIDs(payments.plansMap, options.planIDs) || FREE_PLAN;
    const upsellShortPlan = getUpsellShortPlan(selectedPlan);

    const isB2bPlan = getIsVpnB2BPlan(selectedPlan.Name) || getIsB2BAudienceFromPlan(selectedPlan.Name);
    const flow = getIsVpnB2BPlan(signupParameters.preSelectedPlan as PLANS) ? 'b2b' : 'b2c';
    const background = (() => {
        if (isB2bPlan) {
            return 'dark';
        }

        if (getHas2025OfferCoupon(signupParameters.coupon)) {
            return 'bf2025';
        }
    })();

    const measure: Measure = (data: TelemetryMeasurementData) => {
        const values = 'values' in data ? data.values : {};
        return sendTelemetryReport({
            api: unauthApi,
            measurementGroup: TelemetryMeasurementGroups.accountSignup,
            event: data.event,
            dimensions: {
                ...data.dimensions,
                flow: mode === 'signup' ? 'vpn_signup_2step' : 'vpn_signup_3step',
                ...(threePlansVariant && { three_plans_variant: threePlansVariant }),
            },
            values,
            delay: false,
        }).catch(noop);
    };

    useEffect(() => {
        payments.setIsTrialResolver(() => !!signupParameters.trial);
        return () => payments.setIsTrialResolver(undefined);
    }, []);

    useEffect(() => {
        if (!pricingInitialized) {
            return;
        }

        void measure({ event: TelemetryAccountSignupEvents.pageLoad, dimensions: {} });
        if (payments.paymentStatus) {
            void measure({
                event: TelemetryAccountSignupEvents.bePaymentMethods,
                dimensions: getPaymentMethodsAvailable(payments.paymentStatus.VendorStates),
            });
        }
        metrics.core_vpn_single_signup_fetchDependencies_2_total.increment({ status: 'success', flow });

        // The promotion picked the VPN+Pass bundle, but the preferred currency has no promotion
        const { currency, planIDs, cycle } = payments.options;
        const isPromotionBundle = !isDeepEqual(initialSelection.selectedPlanIDs, initialSelection.planIDs);
        if (isPromotionBundle && !getIsVPNPassPromotion(signupParameters.coupon, currency)) {
            payments.selectPlan(
                getVpnPlanToCheck({
                    planIDs: isDeepEqual(planIDs, initialSelection.selectedPlanIDs)
                        ? initialSelection.planIDs
                        : planIDs,
                    cycle,
                    currency,
                    coupon: signupParameters.coupon,
                    trial: signupParameters.trial,
                })
            );
        }
    }, [pricingInitialized]);

    useEffect(() => {
        if (loadError) {
            observeApiError(loadError, (status) =>
                metrics.core_vpn_single_signup_fetchDependencies_2_total.increment({ status, flow })
            );
        }
    }, [loadError]);

    if (loadError) {
        return <StandardLoadErrorPage errorMessage={loadError instanceof Error ? loadError.message : undefined} />;
    }

    const done = async () => {
        metrics.core_vpn_single_signup_step4_setup_2_total.increment({
            status: 'success',
            flow: isB2bPlan ? 'b2b' : 'b2c',
        });

        // The sign-in sends the pending metrics
        await measure({
            event: TelemetryAccountSignupEvents.onboardFinish,
            dimensions: {},
        });

        await signup.login();
    };

    const completeSignup = async () => {
        const gotoB2bSetup = isB2bPlan && signupParameters.orgName;
        if (gotoB2bSetup) {
            setModelDiff({ step: Steps.SetupOrg });
        } else {
            await done();
        }
    };

    const handleSetup = async () => {
        const { subscriptionData } = model;
        if (!subscriptionData) {
            throw new Error('Missing subscription data');
        }
        const subscriptionMetricsData = getSubscriptionMetricsData(subscriptionData);
        try {
            // A reserved Bitcoin account is already set up: only its subscription is left
            await Promise.all([model.signupTokenMode ? signup.setupSubscription() : signup.setupUser(), wait(3500)]);

            void measure(getSignupTelemetryData(payments.plansMap, subscriptionData));

            // The password of a reserved Bitcoin account was already picked: the signup completes once subscribed
            if (!model.signupTokenMode) {
                setModelDiff({ step: Steps.Custom });
            }

            metrics.core_vpn_single_signup_step2_setup_3_total.increment({
                status: 'success',
                ...subscriptionMetricsData,
                flow: isB2bPlan ? 'b2b' : 'b2c',
            });
        } catch (error) {
            observeApiError(error, (status) =>
                metrics.core_vpn_single_signup_step2_setup_3_total.increment({
                    status,
                    ...subscriptionMetricsData,
                    flow: isB2bPlan ? 'b2b' : 'b2c',
                })
            );

            // The Bitcoin transaction is already confirmed and the signup holds its token: the form can't pay it
            // again, so the subscription is retried from here
            if (model.signupTokenMode && subscriptionData.type === 'btc') {
                setSetupError(
                    getApiErrorMessage(error) ||
                        (error instanceof Error ? error.message : '') ||
                        c('Error').t`Unknown error`
                );
                return;
            }

            notifyError(error);
            // The created user stays: submitting the form again only retries its setup
            setModelDiff({ step: Steps.Account });
            return;
        }

        if (model.signupTokenMode) {
            await completeSignup().catch(notifyError);
        }
    };

    return (
        <>
            <link rel="prefetch" href={onboardingVPNWelcome} as="image" />
            <link rel="prefetch" href={onboardingVPNWelcome2} as="image" />
            <link rel="prefetch" href={vpnUpsellIllustration} as="image" />
            {model.step === Steps.Account && (
                <Step1
                    signupParameters={signupParameters}
                    activeBreakpoint={activeBreakpoint}
                    mode={mode}
                    options={options}
                    selectedPlan={selectedPlan}
                    linkPlanIDs={initialSelection.planIDs}
                    cycleData={cycleData}
                    isB2bPlan={isB2bPlan}
                    showThreePlans={showThreePlans}
                    background={background}
                    upsellShortPlan={upsellShortPlan}
                    model={model}
                    sessionUID={model.signupTokenMode ? signup.session?.UID : undefined}
                    measure={measure}
                    onComplete={async (data) => {
                        // The reserved account's Bitcoin payment is confirmed: only the subscription is left
                        if (data.type === 'existing') {
                            signup.submitSubscriptionData(getSignupSubscriptionData(data.subscriptionData));
                            setModelDiff({ subscriptionData: data.subscriptionData, step: Steps.Loading });
                            return;
                        }

                        const { accountData, subscriptionData } = data;
                        const accountType =
                            accountData.signupType === SignupType.External ? 'external_account' : 'proton_account';
                        try {
                            /**
                             * Bitcoin signups create the account on the free plan first: the deposit address can only
                             * be requested by an authenticated user, and it reserves the username while the
                             * transaction confirms.
                             */
                            const isBitcoin = data.type === 'signup-token';
                            signup.submitSubscriptionData(
                                getSignupSubscriptionData(
                                    isBitcoin ? getFreeSubscriptionData(subscriptionData) : subscriptionData
                                )
                            );
                            // A previous attempt created the user but failed to set it up: only the setup is left
                            if (!model.reservedUser) {
                                signup.submitAccountData(accountData);
                                await signup.createUser();
                                setAccountData(accountData);
                                setModelDiff({ reservedUser: true });
                            }

                            if (isBitcoin) {
                                // No plan in the subscription data, so the free account is only set up, nothing is charged
                                await signup.setupUser({ reservation: true });
                                // The original subscription data is paid once the transaction is confirmed
                                // The password is picked before the deposit address is shown: if the payment isn't confirmed
                                // while the page is open, the user can still sign in and upgrade with the credits it adds
                                setModelDiff({ subscriptionData, signupTokenMode: true, step: Steps.Custom });
                            } else {
                                setModelDiff({ subscriptionData, step: Steps.Loading });
                            }

                            metrics.core_vpn_single_signup_step1_accountCreation_2_total.increment({
                                status: 'success',
                                account_type: accountType,
                                flow: isB2bPlan ? 'b2b' : 'b2c',
                            });
                        } catch (error) {
                            notifyError(error);
                            observeApiError(error, (status) =>
                                metrics.core_vpn_single_signup_step1_accountCreation_2_total.increment({
                                    status,
                                    account_type: accountType,
                                    flow: isB2bPlan ? 'b2b' : 'b2c',
                                })
                            );
                            // Let Step1 report the failed Bitcoin checkout, the error is already shown
                            if (data.type === 'signup-token') {
                                throw error;
                            }
                        }
                    }}
                    upsellImg={<img src={vpnUpsellIllustration} alt={upsellShortPlan?.description || ''} />}
                    toAppName={toAppName}
                    telemetryContext={telemetryContext}
                />
            )}
            {model.step === Steps.Loading && (
                <Step2
                    hasPayment={
                        !!model.subscriptionData &&
                        hasPlanIDs(model.subscriptionData.planIDs) &&
                        model.subscriptionData.checkResult.AmountDue > 0
                    }
                    product={VPN_APP_NAME}
                    isB2bPlan={isB2bPlan}
                    background={background}
                    img={<img src={onboardingVPNWelcome} alt={getWelcomeToText(VPN_APP_NAME)} />}
                    onSetup={handleSetup}
                    error={setupError}
                    onRetry={() => {
                        setSetupError(undefined);
                        handleSetup().catch(noop);
                    }}
                />
            )}
            {model.step === Steps.Custom && accountData && (
                <Step3
                    email={accountData.email}
                    password={accountData.password}
                    product={VPN_APP_NAME}
                    isB2bPlan={isB2bPlan}
                    background={background}
                    onComplete={async (newPassword: string) => {
                        if (newPassword) {
                            try {
                                await signup.setPassword(newPassword);
                            } catch (error) {
                                observeApiError(error, (status) =>
                                    metrics.core_vpn_single_signup_step3_complete_2_total.increment({
                                        status,
                                        flow: isB2bPlan ? 'b2b' : 'b2c',
                                    })
                                );
                                notifyError(error);
                                return;
                            }
                        }

                        metrics.core_vpn_single_signup_step3_complete_2_total.increment({
                            status: 'success',
                            flow: isB2bPlan ? 'b2b' : 'b2c',
                        });

                        // A reserved Bitcoin account goes back to the checkout to get the deposit address
                        if (model.signupTokenMode) {
                            setModelDiff({ step: Steps.Account });
                            return;
                        }

                        await completeSignup();
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
                        // The organization can be named later in the settings, so a failure doesn't stop the signup
                        await signup.setOrgName(signupParameters.orgName || '').catch(noop);

                        metrics.core_vpn_single_signup_step4_orgSetup_total.increment({
                            status: 'success',
                            flow: isB2bPlan ? 'b2b' : 'b2c',
                        });

                        await done();
                    }}
                />
            )}
        </>
    );
};

const availableSignupTypes = new Set([SignupType.External]);

const VpnSignup = ({ onLogin, onPreSubmit, onStartAuth, onSessionExpired, toApp, toAppName, metaTags }: Props) => {
    const location = useLocationWithoutLocale();

    const [signupParameters] = useState(() => getVpnSignupParameters(location.pathname, getSearchParams()));
    const [initialSelection] = useState(() => getInitialSelection(signupParameters));
    // Decided once from the link, so the cards and the telemetry tag don't change during the signup
    const threePlans = useVpnSignupThreePlans({
        mode: getSignupMode(signupParameters.coupon, signupParameters.currency),
        isB2bPlan: getIsVpnB2BPlan(initialSelection.plan.Name) || getIsB2BAudienceFromPlan(initialSelection.plan.Name),
        coupon: signupParameters.coupon,
        trial: signupParameters.trial,
        preSelectedPlan: signupParameters.preSelectedPlan,
        urlVariant: signupParameters.vpn2024SignupExperimentVariant,
    });

    const planToCheck = {
        planIDs: initialSelection.selectedPlanIDs,
        cycle: initialSelection.cycle,
        currency: signupParameters.currency,
        coupon: getVpnCoupon({
            planIDs: initialSelection.selectedPlanIDs,
            cycle: initialSelection.cycle,
            currency: signupParameters.currency,
            coupon: signupParameters.coupon,
        }),
        trial: signupParameters.trial,
    };

    return (
        <PaymentsContextOptimisticProvider
            preload={false}
            authenticated={false}
            cachedPlans={cachedPlans}
            // When Bitcoin is offered, guess it's active until the payment status loads, so it doesn't pop in
            optimisticVendorStates={{ Bitcoin: true }}
            billingDetails={{
                Company: signupParameters.orgName,
                City: signupParameters.city,
                Address: signupParameters.streetAddress,
                FirstName: signupParameters.firstName,
                LastName: signupParameters.lastName,
            }}
        >
            <SignupContextProvider
                app={toApp}
                flowId={flowId}
                onPreSubmit={onPreSubmit}
                onStartAuth={onStartAuth}
                onSessionExpired={onSessionExpired}
                loginUrl={SSO_PATHS.LOGIN}
                onLogin={(session, loginPassword) =>
                    onLogin({ data: session, loginPassword, flow: 'signup', appIntent: undefined })
                }
                paymentsDataConfig={{
                    plan: planToCheck,
                    availablePlans: getVpnAvailablePlans({
                        planIDs: initialSelection.selectedPlanIDs,
                        cycles: initialSelection.cycles,
                        currency: signupParameters.currency,
                        coupon: signupParameters.coupon,
                        withProtonUnlimited: threePlans.showThreePlans,
                    }),
                    vatNumber: signupParameters.vatNumber,
                    telemetryContext,
                }}
                accountFormDataConfig={{ availableSignupTypes, defaultEmail: signupParameters.email }}
                hvMode={SignupHumanVerification.DEFERRED}
                visitorId={signupParameters.visitorId}
                // The user gets a generated password and chooses their own, which sets up the keys, in the password step
                deferKeySetup
                persistent={false}
            >
                <VpnSignupInner
                    metaTags={metaTags}
                    toAppName={toAppName}
                    signupParameters={signupParameters}
                    initialSelection={initialSelection}
                    threePlans={threePlans}
                />
            </SignupContextProvider>
        </PaymentsContextOptimisticProvider>
    );
};

export default VpnSignup;
