import type { ComponentProps, ReactElement, ReactNode } from 'react';
import { Fragment, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useConfig } from '@proton/app-context/useConfig';
import { useSilentApi } from '@proton/app-context/useSilentApi';
import { Button } from '@proton/atoms/Button/Button';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { Vr } from '@proton/atoms/Vr/Vr';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Price from '@proton/components/components/price/Price';
import SkeletonLoader from '@proton/components/components/skeletonLoader/SkeletonLoader';
import Toggle from '@proton/components/components/toggle/Toggle';
import CurrencySelector from '@proton/components/containers/payments/CurrencySelector';
import { useVpn2024SignupExperiment } from '@proton/components/containers/payments/subscription/helpers/useVpn2024SignupExperiment';
import type { Breakpoints } from '@proton/components/hooks/useActiveBreakpoint';
import useLoading from '@proton/hooks/useLoading';
import { IcCode } from '@proton/icons/icons/IcCode';
import { IcEyeSlash } from '@proton/icons/icons/IcEyeSlash';
import { IcServers } from '@proton/icons/icons/IcServers';
import metrics from '@proton/metrics/metricsInstance';
import observeApiError from '@proton/metrics/observeApiError';
import type { WebCoreVpnSingleSignupStep1InteractionTotal } from '@proton/metrics/types/web_core_vpn_single_signup_step1_interaction_total_v1.schema';
import { sortMethodsBasedOnDevice } from '@proton/payments-ui/client-extensions/useMethods';
import { usePaymentFacade } from '@proton/payments-ui/client-extensions/usePaymentFacade';
import PaymentWrapper from '@proton/payments-ui/containers/payments/PaymentWrapper';
import { useBillingAddress } from '@proton/payments-ui/ui/billing-address/hooks/useBillingAddress';
import { PayButton } from '@proton/payments-ui/ui/components/PayButton';
import {
    type PaymentsContextOptimisticType,
    usePaymentOptimistic,
} from '@proton/payments-ui/ui/context/PaymentContextOptimistic';
import type { FullBillingAddressFlat } from '@proton/payments/core/billing-address/billing-address';
import type { PaymentsCheckoutUI } from '@proton/payments/core/checkout';
import { COUPON_CODES, CYCLE, PAYMENT_METHOD_TYPES, PLANS, TRIAL_DURATION_DAYS } from '@proton/payments/core/constants';
import type {
    Currency,
    Cycle,
    CycleMapping,
    ExtendedTokenPayment,
    PlainPaymentMethodType,
    PlanIDs,
    TokenPayment,
} from '@proton/payments/core/interface';
import type { PaymentProcessorHook } from '@proton/payments/core/payment-processors/interface';
import { getHas2025OfferCoupon, getIsVPNPassPromotion } from '@proton/payments/core/subscription/helpers';
import type { PlanToCheck } from '@proton/payments/core/subscription/plan-to-check';
import { isV5PaymentToken } from '@proton/payments/core/type-guards';
import { v5PaymentTokenToLegacyPaymentToken } from '@proton/payments/core/utils';
import { tracePaymentError } from '@proton/payments/sentry/capture';
import type { PaymentTelemetryContext } from '@proton/payments/telemetry/helpers';
import { reportVpn2024SignupAddPass } from '@proton/payments/telemetry/signup-experiment-telemetry';
import { getUIDApi } from '@proton/shared/lib/api/helpers/customConfig';
import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import { APPS, PASS_SHORT_APP_NAME, VPN_APP_NAME, VPN_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { generatePassword } from '@proton/shared/lib/password';
import { getPlanNameFromIDs } from '@proton/shared/lib/payments/plan/helpers';
import type { Plan, StrictPlan } from '@proton/shared/lib/payments/plan/interface';
import { SubscriptionMode } from '@proton/shared/lib/payments/subscription/constants';
import { getVpnServers } from '@proton/shared/lib/vpn/features';
import { VPN_SERVERS } from '@proton/shared/lib/vpn/vpnServers';
import { useFlag } from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import SignupSupportDropdown from '../../../signup/SignupSupportDropdown';
import type { SignupCacheResult, SubscriptionData } from '../../../signup/interfaces';
import type { getSignupSearchParams } from '../../../signup/searchParams';
import { usePaypalFirstSort } from '../../../signup/usePaypalFirstSort';
import type { AccountStepDetailsRef } from '../../../single-signup-v2/AccountStepDetails';
import AccountStepDetails from '../../../single-signup-v2/AccountStepDetails';
import DiscountBanner from '../../../single-signup-v2/DiscountBanner';
import { getFreeSubscriptionData } from '../../../single-signup-v2/helper';
import { getPaymentMethod } from '../../../single-signup-v2/measure';
import {
    type CheckTrialPriceResult,
    checkTrialPriceCommon,
} from '../../../single-signup-v2/modals/Trial2024UpsellModal';
import Box from './Box';
import CycleSelector from './CycleSelector';
import DollarOfferModal from './DollarOfferModal';
import GiftCodeSummary from './GiftCodeSummary';
import Guarantee from './Guarantee';
import GuaranteeCard from './GuaranteeCard';
import type { Background } from './Layout';
import Layout from './Layout';
import MobilePlanBar from './MobilePlanBar';
import PayButtonSuffix from './PayButtonSuffix';
import PaymentSummary from './PaymentSummary';
import RightPlanSummary from './RightPlanSummary';
import SignIntoLink from './SignIntoLink';
import ThreePlansSelector from './ThreePlansSelector';
import VPNPassUpsellToggle from './VPNPassUpsellButton';
import { VpnPassBundleUpsell } from './VpnPassBundleUpsell';
import swissFlag from './flag.svg';
import { getPlanInformation } from './getPlanInformation';
import type { getUpsellShortPlan } from './helper';
import { getBillingCycleText, getOffText } from './helper';
import type { Measure, VPNSignupModel } from './interface';
import type { TelemetryPayType } from './measure';
import PlanCustomizer from './planCustomizer/PlanCustomizer';
import { getVpnPlanToCheck, getVpnPlansToCheck } from './pricing';
import RatingsSection from './ratings/RatingsSection';
import { useIsMobileCheckout } from './useIsMobileCheckout';

const protonDomain = '@proton.me';
const vpnPricingURL = 'https://protonvpn.com/pricing';

const getBundleTitle = (a: string, b: string) => {
    return c('vpn_2step: info').t`Your ${a} and ${b} bundle`;
};

const getPlanTitle = (selected: string, trial?: boolean) => {
    if (trial) {
        // translator: full sentence is, for example, "Try Workspace Standard free for 14 days"
        const freeForNDays = (
            <span className="color-success" key="free-for-n-days">{c('b2b_trials_2025_Info')
                .t`free for ${TRIAL_DURATION_DAYS} days`}</span>
        );
        // translator: full sentence is, for example, "Try Workspace Standard free for 14 days"
        return c('b2b_trials_2025_Info').jt`Try ${selected} ${freeForNDays}`;
    }

    // translator: ${selected} is title of a subscription plan, for example can be "Workspace Standard",
    // translator: then the whole is "Your Workspace Standard plan"
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

const Step1 = ({
    activeBreakpoint,
    mode,
    options: selection,
    selectedPlan,
    linkPlanIDs,
    cycleData,
    isB2bPlan,
    showThreePlans,
    background,
    onComplete,
    model,
    sessionUID,
    upsellImg,
    measure,
    className,
    toAppName,
    telemetryContext,
    signupParameters,
}: {
    activeBreakpoint: Breakpoints;
    mode: 'signup' | 'pricing' | 'vpn-pass-promotion';
    /** The selection, with its prices */
    options: PaymentsContextOptimisticType['options'];
    selectedPlan: StrictPlan;
    /** The plan of the link, which a currency without the VPN+Pass promotion goes back to */
    linkPlanIDs: PlanIDs;
    cycleData: { cycles: Cycle[]; upsellCycle: Cycle };
    isB2bPlan: boolean;
    showThreePlans: boolean;
    background?: Background;
    upsellShortPlan: ReturnType<typeof getUpsellShortPlan> | undefined;
    onComplete: (
        data:
            | {
                  accountData: SignupCacheResult['accountData'];
                  subscriptionData: SignupCacheResult['subscriptionData'];
                  type: 'signup' | 'signup-token';
              }
            | {
                  subscriptionData: SignupCacheResult['subscriptionData'];
                  type: 'existing';
              }
    ) => void;
    model: VPNSignupModel;
    /** The reserved Bitcoin account's session: the checkout requests the deposit address with it */
    sessionUID: string | undefined;
    upsellImg: ComponentProps<typeof DollarOfferModal>['img'];
    measure: Measure;
    className?: string;
    toAppName: string;
    telemetryContext: PaymentTelemetryContext;
    signupParameters: ReturnType<typeof getSignupSearchParams>;
}) => {
    const {
        coupon: couponUrlParam,
        trial: signupTrial,
        hideFreePlan,
        email: defaultEmail,
        vpn2024SignupExperimentVariant,
    } = signupParameters;

    const [upsellModalProps, setUpsellModal, renderUpsellModal] = useModalState();
    const [checkTrialResult, setCheckTrialResult] = useState<CheckTrialPriceResult | undefined>();
    const [checkingTrial, withCheckingTrial] = useLoading();
    const silentApi = useSilentApi();
    const payments = usePaymentOptimistic();
    const [toggleUpsell, setToggleUpsell] = useState<{ from: CYCLE; to: CYCLE } | undefined>(undefined);
    const accountDetailsRef = useRef<AccountStepDetailsRef>(undefined);
    /** The code the user applied, which later selections keep */
    const [couponCode, setCouponCode] = useState<string>();
    const { viewportWidth } = activeBreakpoint;
    const { APP_NAME } = useConfig();

    const [isFormValid, setIsFormValid] = useState(false);

    const [loadingSignup, withLoadingSignup] = useLoading();
    const loadingPaymentDetails = payments.loadingPaymentDetails;

    const { plansMap } = payments;
    const isLoadingModelDeps = !payments.initializationStatus.pricingInitialized;
    const isLoading = loadingSignup || loadingPaymentDetails;
    const paymentStatus = payments.optimisticPaymentStatus;

    useEffect(() => {
        if (isLoadingModelDeps) {
            return;
        }

        metrics.core_vpn_single_signup_pageLoad_2_total.increment({
            step: 'plan_username_payment',
            flow: isB2bPlan ? 'b2b' : 'b2c',
        });
    }, [isLoadingModelDeps]);

    const hasBeenCountedRef = useRef<HasBeenCountedState>({
        plan: false,
        email: false,
        payment: false,
    });

    const options = { ...selection, plan: selectedPlan as Plan };

    /** What the user signs up with, for the current selection */
    const getSubscriptionData = (): SubscriptionData => ({
        currency: options.currency,
        cycle: options.cycle,
        planIDs: options.planIDs,
        checkResult: options.checkResult,
        billingAddress: options.billingAddress,
        vatNumber: options.vatNumber,
    });

    /** Selects a plan, cycle or currency with the code that applies to it */
    const select = (selection: Partial<Pick<PlanToCheck, 'planIDs' | 'cycle' | 'currency'>>) => {
        if (isLoadingModelDeps) {
            return;
        }
        payments.selectPlan(
            getVpnPlanToCheck({
                planIDs: selection.planIDs ?? options.planIDs,
                cycle: selection.cycle ?? options.cycle,
                currency: selection.currency ?? options.currency,
                coupon: couponCode || couponUrlParam,
                trial: signupTrial,
            })
        );
    };

    /** The prices of a plan and cycle that isn't selected, for the cycle selector and the upsells */
    const getCheckout = (planIDs: PlanIDs, cycle: Cycle) =>
        payments.getPriceOrFallback(
            getVpnPlanToCheck({ planIDs, cycle, currency: options.currency, coupon: couponUrlParam })
        );

    const plansToCheck = getVpnPlansToCheck({
        withProtonUnlimited: showThreePlans,
        planIDs: options.planIDs,
        cycles: cycleData.cycles,
        currency: options.currency,
        coupon: couponUrlParam,
        // Prices without a coupon come from the plans, and the signup's initialization checked the others already
    }).filter((planToCheck) => !!planToCheck.coupon && !payments.getPrice(planToCheck));

    useEffect(() => {
        if (isLoadingModelDeps || !plansToCheck.length) {
            return;
        }
        payments.checkMultiplePlans(plansToCheck).catch(noop);
    }, [
        isLoadingModelDeps,
        options.currency,
        getPlanNameFromIDs(options.planIDs),
        options.billingAddress.CountryCode,
        options.billingAddress.State,
    ]);

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

    // The account is created, its details can't change anymore
    const hasReservedUser = !!model.signupTokenMode || !!model.reservedUser;

    const handleCompletion = async (subscriptionData: SubscriptionData, type?: 'signup-token') => {
        // The account was already created to receive the Bitcoin payment, only the subscription is left
        if (model.signupTokenMode) {
            return onComplete({ subscriptionData, type: 'existing' });
        }

        const accountDataWithoutPassword = await accountDetailsRef.current?.data();
        if (!accountDataWithoutPassword) {
            throw new Error('Invalid data');
        }

        const accountData = {
            ...accountDataWithoutPassword,
            password: generatePassword({ useSpecialChars: true, length: 16 }),
        };

        return onComplete({ subscriptionData, accountData, type: type || 'signup' });
    };

    const onPay = async (payment: ExtendedTokenPayment, type: 'cc' | 'pp' | 'btc' | undefined) => {
        const subscriptionData: SubscriptionData = {
            ...getSubscriptionData(),
            payment,
            type,
        };
        return handleCompletion(subscriptionData);
    };

    // true iff trial detected through check result (thus the check prefix)
    const checkTrial = options.checkResult.SubscriptionMode === SubscriptionMode.Trial;
    const hasGuarantee =
        ([PLANS.VPN2024, PLANS.VPN_PASS_BUNDLE].includes(options.plan.Name as any) || isB2bPlan) && !checkTrial;

    const isMobileCheckout = useIsMobileCheckout({
        viewportWidth,
        isB2bPlan,
        signupTrial,
        checkTrial,
        planName: selectedPlan.Name,
    });

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

    const disablePayButton = loadingPaymentDetails;

    const validatePayment = () => {
        if (isLoading || disablePayButton) {
            return false;
        }
        return true;
    };

    const paypalFirstSort = usePaypalFirstSort();
    // The PayPal first experiment wins, otherwise the mobile checkout preselects the wallet of the device:
    // Apple Pay on iOS, Google Pay on Android
    const sortNewMethods = paypalFirstSort ?? (isMobileCheckout ? sortMethodsBasedOnDevice : undefined);
    const isBitcoinEnabled = useFlag('VpnBitcoinPaymentMethod');
    const paymentFacade = usePaymentFacade({
        sortNewMethods,
        checkResult: options.checkResult,
        amount: options.checkResult.AmountDue,
        currency: options.currency,
        api: sessionUID ? getUIDApi(sessionUID, silentApi) : silentApi,
        billingAddress: options.billingAddress,
        selectedPlanName: selectedPlan.Name as PLANS,
        paymentStatus: isBitcoinEnabled
            ? paymentStatus
            : {
                  ...paymentStatus,
                  VendorStates: { ...paymentStatus.VendorStates, Bitcoin: false },
              },
        onChargeable: (_, { chargeablePaymentParameters, sourceType, source, paymentProcessorType }) => {
            return withLoadingSignup(async () => {
                const isFreeSignup = chargeablePaymentParameters.Amount <= 0 && !checkTrial;

                const extendedParams: ExtendedTokenPayment = {
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

                let paymentType: 'cc' | 'pp' | 'btc';
                if (sourceType === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL) {
                    paymentType = 'pp';
                } else if (sourceType === PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN) {
                    paymentType = 'btc';
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

    const handleChangeCurrency = (currency: Currency) => {
        handleUpdate('plan');
        void measure({
            event: TelemetryAccountSignupEvents.currencySelect,
            dimensions: { currency: currency },
        });

        // The VPN+Pass promotion picked the bundle, but the new currency has no promotion
        const isPromotionBundle = mode === 'vpn-pass-promotion' && !!options.planIDs[PLANS.VPN_PASS_BUNDLE];
        const planIDs =
            isPromotionBundle && !getIsVPNPassPromotion(couponUrlParam, currency) ? linkPlanIDs : options.planIDs;
        select({ currency, planIDs });

        metrics.core_vpn_single_signup_step1_currencyChange_2_total.increment({
            status: 'success',
            flow: isB2bPlan ? 'b2b' : 'b2c',
        });
    };

    const handleChangePlanIds = (planIDs: PlanIDs, planName: PLANS) => {
        handleUpdate('plan');
        void measure({
            event: TelemetryAccountSignupEvents.planSelect,
            dimensions: { plan: planName },
        });

        select({ planIDs });
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

        select({ cycle, planIDs });

        metrics.core_vpn_single_signup_step1_cycleChange_2_total.increment({
            status: 'success',
            flow: isB2bPlan ? 'b2b' : 'b2c',
        });
    };

    const fetchTrialPrice = async () => {
        const resultPromise = checkTrialPriceCommon({
            paymentsApi: payments.paymentsApi,
            plansMap,
            currency: options.currency,
            planName: PLANS.VPN2024,
            cycle: CYCLE.MONTHLY,
            coupon: COUPON_CODES.VPN_PLUS_FREE_2024,
        });
        withCheckingTrial(resultPromise).catch(noop);
        const result = await resultPromise;
        setCheckTrialResult(result);
    };

    const handleSelectFree = async () => {
        void measure({
            event: TelemetryAccountSignupEvents.planSelect,
            dimensions: { plan: PLANS.FREE },
        });
        try {
            await fetchTrialPrice();
            setUpsellModal(true);
        } catch {
            // If the check call fails, fall back to free signup
            // rather than showing a broken offer.
            void handleChangePlanIds({}, PLANS.FREE);
        }
    };

    const billingAddressHook = useBillingAddress({
        // The form reports its initial address while the prices load: a check then would be of the context's
        // default plan, and would cancel the check of the selected one
        onBillingAddressChange: (billingAddress: FullBillingAddressFlat) => {
            if (!isLoadingModelDeps) {
                void payments.selectFullBillingAddress(billingAddress);
            }
        },
        initialBillingAddress: payments.billingAddress,
        initialVatNumber: signupParameters.vatNumber ?? '',
        paymentFacade,
        telemetryContext,
        selectedPlanName: selectedPlan?.Name,
        onVatChange: (vatNumber) => {
            if (!isLoadingModelDeps) {
                void payments.setVatNumber(vatNumber);
            }
        },
    });

    const checkoutMappingPlanIDs = ((): CycleMapping<PaymentsCheckoutUI> => {
        if (mode === 'vpn-pass-promotion') {
            const vpnPassBundlePlanIDs = { [PLANS.VPN_PASS_BUNDLE]: 1 };
            const vpnPlanIDs = { [PLANS.VPN2024]: 1 };
            return {
                [CYCLE.MONTHLY]: getCheckout(vpnPlanIDs, CYCLE.MONTHLY).checkoutUi,
                [CYCLE.YEARLY]: getCheckout(vpnPassBundlePlanIDs, CYCLE.YEARLY).checkoutUi,
                [CYCLE.TWO_YEARS]: getCheckout(vpnPlanIDs, CYCLE.TWO_YEARS).checkoutUi,
            };
        }
        // Want to show prices for VPN and VPNBIZ
        return Object.fromEntries(
            [
                CYCLE.MONTHLY,
                CYCLE.THREE,
                CYCLE.YEARLY,
                CYCLE.EIGHTEEN,
                CYCLE.TWO_YEARS,
                CYCLE.FIFTEEN,
                CYCLE.THIRTY,
            ].map((cycle) => [cycle, getCheckout(options.planIDs, cycle).checkoutUi])
        );
    })();

    const actualCheckout = payments.checkoutUi;

    const iconColorClassName = background === 'bf2025' ? 'color-norm' : 'color-primary';
    const features = [
        {
            id: 'open-source',
            left: <IcCode size={6} className={iconColorClassName} />,
            text: c('Info').t`Open source`,
        },
        {
            id: 'no-logs',
            left: <IcEyeSlash size={6} className={iconColorClassName} />,
            text: c('new_plans: feature').t`No-logs policy`,
        },
        {
            id: 'swiss',
            left: <img width="24" alt="" src={swissFlag} className="rounded-sm" />,
            text: viewportWidth['>=large'] ? c('Info').t`Protected by Swiss privacy laws` : c('Info').t`Swiss based`,
        },
        viewportWidth['>=large'] &&
            [PLANS.VPN2024, PLANS.VPN_PASS_BUNDLE, PLANS.BUNDLE].includes(selectedPlan.Name as any) && {
                id: 'servers',
                left: <IcServers size={6} className={iconColorClassName} />,
                text: isLoadingModelDeps ? (
                    <>
                        <SkeletonLoader width="5em" />
                    </>
                ) : (
                    getVpnServers(VPN_SERVERS.paid.servers)
                ),
            },
    ].filter(isTruthy);

    const appName = VPN_APP_NAME;

    const hasSelectedFree = selectedPlan.Name === PLANS.FREE;

    const padding = 'sm:p-11';

    const planInformation = getPlanInformation({
        loading: isLoadingModelDeps,
        selectedPlan: options.plan,
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

    const upsellToVPNPassBundle = mode === 'vpn-pass-promotion';

    const coupon = (() => {
        const { Coupon, CouponDiscount } = payments.checkResult;
        const { currency } = options;

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
        if (isLoading) {
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
            return select({
                planIDs: {
                    [PLANS.VPN_PASS_BUNDLE]: 1,
                },
                cycle: upsellToCycle,
            });
        } else {
            const previousCycle = toggleUpsell?.from;
            setToggleUpsell(undefined);
            return select({
                planIDs: {
                    [PLANS.VPN2024]: 1,
                },
                ...(previousCycle ? { cycle: previousCycle } : {}),
            });
        }
    };

    const isBlackFriday =
        getHas2025OfferCoupon(options.checkResult.Coupon?.Code) || getHas2025OfferCoupon(couponUrlParam);

    // const isCyberWeekPeriod = getIsCyberWeekPeriod();
    // const isBlackFridayPeriod = getIsBlackFridayPeriod();

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

                if (processor?.meta.type === 'bitcoin') {
                    return 'pay_btc';
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

                tracePaymentError(e, {
                    component: 'single-signup-v1-step1',
                    subscription: null,
                    extra: {
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
                        subscriptionDataType: model.subscriptionData?.type,
                    },
                });
            }
        }

        withLoadingSignup(run()).catch(noop);
    };

    const getUpsellToggle = () => {
        const hasVpnPassBundle = options.planIDs[PLANS.VPN_PASS_BUNDLE];
        // Hide toggle during vpn promo for vpnpass2023
        const hasUpsellVPNPassBundleToggle = upsellToVPNPassBundle;

        if (hasUpsellVPNPassBundleToggle) {
            const hasPlanSelected = !!hasVpnPassBundle && options.cycle === CYCLE.YEARLY;
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
        // Only a cycle the plan has a price for
        if (!toCycle || !cycleData.cycles.includes(toCycle)) {
            return null;
        }
        if (isLoadingModelDeps) {
            return (
                <div className="p-2 flex gap-1 items-center">
                    <Toggle checked={false} id="toggle-upsell-plan" className="mx-1" />
                    <label htmlFor="toggle-upsell-plan" className="flex-1 text-sm">
                        <SkeletonLoader width="100%" height="2em" index={0} />
                    </label>
                </div>
            );
        }
        const toCycleCheckout = getCheckout(options.planIDs, toCycle).checkoutUi;
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
                        if (isLoading) {
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

    const currencySelector = isLoadingModelDeps ? null : (
        <CurrencySelector
            currencies={payments.getAvailableCurrencies(selectedPlan.Name as PLANS)}
            mode="select-two"
            currency={options.currency}
            loading={loadingPaymentDetails}
            onSelect={(currency) => handleChangeCurrency(currency)}
        />
    );

    const planSelectionTitle = (() => {
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

        if (showThreePlans) {
            return c('pass_signup_2023: Header').t`Select your plan`;
        }
        return c('Header').t`Select your pricing plan`;
    })();

    const loadingPaymentsForm = isLoadingModelDeps;

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
            disabled={isLoadingModelDeps}
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

    const checkSelectionWithCoupon = (coupon: string | undefined) =>
        payments.selectNewPlan({
            planIDs: options.planIDs,
            currency: options.currency,
            cycle: options.cycle,
            coupon,
            trial: signupTrial,
        });

    const summaryPlanInformation =
        mode === 'vpn-pass-promotion' && plansMap[PLANS.VPN2024]
            ? getPlanInformation({
                  selectedPlan: plansMap[PLANS.VPN2024],
                  loading: isLoadingModelDeps,
              }) || planInformation
            : planInformation;

    const paymentSummary = (
        <PaymentSummary
            plansMap={plansMap}
            initialLoading={isLoadingModelDeps}
            couponConfig={payments.couponConfig}
            options={options}
            loadingPaymentDetails={disablePayButton}
            upsellToggle={getUpsellToggle()}
            planInformation={summaryPlanInformation}
            giftCode={
                <GiftCodeSummary
                    coupon={coupon}
                    couponConfig={payments.couponConfig}
                    onApplyCode={async (code) => {
                        const checkResult = await checkSelectionWithCoupon(code);
                        setCouponCode(code);

                        if (!checkResult.Coupon) {
                            throw new Error(c('Notification').t`Invalid code`);
                        }
                    }}
                    onRemoveCode={async () => {
                        await checkSelectionWithCoupon(undefined);
                        setCouponCode(undefined);
                    }}
                />
            }
        />
    );

    const isVpnPassBundleBusinessPlan = selectedPlan.Name === PLANS.VPN_PASS_BUNDLE_BUSINESS;

    const { displayPassAsFakeAddon, isVPNPassBundle: isVpnPassBundle } = useVpn2024SignupExperiment(
        vpn2024SignupExperimentVariant,
        options.planIDs
    );

    // Avoid collision with another offer targeting VPN_PASS_BUNDLE using specific coupons
    const canDisplayVpnPassBundle = displayPassAsFakeAddon && mode !== 'vpn-pass-promotion';

    const checkoutHeaderText = isVpnPassBundleBusinessPlan
        ? c('Header').t`Checkout`
        : c('Header').t`Select your payment method:`;

    // Adding Proton Pass on top of VPN Plus: the VPN+Pass bundle's price per month minus VPN Plus's
    const bundlePlanPrice =
        getCheckout({ [PLANS.VPN_PASS_BUNDLE]: 1 }, options.cycle).checkoutUi.withDiscountPerMonth -
        getCheckout({ [PLANS.VPN2024]: 1 }, options.cycle).checkoutUi.withDiscountPerMonth;

    const bundlePlanPriceInline: ReactElement = (
        <Price
            key={`${PLANS.VPN_PASS_BUNDLE}-1`}
            currency={options.currency}
            suffix={c('Suffix for price').t`per month`}
        >
            {bundlePlanPrice}
        </Price>
    );

    return (
        <Layout
            hasDecoration
            className={clsx(className, isMobileCheckout && 'signup-v1-mobile-checkout')}
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
                        {features.map(({ id, left, text }, i, arr) => {
                            return (
                                <Fragment key={id}>
                                    <FeatureItem left={left} text={text} />
                                    {i !== arr.length - 1 && (
                                        <Vr className="min-h-custom" style={{ '--min-h-custom': '2.25rem' }} />
                                    )}
                                </Fragment>
                            );
                        })}
                    </div>
                )}
                {showCycleAndSelectors && showThreePlans && (
                    <Box className={`mt-8 w-full ${padding}`}>
                        <ThreePlansSelector
                            title={planSelectionTitle}
                            currencySelector={currencySelector}
                            footer={
                                <div className="flex justify-center mt-10 text-sm">
                                    <Guarantee />
                                </div>
                            }
                            plansMap={plansMap}
                            getCheckout={(planIDs, cycle) => getCheckout(planIDs, cycle).checkoutUi}
                            selectedPlanName={options.plan.Name}
                            cycle={options.cycle}
                            cycles={cycleData.cycles}
                            currency={options.currency}
                            loading={isLoadingModelDeps}
                            disabled={isLoadingModelDeps || checkingTrial}
                            hideFreePlan={!!hideFreePlan}
                            onChangeCycle={(cycle) => {
                                handleUpdate('plan');
                                setToggleUpsell(undefined);
                                handleChangeCycle({ cycle });
                            }}
                            onSelectPlan={(planName) => {
                                setToggleUpsell(undefined);
                                if (options.plan.Name !== planName) {
                                    void handleChangePlanIds({ [planName]: 1 }, planName);
                                }
                                accountDetailsRef.current?.scrollInto('email');
                            }}
                            onSelectFree={handleSelectFree}
                        />
                    </Box>
                )}
                {showCycleAndSelectors && !showThreePlans && (
                    <Box className={`mt-8 w-full ${padding}`}>
                        <BoxHeader title={planSelectionTitle} right={currencySelector} />
                        <BoxContent>
                            <div className="flex justify-space-between gap-4 flex-column lg:flex-row">
                                <CycleSelector
                                    mode={mode}
                                    loading={isLoadingModelDeps}
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
                                            disabled={checkingTrial}
                                            onClick={handleSelectFree}
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
                                    <AccountStepDetails
                                        passwordFields={false}
                                        model={{ subscriptionData: options }}
                                        measure={measure}
                                        accountStepDetailsRef={accountDetailsRef}
                                        disableChange={loadingSignup || hasReservedUser}
                                        hideEmailLabel={!isVpnPassBundleBusinessPlan}
                                        onSubmit={
                                            hasSelectedFree
                                                ? () => {
                                                      withLoadingSignup(
                                                          handleCompletion(
                                                              getFreeSubscriptionData(getSubscriptionData())
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
                                                    {isVpnPassBundleBusinessPlan && !(signupTrial || checkTrial) && (
                                                        <span>
                                                            {
                                                                // translator: Full sentence "Already have an account? Sign in"
                                                                c('Go to sign in')
                                                                    .jt`Already have an account? ${signIn}`
                                                            }
                                                        </span>
                                                    )}
                                                    {!isB2bPlan && (
                                                        <>
                                                            <span className="mt-4 color-weak text-sm">
                                                                {
                                                                    // translator: Full sentance "Use an existing email or create a free @proton.me address."
                                                                    c('Info')
                                                                        .t`Use an existing email or create a free ${protonDomain} address.`
                                                                }
                                                                <br />
                                                                {c('Info')
                                                                    .t`Your information is safe with us. We'll only contact you when it's required to provide our services.`}
                                                            </span>
                                                        </>
                                                    )}
                                                </>
                                            );
                                        }}
                                        // Submits by itself only before the account exists: a failing setup would loop
                                        defaultEmail={hasReservedUser ? undefined : defaultEmail}
                                        currentPlan={selectedPlan}
                                    />
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
                {canDisplayVpnPassBundle && (
                    <VpnPassBundleUpsell
                        padding={padding}
                        isVpnPassBundle={isVpnPassBundle}
                        bundlePlanPriceInline={bundlePlanPriceInline}
                        isLoadingModelDeps={isLoadingModelDeps}
                        onToggle={(isVpnPassBundle) => {
                            if (!isVpnPassBundle) {
                                reportVpn2024SignupAddPass();
                            }
                            select({
                                planIDs: { [isVpnPassBundle ? PLANS.VPN2024 : PLANS.VPN_PASS_BUNDLE]: 1 },
                            });
                        }}
                    />
                )}
                {!hasSelectedFree && (
                    <Box className={`mt-8 w-full ${padding}`}>
                        <BoxHeader
                            title={viewportWidth['>=large'] && !checkTrial ? checkoutHeaderText : ''}
                            right={!showCycleAndSelectors ? currencySelector : null}
                        />
                        {viewportWidth['<=medium'] ? (
                            <>
                                {/* The mobile checkout shows the summary in its bottom bar */}
                                {!isMobileCheckout && (
                                    <BoxContent>
                                        <div className="flex-1 border rounded-xl border-weak px-3 py-4">
                                            {paymentSummary}
                                        </div>
                                    </BoxContent>
                                )}

                                <h2 className={clsx('text-bold text-4xl', !isMobileCheckout && 'mt-8')}>
                                    {checkoutHeaderText}
                                </h2>
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
                                                    plansMap={plansMap}
                                                    planIDs={options.planIDs}
                                                    currentPlan={selectedPlan}
                                                    onChangePlanIDs={(planIDs: PlanIDs) => select({ planIDs })}
                                                    isTrialMode={checkTrial}
                                                />
                                                <div className="border-bottom border-weak my-6" />
                                            </>
                                        )}
                                        <PaymentWrapper
                                            {...paymentFacade}
                                            // Remount once the account exists so the Bitcoin method is re-selected
                                            // and the deposit address can be requested
                                            key={sessionUID || 'unauthenticated'}
                                            defaultMethod={
                                                sessionUID ? PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN : undefined
                                            }
                                            isAuthenticated={!!sessionUID}
                                            loadingBitcoin={loadingPaymentDetails}
                                            hideFirstLabel
                                            noMaxWidth
                                            showCardIcons
                                            taxCountry={billingAddressHook.taxCountry}
                                            vatNumber={billingAddressHook.vatNumber}
                                            startTrial={checkTrial}
                                        />
                                        {(() => {
                                            if (!actualCheckout.discountPercent || checkTrial || signupTrial) {
                                                return;
                                            }

                                            const sharedClasses = 'mb-2';
                                            if (isLoadingModelDeps) {
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

                                            const isBitcoin =
                                                paymentFacade.selectedMethodType ===
                                                PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN;

                                            // The subscription is created when the BTC transaction is confirmed,
                                            // there is nothing to submit after the deposit address is displayed
                                            if (isBitcoin && sessionUID) {
                                                return;
                                            }

                                            const showMobilePlanBar = isMobileCheckout && !!summaryPlanInformation;

                                            const getPayButtonSuffix = (
                                                type: PlainPaymentMethodType | undefined,
                                                withGuarantee: boolean
                                            ) => (
                                                <PayButtonSuffix
                                                    paymentMethodType={type}
                                                    hasGuarantee={withGuarantee}
                                                    hasSelectedFree={hasSelectedFree}
                                                    checkTrial={checkTrial}
                                                    checkResult={options.checkResult}
                                                    plansMap={plansMap}
                                                    planIDs={options.planIDs}
                                                />
                                            );

                                            const payButton = isBitcoin ? (
                                                <Button
                                                    size="large"
                                                    color="norm"
                                                    fullWidth
                                                    loading={loadingSignup}
                                                    disabled={disablePayButton || !isFormValid}
                                                    onClick={() => {
                                                        const run = async () => {
                                                            const isFormValid =
                                                                validatePayment() &&
                                                                (await accountDetailsRef.current?.validate());
                                                            if (!isFormValid) {
                                                                return;
                                                            }
                                                            measurePaySubmit('pay_btc');
                                                            await handleCompletion(
                                                                getSubscriptionData(),
                                                                'signup-token'
                                                            ).catch(() => {
                                                                measurePayError('pay_btc');
                                                            });
                                                        };
                                                        withLoadingSignup(run()).catch(noop);
                                                    }}
                                                    data-testid="continue-with-bitcoin"
                                                >
                                                    {c('Action').t`Continue with Bitcoin`}
                                                </Button>
                                            ) : (
                                                <PayButton
                                                    size="large"
                                                    color="norm"
                                                    fullWidth
                                                    taxCountry={billingAddressHook.taxCountry}
                                                    vatNumber={billingAddressHook.vatNumber}
                                                    paymentFacade={paymentFacade}
                                                    loading={loadingSignup}
                                                    disabled={disablePayButton}
                                                    suffix={
                                                        showMobilePlanBar
                                                            ? hasGuarantee && (
                                                                  <div className="text-center text-sm color-success mt-2">
                                                                      <Guarantee />
                                                                  </div>
                                                              )
                                                            : (type) => getPayButtonSuffix(type, hasGuarantee)
                                                    }
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

                                            if (!showMobilePlanBar) {
                                                return payButton;
                                            }

                                            // The bar only keeps the button and the guarantee, the rest of the
                                            // suffix (renewal notice, 3DS, terms) stays in the page
                                            return (
                                                <>
                                                    {!isBitcoin &&
                                                        getPayButtonSuffix(paymentFacade.selectedMethodType, false)}
                                                    <MobilePlanBar
                                                        planInformation={summaryPlanInformation}
                                                        currency={options.currency}
                                                        checkout={actualCheckout}
                                                        loading={disablePayButton || isLoadingModelDeps}
                                                        upsellToggle={getUpsellToggle()}
                                                        changePlanHref={vpnPricingURL}
                                                    >
                                                        {payButton}
                                                    </MobilePlanBar>
                                                </>
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
            {renderUpsellModal && checkTrialResult && (
                <DollarOfferModal
                    checkTrialResult={checkTrialResult}
                    priceWithoutDiscountPerMonth={checkoutMappingPlanIDs?.[options.cycle]?.withoutDiscountPerMonth}
                    img={upsellImg}
                    measure={measure}
                    onGetDeal={() => {
                        const params = new URLSearchParams({
                            plan: PLANS.VPN2024,
                            cycle: `${CYCLE.MONTHLY}`,
                            currency: options.currency,
                            coupon: COUPON_CODES.VPN_PLUS_FREE_2024,
                        });
                        const signupBasePath = APP_NAME === APPS.PROTONVPN_SETTINGS ? '/signup' : '/vpn/signup';
                        window.location.href = `${signupBasePath}?${params.toString()}`;
                    }}
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

export default Step1;
