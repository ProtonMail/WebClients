import { useEffect, useRef, useState } from 'react';
import * as History from 'history';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import {
    APP_NAMES,
    CYCLE,
    PAYMENT_METHOD_TYPES,
    PLAN_SERVICES,
    PLAN_TYPES,
    PLANS,
    TOKEN_TYPES,
    ADDON_NAMES,
} from '@proton/shared/lib/constants';
import { checkSubscription, subscribe } from '@proton/shared/lib/api/payments';
import { c } from 'ttag';
import {
    Address,
    Api,
    Currency,
    Cycle,
    HumanVerificationMethodType,
    Plan,
    SubscriptionCheckResponse,
    User as tsUser,
} from '@proton/shared/lib/interfaces';
import { queryAddresses } from '@proton/shared/lib/api/addresses';
import { persistSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { updateLocale } from '@proton/shared/lib/api/settings';
import { noop } from '@proton/shared/lib/helpers/function';
import { getHasKeyMigrationGeneration, handleSetupAddress, handleSetupKeys } from '@proton/shared/lib/keys';
import { localeCode } from '@proton/shared/lib/i18n';
import { getUser } from '@proton/shared/lib/api/user';
import {
    Alert,
    Button,
    ChallengeResult,
    FeatureCode,
    HumanVerificationForm,
    OnLoginCallback,
    Payment as PaymentComponent,
    PlanSelection,
    SubscriptionCheckout,
    useFeature,
    useApi,
    useConfig,
    useLoading,
    useModals,
    useMyLocation,
    usePayment,
    usePlans,
    useVPNCountriesCount,
} from '@proton/components';
import { Payment, PaymentParameters } from '@proton/components/containers/payments/interface';
import { handlePaymentToken } from '@proton/components/containers/payments/paymentTokenHelper';
import { Steps } from '@proton/components/containers/api/humanVerification/HumanVerificationForm';
import PlanCustomization from '@proton/components/containers/payments/subscription/PlanCustomization';
import { getHasPlanType, hasPlanIDs } from '@proton/shared/lib/helpers/planIDs';
import { getFreeCheckResult } from '@proton/shared/lib/subscription/freePlans';

import BackButton from '../public/BackButton';
import CreateAccountForm from './CreateAccountForm';
import RecoveryForm from './RecoveryForm';
import { HumanVerificationError, PlanIDs, SERVICES, SERVICES_KEYS, SIGNUP_STEPS, SignupModel } from './interfaces';
import { DEFAULT_SIGNUP_MODEL } from './constants';
import { getToAppName } from '../public/helper';
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

    return { currency, cycle, preSelectedPlan, service, users, domains };
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
    onBack?: () => void;
    signupParameters?: ReturnType<typeof getSearchParams>;
}

const SignupContainer = ({ toApp, onLogin, onBack, signupParameters }: Props) => {
    const api = useApi();
    const { createModal } = useModals();
    const { CLIENT_TYPE } = useConfig();
    const [plans = []] = usePlans();
    const [myLocation] = useMyLocation();
    const [loading, withLoading] = useLoading();
    const [vpnCountries] = useVPNCountriesCount();
    const keyMigrationFeature = useFeature(FeatureCode.KeyMigration);

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
        errors: paymentErrors,
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
            domains,
            currency,
            cycle,
        } = model;

        const keyMigrationFeatureValue = await keyMigrationFeature
            .get<number>()
            .then(({ Value }) => Value)
            .catch(() => 0);

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

        try {
            const sharedCreationProps = {
                api: humanApi.api,
                clientType: CLIENT_TYPE,
                payload: cacheRef.current.payload,
                password,
            };
            if (isInternalSignup) {
                await handleCreateUser({ ...sharedCreationProps, username, recoveryEmail, recoveryPhone });
            } else {
                await handleCreateExternalUser({ ...sharedCreationProps, email });
            }
        } catch (error) {
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
                await authApi.api(
                    subscribe({
                        PlanIDs: planIDs,
                        Amount: checkResult.AmountDue,
                        Currency: currency,
                        Cycle: cycle,
                        Payment: actualPayment,
                        // TODO add coupon code
                    })
                );
            }

            const addresses = username
                ? await handleSetupAddress({ api: authApi.api, domains, username })
                : await authApi.api<{ Addresses: Address[] }>(queryAddresses()).then(({ Addresses }) => Addresses);

            const keyPassword = addresses.length
                ? await handleSetupKeys({
                      api: authApi.api,
                      addresses,
                      password,
                      hasAddressKeyMigrationGeneration: getHasKeyMigrationGeneration(keyMigrationFeatureValue),
                  })
                : undefined;

            const authResponse = authApi.getAuthResponse();
            const User = await authApi.api<{ User: tsUser }>(getUser()).then(({ User }) => User);
            await authApi.api(updateLocale(localeCode)).catch(noop);
            await persistSession({ ...authResponse, User, keyPassword, api });
            await onLogin({ ...authResponse, User, keyPassword, flow: 'signup' });
        } catch (error) {
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
            } catch (error) {
                return setModelDiff({ step: NO_SIGNUP });
            }
        };
        withLoading(fetchDependencies());
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
        run();
    }, [plans]);

    useEffect(() => {
        if (model.step === PLANS_STEP) {
            setCard('cvc', '');
        }
    }, [model.step]);

    const { step } = model;

    if (step === NO_SIGNUP) {
        throw new Error('Missing dependencies');
    }

    const toAppName = getToAppName(toApp);
    // TODO: Only some apps are allowed for this
    const disableExternalSignup = true;

    const defaultCountry = myLocation?.Country?.toUpperCase();

    const [humanVerificationStep, setHumanVerificationStep] = useState(Steps.ENTER_DESTINATION);

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
        withLoading(updateCheckResultTogether(model.planIDs, currency, model.cycle));
    };

    const handleChangeCycle = (cycle: Cycle) => {
        setModelDiff({
            cycle,
        });
        withLoading(updateCheckResultTogether(model.planIDs, model.currency, cycle));
    };

    const handleChangePlanIDs = (planIDs: PlanIDs) => {
        setModelDiff({
            planIDs,
        });
        withLoading(updateCheckResultTogether(planIDs, model.currency, model.cycle));
    };

    const handleFinalizePlanIDs = async (planIDs: PlanIDs, step: SIGNUP_STEPS) => {
        setModelDiff({
            planIDs,
            checkResult: await getSubscriptionPrices(planIDs, model.currency, model.cycle),
            step,
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
                                    withLoading(handleFinalizePlanIDs(model.planIDs, PAYMENT));
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

    return (
        <Main larger={[PLANS_STEP, CUSTOMISATION, PAYMENT].includes(step)}>
            {step === ACCOUNT_CREATION_USERNAME && (
                <>
                    <Header
                        title={c('Title').t`Create your Proton Account`}
                        subTitle={toAppName ? c('Info').t`to continue to ${toAppName}` : undefined}
                        left={onBack && <BackButton onClick={onBack} />}
                    />
                    <Content>
                        <CreateAccountForm
                            model={model}
                            onChange={setModelDiff}
                            humanApi={humanApi}
                            domains={model.domains}
                            onSubmit={(payload) => {
                                if (payload) {
                                    addChallengePayload(payload);
                                }
                                const nextStep = model.signupType === 'email' ? VERIFICATION_CODE : RECOVERY_EMAIL;
                                setModelDiff({ step: nextStep });
                            }}
                            hasChallenge={!cacheRef.current.payload || !Object.keys(cacheRef.current.payload).length}
                            hasExternalSignup={!disableExternalSignup}
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
                                handlePrePlanStep();
                            }}
                            onSkip={(payload) => {
                                addChallengePayload(payload);
                                handlePrePlanStep({ recoveryEmail: '', recoveryPhone: '' });
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
                                handlePrePlanStep();
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
            {step === CUSTOMISATION && (
                <>
                    <Header title={c('Title').t`Customize your plan`} left={<BackButton onClick={handleBack} />} />
                    <Content>
                        <div className="flex-no-min-children on-mobile-flex-column">
                            <div className="flex-item-fluid on-mobile-w100 on-tablet-landscape-pr1 on-mobile-pr0">
                                <div className="mlauto mrauto max-w50e border-bottom-children border-bottom-children--not-last">
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
                                if (method === PAYMENT_METHOD_TYPES.CARD && !canPay) {
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
                                                errors={paymentErrors}
                                            />
                                        ) : (
                                            <Alert>{c('Info').t`No payment is required at this time.`}</Alert>
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
                                    if (humanVerificationStep === Steps.ENTER_DESTINATION) {
                                        handleBack();
                                    } else {
                                        setHumanVerificationStep(Steps.ENTER_DESTINATION);
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
