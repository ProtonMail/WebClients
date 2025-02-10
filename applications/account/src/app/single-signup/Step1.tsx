import type { Dispatch, ReactElement, ReactNode, SetStateAction } from 'react';
import { Fragment, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { c, msgid } from 'ttag';

import { Button, Href, InlineLinkButton, Vr } from '@proton/atoms';
import {
    Alert3ds,
    type Breakpoints,
    CurrencySelector,
    Icon,
    PayPalButton,
    Price,
    SkeletonLoader,
    StyledPayPalButton,
    Toggle,
    getCheckoutRenewNoticeText,
    isBlackFridayPeriod as getIsBlackFridayPeriod,
    isCyberWeekPeriod as getIsCyberWeekPeriod,
    useApi,
    useModalState,
} from '@proton/components';
import PaymentWrapper from '@proton/components/containers/payments/PaymentWrapper';
import {
    getCountries,
    getNetShield,
    getProtectDevices,
    getStreaming,
} from '@proton/components/containers/payments/features/vpn';
import { ChargebeePaypalWrapper } from '@proton/components/payments/chargebee/ChargebeeWrapper';
import { usePaymentFacade } from '@proton/components/payments/client-extensions';
import { useChargebeeContext } from '@proton/components/payments/client-extensions/useChargebeeContext';
import { useCurrencies } from '@proton/components/payments/client-extensions/useCurrencies';
import type { PaymentProcessorHook } from '@proton/components/payments/react-extensions/interface';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import { useLoading } from '@proton/hooks';
import metrics, { observeApiError } from '@proton/metrics';
import type { WebCoreVpnSingleSignupStep1InteractionTotal } from '@proton/metrics/types/web_core_vpn_single_signup_step1_interaction_total_v1.schema';
import type { BillingAddress, ExtendedTokenPayment, TokenPayment } from '@proton/payments';
import {
    CYCLE,
    type Currency,
    DEFAULT_CYCLE,
    PAYMENT_METHOD_TYPES,
    PLANS,
    type PlanIDs,
    getBillingAddressStatus,
    isV5PaymentToken,
    v5PaymentTokenToLegacyPaymentToken,
} from '@proton/payments';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getPaymentsVersion } from '@proton/shared/lib/api/payments';
import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import {
    APPS,
    PASS_SHORT_APP_NAME,
    VPN_APP_NAME,
    VPN_CONNECTIONS,
    VPN_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';
import type { RequiredCheckResponse, SubscriptionCheckoutData } from '@proton/shared/lib/helpers/checkout';
import { getCheckout, getOptimisticCheckResult } from '@proton/shared/lib/helpers/checkout';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { getPlanFromPlanIDs } from '@proton/shared/lib/helpers/planIDs';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { getHas2024OfferCoupon, getHasValentinesCoupon, getIsVpnPlan } from '@proton/shared/lib/helpers/subscription';
import { stringifySearchParams } from '@proton/shared/lib/helpers/url';
import type { Cycle, CycleMapping, Plan, StrictPlan } from '@proton/shared/lib/interfaces';
import { getSentryError } from '@proton/shared/lib/keys';
import { generatePassword } from '@proton/shared/lib/password';
import { getPlusServers, getVpnServers } from '@proton/shared/lib/vpn/features';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { getLocaleTermsURL } from '../content/helper';
import SignupSupportDropdown from '../signup/SignupSupportDropdown';
import { getSubscriptionPrices } from '../signup/helper';
import type { SignupCacheResult, SubscriptionData } from '../signup/interfaces';
import { SignupType } from '../signup/interfaces';
import type { AccountStepDetailsRef } from '../single-signup-v2/AccountStepDetails';
import AccountStepDetails from '../single-signup-v2/AccountStepDetails';
import DiscountBanner from '../single-signup-v2/DiscountBanner';
import { getFreeSubscriptionData, getSubscriptionMapping } from '../single-signup-v2/helper';
import type { OptimisticOptions } from '../single-signup-v2/interface';
import { getPaymentMethod } from '../single-signup-v2/measure';
import { useFlowRef } from '../useFlowRef';
import Box from './Box';
import CycleSelector from './CycleSelector';
import GiftCodeSummary from './GiftCodeSummary';
import Guarantee from './Guarantee';
import type { Background } from './Layout';
import Layout from './Layout';
import PaymentSummary from './PaymentSummary';
import RightPlanSummary from './RightPlanSummary';
import StepLabel from './StepLabel';
import UpsellModal from './UpsellModal';
import VPNPassUpsellToggle from './VPNPassUpsellButton';
import swissFlag from './flag.svg';
import { getPlanInformation } from './getPlanInformation';
import type { getUpsellShortPlan } from './helper';
import { getBillingCycleText, getOffText } from './helper';
import type { Measure, VPNSignupModel } from './interface';
import type { TelemetryPayType } from './measure';
import PlanCustomizer from './planCustomizer/PlanCustomizer';

const getYears = (n: number) => c('vpn_2step: info').ngettext(msgid`${n} year`, `${n} years`, n);
const getMonths = (n: number) => c('vpn_2step: info').ngettext(msgid`${n} month`, `${n} months`, n);
export const getBilledText = (cycle: CYCLE): string | null => {
    switch (cycle) {
        case CYCLE.MONTHLY:
            return c('vpn_2step: billing').t`Billed monthly`;
        case CYCLE.YEARLY:
            return getYears(1);
        case CYCLE.TWO_YEARS:
            return getYears(2);
        case CYCLE.FIFTEEN:
            return getMonths(15);
        case CYCLE.THIRTY:
            return getMonths(30);
        default:
            return null;
    }
};

const getBundleTitle = (a: string, b: string) => {
    return c('vpn_2step: info').t`Your ${a} and ${b} bundle`;
};
const getPlanTitle = (selected: string) => {
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

const BoxHeader = ({ step, title, right }: { step?: number; title: string; right?: ReactNode }) => {
    return (
        <div className="flex items-center justify-space-between flex-nowrap">
            <div className="flex md:items-center flex-column md:flex-row md:gap-4 gap-2">
                {step !== undefined && (
                    <div className="shrink-0">
                        <StepLabel step={step} />
                    </div>
                )}
                <h2 className="text-bold text-4xl md:flex-1">{title}</h2>
            </div>
            {right && <div className="shrink-0">{right}</div>}
        </div>
    );
};

const BoxContent = ({ children }: { children: ReactNode }) => {
    return <div className="pricing-box-content mt-8">{children}</div>;
};

type StepId = WebCoreVpnSingleSignupStep1InteractionTotal['Labels']['step'];
type HasBeenCountedState = {
    [key in StepId]: boolean;
};

const Step1 = ({
    activeBreakpoint,
    defaultEmail,
    mode,
    selectedPlan,
    cycleData,
    isVpn2024Deal,
    isB2bPlan,
    background,
    onComplete,
    onCurrencyChange,
    model,
    setModel,
    upsellShortPlan,
    hideFreePlan,
    upsellImg,
    measure,
    className,
    currencyUrlParam,
}: {
    activeBreakpoint: Breakpoints;
    defaultEmail?: string;
    mode: 'signup' | 'pricing' | 'vpn-pass-promotion';
    selectedPlan: StrictPlan;
    cycleData: { cycles: Cycle[]; upsellCycle: Cycle };
    isVpn2024Deal: boolean;
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
}) => {
    const [upsellModalProps, setUpsellModal, renderUpsellModal] = useModalState();
    const normalApi = useApi();
    const silentApi = getSilentApi(normalApi);
    const { getPaymentsApi } = usePaymentsApi();
    const [toggleUpsell, setToggleUpsell] = useState<{ from: CYCLE; to: CYCLE } | undefined>(undefined);
    const accountDetailsRef = useRef<AccountStepDetailsRef>();
    const [couponCode, setCouponCode] = useState(model.subscriptionData.checkResult.Coupon?.Code);
    const { viewportWidth } = activeBreakpoint;

    const createFlow = useFlowRef();

    const [loadingSignup, withLoadingSignup] = useLoading();
    const [loadingPaymentDetails, withLoadingPaymentDetails] = useLoading();
    const [changingCurrency, withChangingCurrency] = useLoading();
    const { getAvailableCurrencies } = useCurrencies();

    const disablePayButton = Object.keys(model.optimistic).length > 0 || loadingPaymentDetails;

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
        const optimisticCheckResultWithoutTaxes: RequiredCheckResponse = {
            ...optimisticCheckResult,
            Taxes: [],
        };

        const newOptimistic = {
            ...optimistic,
            checkResult: optimisticCheckResultWithoutTaxes,
        };

        try {
            const validateFlow = createFlow();

            setOptimisticDiff(newOptimistic);

            const coupon =
                couponCode || subscriptionMapping?.checkResult.Coupon?.Code || options.checkResult.Coupon?.Code;

            const checkResult = await getSubscriptionPrices(
                getPaymentsApi(silentApi),
                newPlanIDs,
                newCurrency,
                newCycle,
                newBillingAddress,
                coupon
            );

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
                },
                optimistic: {},
            }));
        } catch (e) {
            // Reset any optimistic state on failures
            setModel((old) => ({
                ...old,
                optimistic: {},
            }));
        }
    };

    const handleChangePlanIds = async (planIDs: PlanIDs, planName: PLANS) => {
        handleUpdate('plan');
        void measure({
            event: TelemetryAccountSignupEvents.planSelect,
            dimensions: { plan: planName },
        });
        void handleOptimistic({ planIDs });
    };

    const handleChangeCurrency = (currency: Currency) => {
        handleUpdate('plan');
        void measure({
            event: TelemetryAccountSignupEvents.currencySelect,
            dimensions: { currency: currency },
        });

        withChangingCurrency(
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

    const handleChangeBillingAddress = (billingAddress: BillingAddress) => {
        void handleOptimistic({ billingAddress });
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

    const hasGuarantee =
        [PLANS.VPN, PLANS.VPN2024, PLANS.VPN_PASS_BUNDLE].includes(options.plan.Name as any) || isB2bPlan;

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

    const validatePayment = () => {
        if (loadingSignup || loadingPaymentDetails || disablePayButton) {
            return false;
        }
        return true;
    };

    const chargebeeContext = useChargebeeContext();

    const paymentFacade = usePaymentFacade({
        checkResult: options.checkResult,
        amount: options.checkResult.AmountDue,
        currency: options.currency,
        api: silentApi,
        selectedPlanName: getPlanFromPlanIDs(model.plansMap, options.planIDs)?.Name,
        paymentMethodStatusExtended: model.paymentMethodStatusExtended,
        onChargeable: (_, { chargeablePaymentParameters, sourceType, paymentsVersion, paymentProcessorType }) => {
            return withLoadingSignup(async () => {
                const isFreeSignup = chargeablePaymentParameters.Amount <= 0;

                const extendedParams: ExtendedTokenPayment = {
                    paymentsVersion,
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
                if (sourceType === PAYMENT_METHOD_TYPES.PAYPAL || sourceType === PAYMENT_METHOD_TYPES.PAYPAL_CREDIT) {
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
    });

    const price = (
        <Price key="price" currency={options.currency}>
            {options.checkResult.AmountDue}
        </Price>
    );

    const upsellPlanName = upsellShortPlan?.title || '';

    const termsHref = (() => {
        return getLocaleTermsURL(APPS.PROTONVPN_SETTINGS);
    })();
    const termsAndConditions = (
        <Href key="terms" href={termsHref}>
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

    const checkoutMappingPlanIDs = ((): CycleMapping<SubscriptionCheckoutData> | undefined => {
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

    const iconColorClassName = background === 'bf2023' ? 'color-norm' : 'color-primary';
    const features = [
        {
            left: <Icon size={6} className={iconColorClassName} name="code" />,
            text: c('Info').t`Open source`,
        },
        {
            left: <Icon size={6} className={iconColorClassName} name="eye-slash" />,
            text: c('new_plans: feature').t`No-logs policy`,
        },
        {
            left: <img width="24" alt="" src={swissFlag} className="rounded-sm" />,
            text: viewportWidth['>=large'] ? c('Info').t`Protected by Swiss privacy laws` : c('Info').t`Swiss based`,
        },
        viewportWidth['>=large'] &&
            [PLANS.VPN, PLANS.VPN2024, PLANS.VPN_PASS_BUNDLE, PLANS.BUNDLE].includes(selectedPlan.Name as any) && {
                left: <Icon size={6} className={iconColorClassName} name="servers" />,
                text: model.loadingDependencies ? (
                    <>
                        <SkeletonLoader width="5em" />
                    </>
                ) : (
                    getVpnServers(vpnServersCountData.paid.servers)
                ),
            },
    ].filter(isTruthy);

    const freeName = `${VPN_SHORT_APP_NAME} Free`;
    const appName = VPN_APP_NAME;

    const hasSelectedFree = selectedPlan.Name === PLANS.FREE;

    const showStepLabel = !isB2bPlan;
    let step = 1;
    const padding = 'sm:p-11';

    const planInformation = getPlanInformation({
        loading: model.loadingDependencies,
        selectedPlan: options.plan,
        vpnServersCountData,
        mode,
    });

    const upsellToCycle = (() => {
        if (options.plan.Name === PLANS.BUNDLE && getHas2024OfferCoupon(options.checkResult.Coupon?.Code)) {
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
        if (![PLANS.VPN, PLANS.VPN_PASS_BUNDLE, PLANS.VPN2024].some((plan) => options.planIDs[plan])) {
            withLoadingPaymentDetails(
                handleOptimistic({
                    planIDs: {
                        [PLANS.VPN2024]: 1,
                    },
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
                    planIDs: { [PLANS.VPN_PASS_BUNDLE]: 1 },
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

    const vpnSubscriptionMapping = getSubscriptionMapping({
        subscriptionDataCycleMapping: model.subscriptionDataCycleMapping,
        planName: PLANS.VPN2024,
        planIDs: { [PLANS.VPN2024]: 1 },
    });

    const isBlackFriday =
        getHas2024OfferCoupon(vpnSubscriptionMapping?.[CYCLE.FIFTEEN]?.checkResult.Coupon?.Code) ||
        getHas2024OfferCoupon(options.checkResult.Coupon?.Code);

    const isCyberWeekPeriod = getIsCyberWeekPeriod();
    const isBlackFridayPeriod = getIsBlackFridayPeriod();

    const showRenewalNotice = !hasSelectedFree;
    const renewalNotice = showRenewalNotice && (
        <div className="w-full text-sm color-norm opacity-70 text-center">
            <div className="mx-auto w-full md:w-7/10">
                *
                {getCheckoutRenewNoticeText({
                    coupon: options.checkResult.Coupon,
                    cycle: options.cycle,
                    plansMap: model.plansMap,
                    planIDs: options.planIDs,
                    checkout: actualCheckout,
                    currency: options.currency,
                })}
            </div>
        </div>
    );

    const process = (processor: PaymentProcessorHook | undefined) => {
        const isFormValid = validatePayment() && accountDetailsRef.current?.validate();
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

            if (processor?.meta.type === 'paypal-credit') {
                return 'pay_pp_no_cc';
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
                        chargebeeEnabled: chargebeeContext.enableChargebeeRef.current,
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
                        handleUpsellVPNPassBundle();
                    }}
                />
            );
        }

        if (getHasValentinesCoupon(options.checkResult.Coupon?.Code)) {
            return null;
        }

        if (getHas2024OfferCoupon(options.checkResult.Coupon?.Code) && options.cycle === CYCLE.MONTHLY) {
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

    const hasSomeVpnPlan = getIsVpnPlan(options.plan.Name);

    const showCycleAndSelectors =
        !hasSelectedFree && (mode === 'pricing' || mode === 'vpn-pass-promotion') && checkoutMappingPlanIDs;

    const currencySelector = model.loadingDependencies ? null : (
        <CurrencySelector
            currencies={getAvailableCurrencies({
                status: model.paymentMethodStatusExtended,
                plans: model.plans,
                selectedPlanName: selectedPlan.Name,
                paramCurrency: currencyUrlParam,
            })}
            mode="select-two"
            currency={options.currency}
            loading={changingCurrency}
            onSelect={(currency) => handleChangeCurrency(currency)}
        />
    );

    const renderingPaymentsWrapper = model.loadingDependencies || Boolean(options.checkResult.AmountDue);
    const loadingPaymentsForm = model.loadingDependencies;

    return (
        <Layout
            hasDecoration
            footer={renewalNotice}
            className={className}
            bottomRight={
                <SignupSupportDropdown
                    isDarkBg={['dark', 'bf2023'].includes(background as any) && !viewportWidth.xsmall}
                />
            }
            background={background}
            isB2bPlan={isB2bPlan}
        >
            <div className="flex items-center flex-column">
                <div className="signup-v1-header mb-4 mt-4 md:mt-0 text-center">
                    <h1 className="m-0 large-font lg:px-4 text-semibold">
                        {(() => {
                            if (mode === 'vpn-pass-promotion' || isVpn2024Deal) {
                                return c('Header').t`Save big on the best ${VPN_APP_NAME} deals`;
                            }

                            if (isB2bPlan) {
                                return c('new_plans: feature').t`Start protecting your organization`;
                            }

                            if (isBlackFriday) {
                                if (isBlackFridayPeriod) {
                                    return c('bf2023: header')
                                        .t`Save with Black Friday deals on a high-speed Swiss VPN`;
                                }
                                if (isCyberWeekPeriod) {
                                    return c('bf2023: header').t`Save with Cyber Week deals on a high-speed Swiss VPN`;
                                }
                                return c('bf2023: header').t`Save with End of Year deals on a high-speed Swiss VPN`;
                            }

                            if (mode === 'pricing') {
                                return c('new_plans: feature').t`High-speed Swiss VPN that protects your privacy`;
                            }

                            return c('new_plans: feature').t`Start protecting yourself online in 2 easy steps`;
                        })()}
                    </h1>
                </div>
                {(() => {
                    if (!getHasValentinesCoupon(options.checkResult.Coupon?.Code)) {
                        return null;
                    }

                    return (
                        <DiscountBanner
                            discountPercent={actualCheckout.discountPercent}
                            selectedPlanTitle={selectedPlan.Title}
                        />
                    );
                })()}
                {(mode === 'pricing' || mode === 'vpn-pass-promotion') && !isB2bPlan && (
                    <div
                        className={clsx(
                            'flex flex-nowrap md:gap-8 gap-3',
                            background === 'bf2023' ? 'color-norm' : 'color-weak'
                        )}
                    >
                        {features.map(({ left, text }, i, arr) => {
                            return (
                                <Fragment key={typeof text === 'string' ? text : i}>
                                    <FeatureItem left={left} text={text} />
                                    {i !== arr.length - 1 && (
                                        <Vr className="h-custom" style={{ '--h-custom': '2.25rem' }} />
                                    )}
                                </Fragment>
                            );
                        })}
                    </div>
                )}
                {showCycleAndSelectors && (
                    <Box className={`mt-8 w-full ${padding}`}>
                        <BoxHeader
                            step={showStepLabel ? step++ : undefined}
                            title={(() => {
                                if (isVpn2024Deal || upsellToVPNPassBundle) {
                                    return c('Header').t`Select your deal`;
                                }

                                if (isBlackFriday) {
                                    if (isBlackFridayPeriod) {
                                        return c('bf2023: header').t`Select your Black Friday offer`;
                                    }
                                    if (isCyberWeekPeriod) {
                                        return c('bf2023: header').t`Select your Cyber Week offer`;
                                    }
                                    return c('bf2023: header').t`Select your End of Year offer`;
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
                                step={showStepLabel ? step++ : undefined}
                                title={c('Header').t`Create your account`}
                            />
                            <BoxContent>
                                <div className="relative">
                                    <AccountStepDetails
                                        domains={model.domains}
                                        signupTypes={[SignupType.Email]}
                                        defaultEmail={defaultEmail}
                                        passwordFields={false}
                                        model={model}
                                        measure={measure}
                                        api={silentApi}
                                        accountStepDetailsRef={accountDetailsRef}
                                        disableChange={loadingSignup}
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
                                        footer={(details) => {
                                            const signInTo = {
                                                pathname: `/dashboard${stringifySearchParams(
                                                    {
                                                        plan: options.plan.Name,
                                                        cycle: `${options.cycle}`,
                                                        currency: options.currency,
                                                        coupon: options.checkResult.Coupon?.Code,
                                                        type: 'offer',
                                                        ref: 'signup',
                                                    },
                                                    '?'
                                                )}`,
                                                state: {
                                                    username: details.email,
                                                },
                                            } as const;
                                            const signIn = (
                                                <Link
                                                    key="signin"
                                                    className="link link-focus text-nowrap"
                                                    to={signInTo}
                                                    onClick={() =>
                                                        measure({
                                                            event: TelemetryAccountSignupEvents.userSignIn,
                                                            dimensions: {
                                                                location: 'step2',
                                                            },
                                                        })
                                                    }
                                                >
                                                    {c('Link').t`Sign in`}
                                                </Link>
                                            );

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
                                                    <span>
                                                        {
                                                            // translator: Full sentence "Already have an account? Sign in"
                                                            c('Go to sign in').jt`Already have an account? ${signIn}`
                                                        }
                                                    </span>
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
                                <div
                                    className={
                                        viewportWidth['>=large'] ? undefined : 'border rounded-xl border-weak p-6 '
                                    }
                                >
                                    <RightPlanSummary
                                        {...planInformation}
                                        title={
                                            options.planIDs[PLANS.VPN_PASS_BUNDLE]
                                                ? getBundleTitle(VPN_SHORT_APP_NAME, PASS_SHORT_APP_NAME)
                                                : getPlanTitle(planInformation.title)
                                        }
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </Box>
                {!hasSelectedFree && (
                    <Box className={`mt-8 w-full ${padding}`}>
                        <BoxHeader
                            step={showStepLabel ? step++ : undefined}
                            title={c('Header').t`Checkout`}
                            right={!showCycleAndSelectors ? currencySelector : null}
                        />
                        <BoxContent>
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
                                                />
                                                <div className="border-bottom border-weak my-6" />
                                            </>
                                        )}
                                        {renderingPaymentsWrapper ? (
                                            <PaymentWrapper
                                                {...paymentFacade}
                                                disabled={loadingSignup}
                                                hideFirstLabel
                                                noMaxWidth
                                                hasSomeVpnPlan={hasSomeVpnPlan}
                                                billingAddressStatus={getBillingAddressStatus(
                                                    model.subscriptionData.billingAddress
                                                )}
                                            />
                                        ) : (
                                            <div className="mb-4">
                                                {c('Info').t`No payment is required at this time.`}
                                            </div>
                                        )}
                                        {(() => {
                                            if (loadingPaymentsForm) {
                                                return;
                                            }
                                            if (
                                                paymentFacade.selectedMethodType === PAYMENT_METHOD_TYPES.PAYPAL &&
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
                                                        />
                                                        {!hasSomeVpnPlan && (
                                                            <PayPalButton
                                                                id="paypal-credit"
                                                                shape="ghost"
                                                                color="norm"
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
                                                paymentFacade.selectedMethodType ===
                                                    PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL &&
                                                options.checkResult.AmountDue > 0
                                            ) {
                                                return (
                                                    <ChargebeePaypalWrapper
                                                        chargebeePaypal={paymentFacade.chargebeePaypal}
                                                        iframeHandles={paymentFacade.iframeHandles}
                                                    />
                                                );
                                            }

                                            return (
                                                <>
                                                    <Button
                                                        type="submit"
                                                        size="large"
                                                        loading={loadingSignup}
                                                        disabled={disablePayButton}
                                                        color="norm"
                                                        data-testid="pay"
                                                        fullWidth
                                                    >
                                                        {options.checkResult.AmountDue > 0
                                                            ? c('Action').jt`Pay ${price}`
                                                            : c('Action').t`Confirm`}
                                                    </Button>
                                                    {hasGuarantee && (
                                                        <div className="text-center color-success my-4">
                                                            <Guarantee />
                                                        </div>
                                                    )}
                                                    <Alert3ds />
                                                    <div className="mt-4 text-sm color-weak text-center">
                                                        {
                                                            // translator: Full sentence "By clicking on "Pay", you agree to our terms and conditions."
                                                            c('new_plans: signup')
                                                                .jt`By clicking on "Pay", you agree to our ${termsAndConditions}.`
                                                        }
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </form>
                                </div>
                                <div
                                    className={clsx(viewportWidth['>=large'] && 'w-custom')}
                                    style={viewportWidth['>=large'] ? { '--w-custom': '18.75rem' } : undefined}
                                >
                                    <div className="border rounded-xl border-weak px-3 py-4">
                                        <PaymentSummary
                                            model={model}
                                            options={options}
                                            actualCheckout={actualCheckout}
                                            loadingPaymentDetails={disablePayButton}
                                            onBillingAddressChange={handleChangeBillingAddress}
                                            showInclusiveTax={paymentFacade.showInclusiveTax}
                                            showTaxCountry={paymentFacade.showTaxCountry}
                                            isB2bPlan={isB2bPlan}
                                            upsellToggle={getUpsellToggle()}
                                            planInformation={(() => {
                                                return model.mode === 'vpn-pass-promotion' && plansMap[PLANS.VPN2024]
                                                    ? getPlanInformation({
                                                          selectedPlan: plansMap[PLANS.VPN2024],
                                                          vpnServersCountData,
                                                          mode,
                                                          loading: model.loadingDependencies,
                                                      }) || planInformation
                                                    : planInformation;
                                            })()}
                                            giftCode={
                                                <GiftCodeSummary
                                                    coupon={coupon}
                                                    onApplyCode={async (code) => {
                                                        const checkResult = await getSubscriptionPrices(
                                                            getPaymentsApi(silentApi),
                                                            options.planIDs,
                                                            options.currency,
                                                            options.cycle,
                                                            model.subscriptionData.billingAddress,
                                                            code
                                                        );

                                                        setModel((old) => ({
                                                            ...old,
                                                            subscriptionData: {
                                                                ...model.subscriptionData,
                                                                checkResult,
                                                            },
                                                        }));

                                                        setCouponCode(code);

                                                        if (!checkResult.Coupon) {
                                                            throw new Error(c('Notification').t`Invalid code`);
                                                        }
                                                    }}
                                                    onRemoveCode={async () => {
                                                        const checkResult = await getSubscriptionPrices(
                                                            getPaymentsApi(silentApi),
                                                            options.planIDs,
                                                            options.currency,
                                                            options.cycle,
                                                            model.subscriptionData.billingAddress
                                                        );

                                                        setModel((old) => ({
                                                            ...old,
                                                            subscriptionData: {
                                                                ...model.subscriptionData,
                                                                checkResult,
                                                            },
                                                        }));

                                                        setCouponCode(undefined);
                                                    }}
                                                />
                                            }
                                            hasSelectedFree={hasSelectedFree}
                                        />
                                    </div>
                                </div>
                            </div>
                        </BoxContent>
                    </Box>
                )}
            </div>
            {renderUpsellModal && (
                <UpsellModal
                    img={upsellImg}
                    title={c('vpn_2step: info').t`Try ${upsellPlanName} risk-free`}
                    info={c('Info').t`If it’s not right for you, we’ll refund you.`}
                    features={[
                        getStreaming(true),
                        getCountries(
                            getPlusServers(vpnServersCountData.paid.servers, vpnServersCountData.paid.countries)
                        ),
                        getProtectDevices(VPN_CONNECTIONS),
                        getNetShield(true),
                    ]}
                    footer={
                        <>
                            <div className="flex flex-column gap-2">
                                <Button
                                    fullWidth
                                    color="norm"
                                    shape="outline"
                                    onClick={() => {
                                        upsellModalProps.onClose();
                                        void handleChangePlanIds({}, PLANS.FREE);
                                    }}
                                >
                                    {c('Info').t`Continue with ${freeName}`}
                                </Button>
                                <Button fullWidth color="norm" onClick={handleCloseUpsellModal}>
                                    {c('Info').t`Get ${upsellPlanName}`}
                                </Button>
                            </div>
                            <div className="text-center mt-6">
                                <Guarantee />
                            </div>
                        </>
                    }
                    {...upsellModalProps}
                />
            )}
        </Layout>
    );
};

export default Step1;
