import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    CurrencySelector,
    Icon,
    Payment as PaymentComponent,
    Price,
    StyledPayPalButton,
    useLoading,
    useModals,
    usePayment,
} from '@proton/components';
import Alert3ds from '@proton/components/containers/payments/Alert3ds';
import { Payment, PaymentParameters } from '@proton/components/containers/payments/interface';
import PlanCustomization from '@proton/components/containers/payments/subscription/PlanCustomization';
import SubscriptionCycleSelector, {
    SubscriptionCheckoutCycleItem,
} from '@proton/components/containers/payments/subscription/SubscriptionCycleSelector';
import { PAYMENT_METHOD_TYPES, PLANS } from '@proton/shared/lib/constants';
import { getIsCustomCycle, getIsOfferBasedOnCoupon } from '@proton/shared/lib/helpers/checkout';
import { toMap } from '@proton/shared/lib/helpers/object';
import { Api, Currency, Cycle, PaymentMethodStatus, Plan, PlansMap } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import Content from '../public/Content';
import Header from '../public/Header';
import Main from '../public/Main';
import { getCardPayment } from './helper';
import { PlanIDs, SubscriptionData } from './interfaces';

interface Props {
    subscriptionData: SubscriptionData;
    plans: Plan[];
    api: Api;
    onBack?: () => void;
    onPay: (payment: Payment | undefined) => Promise<void>;
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
        defaultMethod: paymentMethods[0],
        amount: subscriptionData.checkResult.AmountDue,
        currency: subscriptionData.currency,
        onPay({ Payment }: PaymentParameters) {
            return onPay(Payment);
        },
    });

    const { createModal } = useModals();

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
        <div className="sign-layout-two-column w100 flex flex-align-items-start flex-justify-center flex-gap-2">
            <Main center={false}>
                <Header
                    onBack={onBack}
                    title={c('new_plans: signup').t`Subscription`}
                    right={
                        <div className="inline-block mt2 on-mobile-mt1">
                            <CurrencySelector
                                mode="select-two"
                                currency={subscriptionData.currency}
                                onSelect={onChangeCurrency}
                            />
                        </div>
                    }
                />
                <Content>
                    <div className="text-bold mb1">{c('new_plans: signup').jt`Your selected plan: ${planName}`}</div>
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
                        <div className="flex flex-nowrap color-weak mb0-5">
                            <span className="flex-item-noshrink mr0-5">
                                <Icon name="shield" />
                            </span>
                            <span className="flex-item-fluid pt0-1">{c('Info')
                                .t`Payments are protected with TLS encryption and Swiss privacy laws.`}</span>
                        </div>
                        {hasGuarantee && (
                            <div className="flex flex-nowrap color-weak mb0-5">
                                <span className="flex-item-noshrink mr0-5">
                                    <Icon name="clock" className="align-top" />
                                </span>
                                <span className="flex-item-fluid">{c('Info').t`30-day money-back guarantee.`}</span>
                            </div>
                        )}
                    </div>
                </Content>
            </Main>
            <Main center={false}>
                <Header title={c('new_plans: signup').t`Payment details`} />
                <Content>
                    <form
                        name="payment-form"
                        onSubmit={async (event) => {
                            event.preventDefault();
                            const handle = async () => {
                                if (!handleCardSubmit()) {
                                    return;
                                }
                                if (method === PAYMENT_METHOD_TYPES.CARD) {
                                    const { Payment } = await getCardPayment({
                                        currency: subscriptionData.currency,
                                        createModal,
                                        api,
                                        paymentParameters,
                                        checkResult: subscriptionData.checkResult,
                                    });
                                    return onPay(Payment);
                                }
                                throw new Error('Unknown form submit');
                            };
                            withLoading(handle()).catch(noop);
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
                                currency={subscriptionData.currency}
                                card={card}
                                onMethod={setMethod}
                                onCard={setCard}
                                cardErrors={cardErrors}
                            />
                        ) : (
                            <div className="mb1">{c('Info').t`No payment is required at this time.`}</div>
                        )}
                        {method === PAYMENT_METHOD_TYPES.PAYPAL ? (
                            <StyledPayPalButton
                                paypal={paypal}
                                flow="signup"
                                amount={subscriptionData.checkResult.AmountDue}
                            />
                        ) : (
                            <>
                                <Button type="submit" size="large" loading={loading} color="norm" fullWidth>
                                    {subscriptionData.checkResult.AmountDue > 0
                                        ? c('Action').jt`Pay ${price} now`
                                        : c('Action').t`Confirm`}
                                </Button>
                                <Alert3ds />
                            </>
                        )}
                    </form>
                </Content>
            </Main>
        </div>
    );
};

export default PaymentStep;
