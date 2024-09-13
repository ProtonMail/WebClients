import type { MutableRefObject, ReactNode } from 'react';
import { useImperativeHandle, useRef } from 'react';

import { c } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms';
import { Info, PayPalButton, Price, StyledPayPalButton } from '@proton/components';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import InclusiveVatText from '@proton/components/containers/payments/InclusiveVatText';
import PaymentWrapper from '@proton/components/containers/payments/PaymentWrapper';
import type { OnBillingAddressChange } from '@proton/components/containers/payments/TaxCountrySelector';
import { WrappedTaxCountrySelector } from '@proton/components/containers/payments/TaxCountrySelector';
import { getTotalBillingText } from '@proton/components/containers/payments/helper';
import { ProtonPlanCustomizer, getHasPlanCustomizer } from '@proton/components/containers/payments/planCustomizer';
import { getBillingAddressStatus } from '@proton/components/containers/payments/subscription/helpers';
import { useAssistantAddonEnabledSignup } from '@proton/components/hooks/assistant/useAssistantFeatureEnabled';
import { ChargebeePaypalWrapper } from '@proton/components/payments/chargebee/ChargebeeWrapper';
import { usePaymentFacade } from '@proton/components/payments/client-extensions';
import { BilledUserInlineMessage } from '@proton/components/payments/client-extensions/billed-user';
import { useChargebeeContext } from '@proton/components/payments/client-extensions/useChargebeeContext';
import type { PaymentProcessorHook } from '@proton/components/payments/react-extensions/interface';
import type { WithLoading } from '@proton/hooks/useLoading';
import type { ExtendedTokenPayment, PaymentMethodFlows, TokenPayment } from '@proton/payments';
import { PAYMENT_METHOD_TYPES, isV5PaymentToken, v5PaymentTokenToLegacyPaymentToken } from '@proton/payments';
import { getPaymentsVersion } from '@proton/shared/lib/api/payments';
import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import { APPS } from '@proton/shared/lib/constants';
import { getCheckout } from '@proton/shared/lib/helpers/checkout';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { getIsB2BAudienceFromPlan, getIsVpnPlan, isTaxInclusive } from '@proton/shared/lib/helpers/subscription';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Api, Plan, VPNServersCountData } from '@proton/shared/lib/interfaces';
import { Audience, isBilledUser } from '@proton/shared/lib/interfaces';
import { getSentryError } from '@proton/shared/lib/keys';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { usePublicTheme } from '../containers/PublicThemeProvider';
import Guarantee from './Guarantee';
import RightPlanSummary, { RightPlanSummaryAddons } from './RightPlanSummary';
import RightSummary from './RightSummary';
import SaveLabel from './SaveLabel';
import { getSummaryPlan } from './configuration';
import type { Measure, OptimisticOptions, SignupModelV2, SignupParameters2 } from './interface';
import type { TelemetryPayType } from './measure';
import { getPaymentMethod } from './measure';

export interface AccountStepPaymentRef {
    process: () => void;
    validate: () => Promise<boolean>;
    scrollIntoView: () => void;
}

interface Props {
    accountStepPaymentRef: MutableRefObject<AccountStepPaymentRef | undefined>;
    cta: string;
    api: Api;
    model: SignupModelV2;
    options: OptimisticOptions;
    selectedPlan: Plan;
    vpnServersCountData: VPNServersCountData;
    loadingPaymentDetails: boolean;
    loadingSignup: boolean;
    onPay: (payment: 'signup-token' | ExtendedTokenPayment, type: 'pp' | 'btc' | 'cc' | undefined) => Promise<void>;
    onValidate: () => boolean;
    isDarkBg?: boolean;
    withLoadingSignup: WithLoading;
    measure: Measure;
    defaultMethod: PAYMENT_METHOD_TYPES | undefined;
    takeNullCreditCard?: boolean;
    handleOptimistic: (optimistic: Partial<OptimisticOptions>) => void;
    onBillingAddressChange: OnBillingAddressChange;
    terms?: ReactNode;
    signupParameters: SignupParameters2;
}

const AccountStepPayment = ({
    measure,
    cta,
    accountStepPaymentRef,
    api: normalApi,
    defaultMethod,
    handleOptimistic,
    onPay,
    onValidate,
    model,
    selectedPlan,
    options,
    vpnServersCountData,
    loadingPaymentDetails,
    loadingSignup,
    withLoadingSignup,
    onBillingAddressChange,
    terms,
    signupParameters,
}: Props) => {
    const publicTheme = usePublicTheme();
    const formRef = useRef<HTMLFormElement>(null);
    const scribeEnabled = useAssistantAddonEnabledSignup();

    const measurePay = (
        type: TelemetryPayType,
        event: TelemetryAccountSignupEvents.userCheckout | TelemetryAccountSignupEvents.checkoutError
    ) => {
        if (!selectedPlan) {
            return;
        }

        void measure({
            event,
            dimensions: {
                type: type,
                plan: selectedPlan.Name as any,
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

    const chargebeeContext = useChargebeeContext();

    const isAuthenticated = !!model.session?.UID;

    const flow: PaymentMethodFlows = (() => {
        if (signupParameters.product === APPS.PROTONPASS) {
            return isAuthenticated ? 'signup-pass-upgrade' : 'signup-pass';
        }

        return isAuthenticated ? 'signup-v2-upgrade' : 'signup-v2';
    })();

    const user = model.session?.user;

    const billingAddress = model.subscriptionData.billingAddress;

    const paymentFacade = usePaymentFacade({
        checkResult: options.checkResult,
        amount: options.checkResult.AmountDue,
        currency: options.currency,
        selectedPlanName: selectedPlan.Name,
        flow,
        paymentMethods: model.session?.paymentMethods,
        paymentMethodStatusExtended: model.paymentMethodStatusExtended,
        api: normalApi,
        chargebeeEnabled: user?.ChargebeeUser,
        theme: publicTheme,
        billingAddress,
        user,
        onChargeable: (_, { chargeablePaymentParameters, paymentsVersion, paymentProcessorType }) => {
            return withLoadingSignup(async () => {
                const extendedTokenPayment: ExtendedTokenPayment = {
                    paymentsVersion,
                    paymentProcessorType,
                };

                const isFreeSignup = chargeablePaymentParameters.Amount <= 0;
                if (isFreeSignup) {
                    await onPay(extendedTokenPayment, undefined);
                    return;
                }

                const type = chargeablePaymentParameters.type;
                let paymentType: 'cc' | 'pp' | 'btc';
                if (type === PAYMENT_METHOD_TYPES.PAYPAL || type === PAYMENT_METHOD_TYPES.PAYPAL_CREDIT) {
                    paymentType = 'pp';
                } else if (type === PAYMENT_METHOD_TYPES.BITCOIN || type === PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN) {
                    paymentType = 'btc';
                } else {
                    paymentType = 'cc';
                }

                const legacyTokenPayment: TokenPayment | undefined = isV5PaymentToken(chargeablePaymentParameters)
                    ? v5PaymentTokenToLegacyPaymentToken(chargeablePaymentParameters).Payment
                    : undefined;

                Object.assign(extendedTokenPayment, legacyTokenPayment);

                await onPay(extendedTokenPayment, paymentType);
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

            if (processor?.meta.type === 'bitcoin') {
                return 'pay_btc';
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
                        plan: selectedPlan,
                        planName: selectedPlan.Name,
                        paymentsVersion: getPaymentsVersion(),
                        chargebeeEnabled: chargebeeContext.enableChargebeeRef.current,
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

    const handleProcess = () => {
        return process(paymentFacade.selectedProcessor);
    };

    useImperativeHandle(accountStepPaymentRef, () => ({
        process: handleProcess,
        validate: async () => {
            return validatePayment();
        },
        scrollIntoView: () => {
            setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
        },
    }));

    if (isBilledUser(user)) {
        return <BilledUserInlineMessage />;
    }

    const isB2BPlan = getIsB2BAudienceFromPlan(selectedPlan.Name);

    const hasSomeVpnPlan = getIsVpnPlan(selectedPlan.Name);

    const summaryPlan = getSummaryPlan({ plan: selectedPlan, vpnServersCountData, freePlan: model.freePlan });

    const hasCouponCode = !!model.subscriptionData?.checkResult.Coupon?.Code;
    const currentCheckout = getCheckout({
        // If there is a coupon code, ignore the optimistc results from options since they don't contain the correct discount.
        planIDs: hasCouponCode ? model.subscriptionData.planIDs : options.planIDs,
        plansMap: model.plansMap,
        checkResult: hasCouponCode ? model.subscriptionData.checkResult : options.checkResult,
    });

    return (
        <div className="flex flex-column md:flex-row items-stretch md:items-start justify-space-between gap-14">
            <div className="shrink-0 md:flex-1 order-1 md:order-0">
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
                        handleProcess();
                    }}
                    method="post"
                >
                    {(() => {
                        const planIDs = options.planIDs;
                        const { hasPlanCustomizer, currentPlan } = getHasPlanCustomizer({
                            plansMap: model.plansMap,
                            planIDs,
                        });
                        if (!hasPlanCustomizer || !currentPlan) {
                            return null;
                        }
                        return (
                            <>
                                <ProtonPlanCustomizer
                                    scribeEnabled={scribeEnabled}
                                    mode="signup"
                                    loading={false}
                                    currentPlan={currentPlan}
                                    currency={options.currency}
                                    cycle={options.cycle}
                                    plansMap={model.plansMap}
                                    planIDs={planIDs}
                                    onChangePlanIDs={(planIDs) => handleOptimistic({ planIDs })}
                                    audience={isB2BPlan ? Audience.B2B : Audience.B2C}
                                />
                                <div className="mt-6 mb-6">
                                    <hr />
                                </div>
                            </>
                        );
                    })()}
                    {options.checkResult.AmountDue ? (
                        <PaymentWrapper
                            {...paymentFacade}
                            defaultMethod={defaultMethod} // needed for Bitcoin signup
                            isAuthenticated={isAuthenticated} // needed for Bitcoin signup
                            disabled={loadingSignup || loadingPaymentDetails}
                            noMaxWidth
                            hideFirstLabel
                            hasSomeVpnPlan={hasSomeVpnPlan}
                            billingAddressStatus={getBillingAddressStatus(billingAddress)}
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
                                        pill
                                    />
                                    {!hasSomeVpnPlan && (
                                        <PayPalButton
                                            id="paypal-credit"
                                            shape="ghost"
                                            color="norm"
                                            pill
                                            paypal={paymentFacade.paypalCredit}
                                            disabled={loadingSignup}
                                            amount={paymentFacade.amount}
                                            currency={paymentFacade.currency}
                                            onClick={() => process(paymentFacade.paypalCredit)}
                                        >
                                            {c('Link').t`Paypal without credit card`}
                                        </PayPalButton>
                                    )}
                                </div>
                            );
                        }

                        if (
                            paymentFacade.selectedMethodType === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL &&
                            options.checkResult.AmountDue > 0
                        ) {
                            return (
                                <ChargebeePaypalWrapper
                                    chargebeePaypal={paymentFacade.chargebeePaypal}
                                    iframeHandles={paymentFacade.iframeHandles}
                                />
                            );
                        }

                        if (
                            (paymentFacade.selectedMethodType === PAYMENT_METHOD_TYPES.BITCOIN ||
                                paymentFacade.selectedMethodType === PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN) &&
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
                                    pill
                                    className="block mx-auto"
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
                                    pill
                                    data-testid="pay"
                                    className="block mx-auto"
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
                            </>
                        );
                    })()}
                    {!isAuthenticated && terms}
                </form>
            </div>
            {(() => {
                if (!summaryPlan) {
                    return null;
                }

                const proration = subscriptionData.checkResult?.Proration ?? 0;
                const credits = subscriptionData.checkResult?.Credit ?? 0;
                const couponDiscount = currentCheckout.couponDiscount || 0;

                const showAmountDue = proration !== 0 || credits !== 0 || couponDiscount !== 0;

                const taxInclusiveText = (
                    <InclusiveVatText
                        tax={options.checkResult?.Taxes?.[0]}
                        currency={subscriptionData.currency}
                        className="text-sm color-weak"
                    />
                );

                return (
                    <RightSummary variant="border" className="mx-auto md:mx-0 rounded-xl">
                        <RightPlanSummary
                            cycle={options.cycle}
                            title={summaryPlan.title}
                            price={getSimplePriceString(options.currency, currentCheckout.withDiscountPerMonth)}
                            regularPrice={getSimplePriceString(
                                options.currency,
                                currentCheckout.withoutDiscountPerMonth
                            )}
                            addons={
                                <RightPlanSummaryAddons
                                    cycle={options.cycle}
                                    checkout={currentCheckout}
                                    currency={options.currency}
                                />
                            }
                            logo={summaryPlan.logo}
                            discount={currentCheckout.discountPercent}
                            features={summaryPlan.features}
                            checkout={currentCheckout}
                            mode={isB2BPlan ? 'addons' : undefined}
                        >
                            {paymentFacade.showTaxCountry && (
                                <WrappedTaxCountrySelector
                                    className="mb-2"
                                    onBillingAddressChange={onBillingAddressChange}
                                    statusExtended={
                                        // If we are in signup-token mode, then it means that user created an account by clicking "Continue with bitcoin"
                                        // It also means that before user created the account, they might changed the billing address.
                                        // The account creation re-renders the entire component and resets the user choice. So if we know that this billing address
                                        // is rendered after the account creation, then we used the saved user choice from the model.
                                        model.signupTokenMode ? billingAddress : model.paymentMethodStatusExtended
                                    }
                                />
                            )}
                            <div className="flex flex-column gap-2">
                                {(() => {
                                    const getPrice = (price: number) => {
                                        return <Price currency={subscriptionData.currency}>{price}</Price>;
                                    };
                                    return [
                                        {
                                            id: 'amount',
                                            left: <span>{getTotalBillingText(options.cycle)}</span>,
                                            right: (
                                                <>
                                                    {getPrice(currentCheckout.withoutDiscountPerCycle)}
                                                    {!showAmountDue && '*'}
                                                </>
                                            ),
                                            bold: true,
                                            loader: !showAmountDue,
                                        },
                                        couponDiscount !== 0 && {
                                            id: 'discount',
                                            left: (
                                                <div>
                                                    {c('Info').t`Discount`}{' '}
                                                    <span className="text-sm">
                                                        <SaveLabel percent={currentCheckout.discountPercent} />
                                                    </span>
                                                </div>
                                            ),
                                            right: getPrice(couponDiscount),
                                        },
                                        proration !== 0 && {
                                            id: 'proration',
                                            left: (
                                                <span className="inline-flex items-center">
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
                                            right: getPrice(proration),
                                            bold: false,
                                        },
                                        credits !== 0 && {
                                            id: 'credits',
                                            left: <span>{c('Title').t`Credits`}</span>,
                                            right: getPrice(credits),
                                            bold: false,
                                        },
                                        !showAmountDue &&
                                            paymentFacade.showInclusiveTax && {
                                                id: 'vat',
                                                left: taxInclusiveText,
                                            },
                                    ]
                                        .filter(isTruthy)
                                        .map(({ id, bold, left, right, loader }) => {
                                            return (
                                                <div
                                                    key={id}
                                                    className={clsx(
                                                        bold && 'text-bold',
                                                        'flex justify-space-between text-rg'
                                                    )}
                                                >
                                                    {left}
                                                    <span>
                                                        {(() => {
                                                            if (!right) {
                                                                return null;
                                                            }

                                                            if (loadingPaymentDetails) {
                                                                if (loader) {
                                                                    return <CircleLoader />;
                                                                }
                                                                return null;
                                                            }

                                                            return right;
                                                        })()}
                                                    </span>
                                                </div>
                                            );
                                        });
                                })()}

                                {showAmountDue && (
                                    <>
                                        <hr className="m-0" />
                                        <div className="flex justify-space-between text-bold text-rg">
                                            <span className="">{c('Label').t`Amount due`}</span>
                                            <span>
                                                {loadingPaymentDetails ? (
                                                    <CircleLoader />
                                                ) : (
                                                    <>
                                                        <Price currency={subscriptionData.currency}>
                                                            {options.checkResult.AmountDue}
                                                        </Price>
                                                        *
                                                    </>
                                                )}
                                            </span>
                                        </div>
                                        {isTaxInclusive(options.checkResult) && taxInclusiveText}
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
