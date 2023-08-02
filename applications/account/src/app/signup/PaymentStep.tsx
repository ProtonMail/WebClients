import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, Price, useConfig } from '@proton/components';
import {
    Alert3ds,
    CurrencySelector,
    Payment as PaymentComponent,
    PlanCustomization,
    StyledPayPalButton,
    SubscriptionCheckoutCycleItem,
    SubscriptionCycleSelector,
    usePayment,
    usePaymentToken,
} from '@proton/components/containers/payments';
import {
    AmountAndCurrency,
    CardPayment,
    PAYMENT_METHOD_TYPES,
    PaymentMethodStatus,
    PaypalPayment,
    TokenPayment,
    TokenPaymentMethod,
} from '@proton/components/payments/core';
import { useLoading } from '@proton/hooks';
import metrics from '@proton/metrics';
import { PLANS } from '@proton/shared/lib/constants';
import { getIsCustomCycle, getIsOfferBasedOnCoupon } from '@proton/shared/lib/helpers/checkout';
import { toMap } from '@proton/shared/lib/helpers/object';
import { Api, Currency, Cycle, Plan, PlansMap } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

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
    api,
    onBack,
    onPay,
    onChangeCycle,
    onChangeCurrency,
    onChangePlanIDs,
    plan,
    plans,
    planName: planNameString,
    paymentMethodStatus,
    subscriptionData,
}: Props) => {
    const { APP_NAME } = useConfig();
    const [loading, withLoading] = useLoading();
    const paymentMethods = [
        paymentMethodStatus?.Card && PAYMENT_METHOD_TYPES.CARD,
        paymentMethodStatus?.Paypal && PAYMENT_METHOD_TYPES.PAYPAL,
    ].filter(isTruthy);

    const plansMap = toMap(plans, 'Name') as PlansMap;
    const hasGuarantee = plan?.Name === PLANS.VPN;

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
        api,
        defaultMethod: paymentMethods[0],
        amount: subscriptionData.checkResult.AmountDue,
        currency: subscriptionData.currency,
        onPaypalPay({ Payment }: TokenPaymentMethod) {
            return withLoading(onPay(Payment, 'pp'));
        },
    });

    const createPaymentToken = usePaymentToken();

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

    // Disable cycles during signup for custom cycles or if there is a black friday coupon. (Assume coming from offer page in that case).
    const disableCycleSelector =
        getIsCustomCycle(subscriptionData.cycle) ||
        getIsOfferBasedOnCoupon(subscriptionData.checkResult.Coupon?.Code || '');

    return (
        <div className="sign-layout-mobile-columns w100 flex flex-align-items-start flex-justify-center gap-7">
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
                    <PlanCustomization
                        mode="signup"
                        loading={false}
                        currency={subscriptionData.currency}
                        cycle={subscriptionData.cycle}
                        plansMap={plansMap}
                        planIDs={subscriptionData.planIDs}
                        onChangePlanIDs={onChangePlanIDs}
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
                        onSubmit={async (event) => {
                            event.preventDefault();
                            const handle = async () => {
                                if (!handleCardSubmit() || !paymentParameters) {
                                    return;
                                }

                                const amountAndCurrency: AmountAndCurrency = {
                                    Currency: subscriptionData.currency,
                                    Amount: subscriptionData.checkResult.AmountDue,
                                };
                                const data = await createPaymentToken(paymentParameters, { amountAndCurrency });

                                return onPay(data.Payment, 'cc');
                            };
                            withLoading(handle()).catch(noop);
                        }}
                        method="post"
                    >
                        {subscriptionData.checkResult?.AmountDue ? (
                            <PaymentComponent
                                api={api}
                                type="signup"
                                paypal={paypal}
                                paypalCredit={paypalCredit}
                                paymentMethodStatus={paymentMethodStatus}
                                method={method}
                                amount={subscriptionData.checkResult.AmountDue}
                                currency={subscriptionData.currency}
                                card={card}
                                onMethod={setMethod}
                                onCard={setCard}
                                cardErrors={cardErrors}
                                disabled={loading}
                            />
                        ) : (
                            <div className="mb-4">{c('Info').t`No payment is required at this time.`}</div>
                        )}
                        {method === PAYMENT_METHOD_TYPES.PAYPAL ? (
                            <StyledPayPalButton
                                paypal={paypal}
                                flow="signup"
                                amount={subscriptionData.checkResult.AmountDue}
                                loading={loading}
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
