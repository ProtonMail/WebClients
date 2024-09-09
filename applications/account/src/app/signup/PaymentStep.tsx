import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components/components/icon';
import { Price } from '@proton/components/components/price';
import {
    Alert3ds,
    CurrencySelector,
    StyledPayPalButton,
    SubscriptionCheckoutCycleItem,
    SubscriptionCycleSelector,
    getCheckoutRenewNoticeText,
} from '@proton/components/containers/payments';
import InclusiveVatText from '@proton/components/containers/payments/InclusiveVatText';
import PaymentWrapper from '@proton/components/containers/payments/PaymentWrapper';
import type { OnBillingAddressChange } from '@proton/components/containers/payments/TaxCountrySelector';
import { WrappedTaxCountrySelector } from '@proton/components/containers/payments/TaxCountrySelector';
import { ProtonPlanCustomizer, getHasPlanCustomizer } from '@proton/components/containers/payments/planCustomizer';
import { getAllowedCycles, getBillingAddressStatus } from '@proton/components/containers/payments/subscription/helpers';
import { useConfig, useHandler } from '@proton/components/hooks';
import { useAssistantAddonEnabledSignup } from '@proton/components/hooks/assistant/useAssistantFeatureEnabled';
import { ChargebeePaypalWrapper } from '@proton/components/payments/chargebee/ChargebeeWrapper';
import { useCurrencies, usePaymentFacade } from '@proton/components/payments/client-extensions';
import { useChargebeeContext } from '@proton/components/payments/client-extensions/useChargebeeContext';
import type { ExtendedTokenPayment, PaymentMethodStatusExtended, TokenPayment } from '@proton/components/payments/core';
import {
    PAYMENT_METHOD_TYPES,
    getPlansMap,
    isV5PaymentToken,
    v5PaymentTokenToLegacyPaymentToken,
} from '@proton/components/payments/core';
import type { PaymentProcessorHook } from '@proton/components/payments/react-extensions/interface';
import { useLoading } from '@proton/hooks';
import metrics from '@proton/metrics';
import { getPaymentsVersion } from '@proton/shared/lib/api/payments';
import { CYCLE } from '@proton/shared/lib/constants';
import { getCheckout, getIsCustomCycle } from '@proton/shared/lib/helpers/checkout';
import { getPlanFromIds } from '@proton/shared/lib/helpers/planIDs';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { getIsB2BAudienceFromPlan, getIsConsumerVpnPlan, getIsVpnPlan } from '@proton/shared/lib/helpers/subscription';
import type { Api, Currency, Cycle, Plan } from '@proton/shared/lib/interfaces';
import { getSentryError } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import Content from '../public/Content';
import Header from '../public/Header';
import Main from '../public/Main';
import { getSignupApplication } from './helper';
import type { PlanIDs, SubscriptionData } from './interfaces';

export interface Props {
    api: Api;
    subscriptionData: SubscriptionData;
    plans: Plan[];
    onBack?: () => void;
    onPay: (payment: ExtendedTokenPayment, type: 'cc' | 'pp') => Promise<void>;
    onChangePlanIDs: (planIDs: PlanIDs) => Promise<void>;
    onChangeCurrency: (currency: Currency) => void;
    onChangeCycle: (cycle: Cycle) => void;
    onChangeBillingAddress: OnBillingAddressChange;
    plan: Plan | undefined;
    planName: string | undefined;
    currencySignupParam: Currency | undefined;
    paymentStatus: PaymentMethodStatusExtended;
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
    currencySignupParam,
    paymentStatus,
}: Props) => {
    const { APP_NAME } = useConfig();
    const [loading, withLoading] = useLoading();

    const plansMap = getPlansMap(plans, subscriptionData.currency, false);
    const hasGuarantee = getIsConsumerVpnPlan(plan?.Name);
    const hasSomeVpnPlan = getIsVpnPlan(plan?.Name);

    const chargebeeContext = useChargebeeContext();
    const scribeEnabled = useAssistantAddonEnabledSignup();

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

    const isB2bAudience = getIsB2BAudienceFromPlan(getPlanFromIds(subscriptionData.planIDs));
    const defaultCycles = isB2bAudience ? [CYCLE.YEARLY, CYCLE.MONTHLY] : undefined;

    const [optimisticPlanIDs, setOptimisticPlanIDs] = useState<PlanIDs | null>(null);
    const optimisticPlanIDsRef = useRef<any | undefined>();

    const handleChangePlanIDs = useHandler(
        (planIDs: PlanIDs, id: any) => {
            onChangePlanIDs(planIDs)
                .catch(noop)
                .finally(() => {
                    // Only if it's the latest call is it reset
                    if (optimisticPlanIDsRef.current === id) {
                        setOptimisticPlanIDs(null);
                    }
                });
        },
        { debounce: 300 }
    );

    const handleOptimisticPlanIDs = (planIDs: PlanIDs) => {
        const id = {};
        optimisticPlanIDsRef.current = id;
        setOptimisticPlanIDs(planIDs);
        handleChangePlanIDs(planIDs, id);
    };

    const allowedCycles = getAllowedCycles({
        plansMap,
        defaultCycles,
        subscription: undefined,
        currency: subscriptionData.currency,
        planIDs: subscriptionData.planIDs,
        minimumCycle: subscriptionData.minimumCycle,
    });

    const { getAvailableCurrencies } = useCurrencies('v2-signup');

    const availableCurrencies = getAvailableCurrencies({
        status: paymentStatus,
        plans,
        paramCurrency: currencySignupParam,
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
                                currencies={availableCurrencies}
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
                            currency={subscriptionData.currency}
                            onChangeCycle={onChangeCycle}
                            plansMap={plansMap}
                            planIDs={subscriptionData.planIDs}
                            // the classic signup will be deprecated soon, so no need to add the support for
                            // coupon syncing here
                            additionalCheckResults={undefined}
                            allowedCycles={allowedCycles}
                        />
                    )}
                    <div className="text-sm color-weak">
                        {getCheckoutRenewNoticeText({
                            coupon: subscriptionData.checkResult.Coupon,
                            cycle: subscriptionData.cycle,
                            plansMap: plansMap,
                            planIDs: subscriptionData.planIDs,
                            checkout,
                            currency: subscriptionData.currency,
                        })}
                    </div>
                    {paymentFacade.showTaxCountry && (
                        <WrappedTaxCountrySelector
                            statusExtended={paymentFacade.statusExtended}
                            onBillingAddressChange={onChangeBillingAddress}
                        />
                    )}
                    {(() => {
                        const { hasPlanCustomizer, currentPlan } = getHasPlanCustomizer({
                            plansMap,
                            planIDs: subscriptionData.planIDs,
                        });
                        if (!hasPlanCustomizer || !currentPlan) {
                            return null;
                        }
                        return (
                            <ProtonPlanCustomizer
                                mode="signup"
                                currentPlan={currentPlan}
                                loading={false}
                                currency={subscriptionData.currency}
                                cycle={subscriptionData.cycle}
                                plansMap={plansMap}
                                planIDs={optimisticPlanIDs ?? subscriptionData.planIDs}
                                onChangePlanIDs={handleOptimisticPlanIDs}
                                className="pb-7 mb-8"
                                scribeEnabled={scribeEnabled}
                            />
                        );
                    })()}
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
                                billingAddressStatus={getBillingAddressStatus(subscriptionData.billingAddress)}
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
