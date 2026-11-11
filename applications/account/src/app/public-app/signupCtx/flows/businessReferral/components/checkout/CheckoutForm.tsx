import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import Alert3ds from '@proton/components/containers/payments/Alert3ds';
import CurrencySelector from '@proton/components/containers/payments/CurrencySelector';
import { ProtonPlanCustomizer } from '@proton/components/containers/payments/planCustomizer/ProtonPlanCustomizer';
import { getHasPlanCustomizer } from '@proton/components/containers/payments/planCustomizer/helpers';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import useLoading from '@proton/hooks/useLoading';
import { IcShield } from '@proton/icons/icons/IcShield';
import { usePaymentFacade } from '@proton/payments-ui/client-extensions/usePaymentFacade';
import PaymentWrapper from '@proton/payments-ui/containers/payments/PaymentWrapper';
import { useBillingAddress } from '@proton/payments-ui/ui/billing-address/hooks/useBillingAddress';
import { PayButton } from '@proton/payments-ui/ui/components/PayButton';
import { usePaymentOptimistic } from '@proton/payments-ui/ui/context/PaymentContextOptimistic';
import { getBillingAddressFromPaymentStatus } from '@proton/payments/core/billing-address/billing-address-from-payments-status';
import { ADDON_PREFIXES, PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { PaymentProcessorHook } from '@proton/payments/core/payment-processors/interface';
import { tracePaymentError } from '@proton/payments/sentry/capture';
import { APPS } from '@proton/shared/lib/constants';
import { Audience } from '@proton/shared/lib/interfaces/Subscription';
import { getPlanFromPlanIDs } from '@proton/shared/lib/payments/plan/helpers';
import noop from '@proton/utils/noop';

import Terms from '../../../../components/Terms';
import { useSignup } from '../../../../context/SignupContext';
import AccountDetailsForm from './AccountDetailsForm';
import { BusinessBenefits } from './BusinessBenefits';
import { PricingCard } from './PricingCard/PricingCard';
import { StepHeading } from './StepHeading';
import { StepLayout } from './StepLayout';

interface Props {
    onPaymentTokenProcessed: (company: string | undefined) => Promise<void>;
}

const CheckoutForm = ({ onPaymentTokenProcessed }: Props) => {
    const signup = useSignup();
    const payments = usePaymentOptimistic();
    const { viewportWidth } = useActiveBreakpoint();
    const formRef = useRef<HTMLFormElement>(null);

    const [submitting, withSubmitting] = useLoading();

    const { options } = payments;

    const companyRef = useRef<string | undefined>(undefined);

    const paymentFacade = usePaymentFacade({
        checkResult: options.checkResult,
        amount: options.checkResult.AmountDue,
        currency: options.currency,
        selectedPlanName: getPlanFromPlanIDs(payments.plansMap, options.planIDs)?.Name,
        billingAddress: options.billingAddress,
        onChargeable: async (operations, data) => {
            signup.submitPaymentData(options, data);
            return onPaymentTokenProcessed(companyRef.current);
        },
        paymentStatus: payments.paymentStatus,
        flow: 'signup',
        product: APPS.PROTONACCOUNT,
        telemetryContext: payments.telemetryContext,
    });

    const billingAddressHook = useBillingAddress({
        onBillingAddressChange: payments.selectFullBillingAddress,
        initialBillingAddress: payments.paymentStatus
            ? getBillingAddressFromPaymentStatus(payments.paymentStatus, { shouldRestoreZipCode: true })
            : undefined,
        paymentFacade,
        telemetryContext: payments.telemetryContext,
        selectedPlanName: payments.selectedPlan.getPlanName(),
        onVatChange: payments.setVatNumber,
    });

    companyRef.current = billingAddressHook.vatNumber?.Company ?? undefined;

    // Every plan sold in this flow is B2B, so the generic "I'm purchasing as a business" question
    // the shared VatNumberInput asks unauthenticated users is never actually optional here — skip
    // it by expanding the VAT/company fields upfront instead of leaving them collapsed behind the
    // checkbox. Guarded by a ref so this only runs once; it shouldn't fight the user re-collapsing it.
    const hasExpandedVatFormRef = useRef(false);
    useEffect(() => {
        if (hasExpandedVatFormRef.current || !billingAddressHook.vatNumber?.unauthenticatedCollapsed) {
            return;
        }
        hasExpandedVatFormRef.current = true;
        billingAddressHook.vatNumber.setUnauthenticatedCollapsed(false);
    }, [billingAddressHook.vatNumber?.unauthenticatedCollapsed]);

    const process = (processor: PaymentProcessorHook | undefined) => {
        if (submitting || !payments.initializationStatus.pricingInitialized || payments.loadingPaymentDetails) {
            return;
        }

        async function run() {
            // Account details are validated and submitted first — the payment is only ever
            // attempted once we know the account itself can be created.
            let accountData;
            try {
                accountData = await signup.accountForm.getValidAccountData({ passwords: true });
            } catch {
                return;
            }
            signup.submitAccountData(accountData);

            if (!processor) {
                return;
            }
            try {
                await processor.processPaymentToken();
            } catch (error) {
                tracePaymentError(error, {
                    component: 'business-referral-ctx-payment-step',
                    subscription: null,
                    extra: {
                        currency: payments.options.currency,
                        amount: payments.checkResult.AmountDue,
                        processorType: processor.meta.type,
                        paymentMethod: paymentFacade.selectedMethodType,
                        paymentMethodValue: paymentFacade.selectedMethodValue,
                        cycle: payments.options.cycle,
                        plan: payments.selectedPlan,
                        planName: payments.selectedPlan.getPlanName(),
                    },
                });
            }
        }

        withSubmitting(run()).catch(noop);
    };

    const handleProcess = () => {
        return process(paymentFacade.selectedProcessor);
    };

    const showAlert3ds = paymentFacade.selectedMethodType === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD;

    const planIDs = payments.options.planIDs;
    const hasPlanCustomizer = getHasPlanCustomizer(planIDs);
    const planTitle = payments.selectedPlan.getPlan().Title;

    // Below `md` the Aside is stacked under Main, so the summary is rendered inside Main instead,
    // under the Checkout heading (matching legacy), and the benefits card is hidden.
    const isNarrow = viewportWidth['<=small'];
    const pricingCard = <PricingCard taxCountryCode={billingAddressHook.taxCountry.selectedCountryCode} />;

    return (
        <StepLayout
            currentStep={2}
            aside={
                <>
                    <BusinessBenefits />
                    {!isNarrow && pricingCard}
                </>
            }
        >
            {/*
             * This flow always renders on the dark Storefront theme (see getThemeFromLocation.ts), but
             * ThemeTypes.Storefront isn't in the shared getDarkThemes() list, so none of the inputs below
             * (email, password, plan customizer steppers, billing address, VAT) pick up dark colors on
             * their own. Force it once here for everything in the step.
             */}
            <div className="w-full ui-prominent bg-transparent">
                <AccountDetailsForm onSubmit={handleProcess} submitting={submitting} />

                <div className="mt-16 w-full">
                    <StepHeading
                        step={2}
                        right={
                            <CurrencySelector
                                mode="select-two"
                                className="h-full ml-auto px-3 color-primary relative interactive-pseudo interactive--no-background"
                                currencies={payments.availableCurrencies}
                                currency={options.currency}
                                onSelect={(currency) => payments.selectCurrency(currency)}
                                unstyled
                            />
                        }
                    >
                        {c('Signup').t`Checkout`}
                    </StepHeading>

                    {isNarrow && <div className="mt-4">{pricingCard}</div>}

                    <form
                        ref={formRef}
                        name="payment-form"
                        onSubmit={(event) => {
                            event.preventDefault();
                            handleProcess();
                        }}
                        method="post"
                        className="w-full mt-4"
                    >
                        {hasPlanCustomizer && (
                            <ProtonPlanCustomizer
                                separator
                                mode="signup"
                                currency={payments.options.currency}
                                cycle={payments.options.cycle}
                                plansMap={payments.plansMap}
                                selectedPlanIDs={planIDs}
                                onChangePlanIDs={(planIDs) => payments.selectPlanIDs(planIDs)}
                                audience={Audience.B2B}
                                addonFlags={{
                                    [ADDON_PREFIXES.SCRIBE]: false,
                                    [ADDON_PREFIXES.LUMO]: false,
                                    [ADDON_PREFIXES.MEET]: false,
                                }}
                                showUsersTooltip
                                telemetryContext={payments.telemetryContext}
                            />
                        )}

                        <PaymentWrapper
                            {...paymentFacade}
                            noMaxWidth
                            hideFirstLabel
                            taxCountry={billingAddressHook.taxCountry}
                            vatNumber={billingAddressHook.vatNumber}
                        />

                        <PayButton
                            size="large"
                            color="norm"
                            fullWidth
                            pill
                            taxCountry={billingAddressHook.taxCountry}
                            vatNumber={billingAddressHook.vatNumber}
                            paymentFacade={paymentFacade}
                            loading={submitting}
                            data-testid="pay"
                            className="py-4 text-semibold"
                            paypalClassName=""
                            product={APPS.PROTONACCOUNT}
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
                            {c('Business signup action').t`Start using ${planTitle} now`}
                        </PayButton>
                        {showAlert3ds && <Alert3ds />}
                    </form>
                </div>
            </div>

            <Terms className="mt-4" />
        </StepLayout>
    );
};

export default CheckoutForm;
