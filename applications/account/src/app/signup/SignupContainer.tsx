import { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Step, Stepper } from '@proton/atoms';
import type { OnLoginCallback } from '@proton/components';
import { HumanVerificationSteps, useKTActivation } from '@proton/components';
import { startUnAuthFlow } from '@proton/components/containers/api/unAuthenticatedApi';
import {
    useApi,
    useConfig,
    useErrorHandler,
    useGetPaymentStatus,
    useGetPlans,
    useLocalState,
    useMyCountry,
} from '@proton/components/hooks';
import { useCurrencies } from '@proton/components/payments/client-extensions';
import { usePaymentsTelemetry } from '@proton/components/payments/client-extensions/usePaymentsTelemetry';
import type { PaymentProcessorType } from '@proton/components/payments/react-extensions/interface';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import { useLoading } from '@proton/hooks';
import metrics, { observeApiError } from '@proton/metrics';
import type { WebCoreSignupBackButtonTotal } from '@proton/metrics/types/web_core_signup_backButton_total_v1.schema';
import { type BillingAddress, DEFAULT_TAX_BILLING_ADDRESS, getPlansMap } from '@proton/payments';
import { checkReferrer } from '@proton/shared/lib/api/core/referrals';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { TelemetryAccountSignupEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { getHasAppExternalSignup, getIsVPNApp } from '@proton/shared/lib/authentication/apps';
import type { APP_NAMES, CLIENT_TYPES } from '@proton/shared/lib/constants';
import {
    APPS,
    BRAND_NAME,
    CYCLE,
    DEFAULT_CYCLE,
    MAIL_APP_NAME,
    PLANS,
    REFERRER_CODE_MAIL_TRIAL,
    SSO_PATHS,
} from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { getPlanFromPlanIDs, getPlanNameFromIDs } from '@proton/shared/lib/helpers/planIDs';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { getIsB2BAudienceFromPlan } from '@proton/shared/lib/helpers/subscription';
import type { Currency, Cycle, HumanVerificationMethodType } from '@proton/shared/lib/interfaces';
import { getLocalPart } from '@proton/shared/lib/keys/setupAddress';
import { getFreeCheckResult } from '@proton/shared/lib/subscription/freePlans';
import { getVPNServersCountData } from '@proton/shared/lib/vpn/serversCount';
import { useFlag } from '@proton/unleash';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import mailReferPage from '../../pages/refer-a-friend';
import mailTrialPage from '../../pages/trial';
import Layout from '../public/Layout';
import { defaultPersistentKey, getContinueToString } from '../public/helper';
import { getSubscriptionData } from '../single-signup-v2/helper';
import { getSignupTelemetryData } from '../single-signup-v2/measure';
import { useFlowRef } from '../useFlowRef';
import useLocationWithoutLocale from '../useLocationWithoutLocale';
import type { MetaTags } from '../useMetaTags';
import { useMetaTags } from '../useMetaTags';
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
import { getSignupApplication, getSubscriptionPrices, isMailReferAFriendSignup, isMailTrialSignup } from './helper';
import type {
    InviteData,
    PlanIDs,
    SignupActionResponse,
    SignupCacheResult,
    SignupModel,
    SubscriptionData,
} from './interfaces';
import { SignupSteps, SignupType } from './interfaces';
import type { TelemetryMeasurementData } from './measure';
import { getPlanIDsFromParams, getSignupSearchParams } from './searchParams';
import {
    handleCreateAccount,
    handleDisplayName,
    handleDone,
    handleHumanVerification,
    handlePayment,
    handleSaveRecovery,
    handleSelectPlan,
    handleSetupOrg,
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
    initialSearchParams?: URLSearchParams;
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
    initialSearchParams,
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

    useMetaTags(isMailRefer ? mailReferPage() : isMailTrial ? mailTrialPage() : metaTags);

    const normalApi = useApi();
    const history = useHistory();

    const ktActivation = useKTActivation();
    const mailTrialOfferEnabled = useFlag('MailTrialOffer');
    const driveTrialOfferEnabled = useFlag('DriveTrialOffer');
    const showGatewaysForBundlePlan = useFlag('ShowGatewaysForBundlePlan');

    // Override the app to always be mail in trial or refer-a-friend signup
    if (isMailTrial || isMailRefer) {
        toApp = APPS.PROTONMAIL;
        toAppName = MAIL_APP_NAME;
    }
    const [signupParameters] = useState(() => {
        const params = getSignupSearchParams(location.pathname, new URLSearchParams(location.search), {
            cycle: DEFAULT_CYCLE,
        });
        if (isMailTrial) {
            params.referrer = REFERRER_CODE_MAIL_TRIAL;
        }
        if (!params.email && initialSearchParams) {
            params.email = initialSearchParams.get('email') || params.email;
        }
        return params;
    });
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const ignoreHumanApi = <T,>(config: any) =>
        silentApi<T>({
            ...config,
            ignoreHandler: [API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED],
        });
    const { getPaymentsApi } = usePaymentsApi();
    const { getPreferredCurrency } = useCurrencies('v2-signup');
    const paymentsSilentApi = getPaymentsApi(silentApi);
    const getPlans = useGetPlans();
    const getPaymentStatus = useGetPaymentStatus();
    const { reportPaymentSuccess, reportPaymentFailure } = usePaymentsTelemetry({
        flow: 'signup',
    });
    const [loading, withLoading] = useLoading();
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

    const measure = (data: TelemetryMeasurementData) => {
        const values = 'values' in data ? data.values : {};
        const flow = (() => {
            if (toApp === APPS.PROTONCALENDAR) {
                return 'legacy_calendar_signup';
            }
            if (toApp === APPS.PROTONMAIL) {
                return 'legacy_mail_signup';
            }
            if (productParam === 'business') {
                return 'legacy_business_signup';
            }
            return 'legacy_generic_signup';
        })();
        return sendTelemetryReport({
            api: silentApi,
            measurementGroup: TelemetryMeasurementGroups.accountSignup,
            event: data.event,
            dimensions: {
                ...data.dimensions,
                flow,
            },
            values,
        }).catch(noop);
    };

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
    const vpnServers = model.vpnServersCountData;

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
        const fetchDependencies = async () => {
            const { referrer, invite } = signupParameters;

            await startUnAuthFlow().catch(noop);

            getVPNServersCountData(silentApi).then((vpnServersCountData) => setModelDiff({ vpnServersCountData }));

            const [{ Domains: domains }, referralData, plansResult] = await Promise.all([
                normalApi<{ Domains: string[] }>(queryAvailableDomains('signup')),
                referrer
                    ? await silentApi(checkReferrer(referrer))
                          .then(() => ({
                              referrer: referrer || '',
                              invite: invite || '',
                          }))
                          .catch(() => undefined)
                    : undefined,
                getPlans({ api: silentApi }),
            ]);

            const paymentStatus = await getPaymentStatus({ api: silentApi });

            const { plans: Plans, freePlan } = plansResult;

            if ((location.pathname === SSO_PATHS.REFER || location.pathname === SSO_PATHS.TRIAL) && !referralData) {
                history.replace(SSO_PATHS.SIGNUP);
            }

            const currency = getPreferredCurrency({
                status: paymentStatus,
                plans: Plans,
                paramCurrency: signupParameters.currency,
            });
            const plansMap = getPlansMap(Plans, currency, false);

            const planParameters = getPlanIDsFromParams(
                Plans,
                currency,
                signupParameters,
                {
                    plan: PLANS.FREE,
                },
                { showGatewaysForBundlePlan }
            );
            const cycle = signupParameters.cycle || DEFAULT_CYCLE;
            const billingAddress = DEFAULT_TAX_BILLING_ADDRESS;
            const coupon = signupParameters.coupon;

            const subscriptionData = await getSubscriptionData(paymentsSilentApi, {
                plansMap,
                planIDs: planParameters.planIDs,
                currency,
                cycle,
                coupon,
                billingAddress,
                skipUpsell: planParameters.defined,
            });

            setModelDiff({
                domains,
                plans: Plans,
                freePlan,
                plansMap,
                referralData,
                subscriptionData,
                inviteData: location.state?.invite,
                paymentStatus,
            });

            void measure({
                event: TelemetryAccountSignupEvents.pageLoad,
                dimensions: {},
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
            paymentsSilentApi,
            model.subscriptionData.planIDs,
            currency,
            model.subscriptionData.cycle,
            model.subscriptionData.billingAddress,
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
            paymentsSilentApi,
            model.subscriptionData.planIDs,
            model.subscriptionData.currency,
            cycle,
            model.subscriptionData.billingAddress,
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
            paymentsSilentApi,
            planIDs,
            model.subscriptionData.currency,
            model.subscriptionData.cycle,
            model.subscriptionData.billingAddress,
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

    const handleChangeBillingAddress = async (billingAddress: BillingAddress) => {
        const checkResult = await getSubscriptionPrices(
            paymentsSilentApi,
            model.subscriptionData.planIDs,
            model.subscriptionData.currency,
            model.subscriptionData.cycle,
            billingAddress,
            model.subscriptionData.checkResult.Coupon?.Code
        );

        setModelDiff({
            subscriptionData: {
                ...model.subscriptionData,
                billingAddress,
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

    const plan = getPlanFromPlanIDs(model.plansMap, model.subscriptionData.planIDs);
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
            return { upsellPlanName: PLANS.DRIVE };
        }

        if (toApp === APPS.PROTONPASS || toApp === APPS.PROTONEXTENSION || toApp === APPS.PROTONPASSBROWSEREXTENSION) {
            return { upsellPlanName: PLANS.PASS };
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
                            return getContinueToString(toAppName);
                        }
                        if (signupType.type === SignupType.Email) {
                            return '';
                        }
                        return c('Info').t`One account. All ${BRAND_NAME} services.`;
                    })()}
                    defaultEmail={accountData?.username || accountData?.email || signupParameters.email}
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
                            humanVerificationInline: true,
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
                    onSubscriptionData={async ({ planIDs, billingAddress }) => {
                        // Referral is always free even if there's a plan, and 1-month cycle
                        const cycle = CYCLE.MONTHLY;
                        const checkResult = getFreeCheckResult(model.subscriptionData.currency, cycle);

                        try {
                            await handlePlanSelectionCallback({ checkResult, planIDs, cycle, billingAddress });
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
                    hasMailTrialUpsell={toApp === APPS.PROTONMAIL && !signupParameters.noPromo && mailTrialOfferEnabled}
                    hasDriveTrialUpsell={
                        toApp === APPS.PROTONDRIVE && !signupParameters.noPromo && driveTrialOfferEnabled
                    }
                    freePlan={model.freePlan}
                    onBack={handleBackStep}
                    currency={model.subscriptionData.currency}
                    cycle={model.subscriptionData.cycle}
                    plans={model.plans}
                    paymentStatus={model.paymentStatus}
                    mostPopularPlanName={mostPopularPlanName}
                    upsellPlanName={upsellPlanName}
                    onChangeCurrency={handleChangeCurrency}
                    vpnServers={vpnServers}
                    currencySignupParam={signupParameters.currency}
                    onPlan={async ({ planIDs, cycle, coupon }) => {
                        try {
                            const validateFlow = createFlow();
                            const newCycle = cycle || model.subscriptionData.cycle;
                            const checkResult = await getSubscriptionPrices(
                                paymentsSilentApi,
                                planIDs,
                                model.subscriptionData.currency,
                                newCycle,
                                model.subscriptionData.billingAddress,
                                coupon || model.subscriptionData.checkResult.Coupon?.Code
                            );
                            if (!checkResult) {
                                return;
                            }

                            if (validateFlow()) {
                                await handlePlanSelectionCallback({ checkResult, planIDs, cycle: newCycle });
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
            {step === Payment && (
                <PaymentStep
                    api={normalApi}
                    onBack={handleBackStep}
                    plans={model.plans}
                    paymentStatus={model.paymentStatus}
                    plan={plan}
                    planName={planName}
                    subscriptionData={model.subscriptionData}
                    onChangeCurrency={handleChangeCurrency}
                    onChangeCycle={handleChangeCycle}
                    onChangePlanIDs={handleChangePlanIDs}
                    onChangeBillingAddress={handleChangeBillingAddress}
                    onPay={async (payment, type) => {
                        try {
                            if (!cache) {
                                throw new Error('Missing cache');
                            }

                            const subscriptionData: SubscriptionData = {
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
                    currencySignupParam={signupParameters.currency}
                />
            )}
            {step === CreatingAccount && (
                <LoadingStep
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

                            const getTelemetryParams = () => {
                                const subscriptionData = cache.subscriptionData;

                                const method: PaymentProcessorType | 'n/a' =
                                    subscriptionData.payment?.paymentProcessorType ?? 'n/a';
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

                            const validateFlow = createFlow();
                            const signupActionResponse = await handleSetupUser({
                                cache,
                                api: silentApi,
                                reportPaymentSuccess: () => {
                                    const { method, overrides } = getTelemetryParams();
                                    reportPaymentSuccess(method, overrides);
                                },
                                reportPaymentFailure: () => {
                                    const { method, overrides } = getTelemetryParams();
                                    reportPaymentFailure(method, overrides);
                                },
                            });

                            measure(getSignupTelemetryData(model.plansMap, cache));

                            {
                                const maybeSetupOrg = async () => {
                                    const cache = signupActionResponse.cache;
                                    const orgName = signupParameters.orgName;
                                    const api = cache.setupData?.api;
                                    const user = cache.setupData?.user;
                                    if (orgName && api && user && plan && getIsB2BAudienceFromPlan(plan.Name)) {
                                        const password = cache.accountData.password;
                                        const keyPassword = cache.setupData?.keyPassword || '';
                                        await handleSetupOrg({ api, user, password, keyPassword, orgName });
                                    }
                                };
                                await maybeSetupOrg().catch(noop);
                            }

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
                        } catch (error: any) {
                            handleBack();
                            handleError(error);

                            if (error?.config?.url?.endsWith?.('keys/setup')) {
                                captureMessage(`Signup setup failure`);
                            }

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
                            const updatedCache = await handleDisplayName({
                                displayName,
                                cache,
                            });

                            if (validateFlow()) {
                                const getNextStep = (cache: SignupCacheResult) => {
                                    if (cache.accountData.signupType === SignupType.Email) {
                                        // Ignore recovery step if signing up with an external email address because it's automatically set.
                                        return cache.ignoreExplore ? undefined : SignupSteps.Explore;
                                    }
                                    // The next step is recovery by default
                                    return SignupSteps.SaveRecovery;
                                };
                                const getResponse = (cache: SignupCacheResult): SignupActionResponse => {
                                    const to = getNextStep(cache);
                                    if (to) {
                                        return {
                                            cache,
                                            to,
                                        };
                                    }
                                    return handleDone({ cache });
                                };
                                await handleResult(getResponse(updatedCache));
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
                            await handleSaveRecovery({
                                cache,
                                recoveryEmail,
                                recoveryPhone,
                            });

                            if (validateFlow()) {
                                const getResponse = (cache: SignupCacheResult): SignupActionResponse => {
                                    if (cache.ignoreExplore) {
                                        return handleDone({ cache, appIntent: cache.appIntent });
                                    }
                                    return { cache, to: SignupSteps.Explore };
                                };
                                await handleResult(getResponse(cache));
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
                    plan={plan?.Name}
                    user={cache?.setupData?.user}
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
    const isCurrentStepSignup = step === SignupSteps.CreatingAccount && !hasDecoration;

    return (
        <Layout
            toApp={toApp}
            centeredContent={isCurrentStepSignup}
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
