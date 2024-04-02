import { FormEvent, useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components/components/icon';
import { Price } from '@proton/components/components/price';
import {
    Alert3ds,
    CurrencySelector,
    PlanCustomization,
    StyledPayPalButton,
    SubscriptionCheckoutCycleItem,
    SubscriptionCycleSelector,
    getCheckoutRenewNoticeText,
    getRenewalNoticeText,
} from '@proton/components/containers/payments';
import InclusiveVatText from '@proton/components/containers/payments/InclusiveVatText';
import PaymentWrapper from '@proton/components/containers/payments/PaymentWrapper';
import {
    OnBillingAddressChange,
    WrappedTaxCountrySelector,
} from '@proton/components/containers/payments/TaxCountrySelector';
import { useConfig } from '@proton/components/hooks';
import { ChargebeePaypalWrapper } from '@proton/components/payments/chargebee/ChargebeeWrapper';
import { usePaymentFacade } from '@proton/components/payments/client-extensions';
import { useChargebeeContext } from '@proton/components/payments/client-extensions/useChargebeeContext';
import {
    ExtendedTokenPayment,
    PAYMENT_METHOD_TYPES,
    TokenPayment,
    isV5PaymentToken,
    v5PaymentTokenToLegacyPaymentToken,
} from '@proton/components/payments/core';
import { PaymentProcessorHook } from '@proton/components/payments/react-extensions/interface';
import { useLoading } from '@proton/hooks';
import metrics from '@proton/metrics';
import { getPaymentsVersion } from '@proton/shared/lib/api/payments';
import { getCheckout, getIsCustomCycle } from '@proton/shared/lib/helpers/checkout';
import { toMap } from '@proton/shared/lib/helpers/object';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { getIsConsumerVpnPlan, getIsVpnPlan } from '@proton/shared/lib/helpers/subscription';
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
    onPay: (payment: ExtendedTokenPayment, type: 'cc' | 'pp') => Promise<void>;
    onChangePlanIDs: (planIDs: PlanIDs) => void;
    onChangeCurrency: (currency: Currency) => void;
    onChangeCycle: (cycle: Cycle) => void;
    onChangeBillingAddress: OnBillingAddressChange;
    plan: Plan | undefined;
    planName: string | undefined;
}

const PaymentStep = ({
    onBack,
    onPay,
    onChangeCycle,
    onChangeCurrency,
    onChangePlanIDs,
    onChangeBillingAddress,
    plan,
    plans,
    planName: planNameString,
    subscriptionData,
}: Props) => {
    const { APP_NAME } = useConfig();
    const [loading, withLoading] = useLoading();

    const plansMap = toMap(plans, 'Name') as PlansMap;
    const hasGuarantee = getIsConsumerVpnPlan(plan?.Name);
    const hasSomeVpnPlan = getIsVpnPlan(plan?.Name);

    const chargebeeContext = useChargebeeContext();

    const paymentFacade = usePaymentFacade({
        checkResult: subscriptionData.checkResult,
        amount: subscriptionData.checkResult.AmountDue,
        currency: subscriptionData.currency,
        selectedPlanName: plan?.Name,
        onChargeable: (_, { chargeablePaymentParameters, sourceType, paymentsVersion, paymentProcessorType }) => {
            return withLoading(async () => {
                let paymentType: 'cc' | 'pp';
                if (
                    sourceType === PAYMENT_METHOD_TYPES.PAYPAL ||
                    sourceType === PAYMENT_METHOD_TYPES.PAYPAL_CREDIT ||
                    sourceType === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL
                ) {
                    paymentType = 'pp';
                } else {
                    paymentType = 'cc';
                }

                const legacyTokenPayment: TokenPayment | undefined = isV5PaymentToken(chargeablePaymentParameters)
                    ? v5PaymentTokenToLegacyPaymentToken(chargeablePaymentParameters).Payment
                    : undefined;

                const withVersion: ExtendedTokenPayment = {
                    ...legacyTokenPayment,
                    paymentsVersion,
                    paymentProcessorType,
                };

                await onPay(withVersion, paymentType);
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
                        paymentsVersion: getPaymentsVersion(),
                        chargebeeEnabled: chargebeeContext.enableChargebeeRef.current,
                    };

                    captureMessage('Payments: failed to handle classic signup', {
                        level: 'error',
                        extra: { error, context },
                    });
                }
            }
        });

    const isPaypal = paymentFacade.selectedMethodType === PAYMENT_METHOD_TYPES.PAYPAL;
    const isCard = paymentFacade.selectedMethodType === PAYMENT_METHOD_TYPES.CARD;
    const isChargebeeCard = paymentFacade.selectedMethodType === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD;
    const isChargebeePaypal = paymentFacade.selectedMethodType === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL;

    const checkout = getCheckout({
        planIDs: subscriptionData.planIDs,
        plansMap,
        checkResult: subscriptionData.checkResult,
    });

    return (
        <div className="sign-layout-mobile-columns w-full flex items-start justify-center gap-7">
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
                        {getCheckoutRenewNoticeText({
                            coupon: subscriptionData.checkResult.Coupon?.Code,
                            cycle: subscriptionData.cycle,
                            plansMap: plansMap,
                            planIDs: subscriptionData.planIDs,
                            checkout,
                            currency: subscriptionData.currency,
                        }) || getRenewalNoticeText({ renewCycle: subscriptionData.cycle })}
                    </div>
                    {paymentFacade.showTaxCountry && (
                        <WrappedTaxCountrySelector
                            statusExtended={paymentFacade.statusExtended}
                            onBillingAddressChange={onChangeBillingAddress}
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
                        className="pb-7 mb-8"
                    />
                    <div className="text-sm">
                        {hasGuarantee && (
                            <div className="flex flex-nowrap color-weak mb-2">
                                <span className="shrink-0 mr-2">
                                    <Icon name="clock" className="align-top" />
                                </span>
                                <span className="flex-1">{c('Info').t`30-day money-back guarantee.`}</span>
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
                                hasSomeVpnPlan={hasSomeVpnPlan}
                            />
                        ) : (
                            <div className="mb-4">{c('Info').t`No payment is required at this time.`}</div>
                        )}
                        {isPaypal && (
                            <StyledPayPalButton
                                paypal={paymentFacade.paypal}
                                flow="signup"
                                amount={subscriptionData.checkResult.AmountDue}
                                currency={subscriptionData.currency}
                                loading={loading}
                                type="submit"
                            />
                        )}
                        {(isCard || isChargebeeCard) && (
                            <>
                                <Button type="submit" size="large" loading={loading} color="norm" fullWidth>
                                    {subscriptionData.checkResult.AmountDue > 0
                                        ? c('Action').jt`Pay ${price} now`
                                        : c('Action').t`Confirm`}
                                </Button>
                                {paymentFacade.showInclusiveTax && (
                                    <InclusiveVatText
                                        tax={subscriptionData.checkResult?.Taxes?.[0]}
                                        currency={subscriptionData.currency}
                                        className="text-sm text-center color-weak mt-1"
                                    />
                                )}
                                <Alert3ds />
                                <div className="flex flex-nowrap color-weak mb-2 text-sm mx-7">
                                    <span className="shrink-0 mr-2">
                                        <Icon name="shield" />
                                    </span>
                                    <span className="flex-1">{c('Info')
                                        .t`Payments are protected with TLS encryption and Swiss privacy laws.`}</span>
                                </div>
                            </>
                        )}
                        {isChargebeePaypal && (
                            <>
                                <ChargebeePaypalWrapper
                                    chargebeePaypal={paymentFacade.chargebeePaypal}
                                    iframeHandles={paymentFacade.iframeHandles}
                                />
                                {paymentFacade.showInclusiveTax && (
                                    <InclusiveVatText
                                        tax={subscriptionData.checkResult?.Taxes?.[0]}
                                        currency={subscriptionData.currency}
                                        className="text-sm text-center color-weak mt-1"
                                    />
                                )}
                            </>
                        )}
                    </form>
                </Content>
            </Main>
        </div>
    );
};

export default PaymentStep;
