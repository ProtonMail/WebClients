import type { MutableRefObject, ReactNode } from 'react';
import { useImperativeHandle, useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Alert3ds, PayPalButton, StyledPayPalButton } from '@proton/components';
import PaymentWrapper from '@proton/components/containers/payments/PaymentWrapper';
import type { OnBillingAddressChange } from '@proton/components/containers/payments/TaxCountrySelector';
import { ProtonPlanCustomizer, getHasPlanCustomizer } from '@proton/components/containers/payments/planCustomizer';
import { getBillingAddressStatus } from '@proton/components/containers/payments/subscription/helpers';
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
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { getIsB2BAudienceFromPlan, getIsVpnPlan } from '@proton/shared/lib/helpers/subscription';
import type { Api, Plan, VPNServersCountData } from '@proton/shared/lib/interfaces';
import { Audience, isBilledUser } from '@proton/shared/lib/interfaces';
import { getSentryError } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import { usePublicTheme } from '../containers/PublicThemeProvider';
import AccountStepPaymentSummary from './AccountStepPaymentSummary';
import Guarantee from './Guarantee';
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
    showRenewalNotice: boolean;
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
    showRenewalNotice,
}: Props) => {
    const publicTheme = usePublicTheme();
    const formRef = useRef<HTMLFormElement>(null);

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

    const isAuthenticated = !!model.session?.resumedSessionResult.UID;

    const flow: PaymentMethodFlows = (() => {
        if (signupParameters.product === APPS.PROTONPASS) {
            return isAuthenticated ? 'signup-pass-upgrade' : 'signup-pass';
        }

        return isAuthenticated ? 'signup-v2-upgrade' : 'signup-v2';
    })();

    const user = model.session?.resumedSessionResult.User;

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
        subscription: model.session?.subscription,
        planIDs: model.subscriptionData.planIDs,
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

    const isSignupPass = paymentFacade.flow === 'signup-pass' || paymentFacade.flow === 'signup-pass-upgrade';

    const selectedMethodCard =
        paymentFacade.selectedMethodType === PAYMENT_METHOD_TYPES.CARD ||
        paymentFacade.selectedMethodType === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD;
    const showAlert3ds = selectedMethodCard && !isSignupPass;

    const renderingPaymentsWrapper = model.loadingDependencies || Boolean(options.checkResult.AmountDue);
    const loadingPaymentsForm = model.loadingDependencies;

    const paymentsForm = (
        <>
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
                {renderingPaymentsWrapper ? (
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
                    if (loadingPaymentsForm) {
                        return;
                    }
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
                                        {c('Link').t`PayPal without credit card`}
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

                            {showAlert3ds && <Alert3ds />}
                        </>
                    );
                })()}
                {!loadingPaymentsForm && !isAuthenticated && terms}
            </form>
        </>
    );

    return (
        <div className="flex flex-column md:flex-row items-stretch md:items-start justify-space-between gap-10 lg:gap-20">
            <div className="shrink-0 md:flex-1 order-1 md:order-0">{paymentsForm}</div>
            <AccountStepPaymentSummary
                model={model}
                options={options}
                selectedPlan={selectedPlan}
                vpnServersCountData={vpnServersCountData}
                loadingPaymentDetails={loadingPaymentDetails}
                onBillingAddressChange={onBillingAddressChange}
                showRenewalNotice={showRenewalNotice}
                showInclusiveTax={paymentFacade.showInclusiveTax}
                showTaxCountry={paymentFacade.showTaxCountry}
            />
        </div>
    );
};

export default AccountStepPayment;
