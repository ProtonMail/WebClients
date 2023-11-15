import { FormEvent, useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, Price, useConfig } from '@proton/components';
import {
    Alert3ds,
    CurrencySelector,
    PlanCustomization,
    StyledPayPalButton,
    SubscriptionCheckoutCycleItem,
    SubscriptionCycleSelector,
    getRenewalNoticeText,
} from '@proton/components/containers/payments';
import PaymentWrapper from '@proton/components/containers/payments/PaymentWrapper';
import { usePaymentFacade } from '@proton/components/payments/client-extensions';
import {
    CardPayment,
    PAYMENT_METHOD_TYPES,
    PaymentMethodStatus,
    PaypalPayment,
    TokenPayment,
} from '@proton/components/payments/core';
import { PaymentProcessorHook } from '@proton/components/payments/react-extensions/interface';
import { useLoading } from '@proton/hooks';
import metrics from '@proton/metrics';
import { PLANS } from '@proton/shared/lib/constants';
import { getIsCustomCycle } from '@proton/shared/lib/helpers/checkout';
import { toMap } from '@proton/shared/lib/helpers/object';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { Api, Currency, Cycle, Plan, PlansMap } from '@proton/shared/lib/interfaces';
import { getSentryError } from '@proton/shared/lib/keys';

import Content from '../public/Content';
import Header from '../public/Header';
import Main from '../public/Main';
import { getSignupApplication } from './helper';
import { PlanIDs, SubscriptionData } from './interfaces';

export interface Props {
    api: Api;
    subscriptionData: SubscriptionData;
    plans: Plan[];
    onBack?: () => void;
    onPay: (payment: PaypalPayment | TokenPayment | CardPayment | undefined, type: 'cc' | 'pp') => Promise<void>;
    onChangePlanIDs: (planIDs: PlanIDs) => void;
    onChangeCurrency: (currency: Currency) => void;
    onChangeCycle: (cycle: Cycle) => void;
    plan: Plan | undefined;
    planName: string | undefined;
    paymentMethodStatus: PaymentMethodStatus | undefined;
}

const PaymentStep = ({
    onBack,
    onPay,
    onChangeCycle,
    onChangeCurrency,
    onChangePlanIDs,
    plan,
    plans,
    planName: planNameString,
    subscriptionData,
}: Props) => {
    const { APP_NAME } = useConfig();
    const [loading, withLoading] = useLoading();

    const plansMap = toMap(plans, 'Name') as PlansMap;
    const hasGuarantee = plan?.Name === PLANS.VPN;

    const paymentFacade = usePaymentFacade({
        amount: subscriptionData.checkResult.AmountDue,
        currency: subscriptionData.currency,
        onChargeable: (_, { chargeablePaymentParameters, source }) => {
            return withLoading(async () => {
                let type: 'cc' | 'pp';
                if (source === PAYMENT_METHOD_TYPES.PAYPAL || source === PAYMENT_METHOD_TYPES.PAYPAL_CREDIT) {
                    type = 'pp';
                } else if (source === PAYMENT_METHOD_TYPES.CARD) {
                    type = 'cc';
                } else {
                    throw new Error('Invalid payment source');
                }

                await onPay(chargeablePaymentParameters.Payment, type);
            });
        },
        flow: 'signup',
    });

    useEffect(() => {
        void metrics.core_signup_pageLoad_total.increment({
            step: 'payment',
            application: getSignupApplication(APP_NAME),
        });
    }, []);

    const planName = (
        <span key="plan-name" className="color-primary">
            {planNameString}
        </span>
    );

    const price = (
        <Price key="price" currency={subscriptionData.currency}>
            {subscriptionData.checkResult.AmountDue}
        </Price>
    );

    // Disable cycles during signup for custom cycles or if there is a coupon. (Since the cycle selector will show values which don't include the coupon discount).
    const disableCycleSelector =
        getIsCustomCycle(subscriptionData.cycle) || !!subscriptionData.checkResult.Coupon?.Code;

    const process = async (processor?: PaymentProcessorHook) =>
        withLoading(async () => {
            if (!processor) {
                return;
            }

            try {
                await processor.processPaymentToken();
            } catch (e) {
                const error = getSentryError(e);
                if (error) {
                    const context = {
                        app: APP_NAME,
                        plan: plan?.Name,
                        cycle: subscriptionData.cycle,
                        currency: subscriptionData.currency,
                        amount: subscriptionData.checkResult.AmountDue,
                        code: subscriptionData.checkResult.Coupon?.Code,
                        processorType: paymentFacade.selectedProcessor?.meta.type,
                        paymentMethod: paymentFacade.selectedMethodType,
                        paymentMethodValue: paymentFacade.selectedMethodValue,
                    };

                    captureMessage('Payments: failed to handle classic signup', {
                        level: 'error',
                        extra: { error, context },
                    });
                }
            }
        });

    return (
        <div className="sign-layout-mobile-columns w-full flex flex-align-items-start flex-justify-center gap-7">
            <Main center={false}>
                <Header
                    onBack={onBack}
                    title={c('new_plans: signup').t`Subscription`}
                    right={
                        <div className="inline-block mt-4 md:mt-8">
                            <CurrencySelector
                                mode="select-two"
                                currency={subscriptionData.currency}
                                onSelect={onChangeCurrency}
                            />
                        </div>
                    }
                />
                <Content>
                    <div className="text-bold mb-4">{c('new_plans: signup').jt`Your selected plan: ${planName}`}</div>
                    {disableCycleSelector ? (
                        <SubscriptionCheckoutCycleItem
                            checkResult={subscriptionData.checkResult}
                            plansMap={plansMap}
                            planIDs={subscriptionData.planIDs}
                        />
                    ) : (
                        <SubscriptionCycleSelector
                            mode="buttons"
                            cycle={subscriptionData.cycle}
                            minimumCycle={subscriptionData.minimumCycle}
                            currency={subscriptionData.currency}
                            onChangeCycle={onChangeCycle}
                            plansMap={plansMap}
                            planIDs={subscriptionData.planIDs}
                        />
                    )}
                    <div className="text-sm color-weak">
                        {getRenewalNoticeText({ renewCycle: subscriptionData.cycle })}
                    </div>
                    <PlanCustomization
                        mode="signup"
                        loading={false}
                        currency={subscriptionData.currency}
                        cycle={subscriptionData.cycle}
                        plansMap={plansMap}
                        planIDs={subscriptionData.planIDs}
                        onChangePlanIDs={onChangePlanIDs}
                        className="pb-7 mb-8"
                    />
                    <div className="text-sm">
                        {hasGuarantee && (
                            <div className="flex flex-nowrap color-weak mb-2">
                                <span className="flex-item-noshrink mr-2">
                                    <Icon name="clock" className="align-top" />
                                </span>
                                <span className="flex-item-fluid">{c('Info').t`30-day money-back guarantee.`}</span>
                            </div>
                        )}
                    </div>
                </Content>
            </Main>
            <Main center={false}>
                <Header title={c('new_plans: signup').t`Payment details`} headingLevel={2} />
                <Content>
                    <form
                        name="payment-form"
                        onSubmit={async (e: FormEvent) => {
                            e.preventDefault();

                            void withLoading(process(paymentFacade.selectedProcessor));
                        }}
                        method="post"
                    >
                        {subscriptionData.checkResult?.AmountDue ? (
                            <PaymentWrapper
                                {...paymentFacade}
                                onPaypalCreditClick={() => process(paymentFacade.paypalCredit)}
                                noMaxWidth
                            />
                        ) : (
                            <div className="mb-4">{c('Info').t`No payment is required at this time.`}</div>
                        )}
                        {paymentFacade.selectedMethodType === PAYMENT_METHOD_TYPES.PAYPAL ? (
                            <StyledPayPalButton
                                paypal={paymentFacade.paypal}
                                flow="signup"
                                amount={subscriptionData.checkResult.AmountDue}
                                currency={subscriptionData.currency}
                                loading={loading}
                                type="submit"
                            />
                        ) : (
                            <>
                                <Button type="submit" size="large" loading={loading} color="norm" fullWidth>
                                    {subscriptionData.checkResult.AmountDue > 0
                                        ? c('Action').jt`Pay ${price} now`
                                        : c('Action').t`Confirm`}
                                </Button>
                                <Alert3ds />
                                <div className="flex flex-nowrap color-weak mb-2 text-sm mx-7">
                                    <span className="flex-item-noshrink mr-2">
                                        <Icon name="shield" />
                                    </span>
                                    <span className="flex-item-fluid">{c('Info')
                                        .t`Payments are protected with TLS encryption and Swiss privacy laws.`}</span>
                                </div>
                            </>
                        )}
                    </form>
                </Content>
            </Main>
        </div>
    );
};

export default PaymentStep;
