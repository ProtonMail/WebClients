import { useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Alert3ds, PayPalButton, StyledPayPalButton } from '@proton/components';
import PaymentWrapper from '@proton/components/containers/payments/PaymentWrapper';
import { ProtonPlanCustomizer, getHasPlanCustomizer } from '@proton/components/containers/payments/planCustomizer';
import { ApplePayButton, ChargebeePaypalWrapper } from '@proton/components/payments/chargebee/ChargebeeWrapper';
import { usePaymentFacade } from '@proton/components/payments/client-extensions';
import { useChargebeeContext } from '@proton/components/payments/client-extensions/useChargebeeContext';
import useLoading from '@proton/hooks/useLoading';
import { IcArrowLeft, IcShield } from '@proton/icons';
import {
    PAYMENT_METHOD_TYPES,
    type PaymentProcessorHook,
    getBillingAddressStatus,
    getIsB2BAudienceFromPlan,
    getIsVpnPlan,
    getPaymentsVersion,
    getPlanFromPlanIDs,
} from '@proton/payments';
import { usePaymentOptimistic } from '@proton/payments/ui';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { Audience } from '@proton/shared/lib/interfaces';
import { getSentryError } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import { useSignup } from '../../../context/SignupContext';
import { Aside } from '../components/Layout/Aside';
import { Footer } from '../components/Layout/Footer';
import Header from '../components/Layout/Header';
import Layout from '../components/Layout/Layout';
import { Main } from '../components/Layout/Main';
import { Wrapper } from '../components/Layout/Wrapper';
import { PricingCard } from '../components/PricingCard/PricingCard';
import Terms from '../components/Terms';

interface Props {
    onPaymentTokenProcessed: () => Promise<void>;
    onBack: () => void;
}

/**
 * This contains alot of payments boilerplate that should/will be removed
 */
const PaymentStep = ({ onPaymentTokenProcessed, onBack }: Props) => {
    const signup = useSignup();
    const payments = usePaymentOptimistic();
    const formRef = useRef<HTMLFormElement>(null);

    const [submitting, withSubmitting] = useLoading();

    const { options } = payments;

    const paymentFacade = usePaymentFacade({
        checkResult: options.checkResult,
        amount: options.checkResult.AmountDue,
        currency: options.currency,
        selectedPlanName: getPlanFromPlanIDs(payments.plansMap, options.planIDs)?.Name,
        billingAddress: options.billingAddress,
        onChargeable: async (operations, data) => {
            signup.submitPaymentData(options, data);
            return onPaymentTokenProcessed();
        },
        paymentMethodStatusExtended: payments.paymentsStatus,
        flow: 'signup',
    });

    const validatePayment = () => {
        if (submitting || !payments.initializationStatus.pricingInitialized || payments.loadingPaymentDetails) {
            return false;
        }
        return true;
    };

    const chargebeeContext = useChargebeeContext();

    const process = (processor: PaymentProcessorHook | undefined) => {
        if (!validatePayment()) {
            return;
        }

        async function run() {
            if (!processor) {
                return;
            }
            try {
                await processor.processPaymentToken();
            } catch (error) {
                // measurePayError(telemetryType);

                const sentryError = getSentryError(error);
                if (sentryError) {
                    const context = {
                        currency: payments.options.currency,
                        amount: payments.checkResult.AmountDue,
                        processorType: processor.meta.type,
                        paymentMethod: paymentFacade.selectedMethodType,
                        paymentMethodValue: paymentFacade.selectedMethodValue,
                        cycle: payments.options.cycle,
                        plan: payments.selectedPlan,
                        planName: payments.selectedPlan.getPlanName(),
                        paymentsVersion: getPaymentsVersion(),
                        chargebeeEnabled: chargebeeContext.enableChargebeeRef.current,
                    };

                    captureMessage(`Payments: Failed to handle ${signup.flowId}`, {
                        level: 'error',
                        extra: { error: sentryError, context },
                    });
                }
            }
        }

        withSubmitting(run()).catch(noop);
    };

    const handleProcess = () => {
        return process(paymentFacade.selectedProcessor);
    };

    const selectedMethodCard =
        paymentFacade.selectedMethodType === PAYMENT_METHOD_TYPES.CARD ||
        paymentFacade.selectedMethodType === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD;

    const showAlert3ds = selectedMethodCard;

    const planName = payments.selectedPlan.getPlanName();
    const isB2BPlan = getIsB2BAudienceFromPlan(planName);
    const hasSomeVpnPlan = getIsVpnPlan(planName);

    const paymentsForm = (
        <>
            <form
                ref={formRef}
                name="payment-form"
                onSubmit={(event) => {
                    event.preventDefault();
                    handleProcess();
                }}
                method="post"
                className="w-full"
            >
                {(() => {
                    const planIDs = payments.options.planIDs;
                    const { hasPlanCustomizer, currentPlan } = getHasPlanCustomizer({
                        plansMap: payments.plansMap,
                        planIDs,
                    });

                    if (!hasPlanCustomizer || !currentPlan) {
                        return null;
                    }
                    return (
                        <ProtonPlanCustomizer
                            separator
                            mode="signup"
                            loading={false}
                            currentPlan={currentPlan}
                            currency={payments.options.currency}
                            cycle={payments.options.cycle}
                            plansMap={payments.plansMap}
                            planIDs={planIDs}
                            onChangePlanIDs={(planIDs) => payments.selectPlanIDs(planIDs)}
                            audience={isB2BPlan ? Audience.B2B : Audience.B2C}
                            scribeAddonEnabled
                            showUsersTooltip
                        />
                    );
                })()}
                <PaymentWrapper
                    {...paymentFacade}
                    noMaxWidth
                    hideFirstLabel
                    hasSomeVpnPlan={hasSomeVpnPlan}
                    billingAddressStatus={getBillingAddressStatus(payments.options.billingAddress)}
                />

                {(() => {
                    if (
                        paymentFacade.selectedMethodValue === PAYMENT_METHOD_TYPES.PAYPAL &&
                        payments.checkResult.AmountDue > 0
                    ) {
                        return (
                            <div className="flex flex-column gap-2">
                                <StyledPayPalButton
                                    paypal={paymentFacade.paypal}
                                    amount={paymentFacade.amount}
                                    currency={paymentFacade.currency}
                                    loading={submitting}
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
                                        disabled={submitting}
                                        amount={paymentFacade.amount}
                                        currency={paymentFacade.currency}
                                        onClick={() => process(paymentFacade.paypalCredit)}
                                    >
                                        {c('Link').t`PayPal without credit card`}
                                    </PayPalButton>
                                )}
                            </div>
                        );
                    }

                    if (
                        paymentFacade.selectedMethodType === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL &&
                        payments.checkResult.AmountDue > 0
                    ) {
                        return (
                            <ChargebeePaypalWrapper
                                chargebeePaypal={paymentFacade.chargebeePaypal}
                                iframeHandles={paymentFacade.iframeHandles}
                            />
                        );
                    }

                    if (paymentFacade.selectedMethodType === PAYMENT_METHOD_TYPES.APPLE_PAY) {
                        return (
                            <ApplePayButton
                                applePay={paymentFacade.applePay}
                                iframeHandles={paymentFacade.iframeHandles}
                            />
                        );
                    }

                    if (
                        (paymentFacade.selectedMethodType === PAYMENT_METHOD_TYPES.BITCOIN ||
                            paymentFacade.selectedMethodType === PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN) &&
                        payments.checkResult.AmountDue > 0
                    ) {
                        return (
                            <Button
                                type="button"
                                size="large"
                                loading={submitting}
                                color="norm"
                                pill
                                fullWidth
                                className="py-4 text-semibold"
                                onClick={() => {
                                    captureMessage('Bitcoin payments not supported in CtxSignup');
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
                                loading={submitting}
                                color="norm"
                                pill
                                fullWidth
                                data-testid="pay"
                                className="py-4 text-semibold"
                            >
                                {c('Action').t`Confirm purchase`}
                            </Button>

                            <div className="text-center mt-8">
                                <span className="color-success">
                                    <IcShield className="align-text-bottom mr-1" />
                                    <span>{c('Info').t`30-day money-back guarantee`}</span>
                                </span>
                            </div>

                            {showAlert3ds && <Alert3ds />}
                        </>
                    );
                })()}
            </form>
        </>
    );

    return (
        <Layout>
            <Header />

            <Wrapper minHeight="calc(100vh - 4.25rem - 3.75rem)">
                <Main>
                    <Button
                        onClick={onBack}
                        shape="ghost"
                        size="small"
                        className="inline-flex gap-1 items-center self-start ml-custom"
                        style={{ '--ml-custom': 'calc(var(--padding-inline) * -1)' }}
                        data-testid="back-button"
                    >
                        <IcArrowLeft className="shrink-0" />
                        {c('Action').t`Go back`}
                    </Button>
                    <h1 className="font-arizona text-semibold text-8xl mb-4">
                        {c('Signup').t`Confirm payment, access your Drive`}
                    </h1>
                    {paymentsForm}

                    <Terms />
                </Main>
                <Aside>
                    <PricingCard step="payment" paymentFacade={paymentFacade} />
                </Aside>
            </Wrapper>
            <Footer />
        </Layout>
    );
};

export default PaymentStep;
