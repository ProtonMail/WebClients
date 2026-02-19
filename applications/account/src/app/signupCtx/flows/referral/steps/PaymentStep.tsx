import { useRef } from 'react';

import { c } from 'ttag';

import { useReferralInfo } from '@proton/account/referralInfo/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { Alert3ds, SkeletonLoader } from '@proton/components';
import PaymentWrapper from '@proton/components/containers/payments/PaymentWrapper';
import { usePaymentFacade } from '@proton/components/payments/client-extensions';
import useLoading from '@proton/hooks/useLoading';
import { IcArrowLeft } from '@proton/icons/icons/IcArrowLeft';
import {
    PAYMENT_METHOD_TYPES,
    type PaymentProcessorHook,
    TRIAL_DURATION_DAYS,
    getPaymentsVersion,
    getPlanFromPlanIDs,
} from '@proton/payments';
import { PayButton, usePaymentOptimistic, useTaxCountry, useVatNumber } from '@proton/payments/ui';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
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

    const [referralInfo] = useReferralInfo();

    const { options } = payments;

    const startTrial = true;

    const paymentFacade = usePaymentFacade({
        // since we are not charging anything and we just want to validate the credit card, we set the amount to 0.
        // Chargebee might still create an authorization transaction typically 0.01$ or 0.5$ which will be immediately
        // refunded.
        amount: 0,
        isTrial: startTrial,

        currency: options.currency,
        selectedPlanName: getPlanFromPlanIDs(payments.plansMap, options.planIDs)?.Name,
        billingAddress: options.billingAddress,
        onChargeable: async (_, data) => {
            signup.submitPaymentData(options, data);
            return onPaymentTokenProcessed();
        },
        paymentStatus: payments.paymentStatus,
        flow: 'signup',
        product: signup.app,
        telemetryContext: payments.telemetryContext,
    });

    const validatePayment = () => {
        if (submitting || !payments.initializationStatus.pricingInitialized || payments.loadingPaymentDetails) {
            return false;
        }
        return true;
    };

    const taxCountry = useTaxCountry({
        onBillingAddressChange: payments.selectBillingAddress,
        paymentStatus: payments.paymentStatus,
        zipCodeBackendValid: payments.zipCodeValid,
        previousValidZipCode: payments.options.billingAddress.ZipCode,
        paymentFacade,
        telemetryContext: payments.telemetryContext,
    });

    const vatNumber = useVatNumber({
        selectedPlanName: payments.selectedPlan.getPlanName(),
        onChange: payments.setVatNumber,
        taxCountry,
    });

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
                <h1 className="font-arizona text-semibold text-8xl lh120 mb-2">
                    {
                        // translator: full sentence "Try Proton for 14 days free"
                        c('Signup').t`Try ${BRAND_NAME} for ${TRIAL_DURATION_DAYS} days free`
                    }
                </h1>

                <div className="mt-0 mb-6">
                    {signup.loading?.init ? (
                        <SkeletonLoader width="70%" height="1.4rem" />
                    ) : (
                        <p className="m-0 text-lg">
                            {c('Signup')
                                .t`And get ${referralInfo.uiData.refereeRewardAmount} in credits, if you subscribe.`}
                        </p>
                    )}
                </div>

                <PaymentWrapper
                    {...paymentFacade}
                    noMaxWidth
                    hideFirstLabel
                    onCurrencyChange={payments.selectCurrency}
                    taxCountry={taxCountry}
                    vatNumber={vatNumber}
                    startTrial={startTrial}
                />

                <PayButton
                    size="large"
                    color="norm"
                    fullWidth
                    pill
                    taxCountry={taxCountry}
                    paymentFacade={paymentFacade}
                    loading={submitting}
                    data-testid="pay"
                    className="py-4 text-semibold"
                    paypalClassName=""
                    product={signup.app}
                    telemetryContext={payments.telemetryContext}
                    suffix={
                        <div className="text-center mt-4">
                            <span className="color-success text-semibold">
                                <span>{c('Info').t`Zero charge today`}</span>
                            </span>
                        </div>
                    }
                >
                    {c('Action').t`Start free trial`}
                </PayButton>
                {showAlert3ds && <Alert3ds />}
            </form>
        </>
    );

    return (
        <Layout>
            <Header />

            <Wrapper marginTop="5vh">
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

                    {paymentsForm}
                </Main>
                <Aside>
                    <PricingCard step="payment" />
                </Aside>
            </Wrapper>
            <Footer />
        </Layout>
    );
};

export default PaymentStep;
