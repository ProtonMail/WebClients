import { MutableRefObject, useImperativeHandle, useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Href } from '@proton/atoms/Href';
import { Info, Price } from '@proton/components/components';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { PayPalButton, StyledPayPalButton } from '@proton/components/containers';
import PaymentWrapper from '@proton/components/containers/payments/PaymentWrapper';
import { getTotalBillingText } from '@proton/components/containers/payments/helper';
import { usePaymentFacade } from '@proton/components/payments/client-extensions';
import { CardPayment, PAYMENT_METHOD_TYPES, PaypalPayment, TokenPayment } from '@proton/components/payments/core';
import { PaymentProcessorHook } from '@proton/components/payments/react-extensions/interface';
import { WithLoading } from '@proton/hooks/useLoading';
import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import { getCheckout } from '@proton/shared/lib/helpers/checkout';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { Api, VPNServersCountData } from '@proton/shared/lib/interfaces';
import { getSentryError } from '@proton/shared/lib/keys';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { getLocaleTermsURL } from '../content/helper';
import Guarantee from './Guarantee';
import RightPlanSummary from './RightPlanSummary';
import RightSummary from './RightSummary';
import { getSummaryPlan } from './configuration';
import { Measure, OptimisticOptions, SignupModelV2 } from './interface';
import { TelemetryPayType, getPaymentMethod } from './measure';

export interface AccountStepPaymentRef {
    validate: () => Promise<boolean>;
    scrollIntoView: () => void;
}

interface Props {
    accountStepPaymentRef: MutableRefObject<AccountStepPaymentRef | undefined>;
    cta: string;
    api: Api;
    model: SignupModelV2;
    options: OptimisticOptions;
    vpnServersCountData: VPNServersCountData;
    loadingPaymentDetails: boolean;
    loadingSignup: boolean;
    onPay: (
        payment: 'signup-token' | PaypalPayment | TokenPayment | CardPayment | undefined,
        type: 'pp' | 'btc' | 'cc' | undefined
    ) => Promise<void>;
    onValidate: () => boolean;
    isDarkBg?: boolean;
    withLoadingSignup: WithLoading;
    measure: Measure;
    defaultMethod: PAYMENT_METHOD_TYPES | undefined;
    takeNullCreditCard?: boolean;
}

const AccountStepPayment = ({
    measure,
    cta,
    accountStepPaymentRef,
    api: normalApi,
    defaultMethod,
    onPay,
    onValidate,
    model,
    options,
    vpnServersCountData,
    loadingPaymentDetails,
    loadingSignup,
    withLoadingSignup,
    isDarkBg = false,
}: Props) => {
    const formRef = useRef<HTMLFormElement>(null);

    const measurePay = (
        type: TelemetryPayType,
        event: TelemetryAccountSignupEvents.userCheckout | TelemetryAccountSignupEvents.checkoutError
    ) => {
        if (!options.plan) {
            return;
        }

        void measure({
            event,
            dimensions: {
                type: type,
                plan: options.plan.Name as any,
                cycle: `${options.cycle}`,
                currency: options.currency,
            },
        });
    };

    const measurePaySubmit = (type: TelemetryPayType) => {
        return measurePay(type, TelemetryAccountSignupEvents.userCheckout);
    };
    const measurePayError = (type: TelemetryPayType) => {
        return measurePay(type, TelemetryAccountSignupEvents.checkoutError);
    };

    const { subscriptionData } = model;

    const validatePayment = () => {
        if (loadingSignup || loadingPaymentDetails) {
            return false;
        }
        return true;
    };

    useImperativeHandle(accountStepPaymentRef, () => ({
        validate: async () => {
            return validatePayment();
        },
        scrollIntoView: () => {
            setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
        },
    }));

    const paymentFacade = usePaymentFacade({
        amount: options.checkResult.AmountDue,
        currency: options.currency,
        flow: 'signup-pass',
        paymentMethods: model.session?.paymentMethods,
        paymentMethodStatus: model.paymentMethodStatus,
        api: normalApi,
        onChargeable: (_, { chargeablePaymentParameters }) => {
            return withLoadingSignup(async () => {
                const isFreeSignup = chargeablePaymentParameters.Amount <= 0;
                if (isFreeSignup) {
                    await onPay(undefined, undefined);
                    return;
                }

                const type = chargeablePaymentParameters.type;
                let paymentType: 'cc' | 'pp';
                if (type === PAYMENT_METHOD_TYPES.PAYPAL || type === PAYMENT_METHOD_TYPES.PAYPAL_CREDIT) {
                    paymentType = 'pp';
                } else {
                    paymentType = 'cc';
                }
                await onPay(chargeablePaymentParameters.Payment, paymentType);
            });
        },
        onMethodChanged: (newMethod) => {
            const value = getPaymentMethod(newMethod.type);
            if (value) {
                void measure({
                    event: TelemetryAccountSignupEvents.paymentSelect,
                    dimensions: { type: value },
                });
            }
        },
    });

    const termsAndConditions = (
        <Href className="color-weak" key="terms" href={getLocaleTermsURL()}>
            {
                // translator: Full sentence "By creating a Proton account, you agree to our terms and conditions"
                c('new_plans: signup').t`terms and conditions`
            }
        </Href>
    );

    const summaryPlan = getSummaryPlan(options.plan, vpnServersCountData);

    const currentCheckout = getCheckout({
        planIDs: options.planIDs,
        plansMap: model.plansMap,
        checkResult: options.checkResult,
    });

    const isAuthenticated = !!model.session?.UID;

    const process = (processor: PaymentProcessorHook | undefined) => {
        if (!onValidate() || !validatePayment()) {
            return;
        }

        const telemetryType = (() => {
            const isFreeSignup = paymentFacade.amount <= 0;

            if (isFreeSignup) {
                return 'free';
            }

            if (processor?.meta.type === 'paypal') {
                return 'pay_pp';
            }

            if (processor?.meta.type === 'paypal-credit') {
                return 'pay_pp_no_cc';
            }

            return 'pay_cc';
        })();
        measurePaySubmit(telemetryType);

        async function run() {
            if (!processor) {
                return;
            }
            try {
                await processor.processPaymentToken();
            } catch (error) {
                measurePayError(telemetryType);

                const sentryError = getSentryError(error);
                if (sentryError) {
                    const context = {
                        currency: options.currency,
                        amount: options.checkResult.AmountDue,
                        processorType: processor.meta.type,
                        paymentMethod: paymentFacade.selectedMethodType,
                        paymentMethodValue: paymentFacade.selectedMethodValue,
                        cycle: options.cycle,
                        plan: options.plan,
                        planName: options.plan?.Name,
                    };

                    captureMessage('Payments: Failed to handle single-signup-v2', {
                        level: 'error',
                        extra: { error: sentryError, context },
                    });
                }
            }
        }

        withLoadingSignup(run()).catch(noop);
    };

    return (
        <div className="flex flex-column md:flex-row flex-align-items-start flex-justify-space-between gap-14">
            <div className="flex-item-fluid order-1 md:order-0">
                <form
                    ref={formRef}
                    onFocus={(e) => {
                        const autocomplete = e.target.getAttribute('autocomplete');
                        if (autocomplete) {
                            void measure({
                                event: TelemetryAccountSignupEvents.interactCreditCard,
                                dimensions: { field: autocomplete as any },
                            });
                        }
                    }}
                    name="payment-form"
                    onSubmit={(event) => {
                        event.preventDefault();

                        process(paymentFacade.selectedProcessor);
                    }}
                    method="post"
                >
                    {options.checkResult.AmountDue ? (
                        <PaymentWrapper
                            {...paymentFacade}
                            defaultMethod={defaultMethod} // needed for Bitcoin signup
                            isAuthenticated={isAuthenticated} // needed for Bitcoin signup
                            onBitcoinTokenValidated={(data) => {
                                measurePaySubmit('pay_btc');
                                return withLoadingSignup(onPay(data.Payment, 'btc')).catch(() => {
                                    measurePayError('pay_btc');
                                });
                            }}
                            disabled={loadingSignup || loadingPaymentDetails}
                            noMaxWidth
                            hideFirstLabel
                        />
                    ) : (
                        <div className="mb-4">{c('Info').t`No payment is required at this time.`}</div>
                    )}
                    {(() => {
                        if (
                            paymentFacade.selectedMethodValue === PAYMENT_METHOD_TYPES.PAYPAL &&
                            options.checkResult.AmountDue > 0
                        ) {
                            return (
                                <div className="flex flex-column gap-2">
                                    <StyledPayPalButton
                                        paypal={paymentFacade.paypal}
                                        amount={paymentFacade.amount}
                                        currency={paymentFacade.currency}
                                        loading={loadingSignup}
                                        onClick={() => process(paymentFacade.paypal)}
                                    />
                                    <PayPalButton
                                        id="paypal-credit"
                                        shape="ghost"
                                        color="norm"
                                        paypal={paymentFacade.paypalCredit}
                                        disabled={loadingSignup}
                                        amount={paymentFacade.amount}
                                        currency={paymentFacade.currency}
                                        onClick={() => process(paymentFacade.paypalCredit)}
                                    >
                                        {c('Link').t`Paypal without credit card`}
                                    </PayPalButton>
                                </div>
                            );
                        }

                        if (
                            paymentFacade.selectedMethodType === PAYMENT_METHOD_TYPES.BITCOIN &&
                            options.checkResult.AmountDue > 0
                        ) {
                            if (isAuthenticated) {
                                return null;
                            }

                            return (
                                <Button
                                    type="button"
                                    size="large"
                                    loading={loadingSignup}
                                    color="norm"
                                    fullWidth
                                    onClick={() => {
                                        measurePaySubmit('pay_btc');
                                        if (onValidate() && validatePayment()) {
                                            withLoadingSignup(onPay('signup-token', undefined)).catch(() => {
                                                measurePayError('pay_btc');
                                            });
                                        }
                                    }}
                                >
                                    {c('pass_signup_2023: Action').t`Continue with Bitcoin`}
                                </Button>
                            );
                        }

                        return (
                            <>
                                <Button
                                    type="submit"
                                    size="large"
                                    loading={loadingSignup}
                                    color="norm"
                                    fullWidth
                                    data-testid="pay"
                                >
                                    {cta}
                                </Button>
                                <div className="text-center color-success mt-4">
                                    {subscriptionData.checkResult.AmountDue === 0 ? (
                                        c('Info').t`Cancel anytime`
                                    ) : (
                                        <Guarantee />
                                    )}
                                </div>
                                {!isAuthenticated && (
                                    <div className="mt-4 text-sm color-weak text-center">
                                        {c('pass_signup_2023: Info')
                                            .jt`By continuing, you agree to our ${termsAndConditions}`}
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </form>
            </div>
            {(() => {
                if (!summaryPlan) {
                    return null;
                }

                const proration = subscriptionData.checkResult?.Proration ?? 0;
                const credits = subscriptionData.checkResult?.Credit ?? 0;

                const showAmountDue = proration !== 0 || credits !== 0;

                return (
                    <RightSummary gradient={isDarkBg} className="mx-auto md:mx-0 rounded-xl">
                        <RightPlanSummary
                            cycle={options.cycle}
                            className={isDarkBg ? 'border-primary' : undefined}
                            title={summaryPlan.title}
                            price={getSimplePriceString(options.currency, currentCheckout.withDiscountPerMonth, '')}
                            regularPrice={getSimplePriceString(
                                options.currency,
                                currentCheckout.withoutDiscountPerMonth,
                                ''
                            )}
                            logo={summaryPlan.logo}
                            discount={currentCheckout.discountPercent}
                            features={summaryPlan.features}
                        >
                            <div className="flex flex-column gap-2">
                                {(() => {
                                    return [
                                        {
                                            id: 'amount',
                                            left: <span>{getTotalBillingText(options.cycle)}</span>,
                                            right: currentCheckout.withDiscountPerCycle,
                                            bold: true,
                                        },
                                        proration !== 0 && {
                                            id: 'proration',
                                            left: (
                                                <span className="inline-flex flex-align-items-center">
                                                    <span className="mr-2">{c('Label').t`Proration`}</span>
                                                    <Info
                                                        title={
                                                            proration < 0
                                                                ? c('Info')
                                                                      .t`Credit for the unused portion of your previous plan subscription`
                                                                : c('Info').t`Balance from your previous subscription`
                                                        }
                                                        url={getKnowledgeBaseUrl('/credit-proration-coupons')}
                                                    />
                                                </span>
                                            ),
                                            right: proration,
                                            bold: false,
                                        },
                                        credits !== 0 && {
                                            id: 'credits',
                                            left: <span>{c('Title').t`Credits`}</span>,
                                            right: credits,
                                            bold: false,
                                        },
                                    ]
                                        .filter(isTruthy)
                                        .map(({ id, bold, left, right }) => {
                                            return (
                                                <div
                                                    key={id}
                                                    className={clsx(
                                                        bold && 'text-bold',
                                                        'flex flex-justify-space-between text-rg'
                                                    )}
                                                >
                                                    {left}
                                                    <span>
                                                        {(() => {
                                                            if (loadingPaymentDetails) {
                                                                // When we don't show amount due, we put the circle loader instead of empty value.
                                                                if (!showAmountDue) {
                                                                    return <CircleLoader />;
                                                                }
                                                                return null;
                                                            }
                                                            return (
                                                                <>
                                                                    <Price currency={subscriptionData.currency}>
                                                                        {right}
                                                                    </Price>
                                                                    {id === 'amount' && '*'}
                                                                </>
                                                            );
                                                        })()}
                                                    </span>
                                                </div>
                                            );
                                        });
                                })()}

                                {showAmountDue && (
                                    <>
                                        <hr className="m-0" />
                                        <div className="flex flex-justify-space-between text-bold text-rg">
                                            <span className="">{c('Label').t`Amount due`}</span>
                                            <span>
                                                {loadingPaymentDetails ? (
                                                    <CircleLoader />
                                                ) : (
                                                    <Price currency={subscriptionData.currency}>
                                                        {options.checkResult.AmountDue}
                                                    </Price>
                                                )}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </RightPlanSummary>
                    </RightSummary>
                );
            })()}
        </div>
    );
};

export default AccountStepPayment;
