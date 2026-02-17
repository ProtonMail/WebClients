import { useState } from 'react';

import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { Alert3ds, LoaderPage } from '@proton/components';
import PaymentWrapper from '@proton/components/containers/payments/PaymentWrapper';
import { greenlandOfferCountryCodes } from '@proton/components/containers/payments/subscription/coupon-config/greenlandIceland';
import { usePaymentFacade } from '@proton/components/payments/client-extensions';
import useLoading from '@proton/hooks/useLoading';
import { IcShield } from '@proton/icons/icons/IcShield';
import { IcShield2CheckFilled } from '@proton/icons/icons/IcShield2CheckFilled';
import { PAYMENT_METHOD_TYPES, getPaymentsVersion, getPlanFromPlanIDs } from '@proton/payments';
import { PayButton, usePaymentOptimistic, useTaxCountry } from '@proton/payments/ui';
import { APPS, BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { getSentryError } from '@proton/shared/lib/keys';

import { SignupType } from '../../../../../signup/interfaces';
import { usePasswordInputInline } from '../../../../containers/password/usePasswordInput';
import useEmailInput from '../../../../containers/username/useEmailInput';
import { useSignup } from '../../../../context/SignupContext';
import { getStartUsingAppNameText } from '../../../../helpers/getStartUsingAppNameText';
import { PricingCard } from '../../components/PricingCard/PricingCard';
import Terms from '../../components/Terms';

const SwitchSignupType = () => {
    const signup = useSignup();

    const { availableSignupTypes, selectedSignupType, focusEmail } = signup.accountForm;

    if (availableSignupTypes.size <= 1) {
        return null;
    }

    const handleSwitchType = (signupType: SignupType) => {
        // Reset verification parameters if email is changed
        signup.accountForm.setSignupType(signupType);
        focusEmail(signupType);
    };

    const externalButton = (
        <InlineLinkButton
            key="external-account-switch"
            onClick={() => handleSwitchType(SignupType.Proton)}
            className="color-norm"
        >
            {c('Signup').t`get a secure ${MAIL_APP_NAME} address.`}
        </InlineLinkButton>
    );

    const internalButton = (
        <InlineLinkButton
            key="internal-account-switch"
            onClick={() => handleSwitchType(SignupType.External)}
            className="color-norm"
        >
            {c('Signup').t`use your current email.`}
        </InlineLinkButton>
    );

    return (
        <p className="mt-4 mb-6 mr-auto">
            {selectedSignupType === SignupType.External
                ? // translator: "Use your email, or get a secure Proton Mail address."
                  c('Signup').jt`Use your email, or ${externalButton}`
                : // translator: "Get a secure Proton Mail address, or use your own email."
                  c('Signup').jt`Get a secure ${MAIL_APP_NAME} address, or ${internalButton}`}
        </p>
    );
};

const AccountDetailsForm = ({ onSuccess }: { onSuccess: () => Promise<void> }) => {
    const signup = useSignup();
    const payments = usePaymentOptimistic();
    const [submitting, setSubmitting] = useState(false);
    const [processingPayment, withProcessingPayment] = useLoading();

    const handleRequestSubmit = () => {
        signup.accountForm.refs.form.current?.requestSubmit();
    };
    const { emailInput, loadingChallenge } = useEmailInput({
        autoFocus: true,
        onSubmit: handleRequestSubmit,
        loading: submitting || processingPayment,
        bigger: true,
    });
    const { passwordInputs } = usePasswordInputInline({
        autoFocus: false,
        loading: submitting || processingPayment,
        bigger: true,
    });

    const { options, initializationStatus } = payments;

    const paymentFacade = usePaymentFacade({
        checkResult: options.checkResult,
        amount: options.checkResult.AmountDue,
        currency: options.currency,
        selectedPlanName: getPlanFromPlanIDs(payments.plansMap, options.planIDs)?.Name,
        billingAddress: options.billingAddress,
        onChargeable: async (operations, data) => {
            signup.submitPaymentData(options, data);
            return onSuccess();
        },
        paymentStatus: payments.paymentStatus,
        flow: 'signup',
        product: APPS.PROTONMAIL,
        telemetryContext: payments.telemetryContext,
        coupon: options.checkResult.Coupon?.Code,
    });

    const taxCountry = useTaxCountry({
        onBillingAddressChange: payments.selectBillingAddress,
        paymentStatus: payments.paymentStatus,
        zipCodeBackendValid: payments.zipCodeValid,
        previousValidZipCode: payments.options.billingAddress.ZipCode,
        paymentFacade,
        telemetryContext: payments.telemetryContext,
        allowedCountries: greenlandOfferCountryCodes,
    });

    const validatePayment = () => {
        if (processingPayment || !initializationStatus.pricingInitialized || payments.loadingPaymentDetails) {
            return false;
        }
        return true;
    };

    const handlePaymentClick = async () => {
        if (submitting || processingPayment) {
            return;
        }

        try {
            setSubmitting(true);

            // Validate email and password together
            const isValid = await signup.accountForm.getIsValid({ passwords: true });
            if (!isValid) {
                setSubmitting(false);
                return;
            }

            // Submit account data
            const accountData = await signup.accountForm.getValidAccountData({ passwords: true });
            signup.submitAccountData(accountData);

            // Process payment
            if (!validatePayment() || !paymentFacade.selectedProcessor) {
                setSubmitting(false);
                return;
            }

            const processor = paymentFacade.selectedProcessor;

            // Process payment token
            await withProcessingPayment(
                (async () => {
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
                        throw error;
                    }
                })()
            );
        } catch (error) {
            // Error handling is done in the payment processing
            setSubmitting(false);
        }
    };

    const selectedMethodCard =
        paymentFacade.selectedMethodType === PAYMENT_METHOD_TYPES.CARD ||
        paymentFacade.selectedMethodType === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD;

    const showAlert3ds = selectedMethodCard;

    // Show loading state if payment initialization is not complete
    if (!initializationStatus.triggered) {
        return <LoaderPage text="Loading payment options" />;
    }

    return (
        <form
            ref={signup.accountForm.refs.form}
            name="accountForm"
            onSubmit={(e) => {
                e.preventDefault();
                void handlePaymentClick();
            }}
            method="post"
            autoComplete="off"
            noValidate
            className="w-full"
        >
            <h1 className="font-arizona lh120 text-5xl lg:text-7xl mb-4">
                {c('pass_signup_2023: Title').t`Create your ${BRAND_NAME} account`}
            </h1>
            <SwitchSignupType />

            {emailInput}

            <div className="mt-4">{passwordInputs}</div>

            <div className="mt-8">
                <h2 className="font-arizona text-semibold text-2xl mb-4">{c('Header').t`Checkout`}</h2>
                <div className="block md:hidden mb-6">
                    <PricingCard />
                </div>
                <PaymentWrapper
                    {...paymentFacade}
                    noMaxWidth
                    hideFirstLabel
                    onCurrencyChange={payments.selectCurrency}
                    taxCountry={taxCountry}
                />
            </div>

            <PayButton
                size="large"
                color="norm"
                type="submit"
                fullWidth
                pill
                taxCountry={taxCountry}
                paymentFacade={paymentFacade}
                loading={submitting || processingPayment}
                disabled={loadingChallenge || submitting || processingPayment}
                onClick={handlePaymentClick}
                data-testid="pay"
                className="py-4 text-semibold mt-6"
                paypalClassName=""
                product={APPS.PROTONMAIL}
                telemetryContext={payments.telemetryContext}
                suffix={
                    <div className="text-center mt-8">
                        <span className="color-success">
                            <IcShield className="align-text-bottom mr-1" />
                            <span>{c('Info').t`30-day money-back guarantee`}</span>
                        </span>
                    </div>
                }
            >
                {getStartUsingAppNameText(MAIL_APP_NAME)}
            </PayButton>
            {showAlert3ds && <Alert3ds />}

            <div className="text-center mt-4">
                <span className="color-success">
                    <IcShield2CheckFilled className="align-text-bottom mr-1" />
                    <span>{c('Info').t`End-to-end encrypted`}</span>
                </span>
            </div>

            <footer className="mt-8">
                <Terms />
            </footer>
        </form>
    );
};

export default AccountDetailsForm;
