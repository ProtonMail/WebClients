import { MutableRefObject, useImperativeHandle, useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Href } from '@proton/atoms/Href';
import { Info, Price } from '@proton/components/components';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import {
    PayPalButton,
    Payment as PaymentComponent,
    StyledPayPalButton,
    usePayment,
} from '@proton/components/containers';
import { getTotalBillingText } from '@proton/components/containers/payments/helper';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';
import { getDefaultVerifyPayment } from '@proton/components/containers/payments/usePaymentToken';
import { useConfig } from '@proton/components/hooks';
import { WithLoading } from '@proton/components/hooks/useLoading';
import useModals from '@proton/components/hooks/useModals';
import {
    AmountAndCurrency,
    CardPayment,
    PAYMENT_METHOD_TYPES,
    PaypalPayment,
    TokenPayment,
    createPaymentToken,
} from '@proton/components/payments/core';
import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import { getIsVPNApp } from '@proton/shared/lib/authentication/apps';
import { APPS } from '@proton/shared/lib/constants';
import { getPricingFromPlanIDs, getTotalFromPricing } from '@proton/shared/lib/helpers/subscription';
import { getKnowledgeBaseUrl, getTermsURL } from '@proton/shared/lib/helpers/url';
import { Api, PlansMap, VPNServersCountData } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

import Guarantee from './Guarantee';
import { PlanCard } from './PlanCardSelector';
import RightSummary from './RightSummary';
import SaveLabel from './SaveLabel';
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
    plansMap: PlansMap;
    vpnServersCountData: VPNServersCountData;
    selectedPlanCard?: PlanCard;
    loadingPaymentDetails: boolean;
    loadingSignup: boolean;
    onPay: (payment: 'signup-token' | PaypalPayment | TokenPayment | CardPayment | undefined) => Promise<void>;
    onValidate: () => Promise<boolean>;
    withLoadingSignup: WithLoading;
    measure: Measure;
    defaultMethod: PAYMENT_METHOD_TYPES | undefined;
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
    plansMap,
    vpnServersCountData,
    selectedPlanCard,
    loadingPaymentDetails,
    loadingSignup,
    withLoadingSignup,
}: Props) => {
    const formRef = useRef<HTMLFormElement>(null);
    const { APP_NAME } = useConfig();
    const { createModal } = useModals();

    const measurePay = (
        type: TelemetryPayType,
        event: TelemetryAccountSignupEvents.userCheckout | TelemetryAccountSignupEvents.checkoutError
    ) => {
        if (!options.plan) {
            return;
        }
        measure({
            event,
            dimensions: {
                type: type,
                plan: options.plan?.Name as any,
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

    const { session: maybeSession, paymentMethodStatus, subscriptionData } = model;

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
        cardFieldStatus,
    } = usePayment({
        ignoreName: true,
        api: normalApi,
        defaultMethod,
        amount: options.checkResult.AmountDue,
        currency: options.currency,
        onPaypalError: (type) => {
            measurePayError(type);
        },
        onValidatePaypal: async (type) => {
            measurePaySubmit(type);

            if ((await onValidate()) && validatePayment()) {
                return true;
            }
            return false;
        },
        onPaypalPay({ Payment, type }) {
            return withLoadingSignup(onPay(Payment)).catch(() => {
                measurePayError(type === PAYMENT_METHOD_TYPES.PAYPAL ? 'pay_pp' : 'pay_pp_no_cc');
            });
        },
    });

    const termsAndConditions = (
        <Href
            className="color-weak"
            key="terms"
            href={getTermsURL(getIsVPNApp(APP_NAME) ? APPS.PROTONVPN_SETTINGS : undefined)}
        >
            {
                // translator: Full sentence "By creating a Proton account, you agree to our terms and conditions"
                c('new_plans: signup').t`terms and conditions`
            }
        </Href>
    );

    const summaryPlan = getSummaryPlan(options.plan, vpnServersCountData);

    const pricing = getPricingFromPlanIDs(options.planIDs, plansMap);
    const totals = getTotalFromPricing(pricing, options.cycle);
    const pricePerMonth = totals.totalPerMonth;

    const isAuthenticated = !!model.session?.UID;

    return (
        <div className="flex on-mobile-flex-column flex-align-items-start flex-justify-space-between gap-14">
            <div className="flex-item-fluid on-mobile-order-1">
                <form
                    ref={formRef}
                    onFocus={(e) => {
                        const autocomplete = e.target.getAttribute('autocomplete');
                        if (autocomplete) {
                            measure({
                                event: TelemetryAccountSignupEvents.interactCreditCard,
                                dimensions: { field: autocomplete as any },
                            });
                        }
                    }}
                    name="payment-form"
                    onSubmit={async (event) => {
                        event.preventDefault();

                        const run = async () => {
                            if ((await onValidate()) && paymentParameters && handleCardSubmit() && validatePayment()) {
                                const amountAndCurrency: AmountAndCurrency = {
                                    Currency: options.currency,
                                    Amount: options.checkResult.AmountDue,
                                };

                                if (amountAndCurrency.Amount <= 0) {
                                    return onPay(undefined);
                                }

                                const data = await createPaymentToken(
                                    paymentParameters,
                                    getDefaultVerifyPayment(createModal, normalApi),
                                    normalApi,
                                    { amountAndCurrency }
                                );

                                return onPay(data.Payment);
                            }
                        };

                        measurePaySubmit('pay_cc');
                        withLoadingSignup(run()).catch(() => {
                            measurePayError('pay_cc');
                        });
                    }}
                    method="post"
                >
                    {options.checkResult.AmountDue ? (
                        <PaymentComponent
                            isAuthenticated={!!maybeSession?.UID}
                            api={normalApi}
                            type="signup-pass"
                            paypal={paypal}
                            paypalCredit={paypalCredit}
                            paymentMethods={maybeSession?.paymentMethods}
                            paymentMethodStatus={paymentMethodStatus}
                            method={method}
                            onBitcoinTokenValidated={(data) => {
                                measurePaySubmit('pay_btc');
                                return withLoadingSignup(onPay(data.Payment)).catch(() => {
                                    measurePayError('pay_btc');
                                });
                            }}
                            amount={options.checkResult.AmountDue}
                            currency={options.currency}
                            card={card}
                            onMethod={(newMethod) => {
                                if (method && newMethod && method !== newMethod) {
                                    const value = getPaymentMethod(newMethod);
                                    if (value) {
                                        measure({
                                            event: TelemetryAccountSignupEvents.paymentSelect,
                                            dimensions: { action: value },
                                        });
                                    }
                                }
                                setMethod(newMethod);
                            }}
                            onCard={(card, value) => setCard(card, value)}
                            cardErrors={cardErrors}
                            disabled={loadingSignup || loadingPaymentDetails}
                            noMaxWidth={true}
                            cardFieldStatus={cardFieldStatus}
                        />
                    ) : (
                        <div className="mb-4">{c('Info').t`No payment is required at this time.`}</div>
                    )}
                    {(() => {
                        if (method === PAYMENT_METHOD_TYPES.PAYPAL) {
                            return (
                                <div className="flex flex-column">
                                    <StyledPayPalButton
                                        paypal={paypal}
                                        amount={options.checkResult.AmountDue}
                                        loading={loadingSignup}
                                    />
                                    <PayPalButton
                                        id="paypal-credit"
                                        shape="ghost"
                                        color="norm"
                                        paypal={paypalCredit}
                                        amount={options.checkResult.AmountDue}
                                        className="mt-2"
                                    >
                                        {c('Link').t`Paypal without credit card`}
                                    </PayPalButton>
                                </div>
                            );
                        }

                        if (method === PAYMENT_METHOD_TYPES.BITCOIN) {
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
                                        const run = async () => {
                                            if ((await onValidate()) && validatePayment()) {
                                                return onPay('signup-token');
                                            }
                                        };

                                        measurePaySubmit('pay_btc');
                                        withLoadingSignup(run()).catch(() => {
                                            measurePayError('pay_btc');
                                        });
                                    }}
                                >
                                    {c('pass_signup_2023: Action').t`Continue with Bitcoin`}
                                </Button>
                            );
                        }

                        return (
                            <>
                                <Button type="submit" size="large" loading={loadingSignup} color="norm" fullWidth>
                                    {cta}
                                </Button>
                                {selectedPlanCard?.guarantee && (
                                    <div className="text-center color-success mt-4">
                                        <Guarantee />
                                    </div>
                                )}
                                <div className="mt-4 text-sm color-weak text-center">
                                    {c('pass_signup_2023: Info')
                                        .jt`By continuing, you agree to our ${termsAndConditions}`}
                                </div>
                            </>
                        );
                    })()}
                </form>
            </div>
            {summaryPlan && (
                <RightSummary className="mx-auto md:mx-0">
                    <div className="w100 border rounded-xl p-6">
                        <div className="text-rg text-bold mb-4">{c('Info').t`Summary`}</div>
                        <div className="flex gap-2 flex-nowrap mb-2 flex-align-items-center">
                            <div className="border rounded-lg p-2" title={summaryPlan.title}>
                                {summaryPlan.logo}
                            </div>
                            <div className="flex-item-fluid ">
                                <div className="flex flex rwo gap-2">
                                    <div className="text-rg text-bold flex-item-fluid">{summaryPlan.title}</div>

                                    <div className="text-rg text-bold">
                                        {getSimplePriceString(options.currency, pricePerMonth, '')}
                                    </div>
                                </div>
                                <div className="flex-item-fluid flex flex-align-items-center gap-2">
                                    {totals.discountPercentage > 0 && (
                                        <div className="flex-item-fluid">
                                            <SaveLabel highlightPrice={false} percent={totals.discountPercentage} />
                                        </div>
                                    )}

                                    {totals.discountPercentage > 0 && (
                                        <span className="inline-flex">
                                            <span className="text-sm color-weak text-strike text-ellipsis">
                                                {getSimplePriceString(
                                                    options.currency,
                                                    totals.totalNoDiscountPerMonth,
                                                    ''
                                                )}
                                            </span>
                                            <span className="text-sm color-weak ml-1">{` ${c('Suffix')
                                                .t`/month`}`}</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <PlanCardFeatureList
                            odd={false}
                            margin={false}
                            features={summaryPlan.features}
                            icon={false}
                            highlight={false}
                            iconSize={16}
                            tooltip={false}
                            className="text-sm mb-5 gap-1"
                            itemClassName="color-weak"
                        />
                        <div className="flex flex-column gap-2">
                            {(() => {
                                const proration = subscriptionData.checkResult?.Proration ?? 0;
                                const credits = subscriptionData.checkResult?.Credit ?? 0;
                                return [
                                    {
                                        id: 'amount',
                                        left: <span>{getTotalBillingText(options.cycle)}</span>,
                                        right: options.checkResult.Amount,
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
                                                    {loadingPaymentDetails ? null : (
                                                        <Price currency={subscriptionData.currency}>{right}</Price>
                                                    )}
                                                </span>
                                            </div>
                                        );
                                    });
                            })()}

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
                        </div>
                    </div>
                </RightSummary>
            )}
        </div>
    );
};

export default AccountStepPayment;
