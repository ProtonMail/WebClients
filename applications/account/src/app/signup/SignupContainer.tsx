import { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Step, Stepper } from '@proton/atoms/Stepper';
import { ExperimentCode, HumanVerificationSteps, OnLoginCallback } from '@proton/components/containers';
import { startUnAuthFlow } from '@proton/components/containers/api/unAuthenticatedApi';
import useKTActivation from '@proton/components/containers/keyTransparency/useKTActivation';
import {
    useActiveBreakpoint,
    useApi,
    useConfig,
    useErrorHandler,
    useExperiment,
    useLocalState,
    useMyCountry,
    useVPNServersCount,
} from '@proton/components/hooks';
import { PaymentMethodStatus } from '@proton/components/payments/core';
import { useLoading } from '@proton/hooks';
import metrics, { observeApiError } from '@proton/metrics';
import { WebCoreSignupBackButtonTotal } from '@proton/metrics/types/web_core_signup_backButton_total_v1.schema';
import { checkReferrer } from '@proton/shared/lib/api/core/referrals';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { queryPaymentMethodStatus, queryPlans } from '@proton/shared/lib/api/payments';
import { ProductParam } from '@proton/shared/lib/apps/product';
import { getHasAppExternalSignup, getIsVPNApp } from '@proton/shared/lib/authentication/apps';
import {
    APPS,
    APP_NAMES,
    BRAND_NAME,
    CLIENT_TYPES,
    CYCLE,
    DEFAULT_CURRENCY,
    MAIL_APP_NAME,
    PLANS,
    REFERRER_CODE_MAIL_TRIAL,
    SSO_PATHS,
} from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { hasPlanIDs } from '@proton/shared/lib/helpers/planIDs';
import { getNormalCycleFromCustomCycle } from '@proton/shared/lib/helpers/subscription';
import { Api, Currency, Cycle, HumanVerificationMethodType, Plan } from '@proton/shared/lib/interfaces';
import { getLocalPart } from '@proton/shared/lib/keys/setupAddress';
import { getFreeCheckResult } from '@proton/shared/lib/subscription/freePlans';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import mailReferPage from '../../pages/refer-a-friend';
import mailTrialPage from '../../pages/trial';
import Layout from '../public/Layout';
import { defaultPersistentKey } from '../public/helper';
import { useFlowRef } from '../useFlowRef';
import useLocationWithoutLocale from '../useLocationWithoutLocale';
import { MetaTags, useMetaTags } from '../useMetaTags';
import AccountStep from './AccountStep';
import CongratulationsStep from './CongratulationsStep';
import ExploreStep from './ExploreStep';
import LoadingStep from './LoadingStep';
import PaymentStep from './PaymentStep';
import RecoveryStep from './RecoveryStep';
import ReferralStep from './ReferralStep';
import SignupSupportDropdown from './SignupSupportDropdown';
import UpsellStep from './UpsellStep';
import VerificationStep from './VerificationStep';
import { DEFAULT_SIGNUP_MODEL } from './constants';
import {
    getPlanFromPlanIDs,
    getSignupApplication,
    getSubscriptionPrices,
    isMailReferAFriendSignup,
    isMailTrialSignup,
} from './helper';
import {
    InviteData,
    PlanIDs,
    SignupActionResponse,
    SignupCacheResult,
    SignupModel,
    SignupSteps,
    SignupType,
    SubscriptionData,
} from './interfaces';
import { SignupParameters, getPlanIDsFromParams, getSignupSearchParams } from './searchParams';
import {
    handleCreateAccount,
    handleDisplayName,
    handleDone,
    handleHumanVerification,
    handlePayment,
    handleSaveRecovery,
    handleSelectPlan,
    handleSetupUser,
    usernameAvailabilityError,
} from './signupActions';

const {
    AccountCreationUsername,
    NoSignup,
    SaveRecovery,
    Congratulations,
    Upsell,
    TrialPlan,
    Payment,
    HumanVerification,
    CreatingAccount,
    Explore,
} = SignupSteps;

interface Props {
    onLogin: OnLoginCallback;
    productParam: ProductParam;
    toApp?: APP_NAMES;
    toAppName?: string;
    onBack?: () => void;
    clientType: CLIENT_TYPES;
    loginUrl: string;
    metaTags: MetaTags;
}

const SignupContainer = ({
    metaTags,
    toApp,
    toAppName,
    onBack,
    onLogin,
    clientType,
    productParam,
    loginUrl,
}: Props) => {
    const { APP_NAME } = useConfig();

    const location = useLocationWithoutLocale<{ invite?: InviteData }>();
    const isMailTrial = isMailTrialSignup(location);
    const isMailRefer = isMailReferAFriendSignup(location);

    const { isTinyMobile } = useActiveBreakpoint();

    useMetaTags(isMailRefer ? mailReferPage() : isMailTrial ? mailTrialPage() : metaTags);

    const normalApi = useApi();
    const history = useHistory();

    const ktActivation = useKTActivation();
    // Override the app to always be mail in trial or refer-a-friend signup
    if (isMailTrial || isMailRefer) {
        toApp = APPS.PROTONMAIL;
        toAppName = MAIL_APP_NAME;
    }
    const [signupParameters] = useState(() => {
        const params = getSignupSearchParams(location.pathname, new URLSearchParams(location.search));
        if (isMailTrial) {
            params.referrer = REFERRER_CODE_MAIL_TRIAL;
        }
        return params;
    });
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const ignoreHumanApi = <T,>(config: any) =>
        silentApi<T>({
            ...config,
            ignoreHandler: [API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED],
        });
    const [vpnServers] = useVPNServersCount();
    const [loading, withLoading] = useLoading();
    const multipleUpsellExperiment = useExperiment(ExperimentCode.MultipleUpsell);
    const [[previousSteps, step], setStep] = useState<[SignupSteps[], SignupSteps]>([
        [],
        SignupSteps.AccountCreationUsername,
    ]);
    const [humanVerificationStep, setHumanVerificationStep] = useState(HumanVerificationSteps.ENTER_DESTINATION);

    const handleError = useErrorHandler();
    const cacheRef = useRef<SignupCacheResult | undefined>(undefined);

    const [persistent] = useLocalState(false, defaultPersistentKey);

    const [model, setModel] = useState<SignupModel>(DEFAULT_SIGNUP_MODEL);

    const createFlow = useFlowRef();

    const cache = cacheRef.current;
    const accountData = cache?.accountData;

    const isReferral = model.referralData && !isMailTrial;

    const signupTypes = (() => {
        // Only on account.protonvpn.com do we suggest external only sign up
        if (APP_NAME === APPS.PROTONVPN_SETTINGS) {
            return [SignupType.Email];
        }
        if (toApp && getHasAppExternalSignup(toApp)) {
            return [SignupType.Email, SignupType.Username];
        }
        // Generic signup
        if (!toApp) {
            return [SignupType.Username, SignupType.Email];
        }
        return [SignupType.Username];
    })();
    const defaultSignupType = signupTypes[0];

    const [signupType, setSignupType] = useState<{ method: 'auto' | 'manual'; type: SignupType }>({
        method: 'auto',
        type: defaultSignupType,
    });

    useEffect(() => {
        if (signupType.method === 'auto' && signupType.type !== defaultSignupType) {
            setSignupType({ method: 'auto', type: defaultSignupType });
        }
    }, [signupType.type, defaultSignupType]);

    const setModelDiff = (diff: Partial<SignupModel>) => {
        return setModel((model) => ({
            ...model,
            ...diff,
        }));
    };

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
            const { referrer, invite } = signupParameters;

            await startUnAuthFlow().catch(noop);

            const [{ Domains: domains }, paymentMethodStatus, referralData, Plans] = await Promise.all([
                normalApi<{ Domains: string[] }>(queryAvailableDomains('signup')),
                silentApi<PaymentMethodStatus>(queryPaymentMethodStatus()),
                referrer
                    ? await silentApi(checkReferrer(referrer))
                          .then(() => ({
                              referrer: referrer || '',
                              invite: invite || '',
                          }))
                          .catch(() => undefined)
                    : undefined,
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

            if ((location.pathname === SSO_PATHS.REFER || location.pathname === SSO_PATHS.TRIAL) && !referralData) {
                history.replace(SSO_PATHS.SIGNUP);
            }

            const subscriptionData = await getSubscriptionData(silentApi, Plans, signupParameters);

            setModelDiff({
                domains,
                plans: Plans,
                paymentMethodStatus,
                referralData,
                subscriptionData,
                inviteData: location.state?.invite,
            });
        };

        void withLoading(
            fetchDependencies().catch(() => {
                setStep([[], NoSignup]);
            })
        );

        return () => {
            cacheRef.current = undefined;
        };
    }, []);

    const handleBack = () => {
        if (!previousSteps.length) {
            return;
        }
        createFlow.reset();
        const newSteps = [...previousSteps];
        const newStep = newSteps.pop()!;
        setStep([newSteps, newStep]);
    };

    const handleStep = (to: SignupSteps) => {
        setStep([[...previousSteps, step], to]);
    };

    const handleResult = (result: SignupActionResponse) => {
        createFlow.reset();
        if (result.to === SignupSteps.Done) {
            return onLogin(result.session);
        }
        cacheRef.current = result.cache;
        handleStep(result.to);
    };

    if (step === NoSignup) {
        const error: any = new Error('Missing dependencies');
        error.trace = false;
        throw error;
    }

    const [defaultCountry] = useMyCountry();

    const handleChangeCurrency = async (currency: Currency) => {
        const checkResult = await getSubscriptionPrices(
            silentApi,
            model.subscriptionData.planIDs,
            currency,
            model.subscriptionData.cycle,
            model.subscriptionData.checkResult.Coupon?.Code
        );
        setModelDiff({
            subscriptionData: {
                ...model.subscriptionData,
                currency,
                checkResult,
            },
        });
    };

    const handleChangeCycle = async (cycle: Cycle) => {
        const checkResult = await getSubscriptionPrices(
            silentApi,
            model.subscriptionData.planIDs,
            model.subscriptionData.currency,
            cycle,
            model.subscriptionData.checkResult.Coupon?.Code
        );
        setModelDiff({
            subscriptionData: {
                ...model.subscriptionData,
                cycle,
                checkResult,
            },
        });
    };

    const handleChangePlanIDs = async (planIDs: PlanIDs) => {
        const checkResult = await getSubscriptionPrices(
            silentApi,
            planIDs,
            model.subscriptionData.currency,
            model.subscriptionData.cycle,
            model.subscriptionData.checkResult.Coupon?.Code
        );
        setModelDiff({
            subscriptionData: {
                ...model.subscriptionData,
                planIDs,
                checkResult,
            },
        });
    };

    const handlePlanSelectionCallback = async (subscriptionDataDiff: Partial<SubscriptionData>) => {
        if (!cache) {
            throw new Error('Missing cache');
        }
        const subscriptionData = {
            ...model.subscriptionData,
            ...subscriptionDataDiff,
        };
        setModelDiff({
            subscriptionData,
        });

        const validateFlow = createFlow();
        const signupActionResponse = await handleSelectPlan({ cache, api: ignoreHumanApi, subscriptionData });

        if (validateFlow()) {
            await handleResult(signupActionResponse);
        }
    };

    const plan = getPlanFromPlanIDs(model.plans, model.subscriptionData.planIDs);
    const planName = plan?.Title;
    const verificationModel = cache?.humanVerificationResult?.verificationModel;

    const handleBackStep = (() => {
        const reportBackButtonMetric = (signupStep: SignupSteps) => {
            const metricMap: { [key in SignupSteps]?: WebCoreSignupBackButtonTotal['Labels']['step'] } = {
                [AccountCreationUsername]: 'account',
                [HumanVerification]: 'verification',
                [Payment]: 'payment',
                [Upsell]: 'upsell',
                [TrialPlan]: 'referral',
                [SaveRecovery]: 'recovery',
            };

            const metricStep = metricMap[signupStep];
            if (metricStep === undefined) {
                return;
            }

            metrics.core_signup_backButton_total.increment({
                step: metricStep,
                application: getSignupApplication(APP_NAME),
            });
        };

        if (step === AccountCreationUsername) {
            // No back button on referral
            if (isReferral || !onBack) {
                return undefined;
            }
            return () => {
                reportBackButtonMetric(step);
                onBack();
            };
        }

        if (step === HumanVerification) {
            return () => {
                reportBackButtonMetric(step);
                if (humanVerificationStep === HumanVerificationSteps.ENTER_DESTINATION) {
                    handleBack();
                } else {
                    setHumanVerificationStep(HumanVerificationSteps.ENTER_DESTINATION);
                }
            };
        }

        if ([Payment, Upsell, TrialPlan, SaveRecovery].includes(step)) {
            return () => {
                reportBackButtonMetric(step);
                handleBack();
            };
        }
    })();

    // True while loading, and then true if it's fetched correctly.
    const hasValidPlanSelected = model === DEFAULT_SIGNUP_MODEL || plan;
    const hasPaidPlanPreSelected =
        signupParameters.preSelectedPlan && signupParameters.preSelectedPlan !== 'free' && hasValidPlanSelected;

    const { upsellPlanName, mostPopularPlanName }: { upsellPlanName: PLANS; mostPopularPlanName?: PLANS } = (() => {
        if (getIsVPNApp(toApp, clientType)) {
            return { upsellPlanName: PLANS.VPN };
        }

        if (toApp === APPS.PROTONDRIVE) {
            if (multipleUpsellExperiment.value === 'B' && !isTinyMobile) {
                // Show most popular plan
                return { upsellPlanName: PLANS.BUNDLE, mostPopularPlanName: PLANS.DRIVE };
            }

            return { upsellPlanName: PLANS.DRIVE };
        }

        if (toApp === APPS.PROTONPASS || toApp === APPS.PROTONEXTENSION || toApp === APPS.PROTONPASSBROWSEREXTENSION) {
            return { upsellPlanName: PLANS.PASS_PLUS };
        }

        if (hasPaidPlanPreSelected) {
            return { upsellPlanName: PLANS.MAIL };
        }

        return { upsellPlanName: PLANS.MAIL };
    })();

    const stepper = (() => {
        const stepLabels = {
            accountSetup: c('Signup step').t`Account setup`,
            verification: c('Signup step').t`Verification`,
            payment: c('Signup step').t`Payment`,
        };

        const isExternalAccountFlow = signupType.type === SignupType.Email;
        if (isExternalAccountFlow) {
            if (step === SignupSteps.AccountCreationUsername) {
                return {
                    activeStep: 0,
                    steps: [
                        stepLabels.accountSetup,
                        stepLabels.verification,
                        hasPaidPlanPreSelected && stepLabels.payment,
                    ].filter(isTruthy),
                };
            }

            if (step === SignupSteps.HumanVerification || step === SignupSteps.Upsell) {
                return {
                    activeStep: 1,
                    steps: [
                        stepLabels.accountSetup,
                        stepLabels.verification,
                        hasPaidPlanPreSelected && stepLabels.payment,
                    ].filter(isTruthy),
                };
            }

            if (step === SignupSteps.Payment) {
                return {
                    activeStep: 2,
                    steps: [stepLabels.accountSetup, stepLabels.verification, stepLabels.payment],
                };
            }
        }

        if (step === SignupSteps.AccountCreationUsername) {
            return {
                activeStep: 0,
                steps: [stepLabels.accountSetup, hasPaidPlanPreSelected ? stepLabels.payment : stepLabels.verification],
            };
        }

        if (step === SignupSteps.Upsell) {
            return { activeStep: 0, steps: [stepLabels.accountSetup, stepLabels.verification] };
        }

        if (step === SignupSteps.HumanVerification) {
            return { activeStep: 1, steps: [stepLabels.accountSetup, stepLabels.verification] };
        }

        if (step === SignupSteps.Payment) {
            return { activeStep: 1, steps: [stepLabels.accountSetup, stepLabels.payment] };
        }

        return;
    })();

    const children = (
        <>
            {step === AccountCreationUsername && (
                <AccountStep
                    loginUrl={loginUrl}
                    toApp={toApp}
                    clientType={clientType}
                    onBack={handleBackStep}
                    title={(() => {
                        if (isReferral) {
                            return c('Title').t`You’ve been invited to try ${MAIL_APP_NAME}`;
                        }
                        return c('Title').t`Create your ${BRAND_NAME} Account`;
                    })()}
                    subTitle={(() => {
                        if (loading) {
                            return '';
                        }
                        if (isReferral) {
                            return c('Title').t`Secure email based in Switzerland`;
                        }
                        if (toAppName) {
                            if (signupType.type === SignupType.Username && signupTypes.includes(SignupType.Email)) {
                                return c('Info').t`to use ${toAppName} and all ${BRAND_NAME} services`;
                            }
                            return c('Info').t`to continue to ${toAppName}`;
                        }
                        if (signupType.type === SignupType.Email) {
                            return '';
                        }
                        return c('Info').t`One account. All ${BRAND_NAME} services.`;
                    })()}
                    defaultEmail={accountData?.email}
                    defaultUsername={accountData?.username}
                    signupTypes={signupTypes}
                    signupType={signupType.type}
                    onChangeSignupType={(type) => {
                        setSignupType({ method: 'manual', type });
                    }}
                    defaultRecoveryEmail=""
                    domains={model.domains}
                    onSubmit={async ({ username, email, domain, password, signupType, payload }) => {
                        const accountData = {
                            username,
                            email,
                            password,
                            signupType,
                            payload,
                            domain,
                        };
                        const subscriptionData = {
                            ...model.subscriptionData,
                        };
                        const cache: SignupCacheResult = {
                            type: 'signup',
                            appName: APP_NAME,
                            appIntent: toApp
                                ? {
                                      app: toApp,
                                  }
                                : undefined,
                            productParam,
                            // Internal app or oauth app or vpn
                            ignoreExplore: Boolean(toApp || toAppName),
                            accountData,
                            subscriptionData,
                            inviteData: model.inviteData,
                            referralData: model.referralData,
                            persistent,
                            trusted: false,
                            clientType,
                            ktActivation,
                        };

                        const accountType = signupType === SignupType.Email ? 'external_account' : 'proton_account';

                        try {
                            const validateFlow = createFlow();
                            await startUnAuthFlow();
                            const signupActionResponse = await handleCreateAccount({
                                cache,
                                api: ignoreHumanApi,
                            });

                            if (validateFlow()) {
                                await handleResult(signupActionResponse);
                            }

                            metrics.core_signup_accountStep_accountCreation_total.increment({
                                account_type: accountType,
                                status: 'success',
                                application: getSignupApplication(APP_NAME),
                            });
                        } catch (error: any) {
                            handleError(error);

                            if (
                                /**
                                 * Do not report usernameAvailabilityError's as failures to metrics
                                 */
                                error.type === usernameAvailabilityError
                            ) {
                                return;
                            }
                            observeApiError(error, (status) =>
                                metrics.core_signup_accountStep_accountCreation_total.increment({
                                    account_type: accountType,
                                    status,
                                    application: getSignupApplication(APP_NAME),
                                })
                            );
                        }
                    }}
                    hasChallenge={!accountData?.payload || !Object.keys(accountData.payload).length}
                    loading={loading}
                />
            )}
            {step === HumanVerification && (
                <VerificationStep
                    onBack={handleBackStep}
                    defaultCountry={defaultCountry}
                    title={(() => {
                        if (cache?.humanVerificationData?.methods.includes('ownership-email')) {
                            return c('Title').t`Verify email address`;
                        }
                        return c('Title').t`Verification`;
                    })()}
                    defaultEmail=""
                    token={cache?.humanVerificationData?.token || ''}
                    methods={cache?.humanVerificationData?.methods || []}
                    step={humanVerificationStep}
                    onChangeStep={setHumanVerificationStep}
                    onClose={() => {
                        handleBack();
                    }}
                    onError={() => {
                        handleBack();
                    }}
                    onSubmit={async (token: string, tokenType: HumanVerificationMethodType, verificationModel) => {
                        try {
                            if (!cache) {
                                throw new Error('Missing cache');
                            }

                            const validateFlow = createFlow();
                            const signupActionResponse = await handleHumanVerification({
                                api: ignoreHumanApi,
                                verificationModel,
                                cache,
                                token,
                                tokenType,
                            });

                            if (validateFlow()) {
                                await handleResult(signupActionResponse);
                            }
                        } catch (error) {
                            handleError(error);
                            // Important this is thrown so that the human verification form can handle it
                            throw error;
                        }
                    }}
                />
            )}
            {step === TrialPlan && (
                <ReferralStep
                    onBack={handleBackStep}
                    onPlan={async (planIDs) => {
                        // Referral is always free even if there's a plan, and 1-month cycle
                        const cycle = CYCLE.MONTHLY;
                        const checkResult = getFreeCheckResult(model.subscriptionData.currency, cycle);

                        try {
                            await handlePlanSelectionCallback({ checkResult, planIDs, cycle });
                            metrics.core_signup_referralStep_planSelection_total.increment({
                                status: 'success',
                                application: getSignupApplication(APP_NAME),
                            });
                        } catch (error) {
                            handleError(error);
                            observeApiError(error, (status) =>
                                metrics.core_signup_referralStep_planSelection_total.increment({
                                    status,
                                    application: getSignupApplication(APP_NAME),
                                })
                            );
                        }
                    }}
                />
            )}
            {step === Upsell && (
                <UpsellStep
                    experiment={multipleUpsellExperiment}
                    onBack={handleBackStep}
                    currency={model.subscriptionData.currency}
                    cycle={model.subscriptionData.cycle}
                    plans={model.plans}
                    mostPopularPlanName={mostPopularPlanName}
                    upsellPlanName={upsellPlanName}
                    onChangeCurrency={handleChangeCurrency}
                    vpnServers={vpnServers}
                    onPlan={async (planIDs) => {
                        try {
                            const validateFlow = createFlow();
                            const checkResult = await getSubscriptionPrices(
                                silentApi,
                                planIDs,
                                model.subscriptionData.currency,
                                model.subscriptionData.cycle,
                                model.subscriptionData.checkResult.Coupon?.Code
                            );
                            if (!checkResult) {
                                return;
                            }

                            if (validateFlow()) {
                                await handlePlanSelectionCallback({ checkResult, planIDs });
                            }
                            metrics.core_signup_upsellStep_planSelection_total.increment({
                                status: 'success',
                                application: getSignupApplication(APP_NAME),
                            });
                        } catch (error) {
                            handleError(error);
                            observeApiError(error, (status) =>
                                metrics.core_signup_upsellStep_planSelection_total.increment({
                                    status,
                                    application: getSignupApplication(APP_NAME),
                                })
                            );
                        }
                    }}
                />
            )}
            {step === Payment && model.paymentMethodStatus && (
                <PaymentStep
                    api={normalApi}
                    onBack={handleBackStep}
                    paymentMethodStatus={model.paymentMethodStatus}
                    plans={model.plans}
                    plan={plan}
                    planName={planName}
                    subscriptionData={model.subscriptionData}
                    onChangeCurrency={handleChangeCurrency}
                    onChangeCycle={handleChangeCycle}
                    onChangePlanIDs={handleChangePlanIDs}
                    onPay={async (payment, type) => {
                        try {
                            if (!cache) {
                                throw new Error('Missing cache');
                            }
                            const subscriptionData = {
                                ...model.subscriptionData,
                                payment,
                                type,
                            };

                            const validateFlow = createFlow();
                            const signupActionResponse = await handlePayment({
                                api: silentApi,
                                cache,
                                subscriptionData,
                            });

                            if (validateFlow()) {
                                await handleResult(signupActionResponse);
                            }
                            metrics.core_signup_paymentStep_payment_total.increment({
                                status: 'success',
                                application: getSignupApplication(APP_NAME),
                            });
                        } catch (error) {
                            handleError(error);

                            observeApiError(error, (status) =>
                                metrics.core_signup_paymentStep_payment_total.increment({
                                    status,
                                    application: getSignupApplication(APP_NAME),
                                })
                            );
                        }
                    }}
                />
            )}
            {step === CreatingAccount && (
                <LoadingStep
                    toApp={toApp}
                    hasPayment={
                        hasPlanIDs(model.subscriptionData.planIDs) && model.subscriptionData.checkResult.AmountDue > 0
                    }
                    onSetup={async () => {
                        try {
                            if (!cache) {
                                throw new Error('Missing cache');
                            }

                            /**
                             * Stop the metrics batching process. This prevents a race condition where
                             * handleSetupUser sets an auth cookie before the metrics batch request
                             */
                            metrics.stopBatchingProcess();

                            const validateFlow = createFlow();
                            const signupActionResponse = await handleSetupUser({ cache, api: silentApi });

                            /**
                             * Batch process can now resume since the auth cookie will have been set
                             */
                            metrics.startBatchingProcess();

                            if (validateFlow()) {
                                await handleResult(signupActionResponse);
                            }

                            metrics.core_signup_loadingStep_accountSetup_total.increment({
                                status: 'success',
                                application: getSignupApplication(APP_NAME),
                            });
                        } catch (error) {
                            handleBack();
                            handleError(error);

                            metrics.startBatchingProcess();
                            observeApiError(error, (status) =>
                                metrics.core_signup_loadingStep_accountSetup_total.increment({
                                    status,
                                    application: getSignupApplication(APP_NAME),
                                })
                            );
                        }
                    }}
                />
            )}
            {step === Congratulations && (
                <CongratulationsStep
                    defaultName={
                        cache?.accountData.username ||
                        (accountData?.signupType === SignupType.Email && getLocalPart(accountData.email)) ||
                        ''
                    }
                    planName={planName}
                    onSubmit={async ({ displayName }) => {
                        try {
                            if (!cache) {
                                throw new Error('Missing cache');
                            }
                            const validateFlow = createFlow();
                            const signupActionResponse = await handleDisplayName({
                                displayName,
                                cache,
                            });

                            if (validateFlow()) {
                                await handleResult(signupActionResponse);
                            }

                            metrics.core_signup_congratulationsStep_displayNameChoice_total.increment({
                                status: 'success',
                                application: getSignupApplication(APP_NAME),
                            });
                        } catch (error) {
                            handleError(error);
                            observeApiError(error, (status) =>
                                metrics.core_signup_congratulationsStep_displayNameChoice_total.increment({
                                    status,
                                    application: getSignupApplication(APP_NAME),
                                })
                            );
                        }
                    }}
                />
            )}
            {step === SaveRecovery && (
                <RecoveryStep
                    onBack={handleBackStep}
                    defaultCountry={defaultCountry}
                    defaultEmail={
                        (verificationModel?.method === 'email' && verificationModel?.value) ||
                        (accountData?.signupType === SignupType.Email && accountData.email) ||
                        ''
                    }
                    defaultPhone={verificationModel?.method === 'sms' ? verificationModel?.value : ''}
                    onSubmit={async ({ recoveryEmail, recoveryPhone }) => {
                        try {
                            if (!cache) {
                                throw new Error('Missing cache');
                            }
                            const validateFlow = createFlow();
                            const signupActionResponse = await handleSaveRecovery({
                                cache,
                                recoveryEmail,
                                recoveryPhone,
                            });

                            if (validateFlow()) {
                                await handleResult(signupActionResponse);
                            }

                            if (!!recoveryEmail || !!recoveryPhone) {
                                metrics.core_signup_recoveryStep_setRecoveryMethod_total.increment({
                                    status: 'success',
                                    application: getSignupApplication(APP_NAME),
                                });
                            } else {
                                metrics.core_signup_recoveryStep_setRecoveryMethod_total.increment({
                                    status: 'skipped',
                                    application: getSignupApplication(APP_NAME),
                                });
                            }
                        } catch (error) {
                            handleError(error);
                            observeApiError(error, (status) =>
                                metrics.core_signup_recoveryStep_setRecoveryMethod_total.increment({
                                    status,
                                    application: getSignupApplication(APP_NAME),
                                })
                            );
                        }
                    }}
                />
            )}
            {step === Explore && (
                <ExploreStep
                    onExplore={async (app) => {
                        try {
                            if (!cache) {
                                throw new Error('Missing cache');
                            }
                            const validateFlow = createFlow();
                            const signupActionResponse = handleDone({
                                cache,
                                appIntent: { app, ref: 'product-switch' },
                            });

                            if (validateFlow()) {
                                await handleResult(signupActionResponse);
                            }
                            metrics.core_signup_exploreStep_login_total.increment({
                                status: 'success',
                                application: getSignupApplication(APP_NAME),
                            });
                        } catch (error) {
                            handleError(error);
                            observeApiError(error, (status) =>
                                metrics.core_signup_exploreStep_login_total.increment({
                                    status,
                                    application: getSignupApplication(APP_NAME),
                                })
                            );
                        }
                    }}
                />
            )}
        </>
    );

    const hasDecoration = [AccountCreationUsername].includes(step);

    return (
        <Layout
            onBack={handleBackStep}
            bottomRight={<SignupSupportDropdown />}
            hasDecoration={hasDecoration}
            stepper={
                stepper && (
                    <Stepper position="center" activeStep={stepper.activeStep}>
                        {stepper.steps.map((step) => (
                            <Step key={step}>{step}</Step>
                        ))}
                    </Stepper>
                )
            }
        >
            {children}
        </Layout>
    );
};

export default SignupContainer;
