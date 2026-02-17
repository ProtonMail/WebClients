import type { MutableRefObject, ReactElement, ReactNode } from 'react';
import { useEffect, useImperativeHandle, useRef } from 'react';

import { c } from 'ttag';

import { Alert3ds } from '@proton/components';
import { changeDefaultPaymentMethodBeforePayment } from '@proton/components/containers/payments/DefaultPaymentMethodMessage';
import PaymentWrapper from '@proton/components/containers/payments/PaymentWrapper';
import { ProtonPlanCustomizer, getHasPlanCustomizer } from '@proton/components/containers/payments/planCustomizer';
import type { CouponConfigRendered } from '@proton/components/containers/payments/subscription/coupon-config/useCouponConfig';
import { usePaymentFacade } from '@proton/components/payments/client-extensions';
import { BilledUserInlineMessage } from '@proton/components/payments/client-extensions/billed-user';
import type { WithLoading } from '@proton/hooks/useLoading';
import type {
    AvailablePaymentMethod,
    ExtendedTokenPayment,
    PaymentMethodFlow,
    PaymentProcessorHook,
    PaymentsApi,
    TokenPayment,
} from '@proton/payments';
import {
    PAYMENT_METHOD_TYPES,
    type Plan,
    SubscriptionMode,
    getIsB2BAudienceFromPlan,
    getPaymentsVersion,
    isV5PaymentToken,
    v5PaymentTokenToLegacyPaymentToken,
} from '@proton/payments';
import type { PaymentTelemetryContext } from '@proton/payments/telemetry/helpers';
import { type OnBillingAddressChange, PayButton, useTaxCountry, useVatNumber } from '@proton/payments/ui';
import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import type { Api, VPNServersCountData } from '@proton/shared/lib/interfaces';
import { Audience, isBilledUser } from '@proton/shared/lib/interfaces';
import { getSentryError } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import AccountStepPaymentSummary from './AccountStepPaymentSummary';
import Guarantee from './Guarantee';
import { useSignupV2Theme } from './SignupV2ThemeProvider';
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
    onValidate: () => Promise<boolean>;
    isFormValid: boolean;
    isDarkBg?: boolean;
    withLoadingSignup: WithLoading;
    measure: Measure;
    defaultMethod: PAYMENT_METHOD_TYPES | undefined;
    handleOptimistic: (optimistic: Partial<OptimisticOptions>) => void;
    onBillingAddressChange: OnBillingAddressChange;
    terms?: ReactNode;
    signupParameters: SignupParameters2;
    showRenewalNotice: boolean;
    app: APP_NAMES;
    setCurrencySelectorDisabled: (disabled: boolean) => void;
    paymentsApi: PaymentsApi;
    onVatNumberChange: (vatNumber: string) => void;
    offerBanner: ReactElement | undefined | false;
    telemetryContext: PaymentTelemetryContext;
    onMethodChanged: (method: AvailablePaymentMethod) => void;
    couponConfig: CouponConfigRendered | undefined;
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
    isFormValid,
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
    app,
    setCurrencySelectorDisabled,
    paymentsApi,
    onVatNumberChange,
    offerBanner, // temporary for A/B test,
    telemetryContext,
    onMethodChanged,
    couponConfig,
}: Props) => {
    const signupV2Theme = useSignupV2Theme();
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

    const isAuthenticated = !!model.session?.resumedSessionResult.UID;

    const flow: PaymentMethodFlow = (() => {
        if (signupParameters.product === APPS.PROTONPASS) {
            return isAuthenticated ? 'signup-pass-upgrade' : 'signup-pass';
        }

        if (signupParameters.product === APPS.PROTONWALLET) {
            return 'signup-wallet';
        }

        return isAuthenticated ? 'signup-v2-upgrade' : 'signup-v2';
    })();

    const user = model.session?.resumedSessionResult.User;

    const isTrial = model.subscriptionData.checkResult.SubscriptionMode === SubscriptionMode.Trial;

    const paymentFacade = usePaymentFacade({
        checkResult: model.subscriptionData.checkResult,
        amount: model.subscriptionData.checkResult.AmountDue,
        currency: model.subscriptionData.currency,
        selectedPlanName: selectedPlan.Name,
        flow,
        paymentMethods: model.session?.paymentMethods,
        paymentStatus: model.paymentStatus,
        api: normalApi,
        theme: signupV2Theme,
        billingAddress: model.subscriptionData.billingAddress,
        user,
        subscription: model.session?.subscription,
        planIDs: model.subscriptionData.planIDs,
        onChargeable: (
            _,
            { chargeablePaymentParameters, paymentsVersion, source, sourceType, paymentProcessorType }
        ) => {
            return withLoadingSignup(async () => {
                const extendedTokenPayment: ExtendedTokenPayment = {
                    paymentsVersion,
                    paymentMethodType: sourceType,
                    paymentMethodValue: source,
                    paymentProcessorType,
                };

                const isFreeSignup = chargeablePaymentParameters.Amount <= 0 && !isTrial;
                if (isFreeSignup) {
                    await onPay(extendedTokenPayment, undefined);
                    return;
                }

                const type = chargeablePaymentParameters.type;
                let paymentType: 'cc' | 'pp' | 'btc';
                if (type === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL) {
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

                await changeDefaultPaymentMethodBeforePayment(
                    normalApi,
                    source,

                    paymentFacade.methods.savedMethods ?? []
                );

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

            onMethodChanged(newMethod);
        },
        isTrial: signupParameters.trial,
        product: app,
        telemetryContext,
    });

    useEffect(
        function disableCurrencySelectorWhenSepaSelected() {
            setCurrencySelectorDisabled(
                paymentFacade.selectedMethodType === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT
            );
        },
        [paymentFacade.selectedMethodType]
    );

    const taxCountry = useTaxCountry({
        onBillingAddressChange,
        paymentStatus: paymentFacade.paymentStatus,
        zipCodeBackendValid: subscriptionData.zipCodeValid,
        previousValidZipCode: subscriptionData.billingAddress.ZipCode,
        paymentFacade,
        telemetryContext,
        paymentsApi,
    });

    const vatNumber = useVatNumber({
        isAuthenticated,
        paymentsApi,
        selectedPlanName: selectedPlan?.Name,
        onChange: onVatNumberChange,
        taxCountry,
        onVatUpdated: () => handleOptimistic({}),
    });

    const process = (processor: PaymentProcessorHook | undefined) => {
        async function run() {
            if (!processor) {
                return;
            }

            if (!(await onValidate()) || !validatePayment()) {
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

                if (processor?.meta.type === 'bitcoin') {
                    return 'pay_btc';
                }

                return 'pay_cc';
            })();
            measurePaySubmit(telemetryType);

            try {
                await processor.processPaymentToken();
            } catch (error) {
                measurePayError(telemetryType);

                const sentryError = getSentryError(error);
                if (sentryError) {
                    const context = {
                        currency: model.subscriptionData.currency,
                        amount: model.subscriptionData.checkResult.AmountDue,
                        processorType: processor.meta.type,
                        paymentMethod: paymentFacade.selectedMethodType,
                        paymentMethodValue: paymentFacade.selectedMethodValue,
                        cycle: model.subscriptionData.cycle,
                        plan: selectedPlan,
                        planName: selectedPlan.Name,
                        paymentsVersion: getPaymentsVersion(),
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

    const isSignupPass = paymentFacade.flow === 'signup-pass' || paymentFacade.flow === 'signup-pass-upgrade';

    const selectedMethodCard =
        paymentFacade.selectedMethodType === PAYMENT_METHOD_TYPES.CARD ||
        paymentFacade.selectedMethodType === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD;
    const showAlert3ds = selectedMethodCard && !isSignupPass;

    const loadingPaymentsForm = model.loadingDependencies;

    const showLumoCustomizer = app === APPS.PROTONLUMO;

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
                    if (!getHasPlanCustomizer(planIDs)) {
                        return null;
                    }
                    return (
                        <ProtonPlanCustomizer
                            separator
                            mode="signup"
                            loading={false}
                            currency={options.currency}
                            cycle={options.cycle}
                            plansMap={model.plansMap}
                            selectedPlanIDs={planIDs}
                            onChangePlanIDs={(planIDs) => handleOptimistic({ planIDs })}
                            audience={isB2BPlan ? Audience.B2B : Audience.B2C}
                            showUsersTooltip
                            isTrialMode={signupParameters.trial}
                            lumoAddonEnabled={showLumoCustomizer}
                            scribeAddonEnabled={
                                // To avoid convoluted signup UI, we don't show Scribe and Lumo customizers together.
                                // Remember: Lumo already includes Scribe.
                                !showLumoCustomizer
                            }
                            telemetryContext={telemetryContext}
                        />
                    );
                })()}
                <PaymentWrapper
                    {...paymentFacade}
                    defaultMethod={defaultMethod} // needed for Bitcoin signup
                    isAuthenticated={isAuthenticated} // needed for Bitcoin signup
                    noMaxWidth
                    hideFirstLabel
                    taxCountry={taxCountry}
                    vatNumber={vatNumber}
                    loadingBitcoin={loadingPaymentDetails}
                    subscription={model.session?.subscription}
                    startTrial={isTrial}
                    onCurrencyChange={(currency) => handleOptimistic({ currency })}
                />
                {(() => {
                    if (loadingPaymentsForm) {
                        return;
                    }

                    const isBitcoin =
                        paymentFacade.selectedMethodType === PAYMENT_METHOD_TYPES.BITCOIN ||
                        paymentFacade.selectedMethodType === PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN;

                    // Users who selected bitcoin, can't click "pay" to signup. They need to transfer BTC to the
                    // displayed address, and then the subscription will be created.
                    if (isBitcoin && isAuthenticated) {
                        return null;
                    }

                    const buttonProps = isBitcoin
                        ? {
                              type: 'button' as const,
                              onClick: async () => {
                                  measurePaySubmit('pay_btc');
                                  const run = async () => {
                                      if ((await onValidate()) && validatePayment()) {
                                          return onPay('signup-token', undefined).catch(() => {
                                              measurePayError('pay_btc');
                                          });
                                      }
                                  };
                                  withLoadingSignup(run()).catch(noop);
                              },
                          }
                        : {};

                    const guaranteeElement = (
                        <div className="text-center color-success mt-4">
                            {(() => {
                                if (isTrial) {
                                    return;
                                } else if (subscriptionData.checkResult.AmountDue === 0) {
                                    return c('Info').t`Cancel anytime`;
                                } else {
                                    return <Guarantee />;
                                }
                            })()}
                        </div>
                    );

                    return (
                        <div>
                            {offerBanner && <div className="mt-4 mb-4">{offerBanner}</div>}
                            <PayButton
                                size="large"
                                color="norm"
                                fullWidth
                                taxCountry={taxCountry}
                                paymentFacade={paymentFacade}
                                loading={loadingSignup || loadingPaymentDetails}
                                pill
                                data-testid="pay"
                                className="lumo-payment-trigger" //do not remove `lumo-payment-trigger` it's being used by lumo mobile
                                suffix={(type) => {
                                    if (type === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD) {
                                        return (
                                            <>
                                                {guaranteeElement}
                                                {showAlert3ds && <Alert3ds />}
                                            </>
                                        );
                                    }

                                    return guaranteeElement;
                                }}
                                formInvalid={!isFormValid}
                                // optimistic check result means that we didn't perform the actual check call because it was
                                // forbidden due to combination of current subscription and the new plan/cycle/currency.
                                // We aren't allowed to re-subscribe the same plan.
                                disabled={model.subscriptionData.checkResult.optimistic}
                                product={app}
                                telemetryContext={telemetryContext}
                                {...buttonProps}
                            >
                                {isBitcoin ? c('pass_signup_2023: Action').t`Continue with Bitcoin` : cta}
                            </PayButton>
                        </div>
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
                showRenewalNotice={showRenewalNotice}
                app={app}
                couponConfig={couponConfig}
            />
        </div>
    );
};

export default AccountStepPayment;
