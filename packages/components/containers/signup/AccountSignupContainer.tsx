import React, { FunctionComponent, useEffect, useMemo, useRef, useState } from 'react';
import * as History from 'history';
import { queryAvailableDomains } from 'proton-shared/lib/api/domains';
import { APP_NAMES, PAYMENT_METHOD_TYPES, TOKEN_TYPES, APPS, PLAN_SERVICES } from 'proton-shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from 'proton-shared/lib/errors';
import { checkSubscription, subscribe } from 'proton-shared/lib/api/payments';
import { c } from 'ttag';
import {
    Address,
    Currency,
    Cycle,
    HumanVerificationMethodType,
    SubscriptionCheckResponse,
    User as tsUser,
} from 'proton-shared/lib/interfaces';
import { queryAddresses } from 'proton-shared/lib/api/addresses';
import { getApiErrorMessage } from 'proton-shared/lib/api/helpers/apiErrorHelper';
import { persistSession } from 'proton-shared/lib/authentication/persistedSessionHelper';
import { useHistory } from 'react-router-dom';
import { updateLocale } from 'proton-shared/lib/api/settings';
import { noop } from 'proton-shared/lib/helpers/function';
import { handleSetupKeys } from 'proton-shared/lib/keys';
import { localeCode } from 'proton-shared/lib/i18n';
import {
    getUser,
    queryCheckUsernameAvailability,
    queryCheckVerificationCode,
    queryDirectSignupStatus,
    queryVerificationCode,
} from 'proton-shared/lib/api/user';
import { useApi, useConfig, useLoading, useModals, usePlans } from '../../hooks';
import BackButton from './BackButton';
import HumanVerificationForm from '../api/humanVerification/HumanVerificationForm';
import usePayment from '../payments/usePayment';
import { OnLoginCallback } from '../app/interface';
import { Props as AccountPublicLayoutProps } from './AccountPublicLayout';
import SignupAccountForm from './SignupAccountForm';
import SignupRecoveryForm from './SignupRecoveryForm';
import SignupVerificationCodeForm from './SignupVerificationCodeForm';
import SignupPlans from './SignupPlans';
import SignupPayment from './SignupPayment';
import NoSignup from './NoSignup';
import InvalidVerificationCodeModal from '../api/humanVerification/InvalidVerificationCodeModal';
import { HumanVerificationError, PlanIDs, SERVICES, SERVICES_KEYS, SignupModel } from './interfaces';
import { DEFAULT_CHECK_RESULT, SIGNUP_STEPS } from './constants';
import createHumanApi from './helpers/humanApi';
import RequestNewCodeModal from '../api/humanVerification/RequestNewCodeModal';
import SignupCreatingAccount from './SignupCreatingAccount';
import { Payment, PaymentParameters } from '../payments/interface';
import { ChallengeResult } from '../../components/challenge/ChallengeFrame';
import getSignupErrors from './helpers/getSignupErrors';
import { getToAppName, hasPaidPlan } from './helpers/helper';
import { handlePaymentToken } from '../payments/paymentTokenHelper';
import handleCreateUser from './helpers/handleCreateUser';
import handleCreateExternalUser from './helpers/handleCreateExternalUser';
import createAuthApi from './helpers/authApi';
import handleSetupAddress from './helpers/handleSetupAddress';
import OneAccountIllustration from '../illustration/OneAccountIllustration';

export const DEFAULT_SIGNUP_MODEL: SignupModel = {
    step: SIGNUP_STEPS.ACCOUNT_CREATION_USERNAME,
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    verifyMethods: [],
    domains: [],
    recoveryEmail: '',
    recoveryPhone: '',
    verificationCode: '',
    currency: 'EUR',
    cycle: 12,
    planIDs: {},
    humanVerificationMethods: [],
    humanVerificationToken: '',
};

interface Props {
    onLogin: OnLoginCallback;
    Layout: FunctionComponent<AccountPublicLayoutProps>;
    toApp?: APP_NAMES;
    onBack?: () => void;
}

const {
    ACCOUNT_CREATION_USERNAME,
    ACCOUNT_CREATION_EMAIL,
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
    const currency = searchParams.get('currency') as Currency;
    const cycle = Number(searchParams.get('billing')) as Cycle;
    const preSelectedPlan = searchParams.get('plan');
    const service = searchParams.get('service') as SERVICES_KEYS | undefined;
    return { currency, cycle, preSelectedPlan, service: service ? SERVICES[service] : undefined };
};

const AccountSignupContainer = ({ toApp, onLogin, onBack, Layout }: Props) => {
    const history = useHistory();
    const { currency, cycle, preSelectedPlan, service } = useMemo(() => {
        return getSearchParams(history.location.search);
    }, [history.location.search]);
    const { APP_NAME } = useConfig();
    const isVpnApp = APP_NAME === APPS.PROTONVPN_SETTINGS;
    const currentService = isVpnApp ? PLAN_SERVICES.VPN : PLAN_SERVICES.MAIL;
    const api = useApi();
    const { createModal } = useModals();
    const { CLIENT_TYPE } = useConfig();
    const [plans, loadingPlans] = usePlans();
    const [loading, withLoading] = useLoading();
    const [checkResult, setCheckResult] = useState<SubscriptionCheckResponse>(DEFAULT_CHECK_RESULT);

    const cacheRef = useRef<CacheRef>({});
    const [humanApi] = useState(() => createHumanApi({ api, createModal }));

    const setChallengePayload = (payload: ChallengeResult) => {
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
    const [usernameError, setUsernameError] = useState<string>('');

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

    const getCardPayment = async () => {
        return handlePaymentToken({
            params: {
                ...paymentParameters,
                Amount: checkResult.AmountDue,
                Currency: model.currency,
            },
            api,
            createModal,
            mode: '',
        });
    };

    const handleFinalizeSignup = async ({
        planIDs = model.planIDs,
        payment,
    }: { planIDs?: PlanIDs; payment?: Payment } = {}) => {
        const isBuyingPaidPlan = hasPaidPlan(planIDs);

        if (isBuyingPaidPlan && method === PAYMENT_METHOD_TYPES.CARD && !canPay) {
            setModelDiff({ step: PAYMENT });
            return;
        }

        setModelDiff({ step: CREATING_ACCOUNT });

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
            try {
                const { Payment } = await getCardPayment();
                if (isInternalSignup && Payment && 'Token' in Payment.Details) {
                    // Use payment token to prove humanity for internal paid account
                    humanApi.setToken(Payment.Details.Token, TOKEN_TYPES.PAYMENT);
                }
                actualPayment = Payment;
            } catch (error) {
                return setModelDiff({ step: oldStep });
            }
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
            return setModelDiff({ step: oldStep });
        }

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
                        // TODO: Why not use checkResult here?
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
            await onLogin({ ...authResponse, User, keyPassword, flow: 'signup' });
        } catch (error) {
            // TODO: If any of these requests fail we should probably handle it differently
            return setModelDiff({ step: oldStep });
        }
    };

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                const { Direct, VerifyMethods: verifyMethods } = await api(queryDirectSignupStatus(CLIENT_TYPE));

                if (!Direct) {
                    // We block the signup from API demand
                    throw new Error('No signup');
                }

                const { Domains: domains } = await api(queryAvailableDomains());
                setModelDiff({ step: ACCOUNT_CREATION_USERNAME, verifyMethods, domains });
            } catch (error) {
                return setModelDiff({ step: NO_SIGNUP });
            }
        };
        withLoading(fetchDependencies());
    }, []);

    useEffect(() => {
        // Remove error once username change
        if (usernameError) {
            setUsernameError('');
        }
    }, [model.username]);

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

    useEffect(() => {
        if (model.step === PLANS) {
            setCard('cvc', '');
        }

        if (model.step === ACCOUNT_CREATION_EMAIL) {
            // Reset verification parameters if we try to change the email
            humanApi.clearToken();
        }
    }, [model.step]);

    const errors = useMemo(() => {
        return getSignupErrors(model, usernameError);
    }, [usernameError, model]);

    const { step, username } = model;

    if (step === NO_SIGNUP) {
        return (
            <Layout title={c('Title').t`Signup disabled`}>
                <NoSignup />
            </Layout>
        );
    }

    if (step === ACCOUNT_CREATION_USERNAME || step === ACCOUNT_CREATION_EMAIL) {
        const handleSubmitEmail = async () => {
            await humanApi.api(queryVerificationCode('email', { Address: model.email }));
            setModelDiff({ step: VERIFICATION_CODE });
        };

        const handleSubmitUsername = async () => {
            try {
                await humanApi.api({
                    ...queryCheckUsernameAvailability(username),
                    silence: [
                        API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED,
                        API_CUSTOM_ERROR_CODES.USER_EXISTS_USERNAME_ALREADY_USED,
                    ],
                });
                setModelDiff({ step: RECOVERY_EMAIL });
            } catch (error) {
                const errorText = getApiErrorMessage(error) || c('Error').t`Can't check username, try again later`;
                setUsernameError(errorText);
            }
        };

        const handleSubmit = step === ACCOUNT_CREATION_EMAIL ? handleSubmitEmail : handleSubmitUsername;

        const forkOrQueryApp = toApp || service;
        const toAppName = getToAppName(forkOrQueryApp);
        const disableExternalSignup = true;

        return (
            <Layout
                title={c('Title').t`Create your Proton Account`}
                subtitle={toAppName ? c('Info').t`to continue to ${toAppName}` : undefined}
                aside={<OneAccountIllustration />}
                left={onBack && <BackButton onClick={onBack} />}
            >
                <SignupAccountForm
                    model={model}
                    errors={errors}
                    onChange={setModel}
                    onSubmit={(payload) => {
                        setChallengePayload(payload);
                        withLoading(handleSubmit());
                    }}
                    loading={loading}
                    hasExternalSignup={!disableExternalSignup}
                />
            </Layout>
        );
    }

    if (step === RECOVERY_EMAIL || step === RECOVERY_PHONE) {
        const handleSubmit = () => {
            const isBuyingPaidPlan = hasPaidPlan(model.planIDs);
            if (isBuyingPaidPlan) {
                setModelDiff({ step: PAYMENT });
            } else {
                setModelDiff({ step: PLANS });
            }
        };

        const handleSkip = () => {
            setModelDiff({ step: PLANS, recoveryEmail: '', recoveryPhone: '' });
        };

        const handleBack = () => {
            setModelDiff({ step: ACCOUNT_CREATION_USERNAME });
        };

        const subtitle =
            step === RECOVERY_EMAIL
                ? c('Info')
                      .t`We will send you a recovery link to this email address if you forget your password or get locked out of your account.`
                : step === RECOVERY_PHONE
                ? c('Info')
                      .t`We will send a code to this phone number if you forget your password or get locked out of your account.`
                : '';

        return (
            <Layout
                title={c('Title').t`Add a recovery method (highly recommended)`}
                subtitle={subtitle}
                left={<BackButton onClick={handleBack} />}
            >
                <SignupRecoveryForm
                    model={model}
                    errors={errors}
                    onChange={setModel}
                    onSubmit={(payload) => {
                        setChallengePayload(payload);
                        handleSubmit();
                    }}
                    onSkip={(payload) => {
                        setChallengePayload(payload);
                        handleSkip();
                    }}
                    loading={loading}
                />
            </Layout>
        );
    }

    if (step === VERIFICATION_CODE) {
        const handleResend = async () => {
            await humanApi.api(queryVerificationCode('email', { Address: model.email }));
        };

        const handleSubmit = async () => {
            const token = `${model.email}:${model.verificationCode}`;
            const tokenType = TOKEN_TYPES.EMAIL;
            try {
                await humanApi.api(queryCheckVerificationCode(token, tokenType, CLIENT_TYPE));
                humanApi.setToken(token, tokenType);

                const isBuyingPaidPlan = hasPaidPlan(model.planIDs);
                if (isBuyingPaidPlan) {
                    return setModelDiff({ step: PAYMENT });
                }
                setModelDiff({ step: PLANS });
            } catch (error) {
                createModal(
                    <InvalidVerificationCodeModal
                        edit={c('Action').t`Change email`}
                        request={c('Action').t`Request new code`}
                        onEdit={() => {
                            setModelDiff({
                                step: ACCOUNT_CREATION_EMAIL,
                                verificationCode: '',
                            });
                        }}
                        onResend={() => {
                            withLoading(handleResend());
                            setModelDiff({ verificationCode: '' });
                        }}
                    />
                );
            }
        };

        const handleBack = () => {
            setModelDiff({ step: ACCOUNT_CREATION_EMAIL });
        };

        const handleOuterResend = () => {
            createModal(
                <RequestNewCodeModal
                    onEdit={() => {
                        setModelDiff({
                            verificationCode: '',
                            step: ACCOUNT_CREATION_EMAIL,
                        });
                    }}
                    onResend={() => {
                        withLoading(handleResend());
                        setModelDiff({ verificationCode: '' });
                    }}
                    email={model.email}
                />
            );
        };

        return (
            <Layout title={c('Title').t`Account verification`} left={<BackButton onClick={handleBack} />}>
                <SignupVerificationCodeForm
                    model={model}
                    errors={errors}
                    onChange={setModel}
                    onSubmit={(e) => {
                        e.preventDefault();
                        withLoading(handleSubmit());
                    }}
                    onResend={handleOuterResend}
                    loading={loading}
                />
            </Layout>
        );
    }

    if (step === PLANS) {
        const handleSelectPlan = async (planID: string) => {
            if (!planID) {
                // Select free plan
                setModelDiff({ planIDs: {} });
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
        };
        const getBackStep = () => {
            if (model.username && model.recoveryPhone) {
                return RECOVERY_PHONE;
            }
            if (model.username) {
                return RECOVERY_EMAIL;
            }
            if (model.email) {
                return VERIFICATION_CODE;
            }
        };
        const step = getBackStep();
        const handleBack = step ? () => setModelDiff({ step }) : undefined;
        const firstPlanID = Object.keys(model.planIDs || {})[0];
        const selectedPlan = (plans || []).find(({ ID }) => firstPlanID === ID);
        return (
            <Layout
                title={c('Title').t`Plans`}
                left={handleBack ? <BackButton onClick={handleBack} /> : undefined}
                larger
            >
                <SignupPlans
                    planNameSelected={selectedPlan?.Name}
                    plans={plans}
                    model={model}
                    onChange={setModel}
                    onSelectPlan={(planID) => withLoading(handleSelectPlan(planID))}
                    loading={loading || loadingPlans}
                />
            </Layout>
        );
    }

    if (step === PAYMENT) {
        const handleBack = () => {
            setModelDiff({ step: PLANS });
        };
        return (
            <Layout title={c('Title').t`Choose a payment method`} left={<BackButton onClick={handleBack} />} larger>
                <SignupPayment
                    service={currentService}
                    paypal={paypal}
                    paypalCredit={paypalCredit}
                    checkResult={checkResult}
                    model={model}
                    onChange={setModel}
                    card={card}
                    onCardChange={setCard}
                    method={method}
                    onMethodChange={setMethod}
                    errors={paymentErrors}
                    canPay={canPay}
                    plans={plans}
                    loading={loading}
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleFinalizeSignup();
                    }}
                />
            </Layout>
        );
    }

    if (step === HUMAN_VERIFICATION) {
        const handleSubmit = (token: string, tokenType: HumanVerificationMethodType) => {
            humanApi.setToken(token, tokenType);
            return handleFinalizeSignup();
        };
        const handleBack = () => {
            humanApi.clearToken();
            setModelDiff({ step: PLANS });
        };
        return (
            <Layout
                title={c('Title').t`Are you human?`}
                subtitle={c('Info').t`To fight spam and abuse, please verify you are human.`}
                left={<BackButton onClick={handleBack} />}
            >
                <HumanVerificationForm
                    token={model.humanVerificationToken}
                    methods={model.humanVerificationMethods}
                    mode="signup"
                    onSubmit={handleSubmit}
                />
            </Layout>
        );
    }

    if (step === CREATING_ACCOUNT) {
        return (
            <Layout title={c('Title').t`Creating account`}>
                <SignupCreatingAccount model={model} />
            </Layout>
        );
    }

    throw new Error('Unknown step');
};

export default AccountSignupContainer;
