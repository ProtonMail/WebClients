import { useEffect, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import * as History from 'history';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { checkReferrer } from '@proton/shared/lib/api/core/referrals';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import {
    APP_NAMES,
    CYCLE,
    PAYMENT_METHOD_TYPES,
    PLAN_SERVICES,
    PLAN_TYPES,
    PLANS,
    TOKEN_TYPES,
    ADDON_NAMES,
    COUPON_CODES,
    APPS,
    PLAN_NAMES,
    MAIL_APP_NAME,
    SSO_PATHS,
} from '@proton/shared/lib/constants';
import { checkSubscription, subscribe } from '@proton/shared/lib/api/payments';
import { c } from 'ttag';
import {
    Api,
    Currency,
    Cycle,
    HumanVerificationMethodType,
    Plan,
    SubscriptionCheckResponse,
    User,
    User as tsUser,
} from '@proton/shared/lib/interfaces';
import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { persistSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { updateLocale } from '@proton/shared/lib/api/settings';
import { noop } from '@proton/shared/lib/helpers/function';
import { handleSetupAddress, handleSetupKeys } from '@proton/shared/lib/keys';
import { localeCode } from '@proton/shared/lib/i18n';
import { getUser } from '@proton/shared/lib/api/user';
import {
    Button,
    ChallengeResult,
    FeatureCode,
    HumanVerificationForm,
    HumanVerificationSteps,
    OnLoginCallback,
    Payment as PaymentComponent,
    PlanSelection,
    SubscriptionCheckout,
    useApi,
    useConfig,
    useLoading,
    useModals,
    useMyLocation,
    usePayment,
    usePlans,
    useVPNCountriesCount,
    useLocalState,
    useFeature,
    ReferralFeaturesList,
} from '@proton/components';
import { Payment, PaymentParameters } from '@proton/components/containers/payments/interface';
import { handlePaymentToken } from '@proton/components/containers/payments/paymentTokenHelper';
import PlanCustomization from '@proton/components/containers/payments/subscription/PlanCustomization';
import { getHasPlanType, hasPlanIDs } from '@proton/shared/lib/helpers/planIDs';
import { getFreeCheckResult } from '@proton/shared/lib/subscription/freePlans';

import { getAppName } from '@proton/shared/lib/apps/helper';
import BackButton from '../public/BackButton';
import CreateAccountForm from './CreateAccountForm';
import RecoveryForm from './RecoveryForm';
import {
    HumanVerificationError,
    InviteData,
    PlanIDs,
    SERVICES,
    SERVICES_KEYS,
    SIGNUP_STEPS,
    SignupModel,
} from './interfaces';
import { DEFAULT_SIGNUP_MODEL } from './constants';
import { defaultPersistentKey, getHasAppExternalSignup, getToAppName } from '../public/helper';
import createHumanApi from './helpers/humanApi';
import CreatingAccount from './CreatingAccount';
import handleCreateUser from './helpers/handleCreateUser';
import handleCreateExternalUser from './helpers/handleCreateExternalUser';
import createAuthApi from './helpers/authApi';
import Header from '../public/Header';
import Content from '../public/Content';
import Main from '../public/Main';
import Footer from '../public/Footer';
import SignupSupportDropdown from './SignupSupportDropdown';
import VerificationCodeForm from './VerificationCodeForm';
import CheckoutButton from './CheckoutButton';

const {
    ACCOUNT_CREATION_USERNAME,
    NO_SIGNUP,
    RECOVERY_EMAIL,
    RECOVERY_PHONE,
    VERIFICATION_CODE,
    PLANS: PLANS_STEP,
    TRIAL_PLAN,
    CUSTOMISATION,
    PAYMENT,
    HUMAN_VERIFICATION,
    CREATING_ACCOUNT,
} = SIGNUP_STEPS;

interface CacheRef {
    payload?: { [key: string]: string };
}

export const getSearchParams = (search: History.Search) => {
    const searchParams = new URLSearchParams(search);

    const maybeCurrency = searchParams.get('currency') as Currency | undefined;
    const currency = maybeCurrency && ['EUR', 'CHF', 'USD'].includes(maybeCurrency) ? maybeCurrency : undefined;

    const maybeCycle = Number(searchParams.get('billing')) || Number(searchParams.get('cycle'));
    const cycle = [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS].includes(maybeCycle) ? maybeCycle : undefined;

    const maybeUsers = Number(searchParams.get('users'));
    const users = maybeUsers >= 1 && maybeUsers <= 5000 ? maybeUsers : undefined;
    const maybeDomains = Number(searchParams.get('domains'));
    const domains = maybeDomains >= 1 && maybeDomains <= 100 ? maybeDomains : undefined;

    const maybeService = searchParams.get('service') as SERVICES_KEYS | undefined;
    const service = maybeService ? SERVICES[maybeService] : undefined;

    // plan is validated by comparing plans after it's loaded
    const maybePreSelectedPlan = searchParams.get('plan');
    // static sites use 'business' for pro plan
    const preSelectedPlan = maybePreSelectedPlan === 'business' ? 'professional' : maybePreSelectedPlan;

    const referrer = searchParams.get('referrer') || undefined; // referral ID
    const invite = searchParams.get('invite') || undefined;

    return { currency, cycle, preSelectedPlan, service, users, domains, referrer, invite };
};

const getPlanIDsFromParams = (plans: Plan[], signupParameters: ReturnType<typeof getSearchParams>) => {
    if (!signupParameters.preSelectedPlan) {
        return;
    }

    if (signupParameters.preSelectedPlan === 'free') {
        return {};
    }

    const plan = plans.find(({ Name, Type }) => {
        return Name === signupParameters.preSelectedPlan && Type === PLAN_TYPES.PLAN;
    });

    if (!plan) {
        return;
    }

    const planIDs = { [plan.ID]: 1 };

    if (plan.Name === PLANS.PROFESSIONAL) {
        if (signupParameters.users !== undefined) {
            const usersAddon = plans.find(({ Name }) => Name === ADDON_NAMES.MEMBER);
            const amount = signupParameters.users - plan.MaxMembers;
            if (usersAddon && amount > 0) {
                planIDs[usersAddon.ID] = amount;
            }
        }

        if (signupParameters.domains !== undefined) {
            const domainsAddon = plans.find(({ Name }) => Name === ADDON_NAMES.DOMAIN);
            const amount = signupParameters.domains - plan.MaxDomains;
            if (domainsAddon && amount > 0) {
                planIDs[domainsAddon.ID] = amount;
            }
        }
    }

    return planIDs;
};

const getCardPayment = async ({
    api,
    createModal,
    currency,
    checkResult,
    paymentParameters,
}: {
    createModal: (modal: JSX.Element) => void;
    api: Api;
    currency: string;
    paymentParameters: PaymentParameters;
    checkResult: SubscriptionCheckResponse;
}) => {
    return handlePaymentToken({
        params: {
            ...paymentParameters,
            Amount: checkResult.AmountDue,
            Currency: currency,
        },
        api,
        createModal,
        mode: '',
    });
};

interface Props {
    onLogin: OnLoginCallback;
    toApp?: APP_NAMES;
    toAppName?: string;
    onBack?: () => void;
    signupParameters?: ReturnType<typeof getSearchParams>;
}

const SignupContainer = ({ toApp, toAppName = getToAppName(toApp), onLogin, onBack, signupParameters }: Props) => {
    const api = useApi();
    const location = useLocation<{ invite?: InviteData }>();
    const history = useHistory();
    const inviteRef = useRef(location.state?.invite);
    const { createModal } = useModals();
    const { CLIENT_TYPE } = useConfig();
    const [plans = []] = usePlans();
    const [myLocation] = useMyLocation();
    const [loading, withLoading] = useLoading();
    const [vpnCountries] = useVPNCountriesCount();
    const externalSignupFeature = useFeature(FeatureCode.ExternalSignup);
    const mailAppName = getAppName(APPS.PROTONMAIL);

    const [persistent] = useLocalState(true, defaultPersistentKey);

    const cacheRef = useRef<CacheRef>({});
    const [humanApi] = useState(() => createHumanApi({ api, createModal }));

    const addChallengePayload = (payload: ChallengeResult) => {
        const oldPayload = cacheRef.current.payload || {};
        cacheRef.current.payload = {
            ...oldPayload,
            ...payload,
        };
    };

    const [model, setModel] = useState<SignupModel>({
        ...DEFAULT_SIGNUP_MODEL,
        ...(signupParameters?.currency ? { currency: signupParameters?.currency } : {}),
        ...(signupParameters?.cycle ? { cycle: signupParameters?.cycle } : {}),
        checkResult: getFreeCheckResult(signupParameters?.currency, signupParameters?.cycle),
    });

    const setModelDiff = (diff: Partial<SignupModel>) => {
        return setModel((model) => ({
            ...model,
            ...diff,
            // Never add last step into the history
            ...(diff.step && !diff.stepHistory && model.step !== CREATING_ACCOUNT && diff.step !== model.step
                ? // Filter out self from history, can happen for human verification
                  { stepHistory: [...model.stepHistory.filter((x) => x !== model.step), model.step] }
                : undefined),
        }));
    };

    const isInternalSignup = !!model.username;

    const {
        card,
        setCard,
        handleCardSubmit,
        cardErrors,
        method,
        setMethod,
        parameters: paymentParameters,
        canPay,
        paypal,
        paypalCredit,
    } = usePayment({
        amount: model.checkResult.AmountDue,
        currency: model.currency,
        onPay({ Payment }: PaymentParameters) {
            if (!Payment) {
                throw new Error('Missing payment details');
            }
            if (isInternalSignup && 'Token' in Payment?.Details) {
                humanApi.setToken(Payment.Details.Token, TOKEN_TYPES.PAYMENT);
            }
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            handleFinalizeSignup({ payment: Payment }).catch(noop);
        },
    });

    const handleFinalizeSignup = async ({
        planIDs = model.planIDs,
        payment,
    }: { planIDs?: PlanIDs; payment?: Payment } = {}) => {
        const isBuyingPaidPlan = hasPlanIDs(planIDs);

        let actualPayment = payment;
        const {
            checkResult,
            step: oldStep,
            username,
            password,
            email,
            recoveryEmail,
            recoveryPhone,
            isReferred,
            domains,
            currency,
            cycle,
        } = model;

        if (isBuyingPaidPlan && method === PAYMENT_METHOD_TYPES.CARD) {
            const { Payment } = await getCardPayment({
                currency,
                createModal,
                api,
                paymentParameters,
                checkResult,
            });
            if (isInternalSignup && Payment && 'Token' in Payment.Details) {
                // Use payment token to prove humanity for internal paid account
                humanApi.setToken(Payment.Details.Token, TOKEN_TYPES.PAYMENT);
            }
            actualPayment = Payment;
        }

        const invite = inviteRef.current;
        if (isInternalSignup && !humanApi.hasToken() && invite) {
            humanApi.setToken(`${invite.selector}:${invite.token}`, 'invite');
        }

        const handleCreate = async (): Promise<{ User: User }> => {
            const sharedCreationProps = {
                api: humanApi.api,
                clientType: CLIENT_TYPE,
                payload: cacheRef.current.payload,
                password,
            };
            if (!isInternalSignup) {
                return handleCreateExternalUser({ ...sharedCreationProps, email });
            }
            const referralProps = isReferred
                ? { invite: signupParameters?.invite, referrer: signupParameters?.referrer }
                : {};
            try {
                return await handleCreateUser({
                    ...sharedCreationProps,
                    ...referralProps,
                    username,
                    recoveryEmail,
                    recoveryPhone,
                });
            } catch (error) {
                const { code, details } = getApiError(error);
                if (code === API_CUSTOM_ERROR_CODES.USER_CREATE_TOKEN_INVALID && humanApi.getTokenType() === 'invite') {
                    inviteRef.current = undefined;
                    humanApi.clearToken();
                    // Remove state from history
                    history.replace(location.pathname);
                    // Retry the creation without the invite tokens
                    return handleCreate();
                }
                if (code === API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED) {
                    const { HumanVerificationMethods = [], HumanVerificationToken = '' } = details || {};
                    throw new HumanVerificationError(HumanVerificationMethods, HumanVerificationToken);
                }
                throw error;
            }
        };

        try {
            await handleCreate();
        } catch (error: any) {
            if (error instanceof HumanVerificationError) {
                return setModelDiff({
                    step: HUMAN_VERIFICATION,
                    humanVerificationMethods: error.methods,
                    humanVerificationToken: error.token,
                });
            }
            setModelDiff({ step: oldStep, stepHistory: model.stepHistory });
            throw error;
        }

        setModelDiff({ step: CREATING_ACCOUNT });

        try {
            const authApi = await createAuthApi({
                api,
                username: username || email,
                password,
            });

            if (hasPlanIDs(planIDs)) {
                const paymentProps = isReferred
                    ? { Codes: [COUPON_CODES.REFERRAL], Amount: 0 }
                    : { Payment: actualPayment };
                await authApi.api(
                    subscribe({
                        Amount: checkResult.AmountDue,
                        PlanIDs: planIDs,
                        Currency: currency,
                        Cycle: cycle,
                        ...paymentProps, // Overriding Amount
                    })
                );
            }

            const addresses = username
                ? await handleSetupAddress({ api: authApi.api, domains, username })
                : await getAllAddresses(authApi.api);

            const keyPassword = addresses.length
                ? await handleSetupKeys({
                      api: authApi.api,
                      addresses,
                      password,
                      hasAddressKeyMigrationGeneration: true,
                  })
                : undefined;

            const authResponse = authApi.getAuthResponse();
            const User = await authApi.api<{ User: tsUser }>(getUser()).then(({ User }) => User);
            await authApi.api(updateLocale(localeCode)).catch(noop);
            await persistSession({ ...authResponse, User, keyPassword, api, persistent });
            await onLogin({ ...authResponse, User, keyPassword, flow: 'signup', persistent });
        } catch (error: any) {
            // TODO: If any of these requests fail we should probably handle it differently
            return setModelDiff({ step: oldStep, stepHistory: model.stepHistory });
        }
    };

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                const [{ Domains: domains }] = await Promise.all([
                    api<{ Domains: string[] }>(queryAvailableDomains('signup')),
                ]);
                setModelDiff({ domains });
            } catch (error: any) {
                return setModelDiff({ step: NO_SIGNUP });
            }
        };
        void withLoading(fetchDependencies());
    }, []);

    const getSubscriptionPrices = async (planIDs: PlanIDs, currency: Currency, cycle: Cycle, couponCode?: string) => {
        if (!hasPlanIDs(planIDs)) {
            return getFreeCheckResult(currency, cycle);
        }
        return humanApi.api<SubscriptionCheckResponse>(
            checkSubscription({
                PlanIDs: planIDs,
                Currency: currency,
                Cycle: cycle,
                CouponCode: couponCode,
            })
        );
    };

    const preSelectedPlanRunRef = useRef(false);
    useEffect(() => {
        if (
            preSelectedPlanRunRef.current ||
            !Array.isArray(plans) ||
            !plans.length ||
            !signupParameters?.preSelectedPlan
        ) {
            return;
        }
        preSelectedPlanRunRef.current = true;
        const planIDs = getPlanIDsFromParams(plans, signupParameters);
        if (!planIDs) {
            return;
        }
        // Specifically selecting free plan
        if (planIDs && !hasPlanIDs(planIDs)) {
            setModelDiff({ planIDs, skipPlanStep: true });
            return;
        }
        const run = async () => {
            const checkResult = await getSubscriptionPrices(planIDs, model.currency, model.cycle);
            setModelDiff({ checkResult, planIDs, skipPlanStep: true });
        };
        void run();
    }, [plans]);

    useEffect(() => {
        if (model.step === PLANS_STEP) {
            setCard('cvc', '');
        }
    }, [model.step]);

    useEffect(() => {
        const check = async (referrer: string) => {
            try {
                await api({ ...checkReferrer(referrer), silence: true });
                setModelDiff({ isReferred: true });
            } catch (error) {
                if (location.pathname === SSO_PATHS.REFER) {
                    history.replace(SSO_PATHS.SIGNUP);
                }
            }
        };
        if (signupParameters?.referrer) {
            void withLoading(check(signupParameters.referrer));
        }
    }, []);

    const { step } = model;

    if (step === NO_SIGNUP) {
        throw new Error('Missing dependencies');
    }

    const hasAppExternalSignup = externalSignupFeature.feature?.Value && getHasAppExternalSignup(toApp);

    const defaultCountry = myLocation?.Country?.toUpperCase();

    const [humanVerificationStep, setHumanVerificationStep] = useState(HumanVerificationSteps.ENTER_DESTINATION);

    const getHasCustomisationStep = (planIDs: PlanIDs) => {
        return hasPlanIDs(planIDs) && getHasPlanType(planIDs, plans, PLANS.PROFESSIONAL);
    };

    const handlePrePlanStep = (diff?: Partial<SignupModel>) => {
        if (!model.skipPlanStep) {
            setModelDiff({
                ...diff,
                step: PLANS_STEP,
            });
            return;
        }

        if (hasPlanIDs(model.planIDs)) {
            if (model.isReferred) {
                // Previous step was recovery method
                // Subscribing to plus plan with referrer token
                return handleFinalizeSignup().catch(noop);
            }

            if (getHasCustomisationStep(model.planIDs)) {
                setModelDiff({
                    ...diff,
                    step: CUSTOMISATION,
                });
                return;
            }

            setModelDiff({
                ...diff,
                step: PAYMENT,
            });
            return;
        }

        setModelDiff({
            ...diff,
            checkResult: getFreeCheckResult(model.currency, model.cycle),
            step: CREATING_ACCOUNT,
        });

        return handleFinalizeSignup().catch(noop);
    };

    const updateCheckResultTogether = async (
        planIDs: PlanIDs,
        currency: Currency,
        cycle: Cycle,
        couponCode?: string
    ) => {
        setModelDiff({
            currency,
            cycle,
            planIDs,
            checkResult: await getSubscriptionPrices(planIDs, currency, cycle, couponCode),
        });
    };

    const handleChangeCurrency = (currency: Currency) => {
        setModelDiff({
            currency,
        });
        void withLoading(updateCheckResultTogether(model.planIDs, currency, model.cycle));
    };

    const handleChangeCycle = (cycle: Cycle) => {
        setModelDiff({
            cycle,
        });
        void withLoading(updateCheckResultTogether(model.planIDs, model.currency, cycle));
    };

    const handleChangePlanIDs = (planIDs: PlanIDs) => {
        setModelDiff({
            planIDs,
        });
        void withLoading(updateCheckResultTogether(planIDs, model.currency, model.cycle));
    };

    const handleFinalizePlanIDs = async (planIDs: PlanIDs, step: SIGNUP_STEPS) => {
        setModelDiff({
            planIDs,
            checkResult: await getSubscriptionPrices(planIDs, model.currency, model.cycle),
            step,
        });
    };

    const selectTrialPlan = () => {
        const { ID = '' } = plans.find((plan) => plan.Name === PLANS.PLUS) || {};
        const planIDs = { [ID]: 1 };
        const cycle = CYCLE.MONTHLY;
        setModelDiff({
            planIDs,
            cycle,
            checkResult: getFreeCheckResult(model.currency, model.cycle),
            step: RECOVERY_EMAIL,
            skipPlanStep: true,
        });
    };

    const selectFreePlan = () => {
        const planIDs = {};
        setModelDiff({
            planIDs,
            checkResult: getFreeCheckResult(model.currency, model.cycle),
            step: RECOVERY_EMAIL,
            skipPlanStep: true,
        });
    };

    const subscriptionCheckout = (
        <div className="subscriptionCheckout-column bg-weak on-mobile-w100">
            <div className="subscriptionCheckout-container">
                <SubscriptionCheckout
                    submit={
                        model.step === CUSTOMISATION ? (
                            <Button
                                type="submit"
                                loading={loading}
                                color="norm"
                                onClick={() => {
                                    // Ensure that the check result is up to date.
                                    void withLoading(handleFinalizePlanIDs(model.planIDs, PAYMENT));
                                }}
                                fullWidth
                            >{c('Action').t`Proceed to checkout`}</Button>
                        ) : (
                            <CheckoutButton
                                loading={loading}
                                canPay={canPay}
                                paypal={paypal}
                                method={method}
                                checkResult={model.checkResult}
                                className="w100"
                            />
                        )
                    }
                    plans={plans}
                    checkResult={model.checkResult}
                    loading={loading}
                    service={PLAN_SERVICES.MAIL}
                    currency={model.currency}
                    cycle={model.cycle}
                    planIDs={model.planIDs}
                    onChangeCurrency={handleChangeCurrency}
                    onChangeCycle={handleChangeCycle}
                />
            </div>
        </div>
    );

    const getBackDiff = () => {
        if (!model.stepHistory.length) {
            return {};
        }
        const newStepHistory = [...model.stepHistory];
        const newStep = newStepHistory.pop();
        return {
            step: newStep,
            stepHistory: newStepHistory,
        };
    };

    const handleBack = () => {
        setModelDiff(getBackDiff());
    };

    const getCreateAccountTitle = () => {
        if (model.isReferred) {
            return c('Title').t`You’ve been invited to try ${mailAppName}`;
        }

        return c('Title').t`Create your Proton Account`;
    };

    const getCreateAccountSubtitle = () => {
        if (model.isReferred) {
            return c('Title').t`Secure email based in Switzerland`;
        }

        if (toAppName) {
            return c('Info').t`to continue to ${toAppName}`;
        }

        return undefined;
    };

    return (
        <Main larger={[PLANS_STEP, CUSTOMISATION, PAYMENT].includes(step)}>
            {step === ACCOUNT_CREATION_USERNAME && (
                <>
                    <Header
                        title={getCreateAccountTitle()}
                        subTitle={getCreateAccountSubtitle()}
                        left={onBack && !model.isReferred ? <BackButton onClick={onBack} /> : null}
                    />
                    <Content>
                        <CreateAccountForm
                            model={model}
                            onChange={setModelDiff}
                            humanApi={humanApi}
                            domains={model.domains}
                            onSubmit={async (payload) => {
                                if (payload) {
                                    addChallengePayload(payload);
                                }
                                if (model.signupType === 'email') {
                                    return handlePrePlanStep();
                                }
                                if (model.isReferred) {
                                    setModelDiff({ step: TRIAL_PLAN });
                                    return;
                                }
                                setModelDiff({ step: RECOVERY_EMAIL });
                            }}
                            hasChallenge={!cacheRef.current.payload || !Object.keys(cacheRef.current.payload).length}
                            hasExternalSignup={hasAppExternalSignup}
                            loading={externalSignupFeature.loading}
                        />
                    </Content>
                </>
            )}
            {(step === RECOVERY_EMAIL || step === RECOVERY_PHONE) && (
                <>
                    <Header
                        title={c('Title').t`Add a recovery method`}
                        subTitle={c('Title').t`(highly recommended)`}
                        left={<BackButton onClick={handleBack} />}
                    />
                    <Content>
                        <RecoveryForm
                            model={model}
                            onChange={setModelDiff}
                            defaultCountry={defaultCountry}
                            hasChallenge={!cacheRef.current.payload || Object.keys(cacheRef.current.payload).length < 2}
                            onSubmit={(payload) => {
                                addChallengePayload(payload);
                                void handlePrePlanStep();
                            }}
                            onSkip={(payload) => {
                                addChallengePayload(payload);
                                void handlePrePlanStep({ recoveryEmail: '', recoveryPhone: '' });
                            }}
                        />
                    </Content>
                </>
            )}
            {step === VERIFICATION_CODE && (
                <>
                    <Header title={c('Title').t`Account verification`} left={<BackButton onClick={handleBack} />} />
                    <Content>
                        <VerificationCodeForm
                            clientType={CLIENT_TYPE}
                            model={model}
                            onSubmit={() => {
                                void handlePrePlanStep();
                            }}
                            onBack={handleBack}
                            humanApi={humanApi}
                        />
                    </Content>
                </>
            )}
            {step === PLANS_STEP && (
                <>
                    <Header title={c('Title').t`Plan selection`} left={<BackButton onClick={handleBack} />} />
                    <Content>
                        <PlanSelection
                            mode="signup"
                            loading={loading}
                            plans={plans || []}
                            currency={model.currency}
                            cycle={model.cycle}
                            planIDs={model.planIDs}
                            service={PLAN_SERVICES.MAIL}
                            vpnCountries={vpnCountries}
                            onChangePlanIDs={async (planIDs) => {
                                if (!hasPlanIDs(planIDs)) {
                                    setModelDiff({
                                        planIDs,
                                        checkResult: getFreeCheckResult(model.currency, model.cycle),
                                        step: CREATING_ACCOUNT,
                                    });
                                    return handleFinalizeSignup({ planIDs }).catch(noop);
                                }
                                return withLoading(
                                    handleFinalizePlanIDs(
                                        planIDs,
                                        getHasCustomisationStep(planIDs) ? CUSTOMISATION : PAYMENT
                                    )
                                );
                            }}
                            onChangeCurrency={handleChangeCurrency}
                            onChangeCycle={handleChangeCycle}
                        />
                    </Content>
                </>
            )}
            {step === TRIAL_PLAN && (
                <>
                    <Header
                        title={c('Title').t`Try the best of ${MAIL_APP_NAME} for free`}
                        left={<BackButton onClick={handleBack} />}
                    />
                    <Content>
                        <h1>
                            {getAppName(APPS.PROTONMAIL)} {PLAN_NAMES[PLANS.PLUS]}
                        </h1>
                        <p>{c('Subtitle for trial plan')
                            .t`The privacy-first Mail and Calendar solution for your everyday communications needs.`}</p>
                        <ReferralFeaturesList />

                        <Button color="norm" shape="solid" className="mb0-5" onClick={selectTrialPlan} fullWidth>{c(
                            'Action in trial plan'
                        ).t`Try free for 30 days`}</Button>
                        <p className="text-center mt0 mb0-5">
                            <small className="color-weak">{c('Info').t`No credit card required`}</small>
                        </p>
                        <Button color="norm" shape="ghost" onClick={selectFreePlan} fullWidth>{c('Action in trial plan')
                            .t`No, thanks`}</Button>
                    </Content>
                </>
            )}
            {step === CUSTOMISATION && (
                <>
                    <Header title={c('Title').t`Customize your plan`} left={<BackButton onClick={handleBack} />} />
                    <Content>
                        <div className="flex-no-min-children on-mobile-flex-column">
                            <div className="flex-item-fluid on-mobile-w100 on-tablet-landscape-pr1 on-mobile-pr0">
                                <div className="mlauto mrauto max-w50e divide-y">
                                    <PlanCustomization
                                        plans={plans}
                                        loading={loading}
                                        currency={model.currency}
                                        cycle={model.cycle}
                                        planIDs={model.planIDs}
                                        service={PLAN_SERVICES.MAIL}
                                        hasMailPlanPicker={false}
                                        onChangePlanIDs={handleChangePlanIDs}
                                        onChangeCycle={handleChangeCycle}
                                    />
                                </div>
                            </div>
                            {subscriptionCheckout}
                        </div>
                    </Content>
                </>
            )}
            {step === PAYMENT && (
                <>
                    <Header title={c('Title').t`Checkout`} left={<BackButton onClick={handleBack} />} />
                    <Content>
                        <form
                            name="payment-form"
                            onSubmit={(event) => {
                                event.preventDefault();
                                if (!handleCardSubmit()) {
                                    return;
                                }
                                withLoading(handleFinalizeSignup()).catch(noop);
                            }}
                            method="post"
                        >
                            <div className="flex-no-min-children on-mobile-flex-column">
                                <div className="flex-item-fluid on-mobile-w100 on-tablet-landscape-pr1 on-mobile-pr0">
                                    <div className="mlauto mrauto max-w37e on-mobile-max-w100  ">
                                        {model.checkResult?.AmountDue ? (
                                            <PaymentComponent
                                                type="signup"
                                                paypal={paypal}
                                                paypalCredit={paypalCredit}
                                                method={method}
                                                amount={model.checkResult.AmountDue}
                                                currency={model.currency}
                                                card={card}
                                                onMethod={setMethod}
                                                onCard={setCard}
                                                cardErrors={cardErrors}
                                            />
                                        ) : (
                                            <div className="mb1">{c('Info')
                                                .t`No payment is required at this time.`}</div>
                                        )}
                                    </div>
                                </div>
                                {subscriptionCheckout}
                            </div>
                        </form>
                    </Content>
                </>
            )}
            {step === HUMAN_VERIFICATION && (
                <>
                    <Header
                        title={c('Title').t`Are you human?`}
                        left={
                            <BackButton
                                onClick={() => {
                                    humanApi.clearToken();
                                    if (humanVerificationStep === HumanVerificationSteps.ENTER_DESTINATION) {
                                        handleBack();
                                    } else {
                                        setHumanVerificationStep(HumanVerificationSteps.ENTER_DESTINATION);
                                    }
                                }}
                            />
                        }
                    />

                    <Content>
                        <HumanVerificationForm
                            defaultCountry={defaultCountry}
                            defaultEmail={model.recoveryEmail}
                            defaultPhone={model.recoveryPhone}
                            token={model.humanVerificationToken}
                            methods={model.humanVerificationMethods}
                            step={humanVerificationStep}
                            onChangeStep={setHumanVerificationStep}
                            onClose={() => {
                                humanApi.clearToken();
                                handleBack();
                            }}
                            onSubmit={(token: string, tokenType: HumanVerificationMethodType) => {
                                humanApi.setToken(token, tokenType);
                                return handleFinalizeSignup();
                            }}
                        />
                    </Content>
                </>
            )}

            {step === CREATING_ACCOUNT && (
                <>
                    <Header title={c('Title').t`Creating account`} />
                    <Content>
                        <CreatingAccount model={model} />
                    </Content>
                </>
            )}

            {[PLANS_STEP, CUSTOMISATION, PAYMENT, CREATING_ACCOUNT].includes(step) ? null : (
                <Footer>
                    <SignupSupportDropdown />
                </Footer>
            )}
        </Main>
    );
};

export default SignupContainer;
