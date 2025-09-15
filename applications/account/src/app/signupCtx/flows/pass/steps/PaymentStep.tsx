import { type FC, type FormEvent, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import { Alert3ds, Icon } from '@proton/components';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import PaymentWrapper from '@proton/components/containers/payments/PaymentWrapper';
import { ProtonPlanCustomizer, getHasPlanCustomizer } from '@proton/components/containers/payments/planCustomizer';
import { usePaymentFacade } from '@proton/components/payments/client-extensions';
import { IcShield } from '@proton/icons';
import { PAYMENT_METHOD_TYPES, PLANS, getPaymentsVersion, getPlanFromPlanIDs } from '@proton/payments';
import { PayButton, usePaymentOptimistic, useTaxCountry, useVatNumber } from '@proton/payments/ui';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { Audience } from '@proton/shared/lib/interfaces';
import { getSentryError } from '@proton/shared/lib/keys';

import { useSignup } from '../../../context/SignupContext';
import { Layout } from '../components/Layout/Layout';

type Props = {
    onContinue: () => Promise<void>;
    onBack: () => void;
};

const getMonths = (n: number) => c('Pass signup: info').ngettext(msgid`${n} month`, `${n} months`, n);

export const PaymentStep: FC<Props> = ({ onContinue, onBack }) => {
    const signup = useSignup();
    const payments = usePaymentOptimistic();
    const [loading, setLoading] = useState(false);
    const { options } = payments;
    const amountDue = getSimplePriceString(payments.currency, options.checkResult.AmountDue);
    const monthlyPrice = getSimplePriceString(payments.currency, payments.uiData.checkout.withDiscountPerMonth);

    const paymentFacade = usePaymentFacade({
        checkResult: options.checkResult,
        amount: options.checkResult.AmountDue,
        currency: options.currency,
        selectedPlanName: getPlanFromPlanIDs(payments.plansMap, options.planIDs)?.Name,
        billingAddress: options.billingAddress,
        onChargeable: async (operations, data) => {
            try {
                signup.submitPaymentData(options, data);
                await signup.afterSetupSubscribe();
                await onContinue();
            } catch (error) {
                setLoading(false);
            }
        },
        paymentStatus: payments.paymentStatus,
        flow: 'signup',
    });

    const validatePayment = () => {
        if (loading || !payments.initializationStatus.pricingInitialized || payments.loadingPaymentDetails) {
            return false;
        }
        return true;
    };

    const taxCountry = useTaxCountry({
        onBillingAddressChange: payments.selectBillingAddress,
        paymentStatus: payments.paymentStatus,
        zipCodeBackendValid: payments.zipCodeValid,
        previosValidZipCode: payments.options.billingAddress.ZipCode,
        paymentFacade,
    });

    const vatNumber = useVatNumber({
        selectedPlanName: payments.selectedPlan.getPlanName(),
        onChange: payments.setVatNumber,
        taxCountry,
    });

    const handleProcess = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const processor = paymentFacade.selectedProcessor;

        if (!processor || !validatePayment()) {
            return;
        }

        setLoading(true);

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
            setLoading(false);
        }
    };

    const methodsAllowed: string[] = [PAYMENT_METHOD_TYPES.CARD, PAYMENT_METHOD_TYPES.CHARGEBEE_CARD];
    const showAlert3ds = methodsAllowed.includes(paymentFacade.selectedMethodType ?? '');

    const months = getMonths(payments.uiData.checkout.cycle);
    return (
        <Layout>
            <section className="max-w-custom" style={{ '--max-w-custom': '25rem' }}>
                <div className="flex items-center justify-space-between mb-12">
                    <Button shape="ghost" icon pill onClick={onBack}>
                        <Icon name="arrow-left" size={6} />
                    </Button>
                    <div className="text-center">
                        <span className="text-sm color-weak">{payments.selectedPlan.getPlan().Title}</span>
                        <h3 className="text-5xl text-bold my-1">{amountDue}</h3>
                        {payments.selectedPlan.name !== PLANS.PASS_LIFETIME && (
                            <h4 className="text-sm color-weak">
                                {monthlyPrice}
                                {
                                    // translator: Full sentence "4.99 /month x 12 months"
                                    c('Label').jt`/month x ${months}`
                                }
                            </h4>
                        )}
                    </div>
                    <span />
                </div>
                <form name="payment-form" onSubmit={handleProcess} method="post">
                    {(() => {
                        const planIDs = payments.options.planIDs;

                        if (!getHasPlanCustomizer(planIDs)) {
                            return null;
                        }

                        return (
                            <ProtonPlanCustomizer
                                separator
                                mode="signup"
                                loading={false}
                                currency={payments.options.currency}
                                cycle={payments.options.cycle}
                                plansMap={payments.plansMap}
                                selectedPlanIDs={planIDs}
                                onChangePlanIDs={(planIDs) => payments.selectPlanIDs(planIDs)}
                                audience={Audience.B2C}
                                scribeAddonEnabled
                                showUsersTooltip
                            />
                        );
                    })()}

                    <PaymentWrapper
                        {...paymentFacade}
                        noMaxWidth
                        hideFirstLabel
                        onCurrencyChange={payments.selectCurrency}
                        taxCountry={taxCountry}
                        vatNumber={vatNumber}
                    />

                    <PayButton
                        size="large"
                        color="norm"
                        fullWidth
                        pill
                        taxCountry={taxCountry}
                        paymentFacade={paymentFacade}
                        loading={loading}
                        data-testid="pay"
                        className="py-4 text-semibold"
                        suffix={
                            <div className="text-center mt-8">
                                <span className="color-success">
                                    <IcShield className="align-text-bottom mr-1" />
                                    <span>{c('Info').t`30-day money-back guarantee`}</span>
                                </span>
                            </div>
                        }
                    >
                        {c('Action').t`Start using ${PASS_APP_NAME} now`}
                    </PayButton>
                    {showAlert3ds && <Alert3ds />}
                </form>
            </section>
        </Layout>
    );
};
