import { Fragment, ReactElement, ReactNode, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms/Button';
import { Href } from '@proton/atoms/Href';
import { Vr } from '@proton/atoms/Vr';
import { Icon, InlineLinkButton, InputFieldTwo, Price, useModalState } from '@proton/components/components';
import {
    CurrencySelector,
    FeatureCode,
    Payment as PaymentComponent,
    StyledPayPalButton,
    usePayment,
} from '@proton/components/containers';
import { KT_FF } from '@proton/components/containers/keyTransparency/ktStatus';
import Alert3ds from '@proton/components/containers/payments/Alert3ds';
import {
    getCountries,
    getNetShield,
    getProtectDevices,
    getStreaming,
} from '@proton/components/containers/payments/features/vpn';
import {
    AmountAndCurrency,
    CardPayment,
    PaypalPayment,
    TokenPayment,
    TokenPaymentMethod,
} from '@proton/components/containers/payments/interface';
import { createPaymentToken } from '@proton/components/containers/payments/paymentTokenHelper';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';
import {
    useActiveBreakpoint,
    useApi,
    useConfig,
    useErrorHandler,
    useFeature,
    useLoading,
    useModals,
    useNotifications,
} from '@proton/components/hooks';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { queryCheckEmailAvailability } from '@proton/shared/lib/api/user';
import { ProductParam } from '@proton/shared/lib/apps/product';
import { getIsVPNApp } from '@proton/shared/lib/authentication/apps';
import {
    APPS,
    CLIENT_TYPES,
    CYCLE,
    PAYMENT_METHOD_TYPES,
    PLANS,
    VPN_CONNECTIONS,
    VPN_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { getCroHeaders, mergeHeaders } from '@proton/shared/lib/fetch/headers';
import { confirmEmailValidator, emailValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { toMap } from '@proton/shared/lib/helpers/object';
import { getPricingFromPlanIDs } from '@proton/shared/lib/helpers/subscription';
import { getTermsURL } from '@proton/shared/lib/helpers/url';
import { Currency, Cycle, PlansMap, VPNServersCountData } from '@proton/shared/lib/interfaces';
import { generatePassword } from '@proton/shared/lib/password';
import { getPlusServers, getVpnServers } from '@proton/shared/lib/vpn/features';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { getPlanFromPlanIDs, getSubscriptionPrices } from '../signup/helper';
import { SignupActionResponse, SignupCacheResult, SignupModel, SignupType } from '../signup/interfaces';
import { handleCreateUser } from '../signup/signupActions/handleCreateUser';
import { useFlowRef } from '../useFlowRef';
import Box from './Box';
import CycleSelector from './CycleSelector';
import Guarantee from './Guarantee';
import Layout from './Layout';
import StepLabel from './StepLabel';
import UpsellModal from './UpsellModal';
import swissFlag from './flag.svg';
import { getUpsellShortPlan } from './helper';

const FeatureItem = ({ left, text }: { left: ReactNode; text: string }) => {
    return (
        <div className="flex flex-align-items-center text-center on-mobile-flex-column flex-justify-center">
            <div className="md:mr-4 text-center">{left}</div>
            <div className="color-weak">{text}</div>
        </div>
    );
};

const BoxHeader = ({ step, title, right }: { step: number; title: string; right?: ReactNode }) => {
    return (
        <div className="flex flex-align-items-center flex-justify-space-between flex-nowrap">
            <div className="flex flex-align-items-center on-mobile-flex-column md:gap-4 gap-2">
                <div>
                    <StepLabel step={step} />
                </div>
                <h2 className="text-bold text-4xl">{title}</h2>
            </div>
            {right && <div className="flex-item-noshrink">{right}</div>}
        </div>
    );
};

const BoxContent = ({ children }: { children: ReactNode }) => {
    return <div className="pricing-box-content mt-8">{children}</div>;
};

interface InputState {
    interactive: boolean;
    focus: boolean;
}

const Step1 = ({
    clientType,
    onComplete,
    onUpdate,
    model,
    setModel,
    upsellShortPlan,
    vpnServersCountData,
    productParam,
    hideFreePlan,
    upsellImg,
}: {
    upsellShortPlan: ReturnType<typeof getUpsellShortPlan> | undefined;
    vpnServersCountData: VPNServersCountData;
    clientType: CLIENT_TYPES;
    onComplete: (promise: SignupActionResponse) => void;
    onUpdate: (params: any) => void;
    model: SignupModel;
    setModel: (model: Partial<SignupModel>) => void;
    productParam: ProductParam;
    hideFreePlan: boolean;
    upsellImg: ReactElement;
}) => {
    const ktFeature = useFeature<KT_FF>(FeatureCode.KeyTransparencyWEB);
    const [upsellModalProps, setUpsellModal, renderUpsellModal] = useModalState();
    const { isDesktop } = useActiveBreakpoint();
    const { APP_NAME } = useConfig();
    const { createNotification } = useNotifications();
    const [email, setEmail] = useState('');
    const [confirmEmail, setConfirmEmail] = useState('');
    const trimmedEmail = email.trim();
    const [emailAsyncError, setEmailAsyncError] = useState({ email: '', message: '' });
    const emailRef = useRef<HTMLInputElement>(null);
    const emailConfirmRef = useRef<HTMLInputElement>(null);
    const freeSignupUrl = 'https://account.protonvpn.com/signup';
    const normalApi = useApi();
    const silentApi = getSilentApi(normalApi);
    const [optimisticCycle, setOptimisticCycle] = useState<CYCLE | undefined>();
    const [optimisticCurrency, setOptimisticCurrency] = useState<Currency | undefined>();

    const createFlow = useFlowRef();

    const [loadingPayment, withLoadingPayment] = useLoading();
    const [loadingPaymentDetails, withLoadingPaymentDetails] = useLoading();
    const handleError = useErrorHandler();

    const currency = optimisticCurrency || model.subscriptionData.currency;
    const cycle = optimisticCycle || model.subscriptionData.cycle;

    const scrollIntoEmail = (target?: 'confirm') => {
        const el = target === 'confirm' ? emailConfirmRef.current : emailRef.current;
        if (el) {
            el.focus();
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const handleChangeCurrency = async (currency: Currency) => {
        const validateFlow = createFlow();
        setOptimisticCurrency(currency);
        onUpdate({ currency: currency });
        const checkResult = await getSubscriptionPrices(
            silentApi,
            model.subscriptionData.planIDs,
            currency,
            cycle,
            model.subscriptionData.checkResult.Coupon?.Code
        ).catch(noop);
        if (!validateFlow()) {
            return;
        }
        setOptimisticCurrency(undefined);
        if (!checkResult) {
            return;
        }
        setModel({
            subscriptionData: {
                ...model.subscriptionData,
                currency,
                checkResult,
            },
        });
    };

    const handleChangeCycle = async (cycle: Cycle) => {
        const validateFlow = createFlow();
        setOptimisticCycle(cycle);
        const checkResult = await getSubscriptionPrices(
            silentApi,
            model.subscriptionData.planIDs,
            currency,
            cycle,
            model.subscriptionData.checkResult.Coupon?.Code
        ).catch(noop);
        if (!validateFlow()) {
            return;
        }
        setOptimisticCycle(undefined);
        if (!checkResult) {
            return;
        }
        setModel({
            subscriptionData: {
                ...model.subscriptionData,
                cycle,
                checkResult,
            },
        });
    };

    const onPay = async (payment: PaypalPayment | TokenPayment | CardPayment | undefined) => {
        try {
            if (!payment) {
                throw new Error('Missing cache');
            }

            const extractPaymentToken = () => {
                if (payment.Type === PAYMENT_METHOD_TYPES.TOKEN) {
                    return payment.Details.Token;
                }
            };
            const paymentToken = extractPaymentToken() || '';

            const subscriptionData = {
                ...model.subscriptionData,
                payment,
            };

            setModel({
                subscriptionData,
            });

            const validateFlow = createFlow();

            const accountData = {
                username: '',
                email,
                password: generatePassword({ useSpecialChars: true, length: 16 }),
                signupType: SignupType.Email,
                payload: undefined,
                domain: '',
            };

            const cache: SignupCacheResult = {
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
                ktFeature: (await ktFeature.get())?.Value,
            };

            if (validateFlow()) {
                try {
                    await silentApi(mergeHeaders(queryCheckEmailAvailability(email), getCroHeaders(paymentToken)));
                } catch (e) {
                    const { code, message } = getApiError(e);
                    if (
                        [
                            API_CUSTOM_ERROR_CODES.ALREADY_USED,
                            API_CUSTOM_ERROR_CODES.EMAIL_FORMAT,
                            API_CUSTOM_ERROR_CODES.NOT_ALLOWED,
                        ].includes(code)
                    ) {
                        setEmailAsyncError({ email, message });
                        createNotification({ type: 'error', text: message });
                        scrollIntoEmail();
                        return;
                    }
                    throw e;
                }
                const newCache = await handleCreateUser({ cache, api: silentApi, mode: 'cro', paymentToken });

                onComplete(newCache);
            }
        } catch (error) {
            handleError(error);
        }
    };

    const { subscriptionData, plans, paymentMethodStatus } = model;
    const plan = getPlanFromPlanIDs(plans, subscriptionData.planIDs);
    const planName = plan?.Title;

    const paymentMethods = [
        paymentMethodStatus?.Card && PAYMENT_METHOD_TYPES.CARD,
        paymentMethodStatus?.Paypal && PAYMENT_METHOD_TYPES.PAYPAL,
    ].filter(isTruthy);
    const hasGuarantee = plan?.Name === PLANS.VPN;

    const [inputState, setInputState] = useState<{ email: Partial<InputState>; emailConfirm: Partial<InputState> }>({
        email: {},
        emailConfirm: {},
    });

    const mergeInputState = (key: keyof typeof inputState, diff: Partial<InputState>) => {
        setInputState((old) => {
            return { ...old, [key]: { ...inputState[key], ...diff } };
        });
    };

    const emailError = [
        email === emailAsyncError.email ? emailAsyncError.message : '',
        requiredValidator(trimmedEmail),
        emailValidator(trimmedEmail),
    ].find((x) => !!x);
    const emailValidationError = inputState.email.interactive && inputState.email.focus ? emailError : undefined;
    const emailConfirmError = [confirmEmailValidator(trimmedEmail, confirmEmail.trim())].find((x) => !!x);
    const emailConfirmValidationError =
        inputState.emailConfirm.interactive && inputState.emailConfirm.focus ? emailConfirmError : undefined;

    const validatePayment = () => {
        if (loadingPayment || loadingPaymentDetails) {
            return true;
        }
        return false;
    };

    const validateEmail = () => {
        if (emailError || emailConfirmError) {
            mergeInputState('email', { interactive: true, focus: true });
            mergeInputState('emailConfirm', { interactive: true, focus: true });
            scrollIntoEmail(emailConfirmError && !emailError ? 'confirm' : undefined);
            return true;
        }
        return false;
    };

    const {
        card,
        setCard,
        cardErrors,
        method,
        setMethod,
        handleCardSubmit,
        parameters: paymentParameters,
        paypal,
        paypalCredit,
    } = usePayment({
        defaultMethod: paymentMethods[0],
        amount: subscriptionData.checkResult.AmountDue,
        currency,
        onValidatePaypal: () => {
            onUpdate({ pay: 'paypal' });

            return validatePayment() || validateEmail();
        },
        onPaypalPay({ Payment }: TokenPaymentMethod) {
            return onPay(Payment);
        },
    });
    const { createModal } = useModals();

    const price = (
        <Price key="price" currency={currency}>
            {subscriptionData.checkResult.AmountDue}
        </Price>
    );

    const upsellPlanName = upsellShortPlan?.title || '';

    const termsAndConditions = (
        <Href key="terms" href={getTermsURL(getIsVPNApp(APP_NAME) ? APPS.PROTONVPN_SETTINGS : undefined)}>
            {
                // translator: Full sentence "By creating a Proton account, you agree to our terms and conditions"
                c('new_plans: signup').t`terms and conditions`
            }
        </Href>
    );

    const plansMap = toMap(plans, 'Name') as PlansMap;
    const pricing = getPricingFromPlanIDs(subscriptionData.planIDs, plansMap);
    const cycles = isDesktop
        ? [CYCLE.MONTHLY, CYCLE.TWO_YEARS, CYCLE.YEARLY]
        : [CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY];

    const features = [
        {
            left: <Icon size={24} className="color-primary" name="code" />,
            text: c('Info').t`Open source`,
        },
        {
            left: <Icon size={24} className="color-primary" name="eye-slash" />,
            text: c('new_plans: feature').t`No-logs policy`,
        },
        {
            left: <img width="24" alt={c('VPN signup').t`Swiss flag`} src={swissFlag} />,
            text: isDesktop ? c('Info').t`Protected by Swiss privacy laws` : c('Info').t`Swiss based`,
        },
        isDesktop && {
            left: <Icon size={24} className="color-primary" name="servers" />,
            text: getVpnServers(vpnServersCountData.paid.servers),
        },
    ].filter(isTruthy);

    const freeName = `${VPN_SHORT_APP_NAME} Free`;
    // do modal
    const handleCloseUpsellModal = () => {
        onUpdate({ plan: upsellShortPlan?.plan });
        upsellModalProps.onClose();
    };

    return (
        <Layout hasDecoration languageSelect={false}>
            <div className="flex flex-align-items-center flex-column">
                <div className="mt-8 mb-4 text-center">
                    <h1 className="h2 m-0 text-bold">
                        {c('new_plans: feature').t`High-speed Swiss VPN that protects your privacy`}
                    </h1>
                </div>
                <div className="flex flex-nowrap mb-4 md:gap-8 gap-3">
                    {features.map(({ left, text }, i, arr) => {
                        return (
                            <Fragment key={text}>
                                <FeatureItem left={left} text={text} />
                                {i !== arr.length - 1 && (
                                    <Vr className="h-custom" style={{ '--height-custom': '2.25rem' }} />
                                )}
                            </Fragment>
                        );
                    })}
                </div>
                <Box className="mt-8 w100">
                    <BoxHeader
                        step={1}
                        title={c('Header').t`Select your pricing plan`}
                        right={
                            <CurrencySelector
                                mode="select-two"
                                currency={currency}
                                onSelect={(currency) => withLoadingPaymentDetails(handleChangeCurrency(currency))}
                            />
                        }
                    />
                    <BoxContent>
                        <div className="flex flex-justify-space-between gap-4 on-tablet-flex-column">
                            <CycleSelector
                                pricing={pricing}
                                onGetTheDeal={(cycle) => {
                                    onUpdate({ cycle: `${cycle}m` });
                                    scrollIntoEmail();
                                }}
                                cycle={cycle}
                                currency={currency}
                                cycles={cycles}
                                onChangeCycle={(cycle, upsellFrom) => {
                                    if (upsellFrom !== undefined) {
                                        onUpdate({ cycle: `${cycle}m-${upsellFrom}m-upsell` });
                                    } else {
                                        onUpdate({ cycle: `${cycle}m` });
                                    }
                                    return withLoadingPaymentDetails(handleChangeCycle(cycle)).catch(noop);
                                }}
                            />
                        </div>
                        <div className="flex flex-justify-end mt-10 on-tablet-flex-justify-center">
                            {!hideFreePlan && (
                                <InlineLinkButton
                                    className="color-weak"
                                    onClick={() => {
                                        onUpdate({ plan: 'free' });
                                        setUpsellModal(true);
                                    }}
                                >
                                    {c('Action').t`Sign up for free`}
                                </InlineLinkButton>
                            )}
                        </div>
                    </BoxContent>
                </Box>
                <Box className="mt-8 w100">
                    <BoxHeader step={2} title={c('Header').t`Enter your email address`}></BoxHeader>
                    <BoxContent>
                        <div className="flex flex-justify-space-between on-tablet-flex-column lg:gap-11 md:gap-4 gap-1">
                            <div className="flex-item-fluid max-w30e mx-auto">
                                <InputFieldTwo
                                    ref={emailRef}
                                    id="email"
                                    bigger
                                    label={c('Signup label').t`Email address`}
                                    error={emailValidationError}
                                    disableChange={loadingPayment}
                                    value={email}
                                    onValue={(value: string) => {
                                        setEmail(value);
                                        mergeInputState('email', { interactive: true });
                                    }}
                                    onFocus={() => {
                                        onUpdate({ emType: 'set' });
                                    }}
                                    onBlur={() => {
                                        mergeInputState('email', { focus: true });
                                    }}
                                />
                            </div>
                            <div className="flex-item-fluid max-w30e mx-auto">
                                <div className={clsx('w100', !inputState.email.interactive && 'hidden')}>
                                    <InputFieldTwo
                                        id="confirm-email"
                                        ref={emailConfirmRef}
                                        bigger
                                        label={c('Signup label').t`Confirm email address`}
                                        error={emailConfirmValidationError}
                                        disableChange={loadingPayment}
                                        value={confirmEmail}
                                        onValue={(value: string) => {
                                            setConfirmEmail(value);
                                            mergeInputState('email', { interactive: true });
                                        }}
                                        onFocus={() => {
                                            onUpdate({ emType: 'confirm' });
                                        }}
                                        onBlur={() => {
                                            mergeInputState('emailConfirm', { focus: true });
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                        <span className="color-weak text-sm">
                            {c('Info')
                                .t`Your information is safe with us. We'll only contact you when it's required to provide our services.`}
                        </span>
                    </BoxContent>
                </Box>
                <Box className="mt-8 w100">
                    <BoxHeader step={3} title={c('Header').t`Select your preferred method of payment`} />
                    <BoxContent>
                        <div className="flex flex-justify-space-between gap-14">
                            <div className="flex-item-fluid w0">
                                <form
                                    onFocus={(e) => {
                                        const autocomplete = e.target.getAttribute('autocomplete');
                                        if (autocomplete) {
                                            onUpdate({ cc: autocomplete });
                                        }
                                    }}
                                    name="payment-form"
                                    onSubmit={async (event) => {
                                        event.preventDefault();

                                        onUpdate({ pay: 'card' });

                                        if (validatePayment() || validateEmail()) {
                                            return;
                                        }
                                        const handle = async () => {
                                            if (!handleCardSubmit() || !paymentParameters) {
                                                return;
                                            }

                                            const amountAndCurrency: AmountAndCurrency = {
                                                Currency: currency,
                                                Amount: subscriptionData.checkResult.AmountDue,
                                            };
                                            const data = await createPaymentToken(
                                                {
                                                    params: paymentParameters,
                                                    api: normalApi,
                                                    createModal,
                                                },
                                                amountAndCurrency
                                            );

                                            return onPay(data.Payment);
                                        };
                                        withLoadingPayment(handle()).catch(noop);
                                    }}
                                    method="post"
                                >
                                    {subscriptionData.checkResult?.AmountDue ? (
                                        <PaymentComponent
                                            type="signup"
                                            paypal={paypal}
                                            paypalCredit={paypalCredit}
                                            paymentMethodStatus={paymentMethodStatus}
                                            method={method}
                                            amount={subscriptionData.checkResult.AmountDue}
                                            currency={currency}
                                            card={card}
                                            onMethod={(newMethod) => {
                                                if (method && newMethod && method !== newMethod) {
                                                    onUpdate({ method: newMethod });
                                                }
                                                setMethod(newMethod);
                                            }}
                                            onCard={(card, value) => setCard(card, value)}
                                            cardErrors={cardErrors}
                                        />
                                    ) : (
                                        <div className="mb-4">{c('Info').t`No payment is required at this time.`}</div>
                                    )}
                                    {method === PAYMENT_METHOD_TYPES.PAYPAL ? (
                                        <StyledPayPalButton
                                            paypal={paypal}
                                            flow="signup"
                                            amount={subscriptionData.checkResult.AmountDue}
                                            loading={loadingPayment}
                                        />
                                    ) : (
                                        <>
                                            <Button
                                                type="submit"
                                                size="large"
                                                loading={loadingPayment}
                                                color="norm"
                                                fullWidth
                                            >
                                                {subscriptionData.checkResult.AmountDue > 0
                                                    ? c('Action').jt`Pay ${price} now`
                                                    : c('Action').t`Confirm`}
                                            </Button>
                                            {hasGuarantee && (
                                                <div className="text-center color-success mt-4 mb-8">
                                                    <Guarantee />
                                                </div>
                                            )}
                                            <Alert3ds />
                                            <div className="mt-4 text-sm color-weak text-center">
                                                {c('new_plans: signup')
                                                    .jt`By paying, you agree to our ${termsAndConditions}`}
                                            </div>
                                        </>
                                    )}
                                </form>
                            </div>
                            {upsellShortPlan && (
                                <div className="flex-item-fluid flex w0 no-mobile ml-6">
                                    <div className="w100 bg-weak rounded-xl p-6">
                                        <div className="mb-4">{upsellShortPlan.logo}</div>
                                        <div className="text-bold text-lg mb-4">
                                            {c('Info').t`The ${planName} plan includes:`}
                                        </div>
                                        <PlanCardFeatureList
                                            odd={false}
                                            margin={false}
                                            features={upsellShortPlan.features}
                                            icon={false}
                                            highlight={false}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </BoxContent>
                </Box>
            </div>
            {renderUpsellModal && (
                <UpsellModal
                    img={upsellImg}
                    title={c('Info').t`Try ${upsellPlanName} risk free`}
                    info={c('Info').t`If it’s not right for you, we’ll refund you.`}
                    features={[
                        getStreaming(true),
                        getCountries(
                            getPlusServers(vpnServersCountData.paid.servers, vpnServersCountData.paid.countries)
                        ),
                        getProtectDevices(VPN_CONNECTIONS),
                        getNetShield(true),
                    ]}
                    footer={
                        <>
                            <div className="flex flex-column gap-2">
                                <ButtonLike as="a" href={freeSignupUrl} fullWidth color="norm" shape="outline">
                                    {c('Info').t`Continue with ${freeName}`}
                                </ButtonLike>
                                <Button fullWidth color="norm" onClick={handleCloseUpsellModal}>
                                    {c('Info').t`Get ${upsellPlanName}`}
                                </Button>
                            </div>
                            <div className="text-center mt-6">
                                <Guarantee />
                            </div>
                        </>
                    }
                    {...upsellModalProps}
                    onClose={handleCloseUpsellModal}
                />
            )}
        </Layout>
    );
};

export default Step1;
