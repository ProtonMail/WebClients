import type { Dispatch, ReactElement, ReactNode, SetStateAction } from 'react';
import { Fragment, useEffect, useRef, useState } from 'react';

import isDeepEqual from 'lodash/isEqual';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { Vr } from '@proton/atoms/Vr/Vr';
import {
    Alert3ds,
    type Breakpoints,
    CurrencySelector,
    SkeletonLoader,
    Toggle,
    getCheckoutRenewNoticeTextFromCheckResult,
    useConfig,
    useModalState,
} from '@proton/components';
import PaymentWrapper from '@proton/components/containers/payments/PaymentWrapper';
import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import { usePaymentFacade } from '@proton/components/payments/client-extensions';
import { useCurrencies } from '@proton/components/payments/client-extensions/useCurrencies';
import { InvalidZipCodeError } from '@proton/components/payments/react-extensions/errors';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import { useLoading } from '@proton/hooks';
import { IcCode } from '@proton/icons/icons/IcCode';
import { IcEyeSlash } from '@proton/icons/icons/IcEyeSlash';
import { IcServers } from '@proton/icons/icons/IcServers';
import metrics, { observeApiError } from '@proton/metrics';
import type { WebCoreVpnSingleSignupStep1InteractionTotal } from '@proton/metrics/types/web_core_vpn_single_signup_step1_interaction_total_v1.schema';
import type {
    BillingAddress,
    EnrichedCheckResponse,
    ExtendedTokenPayment,
    PaymentProcessorHook,
    PaymentsCheckout,
    TokenPayment,
} from '@proton/payments';
import {
    CYCLE,
    type Currency,
    type Cycle,
    type CycleMapping,
    DEFAULT_CYCLE,
    PAYMENT_METHOD_TYPES,
    PLANS,
    type Plan,
    type PlanIDs,
    type StrictPlan,
    SubscriptionMode,
    TRIAL_DURATION_DAYS,
    getCheckout,
    getHas2025OfferCoupon,
    getOptimisticCheckResult,
    getPaymentsVersion,
    getPlanFromPlanIDs,
    getPlanNameFromIDs,
    isV5PaymentToken,
    v5PaymentTokenToLegacyPaymentToken,
} from '@proton/payments';
import type { PaymentTelemetryContext } from '@proton/payments/telemetry/helpers';
import type {
    EstimationChangeAction,
    EstimationChangePayload,
} from '@proton/payments/telemetry/shared-checkout-telemetry';
import { checkoutTelemetry } from '@proton/payments/telemetry/telemetry';
import { PayButton, useTaxCountry, useVatNumber } from '@proton/payments/ui';
import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import {
    APPS,
    type APP_NAMES,
    PASS_SHORT_APP_NAME,
    VPN_APP_NAME,
    VPN_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { getSentryError } from '@proton/shared/lib/keys';
import { generatePassword } from '@proton/shared/lib/password';
import { getVpnServers } from '@proton/shared/lib/vpn/features';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { getLocaleTermsURL } from '../content/helper';
import SignupSupportDropdown from '../signup/SignupSupportDropdown';
import { getSubscriptionPrices } from '../signup/helper';
import type { SignupCacheResult, SubscriptionData } from '../signup/interfaces';
import { SignupType } from '../signup/interfaces';
import { AccountFormDataContextProvider } from '../signupCtx/context/accountData/AccountFormDataContext';
import type { AccountStepDetailsRef } from '../single-signup-v2/AccountStepDetails';
import AccountStepDetails from '../single-signup-v2/AccountStepDetails';
import DiscountBanner from '../single-signup-v2/DiscountBanner';
import { getFreeSubscriptionData, getSubscriptionMapping } from '../single-signup-v2/helper';
import type { OptimisticOptions } from '../single-signup-v2/interface';
import { getPaymentMethod } from '../single-signup-v2/measure';
import { useFlowRef } from '../useFlowRef';
import Box from './Box';
import CycleSelector from './CycleSelector';
import DollarOfferModal from './DollarOfferModal';
import GiftCodeSummary from './GiftCodeSummary';
import Guarantee from './Guarantee';
import GuaranteeCard from './GuaranteeCard';
import type { Background } from './Layout';
import Layout from './Layout';
import PaymentSummary from './PaymentSummary';
import RightPlanSummary from './RightPlanSummaryB';
import SignIntoLink from './SignIntoLink';
import VPNPassUpsellToggle from './VPNPassUpsellButton';
import swissFlag from './flag.svg';
import { getPlanInformation } from './getPlanInformationB';
import type { getUpsellShortPlan } from './helper';
import { getBillingCycleText, getOffText } from './helper';
import type { Measure, VPNSignupModel } from './interface';
import type { TelemetryPayType } from './measure';
import PlanCustomizer from './planCustomizer/PlanCustomizer';
import RatingsSection from './ratings/RatingsSection';

const getBundleTitle = (a: string, b: string) => {
    return c('vpn_2step: info').t`Your ${a} and ${b} bundle`;
};

const getPlanTitle = (selected: string, trial?: boolean) => {
    if (trial) {
        // translator: full sentence is, for example, "Try Proton Business Suite free for 14 days"
        const freeForNDays = (
            <span className="color-success" key="free-for-n-days">{c('b2b_trials_2025_Info')
                .t`free for ${TRIAL_DURATION_DAYS} days`}</span>
        );
        // translator: ${selected} is title of a subscription plan, for example can be "Proton Business Suite",
        // translator: then the whole is "Your Proton Business Suite plan"
        return c('b2b_trials_2025_Info').jt`Try ${selected} ${freeForNDays}`;
    }
    return c('vpn_2step: info').t`Your ${selected} plan`;
};

const FeatureItem = ({ left, text }: { left: ReactNode; text: ReactNode }) => {
    return (
        <div className="flex items-center text-center flex-column md:flex-row justify-center">
            <div className="md:mr-4 text-center">{left}</div>
            <div>{text}</div>
        </div>
    );
};

const BoxHeader = ({ title, right }: { title: string; right?: ReactNode }) => {
    return (
        <div className="flex items-center justify-space-between flex-nowrap gap-6">
            <h2 className="text-bold text-4xl">{title}</h2>
            {right && <div className="shrink-0">{right}</div>}
        </div>
    );
};

const BoxContent = ({ children, className = 'mt-8' }: { children: ReactNode; className?: string }) => {
    return <div className={clsx('pricing-box-content', className)}>{children}</div>;
};

type StepId = WebCoreVpnSingleSignupStep1InteractionTotal['Labels']['step'];
type HasBeenCountedState = {
    [key in StepId]: boolean;
};

const Step1B = ({
    activeBreakpoint,
    defaultEmail,
    mode,
    selectedPlan,
    cycleData,
    isB2bPlan,
    background,
    onComplete,
    onCurrencyChange,
    model,
    setModel,
    hideFreePlan,
    upsellImg,
    measure,
    className,
    currencyUrlParam,
    signupTrial,
    toAppName,
    couponUrlParam,
    toApp,
    telemetryContext,
}: {
    activeBreakpoint: Breakpoints;
    defaultEmail?: string;
    mode: 'signup' | 'pricing' | 'vpn-pass-promotion';
    selectedPlan: StrictPlan;
    cycleData: { cycles: Cycle[]; upsellCycle: Cycle };
    isB2bPlan: boolean;
    background?: Background;
    upsellShortPlan: ReturnType<typeof getUpsellShortPlan> | undefined;
    onComplete: (data: {
        accountData: SignupCacheResult['accountData'];
        subscriptionData: SignupCacheResult['subscriptionData'];
        type: 'signup';
    }) => void;
    onCurrencyChange: (currency: Currency) => Promise<unknown>;
    model: VPNSignupModel;
    setModel: Dispatch<SetStateAction<VPNSignupModel>>;
    hideFreePlan: boolean;
    upsellImg: ReactElement;
    measure: Measure;
    className?: string;
    currencyUrlParam?: Currency;
    signupTrial: boolean; // true iff trial detected through signupParameters (thus the signup prefix)
    toAppName: string;
    couponUrlParam: string | undefined;
    toApp: APP_NAMES;
    telemetryContext: PaymentTelemetryContext;
}) => {
    const [upsellModalProps, setUpsellModal, renderUpsellModal] = useModalState();
    const silentApi = useSilentApi();
    const { getPaymentsApi } = usePaymentsApi();
    const [toggleUpsell, setToggleUpsell] = useState<{ from: CYCLE; to: CYCLE } | undefined>(undefined);
    const accountDetailsRef = useRef<AccountStepDetailsRef>();
    const [couponCode, setCouponCode] = useState(model.subscriptionData.checkResult.Coupon?.Code);
    const { viewportWidth } = activeBreakpoint;
    const { APP_NAME } = useConfig();

    const [isFormValid, setIsFormValid] = useState(false);

    const createFlow = useFlowRef();

    const [loadingSignup, withLoadingSignup] = useLoading();
    const [loadingPaymentDetails, withLoadingPaymentDetails] = useLoading();
    const [changingCurrency, withChangingCurrency] = useLoading();
    const { getAvailableCurrencies } = useCurrencies();

    const { vpnServersCountData, plansMap } = model;
    const initialLoading = model.loadingDependencies;

    useEffect(() => {
        if (initialLoading) {
            return;
        }

        metrics.core_vpn_single_signup_pageLoad_2_total.increment({
            step: 'plan_username_payment',
            flow: isB2bPlan ? 'b2b' : 'b2c',
        });
    }, [initialLoading]);

    const hasBeenCountedRef = useRef<HasBeenCountedState>({
        plan: false,
        email: false,
        payment: false,
    });

    const options: OptimisticOptions & { plan: Plan } = {
        currency: model.optimistic.currency || model.subscriptionData.currency,
        cycle: model.optimistic.cycle || model.subscriptionData.cycle,
        plan: getPlanFromPlanIDs(model.plansMap, model.optimistic.planIDs) || selectedPlan,
        planIDs: model.optimistic.planIDs || model.subscriptionData.planIDs,
        checkResult: model.optimistic.checkResult || model.subscriptionData.checkResult,
        billingAddress: model.optimistic.billingAddress || model.subscriptionData.billingAddress,
    };

    const handleUpdate = (step: StepId) => {
        if (!hasBeenCountedRef.current[step]) {
            metrics.core_vpn_single_signup_step1_interaction_2_total.increment({
                step,
                flow: isB2bPlan ? 'b2b' : 'b2c',
            });

            hasBeenCountedRef.current = {
                ...hasBeenCountedRef.current,
                [step]: true,
            };
        }
    };

    const handleCompletion = async (subscriptionData: SubscriptionData) => {
        const accountDataWithoutPassword = await accountDetailsRef.current?.data();
        if (!accountDataWithoutPassword) {
            throw new Error('Invalid data');
        }

        const accountData = {
            ...accountDataWithoutPassword,
            password: generatePassword({ useSpecialChars: true, length: 16 }),
        };

        return onComplete({ subscriptionData, accountData, type: 'signup' });
    };

    const onPay = async (payment: ExtendedTokenPayment, type: 'cc' | 'pp' | undefined) => {
        const subscriptionData: SubscriptionData = {
            ...model.subscriptionData,
            payment,
            type,
        };
        return handleCompletion(subscriptionData);
    };

    // true iff trial detected through check result (thus the check prefix)
    const checkTrial = options.checkResult.SubscriptionMode === SubscriptionMode.Trial;
    const hasGuarantee =
        ([PLANS.VPN2024, PLANS.VPN_PASS_BUNDLE].includes(options.plan.Name as any) || isB2bPlan) && !checkTrial;

    const measurePay = (
        type: TelemetryPayType,
        event: TelemetryAccountSignupEvents.userCheckout | TelemetryAccountSignupEvents.checkoutError
    ) => {
        if (!options.plan) {
            return;
        }
        void measure({
            event,
            dimensions: {
                type: type,
                plan: options.plan.Name as any,
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

    const disablePayButton = Object.keys(model.optimistic).length > 0 || loadingPaymentDetails;

    const validatePayment = () => {
        if (loadingSignup || loadingPaymentDetails || disablePayButton) {
            return false;
        }
        return true;
    };

    const paymentFacade = usePaymentFacade({
        checkResult: options.checkResult,
        amount: options.checkResult.AmountDue,
        currency: options.currency,
        api: silentApi,
        billingAddress: options.billingAddress,
        selectedPlanName: getPlanFromPlanIDs(model.plansMap, options.planIDs)?.Name,
        paymentStatus: model.paymentStatus,
        onChargeable: (
            _,
            { chargeablePaymentParameters, sourceType, paymentsVersion, source, paymentProcessorType }
        ) => {
            return withLoadingSignup(async () => {
                const isFreeSignup = chargeablePaymentParameters.Amount <= 0 && !checkTrial;

                const extendedParams: ExtendedTokenPayment = {
                    paymentsVersion,
                    paymentMethodType: sourceType,
                    paymentMethodValue: source,
                    paymentProcessorType,
                };

                if (isFreeSignup) {
                    await onPay(extendedParams, undefined);
                    return;
                }

                metrics.core_vpn_single_signup_step1_payment_2_total.increment({
                    status: 'success',
                    flow: isB2bPlan ? 'b2b' : 'b2c',
                });

                let paymentType: 'cc' | 'pp';
                if (sourceType === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL) {
                    paymentType = 'pp';
                } else {
                    paymentType = 'cc';
                }

                const legacyTokenPayment: TokenPayment | undefined = isV5PaymentToken(chargeablePaymentParameters)
                    ? v5PaymentTokenToLegacyPaymentToken(chargeablePaymentParameters).Payment
                    : undefined;

                const withVersion: ExtendedTokenPayment = {
                    ...legacyTokenPayment,
                    ...extendedParams,
                };

                await onPay(withVersion, paymentType);
            });
        },
        flow: 'signup-vpn',
        onMethodChanged: (newMethod) => {
            const value = getPaymentMethod(newMethod.type);
            if (value) {
                void measure({
                    event: TelemetryAccountSignupEvents.paymentSelect,
                    dimensions: { type: value },
                });
            }
        },
        isTrial: signupTrial,
        product: APPS.PROTONVPN_SETTINGS,
        telemetryContext,
    });

    const reportEstimationChange = (action: EstimationChangeAction, overrides: Partial<EstimationChangePayload>) => {
        const nonEmptyOverrides = Object.fromEntries(
            Object.entries(overrides).filter(([_, value]) => value !== undefined)
        );
        checkoutTelemetry.reportSubscriptionEstimationChange({
            action,
            context: telemetryContext,
            userCurrency: undefined,
            subscription: undefined,
            selectedPlanIDs: options.planIDs,
            selectedCurrency: options.currency,
            selectedCycle: options.cycle,
            selectedCoupon: options.checkResult.Coupon?.Code,
            paymentMethodType: paymentFacade.selectedMethodType,
            paymentMethodValue: paymentFacade.selectedMethodValue,
            build: APP_NAME,
            product: toApp,
            ...nonEmptyOverrides,
        });
    };

    const setOptimisticDiff = (diff: Partial<OptimisticOptions>) => {
        setModel((old) => ({
            ...old,
            optimistic: {
                ...old.optimistic,
                ...diff,
            },
        }));
    };

    const handleOptimistic = async (optimistic: Partial<OptimisticOptions>) => {
        if (model.loadingDependencies) {
            return;
        }

        if (optimistic.planIDs && !isDeepEqual(options.planIDs, optimistic.planIDs)) {
            const currentlySelectedPlanName = getPlanNameFromIDs(options.planIDs);
            const newlySelectedPlanName = getPlanNameFromIDs(optimistic.planIDs);
            const action = currentlySelectedPlanName === newlySelectedPlanName ? 'addon_changed' : 'plan_changed';
            reportEstimationChange(action, {
                selectedPlanIDs: optimistic.planIDs,
            });
        }

        if (optimistic.cycle) {
            reportEstimationChange('cycle_changed', {
                selectedCycle: optimistic.cycle,
            });
        }

        const newCurrency = optimistic.currency || options.currency;
        const newPlanIDs = optimistic.planIDs || options.planIDs;
        const newCycle = optimistic.cycle || options.cycle;
        const newPlan = getPlanFromPlanIDs(model.plansMap, newPlanIDs);
        const newBillingAddress = optimistic.billingAddress || options.billingAddress;

        // Try a pre-saved check first. If it's not available, then use the default optimistic one.
        // With the regular cycles, it should be available.
        let subscriptionMapping = model.subscriptionDataCycleMapping?.[newPlan?.Name as PLANS]?.[newCycle];
        if (!isDeepEqual(newPlanIDs, subscriptionMapping?.planIDs)) {
            subscriptionMapping = undefined;
        }

        const optimisticCheckResult =
            subscriptionMapping?.checkResult ??
            getOptimisticCheckResult({
                plansMap: model.plansMap,
                planIDs: newPlanIDs,
                cycle: newCycle,
                currency: newCurrency,
            });

        // Taxes shouldn't be part of optimistic updated because it can be misleading.
        const optimisticCheckResultWithoutTaxes = {
            ...optimisticCheckResult,
            Taxes: [],
        } satisfies EnrichedCheckResponse;

        const newOptimistic = {
            ...optimistic,
            checkResult: optimisticCheckResultWithoutTaxes,
        };

        try {
            const validateFlow = createFlow();

            setOptimisticDiff(newOptimistic);

            const coupon =
                couponCode || subscriptionMapping?.checkResult.Coupon?.Code || options.checkResult.Coupon?.Code;

            const checkResult = await getSubscriptionPrices({
                paymentsApi: getPaymentsApi(silentApi),
                planIDs: newPlanIDs,
                currency: newCurrency,
                cycle: newCycle,
                billingAddress: newBillingAddress,
                coupon: coupon,
                trial: signupTrial,
                ValidateZipCode: true,
            });

            if (!validateFlow()) {
                return;
            }

            setModel((old) => ({
                ...old,
                subscriptionData: {
                    ...model.subscriptionData,
                    currency: newCurrency,
                    cycle: newCycle,
                    planIDs: newPlanIDs,
                    checkResult,
                    billingAddress: newBillingAddress,
                    zipCodeValid: true,
                },
                optimistic: {},
            }));
        } catch (e) {
            // Reset any optimistic state on failures
            setModel((old) => ({
                ...old,
                optimistic: {},
            }));

            if (e instanceof InvalidZipCodeError) {
                setModel((old) => ({
                    ...old,
                    subscriptionData: {
                        ...old.subscriptionData,
                        zipCodeValid: false,
                    },
                }));
            }
        }
    };

    const handleChangeCurrency = (currency: Currency) => {
        handleUpdate('plan');
        void measure({
            event: TelemetryAccountSignupEvents.currencySelect,
            dimensions: { currency: currency },
        });

        void withChangingCurrency(
            onCurrencyChange(currency)
                .then(() => {
                    metrics.core_vpn_single_signup_step1_currencyChange_2_total.increment({
                        status: 'success',
                        flow: isB2bPlan ? 'b2b' : 'b2c',
                    });
                })
                .catch((error) => {
                    observeApiError(error, (status) =>
                        metrics.core_vpn_single_signup_step1_currencyChange_2_total.increment({
                            status,
                            flow: isB2bPlan ? 'b2b' : 'b2c',
                        })
                    );
                })
        );

        reportEstimationChange('currency_changed', {
            selectedCurrency: currency,
        });
    };

    const handleChangePlanIds = async (planIDs: PlanIDs, planName: PLANS) => {
        handleUpdate('plan');
        void measure({
            event: TelemetryAccountSignupEvents.planSelect,
            dimensions: { plan: planName },
        });

        void handleOptimistic({ planIDs });
    };

    const handleChangeCycle = ({ cycle, mode, planIDs }: { cycle: Cycle; mode?: 'upsell'; planIDs?: PlanIDs }) => {
        if (mode === 'upsell') {
            void measure({
                event: TelemetryAccountSignupEvents.interactUpsell,
                dimensions: {
                    upsell_to: `${options.plan.Name}_${cycle}m`,
                    upsell_from: `${options.plan.Name}_${options.cycle}m`,
                },
            });
        } else {
            void measure({ event: TelemetryAccountSignupEvents.cycleSelect, dimensions: { cycle: `${cycle}` } });
        }

        handleOptimistic({ cycle, planIDs })
            .then((result) => {
                metrics.core_vpn_single_signup_step1_cycleChange_2_total.increment({
                    status: 'success',
                    flow: isB2bPlan ? 'b2b' : 'b2c',
                });
                return result;
            })
            .catch((error) => {
                observeApiError(error, (status) =>
                    metrics.core_vpn_single_signup_step1_cycleChange_2_total.increment({
                        status,
                        flow: isB2bPlan ? 'b2b' : 'b2c',
                    })
                );
            });
    };

    const handleChangeCoupon = (coupon: string | undefined) => {
        setCouponCode(coupon);
        reportEstimationChange('coupon_changed', {
            selectedCoupon: coupon,
        });
    };

    const handleChangeBillingAddress = (billingAddress: BillingAddress) => {
        void handleOptimistic({ billingAddress });
    };

    const taxCountry = useTaxCountry({
        onBillingAddressChange: handleChangeBillingAddress,
        paymentStatus: model.paymentStatus,
        zipCodeBackendValid: model.subscriptionData.zipCodeValid,
        previousValidZipCode: model.subscriptionData.billingAddress.ZipCode,
        paymentFacade,
        telemetryContext,
    });

    const vatNumber = useVatNumber({
        selectedPlanName: selectedPlan?.Name,
        onChange: (vatNumber) =>
            setModel((model) => ({
                ...model,
                subscriptionData: {
                    ...model.subscriptionData,
                    vatNumber,
                },
            })),
        taxCountry,
    });

    const termsHref = (() => {
        return getLocaleTermsURL(APPS.PROTONVPN_SETTINGS);
    })();
    const termsAndConditions = (
        <Href key="terms" href={termsHref} className="color-weak">
            {
                // translator: Full sentence "By clicking on "Pay", you agree to our terms and conditions."
                c('new_plans: signup').t`terms and conditions`
            }
        </Href>
    );

    const getCheckoutForCycle = (
        planIDs: PlanIDs,
        subscriptionMapping: CycleMapping<SubscriptionData>,
        cycle: Cycle
    ) => {
        const checkResult = subscriptionMapping?.[cycle]?.checkResult;
        if (!checkResult) {
            return;
        }
        return getCheckout({
            planIDs,
            plansMap,
            checkResult,
        });
    };

    const checkoutMappingPlanIDs = ((): CycleMapping<PaymentsCheckout> | undefined => {
        if (mode === 'vpn-pass-promotion') {
            const vpnPassBundlePlanIDs = { [PLANS.VPN_PASS_BUNDLE]: 1 };
            const vpnPassBundleSubscriptionMapping = getSubscriptionMapping({
                subscriptionDataCycleMapping: model.subscriptionDataCycleMapping,
                planName: PLANS.VPN_PASS_BUNDLE,
                planIDs: vpnPassBundlePlanIDs,
            });
            const vpnPlanIDs = { [PLANS.VPN2024]: 1 };
            const vpnSubscriptionMapping = getSubscriptionMapping({
                subscriptionDataCycleMapping: model.subscriptionDataCycleMapping,
                planName: PLANS.VPN2024,
                planIDs: vpnPlanIDs,
            });
            if (!vpnPassBundleSubscriptionMapping || !vpnSubscriptionMapping) {
                return;
            }
            return {
                [CYCLE.MONTHLY]: getCheckoutForCycle(vpnPlanIDs, vpnSubscriptionMapping, CYCLE.MONTHLY),
                [CYCLE.YEARLY]: getCheckoutForCycle(
                    vpnPassBundlePlanIDs,
                    vpnPassBundleSubscriptionMapping,
                    CYCLE.YEARLY
                ),
                [CYCLE.TWO_YEARS]: getCheckoutForCycle(vpnPlanIDs, vpnSubscriptionMapping, CYCLE.TWO_YEARS),
            };
        }
        const planIDs = options.planIDs;
        // Want to show prices for VPN and VPNBIZ
        const subscriptionMapping = getSubscriptionMapping({
            subscriptionDataCycleMapping: model.subscriptionDataCycleMapping,
            planName: options.plan.Name,
            planIDs,
        });
        if (!subscriptionMapping) {
            return;
        }
        return {
            [CYCLE.MONTHLY]: getCheckoutForCycle(planIDs, subscriptionMapping, CYCLE.MONTHLY),
            [CYCLE.THREE]: getCheckoutForCycle(planIDs, subscriptionMapping, CYCLE.THREE),
            [CYCLE.YEARLY]: getCheckoutForCycle(planIDs, subscriptionMapping, CYCLE.YEARLY),
            [CYCLE.EIGHTEEN]: getCheckoutForCycle(planIDs, subscriptionMapping, CYCLE.EIGHTEEN),
            [CYCLE.TWO_YEARS]: getCheckoutForCycle(planIDs, subscriptionMapping, CYCLE.TWO_YEARS),
            [CYCLE.FIFTEEN]: getCheckoutForCycle(planIDs, subscriptionMapping, CYCLE.FIFTEEN),
            [CYCLE.THIRTY]: getCheckoutForCycle(planIDs, subscriptionMapping, CYCLE.THIRTY),
        };
    })();

    const actualCheckout = getCheckout({
        planIDs: options.planIDs,
        plansMap,
        checkResult: options.checkResult,
    });

    const iconColorClassName = background === 'bf2025' ? 'color-norm' : 'color-primary';
    const features = [
        {
            left: <IcCode size={6} className={iconColorClassName} />,
            text: c('Info').t`Open source`,
        },
        {
            left: <IcEyeSlash size={6} className={iconColorClassName} />,
            text: c('new_plans: feature').t`No-logs policy`,
        },
        {
            left: <img width="24" alt="" src={swissFlag} className="rounded-sm" />,
            text: viewportWidth['>=large'] ? c('Info').t`Protected by Swiss privacy laws` : c('Info').t`Swiss based`,
        },
        viewportWidth['>=large'] &&
            [PLANS.VPN2024, PLANS.VPN_PASS_BUNDLE, PLANS.BUNDLE].includes(selectedPlan.Name as any) && {
                left: <IcServers size={6} className={iconColorClassName} />,
                text: model.loadingDependencies ? (
                    <>
                        <SkeletonLoader width="5em" />
                    </>
                ) : (
                    getVpnServers(vpnServersCountData.paid.servers)
                ),
            },
    ].filter(isTruthy);

    const appName = VPN_APP_NAME;

    const hasSelectedFree = selectedPlan.Name === PLANS.FREE;

    const padding = 'sm:p-11';

    const planInformation = getPlanInformation({
        loading: model.loadingDependencies,
        selectedPlan: options.plan,
        vpnServersCountData,
    });

    const upsellToCycle = (() => {
        if (options.plan.Name === PLANS.BUNDLE && getHas2025OfferCoupon(options.checkResult.Coupon?.Code)) {
            return;
        }
        if (options.cycle === CYCLE.MONTHLY) {
            if (cycleData.cycles.includes(CYCLE.EIGHTEEN)) {
                return CYCLE.EIGHTEEN;
            }
            if (cycleData.cycles.includes(CYCLE.FIFTEEN)) {
                return CYCLE.FIFTEEN;
            }
            return CYCLE.YEARLY;
        }
        if (options.cycle === CYCLE.THREE) {
            if (cycleData.cycles.includes(CYCLE.EIGHTEEN)) {
                return CYCLE.EIGHTEEN;
            }
        }
        if (options.cycle === CYCLE.YEARLY) {
            return CYCLE.TWO_YEARS;
        }
        if (options.cycle === CYCLE.FIFTEEN) {
            return CYCLE.THIRTY;
        }
    })();

    const handleCloseUpsellModal = () => {
        handleUpdate('plan');
        if (![PLANS.VPN_PASS_BUNDLE, PLANS.VPN2024].some((plan) => options.planIDs[plan])) {
            const newPlanIDs = { [PLANS.VPN2024]: 1 };
            withLoadingPaymentDetails(
                handleOptimistic({
                    planIDs: newPlanIDs,
                    cycle: cycleData.cycles[0] || DEFAULT_CYCLE,
                })
            ).catch(noop);
        }
        upsellModalProps.onClose();
    };

    const upsellToVPNPassBundle = mode === 'vpn-pass-promotion';

    const coupon = (() => {
        const {
            currency,
            checkResult: { Coupon, CouponDiscount },
        } = model.subscriptionData;

        if (!Coupon || !CouponDiscount) {
            return;
        }
        return {
            code: Coupon.Code,
            description: Coupon.Description,
            discount: CouponDiscount,
            currency,
        };
    })();

    const handleUpsellVPNPassBundle = () => {
        if (loadingSignup || loadingPaymentDetails) {
            return;
        }
        if (
            !options.planIDs[PLANS.VPN_PASS_BUNDLE] ||
            (options.planIDs[PLANS.VPN_PASS_BUNDLE] && options.cycle !== CYCLE.YEARLY)
        ) {
            const upsellToCycle = CYCLE.YEARLY;
            setToggleUpsell({
                from: options.cycle,
                to: upsellToCycle,
            });
            return withLoadingPaymentDetails(
                handleOptimistic({
                    planIDs: {
                        [PLANS.VPN_PASS_BUNDLE]: 1,
                    },
                    cycle: upsellToCycle,
                })
            ).catch(noop);
        } else {
            const previousCycle = toggleUpsell?.from;
            setToggleUpsell(undefined);
            return withLoadingPaymentDetails(
                handleOptimistic({
                    planIDs: {
                        [PLANS.VPN2024]: 1,
                    },
                    ...(previousCycle ? { cycle: previousCycle } : {}),
                })
            ).catch(noop);
        }
    };

    const isBlackFriday =
        getHas2025OfferCoupon(options.checkResult.Coupon?.Code) || getHas2025OfferCoupon(couponUrlParam);

    // const isCyberWeekPeriod = getIsCyberWeekPeriod();
    // const isBlackFridayPeriod = getIsBlackFridayPeriod();

    const showRenewalNotice = !hasSelectedFree;
    const renewalNotice = showRenewalNotice && (
        <div className="w-full text-sm color-norm opacity-70 text-center">
            <div className="mx-auto w-full md:w-7/10">
                *
                {getCheckoutRenewNoticeTextFromCheckResult({
                    checkResult: options.checkResult,
                    plansMap: model.plansMap,
                    planIDs: options.planIDs,
                    app: APPS.PROTONVPN_SETTINGS,
                })}
            </div>
        </div>
    );

    const process = (processor: PaymentProcessorHook | undefined) => {
        async function run() {
            if (!processor) {
                return;
            }

            const isFormValid = validatePayment() && (await accountDetailsRef.current?.validate());
            if (!isFormValid) {
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

                return 'pay_cc';
            })();
            measurePaySubmit(telemetryType);

            try {
                await processor.processPaymentToken();
            } catch (e) {
                observeApiError(e, (status) => {
                    measurePayError(telemetryType);
                    metrics.core_vpn_single_signup_step1_payment_2_total.increment({
                        status,
                        flow: isB2bPlan ? 'b2b' : 'b2c',
                    });
                });

                const error = getSentryError(e);
                if (error) {
                    const context = {
                        mode,
                        selectedPlan,
                        selectedPlanName: selectedPlan.Name,
                        isB2bPlan,
                        step: model.step,
                        currency: options.currency,
                        cycle: options.cycle,
                        amount: options.checkResult.AmountDue,
                        coupon,
                        processorType: paymentFacade.selectedProcessor?.meta.type,
                        paymentMethod: paymentFacade.selectedMethodType,
                        paymentMethodValue: paymentFacade.selectedMethodValue,
                        subscriptionDataType: model.subscriptionData.type,
                        paymentsVersion: getPaymentsVersion(),
                    };

                    captureMessage('Payments: Failed to handle single-signup-v1', {
                        level: 'error',
                        extra: { error, context },
                    });
                }
            }
        }

        withLoadingSignup(run()).catch(noop);
    };

    const getUpsellToggle = () => {
        const hasUpsellVPNPassBundleToggle = upsellToVPNPassBundle || options.planIDs[PLANS.VPN_PASS_BUNDLE];

        if (hasUpsellVPNPassBundleToggle) {
            const hasPlanSelected = !!options.planIDs[PLANS.VPN_PASS_BUNDLE] && options.cycle === CYCLE.YEARLY;
            return (
                <VPNPassUpsellToggle
                    view={hasPlanSelected && !toggleUpsell?.from ? 'included' : undefined}
                    checked={hasPlanSelected}
                    currency={options.currency}
                    cycle={toggleUpsell?.from || options.cycle}
                    onChange={() => {
                        void handleUpsellVPNPassBundle();
                    }}
                />
            );
        }

        if (getHas2025OfferCoupon(options.checkResult.Coupon?.Code) || getHas2025OfferCoupon(couponUrlParam)) {
            return null;
        }
        const toCycle = toggleUpsell?.to || upsellToCycle;
        if (!toCycle) {
            return null;
        }
        const subscriptionMapping = getSubscriptionMapping({
            subscriptionDataCycleMapping: model.subscriptionDataCycleMapping,
            planName: options.plan.Name,
            planIDs: options.planIDs,
        });
        if (!subscriptionMapping) {
            if (model.loadingDependencies) {
                return (
                    <div className="p-2 flex gap-1 items-center">
                        <Toggle checked={false} id="toggle-upsell-plan" className="mx-1" />
                        <label htmlFor="toggle-upsell-plan" className="flex-1 text-sm">
                            <SkeletonLoader width="100%" height="2em" index={0} />
                        </label>
                    </div>
                );
            }
            return null;
        }
        const toCycleCheckout = getCheckoutForCycle(options.planIDs, subscriptionMapping, toCycle);
        if (!toCycleCheckout) {
            return null;
        }
        const billingCycle = getBillingCycleText(toCycle);
        if (!billingCycle) {
            return null;
        }
        const label = getOffText(`${toCycleCheckout.discountPercent}%`, billingCycle);

        return (
            <div className="p-2 flex gap-1 items-center">
                <Toggle
                    checked={!!toggleUpsell}
                    id="toggle-upsell-plan"
                    className="mx-1"
                    onChange={(event) => {
                        if (loadingSignup || loadingPaymentDetails) {
                            return;
                        }
                        if (event.target.checked && upsellToCycle) {
                            setToggleUpsell({
                                from: options.cycle,
                                to: upsellToCycle,
                            });
                            handleChangeCycle({
                                cycle: upsellToCycle,
                                mode: 'upsell',
                            });
                        } else if (toggleUpsell) {
                            handleChangeCycle({
                                cycle: toggleUpsell.from,
                                mode: 'upsell',
                            });
                            setToggleUpsell(undefined);
                        }
                    }}
                />
                <label htmlFor="toggle-upsell-plan" className="flex-1 text-sm">
                    {label}
                </label>
            </div>
        );
    };

    const showCycleAndSelectors =
        !hasSelectedFree && (mode === 'pricing' || mode === 'vpn-pass-promotion') && checkoutMappingPlanIDs;

    const currencySelector = model.loadingDependencies ? null : (
        <CurrencySelector
            currencies={getAvailableCurrencies({
                paymentStatus: model.paymentStatus,
                plans: model.plans,
                selectedPlanName: selectedPlan.Name,
                paramCurrency: currencyUrlParam,
            })}
            mode="select-two"
            currency={options.currency}
            loading={changingCurrency}
            onSelect={(currency) => handleChangeCurrency(currency)}
            disabled={paymentFacade.selectedMethodType === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT}
        />
    );

    const loadingPaymentsForm = model.loadingDependencies;

    const title = (() => {
        if (mode === 'vpn-pass-promotion') {
            return c('Header').t`Save big on the best ${VPN_APP_NAME} deals`;
        }

        if (isB2bPlan) {
            return c('new_plans: feature').t`Start protecting your organization`;
        }

        if (isBlackFriday) {
            // if (isBlackFridayPeriod) {
            //     return c('bf2023: header').t`Save with Black Friday deals on a high-speed Swiss VPN`;
            // }
            // if (isCyberWeekPeriod) {
            //     return c('bf2023: header').t`Save with Cyber Week deals on a high-speed Swiss VPN`;
            // }
            // return c('bf2023: header').t`Save with End of Year deals on a high-speed Swiss VPN`;
            return c('bf2023: header').t`Save with Black Friday deals on a high-speed Swiss VPN`;
        }

        return;
    })();

    const signIn = (
        <SignIntoLink
            key="sign-in"
            options={options}
            measure={measure}
            details={undefined}
            disabled={model.loadingDependencies}
        />
    );

    const signInText = !(signupTrial || checkTrial) ? (
        <div className="text-center color-norm">
            {
                // translator: Full sentence "Already have an account? Sign in"
                c('Go to sign in').jt`Already have an account? ${signIn}`
            }
        </div>
    ) : null;

    const paymentSummary = (
        <PaymentSummary
            model={model}
            options={options}
            actualCheckout={actualCheckout}
            loadingPaymentDetails={disablePayButton}
            isB2bPlan={isB2bPlan}
            upsellToggle={getUpsellToggle()}
            planInformation={(() => {
                return model.mode === 'vpn-pass-promotion' && plansMap[PLANS.VPN2024]
                    ? getPlanInformation({
                          selectedPlan: plansMap[PLANS.VPN2024],
                          vpnServersCountData,
                          loading: model.loadingDependencies,
                      }) || planInformation
                    : planInformation;
            })()}
            giftCode={
                <GiftCodeSummary
                    coupon={coupon}
                    checkResult={model.subscriptionData.checkResult}
                    planIDs={options.planIDs}
                    plansMap={model.plansMap}
                    onApplyCode={async (code) => {
                        const checkResult = await getSubscriptionPrices({
                            paymentsApi: getPaymentsApi(silentApi),
                            planIDs: options.planIDs,
                            currency: options.currency,
                            cycle: options.cycle,
                            billingAddress: model.subscriptionData.billingAddress,
                            coupon: code,
                            trial: signupTrial,
                            ValidateZipCode: true,
                        });

                        setModel((old) => ({
                            ...old,
                            subscriptionData: {
                                ...model.subscriptionData,
                                checkResult,
                            },
                        }));

                        handleChangeCoupon(code);

                        if (!checkResult.Coupon) {
                            throw new Error(c('Notification').t`Invalid code`);
                        }
                    }}
                    onRemoveCode={async () => {
                        const checkResult = await getSubscriptionPrices({
                            paymentsApi: getPaymentsApi(silentApi),
                            planIDs: options.planIDs,
                            currency: options.currency,
                            cycle: options.cycle,
                            billingAddress: model.subscriptionData.billingAddress,
                            coupon: undefined, // don't pass coupon code, it will be removed
                            trial: signupTrial,
                            ValidateZipCode: true,
                        });

                        setModel((old) => ({
                            ...old,
                            subscriptionData: {
                                ...model.subscriptionData,
                                checkResult,
                            },
                        }));

                        handleChangeCoupon(undefined);
                    }}
                />
            }
            hasSelectedFree={hasSelectedFree}
        />
    );

    const isVpnPassBundleBusinessPlan = selectedPlan.Name === PLANS.VPN_PASS_BUNDLE_BUSINESS;
    const checkoutHeaderText = isVpnPassBundleBusinessPlan
        ? c('Header').t`Checkout`
        : c('Header').t`Select your payment method:`;

    return (
        <Layout
            hasDecoration
            footer={renewalNotice}
            className={className}
            bottomRight={
                <SignupSupportDropdown
                    isDarkBg={['dark', 'bf2025'].includes(background as any) && !viewportWidth.xsmall}
                />
            }
            background={background}
            isB2bPlan={isB2bPlan}
            headerCenterElement={viewportWidth['<=small'] || isVpnPassBundleBusinessPlan ? undefined : signInText}
        >
            {viewportWidth['<=small'] && signInText}
            <div className="flex items-center flex-column">
                {title && (
                    <div className="signup-v1-header mb-4 mt-4 md:mt-0 text-center">
                        <h1 className="m-0 large-font lg:px-4 text-semibold">{title}</h1>
                    </div>
                )}
                {mode === 'vpn-pass-promotion' && !isB2bPlan && (
                    <div
                        className={clsx(
                            'flex flex-nowrap md:gap-8 gap-3',
                            background === 'bf2025' ? 'color-norm' : 'color-weak'
                        )}
                    >
                        {features.map(({ left, text }, i, arr) => {
                            return (
                                <Fragment key={typeof text === 'string' ? text : i}>
                                    <FeatureItem left={left} text={text} />
                                    {i !== arr.length - 1 && (
                                        <Vr className="min-h-custom" style={{ '--min-h-custom': '2.25rem' }} />
                                    )}
                                </Fragment>
                            );
                        })}
                    </div>
                )}
                {showCycleAndSelectors && (
                    <Box className={`mt-8 w-full ${padding}`}>
                        <BoxHeader
                            title={(() => {
                                if (upsellToVPNPassBundle) {
                                    return c('Header').t`Select your deal`;
                                }

                                if (isBlackFriday) {
                                    // if (isBlackFridayPeriod) {
                                    //     return c('bf2023: header').t`Select your Black Friday offer`;
                                    // }
                                    // if (isCyberWeekPeriod) {
                                    //     return c('bf2023: header').t`Select your Cyber Week offer`;
                                    // }
                                    // return c('bf2023: header').t`Select your End of Year offer`;
                                    return c('bf2023: header').t`Select your Black Friday offer`;
                                }
                                return c('Header').t`Select your pricing plan`;
                            })()}
                            right={currencySelector}
                        />
                        <BoxContent>
                            <div className="flex justify-space-between gap-4 flex-column lg:flex-row">
                                <CycleSelector
                                    mode={mode}
                                    loading={model.loadingDependencies}
                                    onGetTheDeal={({ cycle, planIDs }) => {
                                        handleUpdate('plan');
                                        setToggleUpsell(undefined);
                                        handleChangeCycle({
                                            cycle,
                                            planIDs,
                                        });
                                        accountDetailsRef.current?.scrollInto('email');
                                    }}
                                    upsell={(() => {
                                        if (mode === 'vpn-pass-promotion') {
                                            const cycle = CYCLE.YEARLY;
                                            const mapping = checkoutMappingPlanIDs[cycle];
                                            if (mapping?.planIDs[PLANS.VPN_PASS_BUNDLE]) {
                                                return {
                                                    mapping,
                                                    cycle,
                                                };
                                            }
                                            return;
                                        }
                                        const mapping = checkoutMappingPlanIDs[cycleData.upsellCycle];
                                        if (mapping) {
                                            return {
                                                cycle: cycleData.upsellCycle,
                                                mapping,
                                            };
                                        }
                                    })()}
                                    cycle={options.cycle}
                                    cycles={cycleData.cycles}
                                    onChangeCycle={({ cycle, upsellFrom, planIDs }) => {
                                        handleUpdate('plan');
                                        setToggleUpsell(undefined);
                                        handleChangeCycle({
                                            planIDs,
                                            cycle,
                                            mode: upsellFrom !== undefined ? 'upsell' : undefined,
                                        });
                                    }}
                                    checkoutMapping={checkoutMappingPlanIDs}
                                />
                            </div>
                            <div className="flex flex-column items-center gap-1 lg:flex-row lg:justify-space-between mt-10">
                                <span className="text-sm">
                                    <Guarantee />
                                </span>
                                {!hideFreePlan && (
                                    <div className="color-weak">
                                        {c('Action').t`Or`}{' '}
                                        <InlineLinkButton
                                            className="color-weak"
                                            onClick={() => {
                                                void measure({
                                                    event: TelemetryAccountSignupEvents.planSelect,
                                                    dimensions: { plan: PLANS.FREE },
                                                });
                                                setUpsellModal(true);
                                            }}
                                        >
                                            {c('Action').t`sign up for free`}
                                        </InlineLinkButton>
                                    </div>
                                )}
                            </div>
                        </BoxContent>
                    </Box>
                )}
                <Box className="mt-8 w-full">
                    <div className="flex justify-space-between flex-column lg:flex-row ">
                        <div className={`lg:flex-1 ${padding}`}>
                            <BoxHeader
                                title={
                                    isVpnPassBundleBusinessPlan
                                        ? c('Header').t`Create your account`
                                        : c('Header').t`Enter your email address`
                                }
                            />
                            <BoxContent>
                                <div className="relative">
                                    <AccountFormDataContextProvider
                                        availableSignupTypes={new Set([SignupType.External])}
                                        domains={model.domains}
                                        defaultEmail={defaultEmail}
                                    >
                                        <AccountStepDetails
                                            passwordFields={false}
                                            model={model}
                                            measure={measure}
                                            accountStepDetailsRef={accountDetailsRef}
                                            disableChange={loadingSignup}
                                            hideEmailLabel={!isVpnPassBundleBusinessPlan}
                                            onSubmit={
                                                hasSelectedFree
                                                    ? () => {
                                                          withLoadingSignup(
                                                              handleCompletion(
                                                                  getFreeSubscriptionData(model.subscriptionData)
                                                              )
                                                          ).catch(noop);
                                                      }
                                                    : undefined
                                            }
                                            onFormValidChange={setIsFormValid}
                                            footer={() => {
                                                return (
                                                    <>
                                                        {hasSelectedFree && (
                                                            <div className="mb-4">
                                                                <Button
                                                                    type="submit"
                                                                    size="large"
                                                                    loading={loadingSignup}
                                                                    color="norm"
                                                                    fullWidth
                                                                >
                                                                    {c('pass_signup_2023: Action')
                                                                        .t`Start using ${appName}`}
                                                                </Button>
                                                            </div>
                                                        )}
                                                        {isVpnPassBundleBusinessPlan &&
                                                            !(signupTrial || checkTrial) && (
                                                                <span>
                                                                    {
                                                                        // translator: Full sentence "Already have an account? Sign in"
                                                                        c('Go to sign in')
                                                                            .jt`Already have an account? ${signIn}`
                                                                    }
                                                                </span>
                                                            )}
                                                        {!isB2bPlan && (
                                                            <div className="mt-4 color-weak text-sm">
                                                                {c('Info')
                                                                    .t`Your information is safe with us. We'll only contact you when it's required to provide our services.`}
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            }}
                                        />
                                    </AccountFormDataContextProvider>
                                </div>
                            </BoxContent>
                        </div>
                        {planInformation && (
                            <div
                                className={clsx(
                                    'mt-8 sm:mt-0',
                                    viewportWidth['>=large']
                                        ? `${padding} w-custom border-left border-weak`
                                        : `${padding} sm:pt-0 pt-0`
                                )}
                                style={
                                    viewportWidth['>=large']
                                        ? {
                                              '--w-custom': '22.125rem',
                                          }
                                        : undefined
                                }
                            >
                                <RightPlanSummary
                                    {...planInformation}
                                    title={
                                        options.planIDs[PLANS.VPN_PASS_BUNDLE]
                                            ? getBundleTitle(VPN_SHORT_APP_NAME, PASS_SHORT_APP_NAME)
                                            : getPlanTitle(planInformation.title, checkTrial)
                                    }
                                />
                            </div>
                        )}
                    </div>
                </Box>
                {!hasSelectedFree && (
                    <Box className={`mt-8 w-full ${padding}`}>
                        <BoxHeader
                            title={viewportWidth['>=large'] && !checkTrial ? checkoutHeaderText : ''}
                            right={!showCycleAndSelectors ? currencySelector : null}
                        />
                        {viewportWidth['<=medium'] ? (
                            <>
                                <BoxContent>
                                    <div className="flex-1 border rounded-xl border-weak px-3 py-4">
                                        {paymentSummary}
                                    </div>
                                </BoxContent>

                                <h2 className="text-bold text-4xl mt-8">{checkoutHeaderText}</h2>
                            </>
                        ) : null}
                        <BoxContent className="mt-4">
                            {signupTrial && (
                                <div className="mb-4 text-sm color-weak">
                                    {c('b2b_trials_2025_Info').t`During the trial period, you can have up to 10 users.`}
                                </div>
                            )}
                            <div className="flex justify-space-between md:gap-14 gap-6 flex-column lg:flex-row">
                                <div className="lg:flex-1 md:pr-1 order-1 lg:order-0">
                                    <form
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
                                            process(paymentFacade.selectedProcessor);
                                        }}
                                        method="post"
                                    >
                                        {isB2bPlan && (
                                            <>
                                                <PlanCustomizer
                                                    currency={options.currency}
                                                    cycle={options.cycle}
                                                    plansMap={model.plansMap}
                                                    planIDs={options.planIDs}
                                                    currentPlan={selectedPlan}
                                                    onChangePlanIDs={(planIDs: PlanIDs) =>
                                                        withLoadingPaymentDetails(handleOptimistic({ planIDs })).catch(
                                                            noop
                                                        )
                                                    }
                                                    isTrialMode={checkTrial}
                                                />
                                                <div className="border-bottom border-weak my-6" />
                                            </>
                                        )}
                                        <PaymentWrapper
                                            {...paymentFacade}
                                            hideFirstLabel
                                            noMaxWidth
                                            taxCountry={taxCountry}
                                            showCardIcons
                                            vatNumber={vatNumber}
                                            startTrial={checkTrial}
                                            onCurrencyChange={handleChangeCurrency}
                                        />
                                        {(() => {
                                            if (!actualCheckout.discountPercent || checkTrial || signupTrial) {
                                                return;
                                            }

                                            const sharedClasses = 'mb-2';
                                            if (model.loadingDependencies) {
                                                return (
                                                    <SkeletonLoader
                                                        height="2.5rem"
                                                        width="30rem"
                                                        className={sharedClasses}
                                                    />
                                                );
                                            }
                                            return (
                                                <DiscountBanner
                                                    discountPercent={actualCheckout.discountPercent}
                                                    selectedPlanTitle={selectedPlan.Title}
                                                    className={sharedClasses}
                                                />
                                            );
                                        })()}

                                        {(() => {
                                            if (loadingPaymentsForm) {
                                                return;
                                            }
                                            const guaranteeElement = hasGuarantee ? (
                                                <div className="text-center color-success my-4">
                                                    <Guarantee />
                                                </div>
                                            ) : null;
                                            const tncElement = (
                                                <div className="mt-4 text-sm color-weak text-center">
                                                    {checkTrial
                                                        ? // translator: Full sentence "By clicking on "Try", you agree to our terms and conditions."
                                                          c('b2b_trials_2025_Info')
                                                              .jt`By clicking on "Try", you agree to our ${termsAndConditions}.`
                                                        : // translator: Full sentence "By clicking on "Pay", you agree to our terms and conditions."
                                                          c('new_plans: signup')
                                                              .jt`By clicking on "Pay", you agree to our ${termsAndConditions}.`}
                                                </div>
                                            );

                                            return (
                                                <PayButton
                                                    size="large"
                                                    color="norm"
                                                    fullWidth
                                                    taxCountry={taxCountry}
                                                    paymentFacade={paymentFacade}
                                                    loading={loadingSignup}
                                                    disabled={disablePayButton}
                                                    suffix={(type) => (
                                                        <>
                                                            {guaranteeElement}
                                                            {type === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD ? (
                                                                <Alert3ds />
                                                            ) : (
                                                                ''
                                                            )}
                                                            {tncElement}
                                                        </>
                                                    )}
                                                    formInvalid={!isFormValid}
                                                    product={APPS.PROTONVPN_SETTINGS}
                                                    telemetryContext={telemetryContext}
                                                >
                                                    {(() => {
                                                        if (checkTrial) {
                                                            return c('Action').t`Try for free`;
                                                        }
                                                        return c('Action').t`Get Deal`;
                                                    })()}
                                                </PayButton>
                                            );
                                        })()}
                                    </form>

                                    {!isVpnPassBundleBusinessPlan && (
                                        <>
                                            {hasGuarantee && viewportWidth['<=medium'] && (
                                                <GuaranteeCard className="mt-8" productName={toAppName} />
                                            )}
                                            <RatingsSection className="mt-8" />
                                        </>
                                    )}
                                </div>
                                {viewportWidth['>=large'] && (
                                    <div className="w-custom" style={{ '--w-custom': '18.75rem' }}>
                                        <div className="flex-1 border rounded-xl border-weak px-3 py-4">
                                            {paymentSummary}
                                        </div>
                                        {hasGuarantee && !isVpnPassBundleBusinessPlan && (
                                            <GuaranteeCard productName={toAppName} className="mt-6" />
                                        )}
                                    </div>
                                )}
                            </div>
                        </BoxContent>
                    </Box>
                )}
            </div>
            {renderUpsellModal && (
                <DollarOfferModal
                    img={upsellImg}
                    currency={options.currency}
                    measure={measure}
                    onGetDeal={handleCloseUpsellModal}
                    onContinueFree={() => {
                        upsellModalProps.onClose();
                        void handleChangePlanIds({}, PLANS.FREE);
                    }}
                    {...upsellModalProps}
                />
            )}
        </Layout>
    );
};

export default Step1B;
