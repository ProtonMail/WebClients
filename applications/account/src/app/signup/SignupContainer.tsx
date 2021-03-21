import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as History from 'history';
import { queryAvailableDomains } from 'proton-shared/lib/api/domains';
import { APP_NAMES, PAYMENT_METHOD_TYPES, TOKEN_TYPES } from 'proton-shared/lib/constants';
import { checkSubscription, subscribe } from 'proton-shared/lib/api/payments';
import { c } from 'ttag';
import {
    Address,
    Api,
    Currency,
    HumanVerificationMethodType,
    SubscriptionCheckResponse,
    User as tsUser,
} from 'proton-shared/lib/interfaces';
import { queryAddresses } from 'proton-shared/lib/api/addresses';
import { persistSession } from 'proton-shared/lib/authentication/persistedSessionHelper';
import { useHistory } from 'react-router-dom';
import { updateLocale } from 'proton-shared/lib/api/settings';
import { noop } from 'proton-shared/lib/helpers/function';
import { handleSetupKeys, handleSetupAddress } from 'proton-shared/lib/keys';
import { localeCode } from 'proton-shared/lib/i18n';
import { getUser } from 'proton-shared/lib/api/user';
import {
    useApi,
    useConfig,
    useLoading,
    useModals,
    usePlans,
    OnLoginCallback,
    HumanVerificationForm,
    usePayment,
    useMyLocation,
} from 'react-components';
import { ChallengeResult } from 'react-components/components/challenge/ChallengeFrame';
import { Payment, PaymentParameters } from 'react-components/containers/payments/interface';
import { handlePaymentToken } from 'react-components/containers/payments/paymentTokenHelper';
import { Steps } from 'react-components/containers/api/humanVerification/HumanVerificationForm';

import BackButton from '../public/BackButton';
import CreateAccountForm from './CreateAccountForm';
import RecoveryForm from './RecoveryForm';
import { HumanVerificationError, PlanIDs, SERVICES, SERVICES_KEYS, SIGNUP_STEPS, SignupModel } from './interfaces';
import { DEFAULT_CHECK_RESULT, DEFAULT_SIGNUP_MODEL } from './constants';
import { getToAppName } from '../public/helper';
import createHumanApi from './helpers/humanApi';
import CreatingAccount from './CreatingAccount';
import { hasPaidPlan } from './helpers/helper';
import handleCreateUser from './helpers/handleCreateUser';
import handleCreateExternalUser from './helpers/handleCreateExternalUser';
import createAuthApi from './helpers/authApi';
import Header from '../public/Header';
import Content from '../public/Content';
import Main from '../public/Main';
import Footer from '../public/Footer';
import SignupSupportDropdown from './SignupSupportDropdown';
import VerificationCodeForm from './VerificationCodeForm';
import Plans from './Plans';
import PaymentForm from './PaymentForm';

interface Props {
    onLogin: OnLoginCallback;
    toApp?: APP_NAMES;
    onBack?: () => void;
}

const {
    ACCOUNT_CREATION_USERNAME,
    NO_SIGNUP,
    RECOVERY_EMAIL,
    RECOVERY_PHONE,
    VERIFICATION_CODE,
    PLANS,
    PAYMENT,
    HUMAN_VERIFICATION,
    CREATING_ACCOUNT,
} = SIGNUP_STEPS;

interface CacheRef {
    payload?: { [key: string]: string };
}

const getSearchParams = (search: History.Search) => {
    const searchParams = new URLSearchParams(search);
    const maybeCurrency = searchParams.get('currency');
    const currency = ['EUR', 'CHF', 'USD'].includes(maybeCurrency as any) ? (maybeCurrency as Currency) : undefined;

    const cycle = Number(searchParams.get('billing'));
    const preSelectedPlan = searchParams.get('plan');
    const service = searchParams.get('service') as SERVICES_KEYS | undefined;
    return { currency, cycle, preSelectedPlan, service: service ? SERVICES[service] : undefined };
};

const getCardPayment = async ({
    api,
    createModal,
    currency,
    checkResult,
    paymentParameters,
}: {
    createModal: (modal: React.ReactNode) => void;
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

const SignupContainer = ({ toApp, onLogin, onBack }: Props) => {
    const history = useHistory();
    const { currency, cycle, preSelectedPlan, service } = useMemo(() => {
        return getSearchParams(history.location.search);
    }, [history.location.search]);

    const api = useApi();
    const { createModal } = useModals();
    const { CLIENT_TYPE } = useConfig();
    const [plans] = usePlans();
    const [myLocation] = useMyLocation();
    const [loading, withLoading] = useLoading();
    const [checkResult, setCheckResult] = useState<SubscriptionCheckResponse>(DEFAULT_CHECK_RESULT);

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
        ...(currency ? { currency } : {}),
        ...(cycle ? { cycle } : {}),
        // NOTE preSelectedPlan is used in a useEffect
    });

    const setModelDiff = (diff: Partial<SignupModel>) => setModel((model) => ({ ...model, ...diff }));

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
        amount: checkResult.AmountDue,
        currency: model.currency,
        onPay({ Payment }: PaymentParameters) {
            if (!Payment) {
                throw new Error('Missing payment details');
            }
            if (isInternalSignup && 'Token' in Payment?.Details) {
                humanApi.setToken(Payment.Details.Token, TOKEN_TYPES.PAYMENT);
            }
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            handleFinalizeSignup({ payment: Payment });
        },
    });

    const handleFinalizeSignup = async ({
        planIDs = model.planIDs,
        payment,
    }: { planIDs?: PlanIDs; payment?: Payment } = {}) => {
        const isBuyingPaidPlan = hasPaidPlan(planIDs);

        if (isBuyingPaidPlan && method === PAYMENT_METHOD_TYPES.CARD && !canPay) {
            setModelDiff({ step: PAYMENT });
            return;
        }

        let actualPayment = payment;
        const {
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

        if (isBuyingPaidPlan && method === PAYMENT_METHOD_TYPES.CARD) {
            const { Payment } = await getCardPayment({
                currency: model.currency,
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
            throw error;
        }

        setModelDiff({ step: CREATING_ACCOUNT });

        try {
            const authApi = await createAuthApi({
                api,
                username: username || email,
                password,
            });

            if (Object.keys(planIDs).length) {
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
                  })
                : undefined;

            const authResponse = authApi.getAuthResponse();
            const User = await authApi.api<{ User: tsUser }>(getUser()).then(({ User }) => User);
            await authApi.api(updateLocale(localeCode)).catch(noop);
            await persistSession({ ...authResponse, User, keyPassword, api });
            await onLogin({ ...authResponse, User, keyPassword });
        } catch (error) {
            // TODO: If any of these requests fail we should probably handle it differently
            return setModelDiff({ step: oldStep });
        }
    };

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                const [{ Domains: domains }] = await Promise.all([api<{ Domains: string[] }>(queryAvailableDomains())]);
                setModelDiff({ domains });
            } catch (error) {
                return setModelDiff({ step: NO_SIGNUP });
            }
        };
        withLoading(fetchDependencies());
    }, []);

    useEffect(() => {
        // Pre-select plan
        if (Array.isArray(plans) && preSelectedPlan) {
            const plan = plans.find(({ Name }) => Name === preSelectedPlan);
            if (plan) {
                const planIDs = { [plan.ID]: 1 };
                setModelDiff({ planIDs });
            }
        }
    }, [plans]);

    useEffect(() => {
        if (model.step === PLANS) {
            setCard('cvc', '');
        }
    }, [model.step]);

    useEffect(() => {
        const check = async () => {
            const result = await humanApi.api<SubscriptionCheckResponse>(
                checkSubscription({
                    PlanIDs: model.planIDs,
                    Currency: model.currency,
                    Cycle: model.cycle,
                    // CouponCode: model.couponCode
                })
            );
            setCheckResult(result);
        };
        if (hasPaidPlan(model.planIDs)) {
            withLoading(check());
        }
    }, [model.cycle, model.planIDs]);

    const { step } = model;

    if (step === NO_SIGNUP) {
        throw new Error('Missing dependencies');
    }

    const forkOrQueryApp = toApp || service;
    const toAppName = getToAppName(forkOrQueryApp);
    const disableExternalSignup = false;

    const firstPlanID = Object.keys(model.planIDs || {})[0];
    const selectedPlan = (plans || []).find(({ ID }) => firstPlanID === ID);
    const defaultCountry = myLocation?.Country?.toUpperCase();

    const [humanVerificationStep, setHumanVerificationStep] = useState(Steps.ENTER_DESTINATION);

    return (
        <Main larger={[PAYMENT, PLANS].includes(step)}>
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
                                const nextStep = model.signupType === 'email' ? VERIFICATION_CODE : RECOVERY_EMAIL;
                                setModelDiff({ step: nextStep });
                                if (payload) {
                                    addChallengePayload(payload);
                                }
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
                        left={
                            <BackButton
                                onClick={() => {
                                    setModelDiff({ step: ACCOUNT_CREATION_USERNAME });
                                }}
                            />
                        }
                    />
                    <Content>
                        <RecoveryForm
                            model={model}
                            onChange={setModelDiff}
                            defaultCountry={defaultCountry}
                            onSubmit={(payload) => {
                                addChallengePayload(payload);
                                const isBuyingPaidPlan = hasPaidPlan(model.planIDs);
                                if (isBuyingPaidPlan) {
                                    setModelDiff({ step: PAYMENT });
                                } else {
                                    setModelDiff({ step: PLANS });
                                }
                            }}
                            onSkip={(payload) => {
                                addChallengePayload(payload);
                                setModelDiff({ step: PLANS, recoveryEmail: '', recoveryPhone: '' });
                            }}
                        />
                    </Content>
                </>
            )}
            {step === PLANS && (
                <>
                    <Header
                        title={c('Title').t`Plans`}
                        left={
                            <BackButton
                                onClick={() => {
                                    let toStep = RECOVERY_EMAIL;
                                    if (model.username && model.recoveryPhone) {
                                        toStep = RECOVERY_PHONE;
                                    } else if (model.username) {
                                        toStep = RECOVERY_EMAIL;
                                    } else if (model.email) {
                                        toStep = VERIFICATION_CODE;
                                    }
                                    setModelDiff({ step: toStep });
                                }}
                            />
                        }
                    />
                    <Content>
                        <Plans
                            planNameSelected={selectedPlan?.Name}
                            plans={plans}
                            model={model}
                            onChange={setModelDiff}
                            loading={false}
                            onSelectPlan={(planID: string) => {
                                if (!planID) {
                                    // Select free plan
                                    setModelDiff({ planIDs: {}, step: CREATING_ACCOUNT });
                                    return handleFinalizeSignup({ planIDs: {} });
                                }
                                const plan = plans?.find(({ ID }) => ID === planID);
                                if (!plan) {
                                    throw new Error('Unknown plan');
                                }
                                setModelDiff({
                                    planIDs: { [plan.ID]: 1 },
                                    step: PAYMENT,
                                });
                            }}
                        />
                    </Content>
                </>
            )}
            {step === PAYMENT && (
                <>
                    <Header
                        title={c('Title').t`Choose a payment method`}
                        left={
                            <BackButton
                                onClick={() => {
                                    setModelDiff({ step: PLANS });
                                }}
                            />
                        }
                    />
                    <Content>
                        <PaymentForm
                            paypal={paypal}
                            paypalCredit={paypalCredit}
                            checkResult={checkResult}
                            model={model}
                            onChange={setModelDiff}
                            card={card}
                            onCardChange={setCard}
                            method={method}
                            onMethodChange={setMethod}
                            errors={paymentErrors}
                            canPay={canPay}
                            plans={plans}
                            loading={loading}
                            onSubmit={() => {
                                return handleFinalizeSignup();
                            }}
                        />
                    </Content>
                </>
            )}
            {step === VERIFICATION_CODE && (
                <>
                    <Header
                        title={c('Title').t`Account verification`}
                        left={
                            <BackButton
                                onClick={() => {
                                    setModelDiff({ step: ACCOUNT_CREATION_USERNAME });
                                }}
                            />
                        }
                    />
                    <Content>
                        <VerificationCodeForm
                            clientType={CLIENT_TYPE}
                            model={model}
                            onSubmit={() => {
                                const isBuyingPaidPlan = hasPaidPlan(model.planIDs);
                                if (isBuyingPaidPlan) {
                                    return setModelDiff({ step: PAYMENT });
                                }
                                setModelDiff({ step: PLANS });
                            }}
                            onBack={() => {
                                setModelDiff({
                                    step: ACCOUNT_CREATION_USERNAME,
                                });
                            }}
                            humanApi={humanApi}
                        />
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
                                        setModelDiff({ step: PLANS });
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
            {[PLANS, PAYMENT, CREATING_ACCOUNT].includes(step) ? null : (
                <Footer>
                    <SignupSupportDropdown />
                </Footer>
            )}
        </Main>
    );
};

export default SignupContainer;
