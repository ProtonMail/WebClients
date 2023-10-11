import { Dispatch, Fragment, ReactElement, ReactNode, SetStateAction, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Href } from '@proton/atoms/Href';
import { Vr } from '@proton/atoms/Vr';
import { Icon, InlineLinkButton, Price, Toggle, VpnLogo, useModalState } from '@proton/components/components';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import {
    CurrencySelector,
    PayPalButton,
    Payment as PaymentComponent,
    StyledPayPalButton,
    usePayment,
} from '@proton/components/containers';
import Alert3ds from '@proton/components/containers/payments/Alert3ds';
import { getRenewalNoticeText } from '@proton/components/containers/payments/RenewalNotice';
import { getCalendarAppFeature } from '@proton/components/containers/payments/features/calendar';
import { getDriveAppFeature } from '@proton/components/containers/payments/features/drive';
import { getMailAppFeature } from '@proton/components/containers/payments/features/mail';
import { getPassAppFeature } from '@proton/components/containers/payments/features/pass';
import {
    getAdvancedVPNCustomizations,
    getAllPlatforms,
    getBandwidth,
    getCountries,
    getNetShield,
    getNoAds,
    getPrioritySupport,
    getProtectDevices,
    getRefundable,
    getStreaming,
    getVPNAppFeature,
    getVPNSpeed,
} from '@proton/components/containers/payments/features/vpn';
import { getTotalBillingText } from '@proton/components/containers/payments/helper';
import usePaymentToken from '@proton/components/containers/payments/usePaymentToken';
import { useActiveBreakpoint, useApi, useConfig } from '@proton/components/hooks';
import {
    AmountAndCurrency,
    CardPayment,
    PAYMENT_METHOD_TYPES,
    PaypalPayment,
    TokenPayment,
    TokenPaymentMethod,
} from '@proton/components/payments/core';
import { useLoading } from '@proton/hooks';
import metrics, { observeApiError } from '@proton/metrics';
import { WebCoreVpnSingleSignupStep1InteractionTotal } from '@proton/metrics/types/web_core_vpn_single_signup_step1_interaction_total_v1.schema';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import { getIsVPNApp } from '@proton/shared/lib/authentication/apps';
import {
    ADDON_NAMES,
    APPS,
    BRAND_NAME,
    CYCLE,
    PLANS,
    VPN_APP_NAME,
    VPN_CONNECTIONS,
    VPN_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';
import { SubscriptionCheckoutData, getCheckout, getOptimisticCheckResult } from '@proton/shared/lib/helpers/checkout';
import { getPricingFromPlanIDs, getTotalFromPricing } from '@proton/shared/lib/helpers/subscription';
import { getTermsURL, stringifySearchParams } from '@proton/shared/lib/helpers/url';
import { Currency, Cycle, CycleMapping, Plan, VPNServersCountData } from '@proton/shared/lib/interfaces';
import { generatePassword } from '@proton/shared/lib/password';
import { getFreeServers, getPlusServers, getVpnServers } from '@proton/shared/lib/vpn/features';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import SignupSupportDropdown from '../signup/SignupSupportDropdown';
import { getSubscriptionPrices } from '../signup/helper';
import { PlanIDs, SignupCacheResult, SubscriptionData } from '../signup/interfaces';
import AccountStepDetails, { AccountStepDetailsRef } from '../single-signup-v2/AccountStepDetails';
import FreeLogo from '../single-signup-v2/FreeLogo';
import bundle from '../single-signup-v2/bundle.svg';
import { getFreeSubscriptionData, getFreeTitle } from '../single-signup-v2/helper';
import { OptimisticOptions, SignupModelV2 } from '../single-signup-v2/interface';
import { getPaymentMethod } from '../single-signup-v2/measure';
import { useFlowRef } from '../useFlowRef';
import AddonSummary from './AddonSummary';
import Box from './Box';
import CycleSelector from './CycleSelector';
import GiftCodeSummary from './GiftCodeSummary';
import Guarantee from './Guarantee';
import Layout from './Layout';
import RightPlanSummary from './RightPlanSummary';
import SaveLabel2 from './SaveLabel2';
import StepLabel from './StepLabel';
import UpsellModal from './UpsellModal';
import VpnProLogo from './VpnProLogo';
import swissFlag from './flag.svg';
import { getBillingCycleText, getOffText, getUpsellShortPlan } from './helper';
import { Measure } from './interface';
import { TelemetryPayType } from './measure';
import PlanCustomizer from './planCustomizer/PlanCustomizer';
import getAddonsPricing from './planCustomizer/getAddonsPricing';

const getPlanInformation = (
    selectedPlan: Plan,
    vpnServersCountData: VPNServersCountData,
    flow: 'pricing' | 'signup'
) => {
    const iconSize = 28;

    if (selectedPlan.Name === PLANS.FREE) {
        const freeServers = getFreeServers(vpnServersCountData.free.servers, vpnServersCountData.free.countries);
        return {
            logo: <FreeLogo size={iconSize} app={APPS.PROTONVPN_SETTINGS} />,
            title: getFreeTitle(BRAND_NAME),
            features: [getCountries(freeServers), getNoAds(), getBandwidth()],
        };
    }

    if (selectedPlan.Name === PLANS.VPN) {
        const plusServers = getPlusServers(vpnServersCountData.paid.servers, vpnServersCountData.paid.countries);
        return {
            logo: <VpnLogo variant="glyph-only" size={iconSize} />,
            title: selectedPlan.Title,
            features: [
                flow === 'pricing' ? getCountries(plusServers) : undefined,
                getVPNSpeed('highest'),
                flow === 'pricing' ? getStreaming(true) : undefined,
                getProtectDevices(VPN_CONNECTIONS),
                getAllPlatforms(),
                getNetShield(true),
                flow === 'signup' ? getStreaming(true) : undefined,
                getPrioritySupport(),
                getAdvancedVPNCustomizations(true),
                flow === 'pricing' ? getRefundable() : undefined,
            ].filter(isTruthy),
        };
    }

    if (selectedPlan.Name === PLANS.BUNDLE) {
        return {
            logo: (
                <div>
                    <img src={bundle} width={iconSize} height={iconSize} alt={selectedPlan.Title} />
                </div>
            ),
            title: selectedPlan.Title,
            features: [
                getMailAppFeature(),
                getCalendarAppFeature(),
                getDriveAppFeature(),
                getVPNAppFeature(),
                getPassAppFeature(),
            ],
        };
    }

    const serversInNCountries = c('new_plans: feature').ngettext(
        msgid`Servers in ${vpnServersCountData.paid.countries}+ country`,
        `Servers in ${vpnServersCountData.paid.countries}+ countries`,
        vpnServersCountData.paid.countries
    );

    if (selectedPlan.Name === PLANS.VPN_PRO) {
        return {
            logo: <VpnProLogo size={iconSize} />,
            title: selectedPlan.Title,
            features: [
                {
                    text: c('new_plans: feature').t`Advanced network security`,
                    included: true,
                },
                {
                    text: serversInNCountries,
                    included: true,
                },
                {
                    text: c('new_plans: feature').t`24/7 support`,
                    included: true,
                },
                {
                    text: c('new_plans: feature').t`Centralized settings and billings`,
                    included: true,
                },
            ],
        };
    }

    if (selectedPlan.Name === PLANS.VPN_BUSINESS) {
        return {
            logo: <VpnLogo variant="glyph-only" size={iconSize} />,
            title: selectedPlan.Title,
            features: [
                {
                    text: c('new_plans: feature').t`Advanced network security`,
                    included: true,
                },
                {
                    text: serversInNCountries,
                    included: true,
                },
                {
                    text: c('new_plans: feature').t`Dedicated servers and IP`,
                    included: true,
                },
                {
                    text: c('new_plans: feature').t`24/7 support`,
                    included: true,
                },
                {
                    text: c('new_plans: feature').t`Centralized settings and billings`,
                    included: true,
                },
            ],
        };
    }
};

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

const getPlanTitle = (selected: string) => {
    return c('vpn_2step: info').t`Your ${selected} plan`;
};
const FeatureItem = ({ left, text }: { left: ReactNode; text: string }) => {
    return (
        <div className="flex flex-align-items-center text-center on-mobile-flex-column flex-justify-center">
            <div className="md:mr-4 text-center">{left}</div>
            <div className="color-weak">{text}</div>
        </div>
    );
};

const BoxHeader = ({ step, title, right }: { step?: number; title: string; right?: ReactNode }) => {
    return (
        <div className="flex flex-align-items-center flex-justify-space-between flex-nowrap">
            <div className="flex flex-align-items-center on-mobile-flex-column md:gap-4 gap-2">
                {step !== undefined && (
                    <div className="flex-item-noshrink">
                        <StepLabel step={step} />
                    </div>
                )}
                <h2 className="text-bold text-4xl flex-item-fluid">{title}</h2>
            </div>
            {right && <div className="flex-item-noshrink">{right}</div>}
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
    defaultEmail,
    mode,
    selectedPlan,
    isB2bPlan,
    isDarkBg,
    onComplete,
    model,
    setModel,
    upsellShortPlan,
    vpnServersCountData,
    hideFreePlan,
    upsellImg,
    measure,
    onChallengeError,
    onChallengeLoaded,
    className,
    loading,
}: {
    defaultEmail?: string;
    mode: 'signup' | 'pricing';
    selectedPlan: Plan;
    isB2bPlan: boolean;
    isDarkBg: boolean;
    upsellShortPlan: ReturnType<typeof getUpsellShortPlan> | undefined;
    vpnServersCountData: VPNServersCountData;
    onComplete: (data: {
        accountData: SignupCacheResult['accountData'];
        subscriptionData: SignupCacheResult['subscriptionData'];
        type: 'signup';
    }) => void;
    model: SignupModelV2;
    setModel: Dispatch<SetStateAction<SignupModelV2>>;
    hideFreePlan: boolean;
    upsellImg: ReactElement;
    measure: Measure;
    onChallengeError: () => void;
    onChallengeLoaded: () => void;
    className?: string;
    loading: boolean;
}) => {
    const [upsellModalProps, setUpsellModal, renderUpsellModal] = useModalState();
    const { isDesktop, isTinyMobile } = useActiveBreakpoint();
    const { APP_NAME } = useConfig();
    const [loadingChallenge, setLoadingChallenge] = useState(false);
    const normalApi = useApi();
    const silentApi = getSilentApi(normalApi);
    const [toggleUpsell, setToggleUpsell] = useState<{ from: CYCLE; to: CYCLE } | undefined>(undefined);
    const createPaymentToken = usePaymentToken();
    const accountDetailsRef = useRef<AccountStepDetailsRef>();
    const [couponCode, setCouponCode] = useState(model.subscriptionData.checkResult.Coupon?.Code);
    const [checkingSubscription, setCheckingSubscription] = useState(false);

    const createFlow = useFlowRef();

    const [loadingSignup, withLoadingSignup] = useLoading();
    const [loadingPaymentDetails, withLoadingPaymentDetails] = useLoading();

    const { plansMap, paymentMethodStatus } = model;

    useEffect(() => {
        if (loading) {
            return;
        }

        metrics.core_vpn_single_signup_pageLoad_2_total.increment({
            step: 'plan_username_payment',
            flow: isB2bPlan ? 'b2b' : 'b2c',
        });
    }, [loading]);

    const hasBeenCountedRef = useRef<HasBeenCountedState>({
        plan: false,
        email: false,
        payment: false,
    });

    const options: OptimisticOptions = {
        currency: model.optimistic.currency || model.subscriptionData.currency,
        cycle: model.optimistic.cycle || model.subscriptionData.cycle,
        plan: model.optimistic.plan || selectedPlan,
        planIDs: model.optimistic.planIDs || model.subscriptionData.planIDs,
        checkResult: model.optimistic.checkResult || model.subscriptionData.checkResult,
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

    const getCouponForCurrentCycle = (cycle?: Cycle) => {
        return couponCode ?? model.subscriptionDataCycleMapping[cycle ?? options.cycle]?.checkResult.Coupon?.Code;
    };

    const showLifetimeDeal = !isB2bPlan && !getCouponForCurrentCycle();

    const handleOptimistic = async (optimistic: Partial<OptimisticOptions>) => {
        setCheckingSubscription(true);

        const newCurrency = optimistic.currency || options.currency;
        const newPlanIDs = optimistic.planIDs || options.planIDs;
        const newCycle = optimistic.cycle || options.cycle;

        // Try a pre-saved check first. If it's not available, then use the default optimistic one.
        // With the regular cycles, it should be available.
        const optimisticCheckResult =
            model.subscriptionDataCycleMapping[newCycle]?.checkResult ??
            getOptimisticCheckResult({
                plansMap: model.plansMap,
                planIDs: newPlanIDs,
                cycle: newCycle,
            });

        const newOptimistic = {
            ...optimistic,
            checkResult: optimisticCheckResult,
        };

        const resetOptimistic = Object.keys(newOptimistic).reduce<Partial<OptimisticOptions>>((acc, key) => {
            acc[key as keyof typeof acc] = undefined;
            return acc;
        }, {});

        try {
            const validateFlow = createFlow();

            setOptimisticDiff(newOptimistic);

            const coupon = getCouponForCurrentCycle(newCycle);
            const checkResult = await getSubscriptionPrices(silentApi, newPlanIDs, newCurrency, newCycle, coupon);

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
                },
                optimistic: {
                    ...old.optimistic,
                    ...resetOptimistic,
                },
            }));
        } catch (e) {
            // Reset any optimistic state on failures
            setModel((old) => ({
                ...old,
                optimistic: {},
            }));
        } finally {
            setCheckingSubscription(false);
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

    const handleChangeCurrency = async (currency: Currency) => {
        handleUpdate('plan');
        void measure({
            event: TelemetryAccountSignupEvents.currencySelect,
            dimensions: { currency: currency },
        });
        handleOptimistic({ currency })
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
            });
    };

    const handleChangeCycle = async (cycle: Cycle, mode?: 'upsell') => {
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
        handleOptimistic({ cycle })
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

    const onPay = async (
        payment: PaypalPayment | TokenPayment | CardPayment | undefined,
        type: 'cc' | 'pp' | undefined
    ) => {
        const subscriptionData: SubscriptionData = {
            ...model.subscriptionData,
            payment,
            type,
        };
        return handleCompletion(subscriptionData);
    };

    const paymentMethods = [
        paymentMethodStatus?.Card && PAYMENT_METHOD_TYPES.CARD,
        paymentMethodStatus?.Paypal && PAYMENT_METHOD_TYPES.PAYPAL,
    ].filter(isTruthy);

    const hasGuarantee = options.plan.Name === PLANS.VPN || isB2bPlan;

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
        if (loadingSignup || loadingPaymentDetails) {
            return false;
        }
        return true;
    };

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
        ignoreName: true,
        api: normalApi,
        defaultMethod: paymentMethods[0],
        amount: options.checkResult.AmountDue,
        currency: options.currency,
        onPaypalError: (error, type) => {
            observeApiError(error, (status) => {
                measurePayError(type);
                metrics.core_vpn_single_signup_step1_payment_2_total.increment({
                    status,
                    flow: isB2bPlan ? 'b2b' : 'b2c',
                });
            });
        },
        onValidatePaypal: (type) => {
            if (!validatePayment() || !accountDetailsRef.current?.validate()) {
                return false;
            }
            measurePaySubmit(type);
            return true;
        },
        onPaypalPay({ Payment }: TokenPaymentMethod) {
            metrics.core_vpn_single_signup_step1_payment_2_total.increment({
                status: 'success',
                flow: isB2bPlan ? 'b2b' : 'b2c',
            });
            return withLoadingSignup(onPay(Payment, 'pp'));
        },
    });

    const price = (
        <Price key="price" currency={options.currency}>
            {options.checkResult.AmountDue}
        </Price>
    );

    const upsellPlanName = upsellShortPlan?.title || '';

    const termsHref = (() => {
        if (isB2bPlan) {
            return getTermsURL();
        }

        if (getIsVPNApp(APP_NAME)) {
            return getTermsURL(APPS.PROTONVPN_SETTINGS);
        }

        return getTermsURL();
    })();
    const termsAndConditions = (
        <Href key="terms" href={termsHref}>
            {
                // translator: Full sentence "By clicking on "Pay", you agree to our terms and conditions."
                c('new_plans: signup').t`terms and conditions`
            }
        </Href>
    );

    const pricing = getPricingFromPlanIDs(options.planIDs, plansMap);

    const totals = getTotalFromPricing(pricing, options.cycle);

    const getCheckoutForCycle = (cycle: Cycle) => {
        // This is an assumption that this page always uses so-called regular cycles:
        // monthly, yearly and two-yearly. 15 and 30 were temporary promotions.
        // If this react component must handle other cycles, then this code should be changed.
        const regularCycle = cycle as CYCLE.MONTHLY | CYCLE.YEARLY | CYCLE.TWO_YEARS;

        return getCheckout({
            planIDs: options.planIDs,
            plansMap,
            checkResult: model.subscriptionDataCycleMapping[regularCycle].checkResult,
        });
    };

    const checkoutMapping: CycleMapping<SubscriptionCheckoutData> = {
        [CYCLE.MONTHLY]: getCheckoutForCycle(CYCLE.MONTHLY),
        [CYCLE.YEARLY]: getCheckoutForCycle(CYCLE.YEARLY),
        [CYCLE.TWO_YEARS]: getCheckoutForCycle(CYCLE.TWO_YEARS),
    };

    const selectedCycleCheckout = checkoutMapping[options.cycle] as SubscriptionCheckoutData;

    const cycles = isDesktop
        ? [CYCLE.MONTHLY, CYCLE.TWO_YEARS, CYCLE.YEARLY]
        : [CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY];

    const features = [
        {
            left: <Icon size={24} className="color-primary" name="code" />,
            text: c('Info').t`Open source`,
        },
        {
            left: <Icon size={24} className="color-primary" name="eye-slash" />,
            text: c('new_plans: feature').t`No-logs policy`,
        },
        {
            left: <img width="24" alt="" src={swissFlag} />,
            text: isDesktop ? c('Info').t`Protected by Swiss privacy laws` : c('Info').t`Swiss based`,
        },
        isDesktop &&
            [PLANS.VPN, PLANS.BUNDLE].includes(selectedPlan.Name as any) && {
                left: <Icon size={24} className="color-primary" name="servers" />,
                text: getVpnServers(vpnServersCountData.paid.servers),
            },
    ].filter(isTruthy);

    const freeName = `${VPN_SHORT_APP_NAME} Free`;
    const appName = VPN_APP_NAME;

    const handleCloseUpsellModal = () => {
        handleUpdate('plan');
        upsellModalProps.onClose();
    };

    const hasSelectedFree = selectedPlan.Name === PLANS.FREE;

    const showStepLabel = !isB2bPlan;
    let step = 1;
    const padding = 'sm:p-11';

    const planInformation = getPlanInformation(options.plan, vpnServersCountData, mode);

    const upsellToCycle = (() => {
        if (options.cycle === CYCLE.MONTHLY) {
            return CYCLE.YEARLY;
        }
        if (options.cycle === CYCLE.YEARLY) {
            return CYCLE.TWO_YEARS;
        }
    })();

    const addonsPricing = getAddonsPricing({
        currentPlan: options.plan,
        plansMap: model.plansMap,
        planIDs: options.planIDs,
        cycle: options.cycle,
    });

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

    return (
        <Layout
            hasDecoration
            className={className}
            bottomRight={<SignupSupportDropdown isDarkBg={isDarkBg && !isTinyMobile} />}
            isDarkBg={isDarkBg}
            isB2bPlan={isB2bPlan}
        >
            <div className="flex flex-align-items-center flex-column">
                <div className="signup-v1-header mb-4 text-center">
                    <h1 className="m-0 large-font lg:px-4 text-semibold">
                        {(() => {
                            if (isB2bPlan) {
                                return c('new_plans: feature').t`Start protecting your organization`;
                            }

                            if (mode === 'pricing') {
                                return c('new_plans: feature').t`High-speed Swiss VPN that protects your privacy`;
                            }

                            return c('new_plans: feature').t`Start protecting yourself online in 2 easy steps`;
                        })()}
                    </h1>
                </div>
                {mode === 'pricing' && !isB2bPlan && (
                    <div className="flex flex-nowrap md:gap-8 gap-3">
                        {features.map(({ left, text }, i, arr) => {
                            return (
                                <Fragment key={text}>
                                    <FeatureItem left={left} text={text} />
                                    {i !== arr.length - 1 && (
                                        <Vr className="h-custom" style={{ '--h-custom': '2.25rem' }} />
                                    )}
                                </Fragment>
                            );
                        })}
                    </div>
                )}
                {!hasSelectedFree && mode === 'pricing' && (
                    <Box className={`mt-8 w100 ${padding}`}>
                        <BoxHeader
                            step={showStepLabel ? step++ : undefined}
                            title={c('Header').t`Select your pricing plan`}
                            right={
                                <CurrencySelector
                                    mode="select-two"
                                    currency={options.currency}
                                    onSelect={(currency) => withLoadingPaymentDetails(handleChangeCurrency(currency))}
                                />
                            }
                        />
                        <BoxContent>
                            <div className="flex flex-justify-space-between gap-4 on-tablet-flex-column">
                                <CycleSelector
                                    onGetTheDeal={(cycle) => {
                                        handleUpdate('plan');
                                        setToggleUpsell(undefined);
                                        withLoadingPaymentDetails(handleChangeCycle(cycle)).catch(noop);
                                        accountDetailsRef.current?.scrollInto('email');
                                    }}
                                    cycle={options.cycle}
                                    currency={options.currency}
                                    cycles={cycles}
                                    onChangeCycle={(cycle, upsellFrom) => {
                                        handleUpdate('plan');
                                        setToggleUpsell(undefined);
                                        return withLoadingPaymentDetails(
                                            handleChangeCycle(cycle, upsellFrom !== undefined ? 'upsell' : undefined)
                                        ).catch(noop);
                                    }}
                                    checkoutMapping={checkoutMapping}
                                />
                            </div>
                            <div className="flex flex-justify-end mt-10 on-tablet-flex-justify-center">
                                {!hideFreePlan && options.plan.Name === PLANS.VPN && (
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
                                        {c('Action').t`Sign up for free`}
                                    </InlineLinkButton>
                                )}
                            </div>
                        </BoxContent>
                    </Box>
                )}
                <Box className="mt-8 w100">
                    <div className="flex flex-justify-space-between on-tablet-flex-column ">
                        <div className={`flex-item-fluid ${padding}`}>
                            <BoxHeader
                                step={showStepLabel ? step++ : undefined}
                                title={c('Header').t`Create your account`}
                            ></BoxHeader>
                            <BoxContent>
                                <div className="relative">
                                    <AccountStepDetails
                                        defaultEmail={defaultEmail}
                                        passwordFields={false}
                                        model={model}
                                        measure={measure}
                                        loading={loadingChallenge}
                                        api={silentApi}
                                        accountStepDetailsRef={accountDetailsRef}
                                        onChallengeError={() => {
                                            setLoadingChallenge(false);
                                            onChallengeError();
                                        }}
                                        onChallengeLoaded={() => {
                                            setLoadingChallenge(false);
                                            onChallengeLoaded();
                                        }}
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
                                    isDesktop
                                        ? `${padding} w-custom border-left border-weak`
                                        : `${padding} sm:pt-0 pt-0`
                                )}
                                style={
                                    isDesktop
                                        ? {
                                              '--w-custom': '354px',
                                          }
                                        : undefined
                                }
                            >
                                <div className={isDesktop ? undefined : 'border rounded-xl border-weak p-6 '}>
                                    <RightPlanSummary
                                        {...planInformation}
                                        title={getPlanTitle(planInformation.title)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </Box>
                {!hasSelectedFree && (
                    <Box className={`mt-8 w100 ${padding}`}>
                        <BoxHeader step={showStepLabel ? step++ : undefined} title={c('Header').t`Checkout`} />
                        <BoxContent>
                            <div className="flex flex-justify-space-between md:gap-14 gap-6 on-tablet-flex-column">
                                <div className="flex-item-fluid md:pr-1 on-tablet-order-1">
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
                                        onSubmit={async (event) => {
                                            event.preventDefault();

                                            const amountAndCurrency: AmountAndCurrency = {
                                                Currency: options.currency,
                                                Amount: options.checkResult.AmountDue,
                                            };

                                            const run = async () => {
                                                const type = amountAndCurrency.Amount <= 0 ? 'free' : 'pay_cc';

                                                measurePaySubmit(type);

                                                if (amountAndCurrency.Amount <= 0) {
                                                    return onPay(undefined, undefined);
                                                }

                                                if (!paymentParameters) {
                                                    throw new Error('Missing payment parameters');
                                                }

                                                try {
                                                    const data = await createPaymentToken(paymentParameters, {
                                                        amountAndCurrency,
                                                    });
                                                    metrics.core_vpn_single_signup_step1_payment_2_total.increment({
                                                        status: 'success',
                                                        flow: isB2bPlan ? 'b2b' : 'b2c',
                                                    });
                                                    return await onPay(data.Payment, 'cc');
                                                } catch (error) {
                                                    observeApiError(error, (status) => {
                                                        measurePayError(type);
                                                        metrics.core_vpn_single_signup_step1_payment_2_total.increment({
                                                            status,
                                                            flow: isB2bPlan ? 'b2b' : 'b2c',
                                                        });
                                                    });
                                                }
                                            };

                                            if (
                                                accountDetailsRef.current?.validate() &&
                                                handleCardSubmit() &&
                                                validatePayment()
                                            ) {
                                                withLoadingSignup(run()).catch(noop);
                                            }
                                        }}
                                        method="post"
                                    >
                                        {isB2bPlan && (
                                            <>
                                                <PlanCustomizer
                                                    currency={model.subscriptionData.currency}
                                                    cycle={model.subscriptionData.cycle}
                                                    plansMap={model.plansMap}
                                                    planIDs={model.subscriptionData.planIDs}
                                                    currentPlan={selectedPlan}
                                                    onChangePlanIDs={(planIDs: PlanIDs) =>
                                                        handleOptimistic({ planIDs })
                                                    }
                                                />
                                                <div className="border-bottom border-weak my-6" />
                                            </>
                                        )}
                                        {options.checkResult.AmountDue ? (
                                            <PaymentComponent
                                                api={normalApi}
                                                noMaxWidth
                                                type="signup-pass"
                                                paypal={paypal}
                                                paypalCredit={paypalCredit}
                                                paymentMethodStatus={paymentMethodStatus}
                                                method={method}
                                                amount={options.checkResult.AmountDue}
                                                currency={options.currency}
                                                card={card}
                                                onMethod={(newMethod) => {
                                                    if (method && newMethod && method !== newMethod) {
                                                        const value = getPaymentMethod(newMethod);
                                                        if (value) {
                                                            void measure({
                                                                event: TelemetryAccountSignupEvents.paymentSelect,
                                                                dimensions: { type: value },
                                                            });
                                                        }
                                                    }
                                                    setMethod(newMethod);
                                                }}
                                                onCard={(card, value) => setCard(card, value)}
                                                cardErrors={cardErrors}
                                                disabled={loadingSignup}
                                            />
                                        ) : (
                                            <div className="mb-4">{c('Info')
                                                .t`No payment is required at this time.`}</div>
                                        )}
                                        {(() => {
                                            if (
                                                method === PAYMENT_METHOD_TYPES.PAYPAL &&
                                                options.checkResult.AmountDue > 0
                                            ) {
                                                return (
                                                    <div className="flex flex-column gap-2">
                                                        <StyledPayPalButton
                                                            paypal={paypal}
                                                            amount={options.checkResult.AmountDue}
                                                            loading={loadingSignup}
                                                        />
                                                        <PayPalButton
                                                            id="paypal-credit"
                                                            shape="ghost"
                                                            color="norm"
                                                            paypal={paypalCredit}
                                                            disabled={loadingSignup}
                                                            amount={options.checkResult.AmountDue}
                                                        >
                                                            {c('Link').t`Paypal without credit card`}
                                                        </PayPalButton>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <>
                                                    <Button
                                                        type="submit"
                                                        size="large"
                                                        loading={loadingSignup}
                                                        disabled={checkingSubscription}
                                                        color="norm"
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
                                    className={clsx(isDesktop && 'w-custom')}
                                    style={isDesktop ? { '--w-custom': '300px' } : undefined}
                                >
                                    <div className="border rounded-xl border-weak px-3 py-4">
                                        <div className="flex flex-column gap-3">
                                            <div className="color-weak text-semibold mx-3">{c('Info').t`Summary`}</div>
                                            {(() => {
                                                if (!planInformation) {
                                                    return null;
                                                }

                                                const pricePerMonth = getSimplePriceString(
                                                    options.currency,
                                                    selectedCycleCheckout.withDiscountPerMonth,
                                                    ''
                                                );

                                                const regularPrice = getSimplePriceString(
                                                    options.currency,
                                                    totals.totalNoDiscountPerMonth,
                                                    ''
                                                );
                                                const free = hasSelectedFree;

                                                return (
                                                    <div
                                                        className={clsx(
                                                            'rounded-xl flex flex-column gap-1',
                                                            upsellToCycle || toggleUpsell ? 'border border-weak' : ''
                                                        )}
                                                    >
                                                        <div className="p-2 flex gap-2">
                                                            <div>
                                                                <div
                                                                    className="inline-block border border-weak rounded-lg p-2"
                                                                    title={planInformation.title}
                                                                >
                                                                    {planInformation.logo}
                                                                </div>
                                                            </div>
                                                            <div className="flex-item-fluid">
                                                                <div className="flex gap-2">
                                                                    <div className="text-rg text-bold flex-item-fluid">
                                                                        {planInformation.title}
                                                                    </div>
                                                                    {!isB2bPlan && (
                                                                        <div className="text-rg text-bold">
                                                                            {pricePerMonth}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-item-fluid flex flex-align-items-center gap-2">
                                                                    <div className="flex-item-fluid text-sm">
                                                                        <span className="color-weak mr-1">
                                                                            {getBilledText(options.cycle)}
                                                                        </span>
                                                                        {selectedCycleCheckout.discountPercent > 0 && (
                                                                            <SaveLabel2
                                                                                highlightPrice={true}
                                                                                percent={
                                                                                    selectedCycleCheckout.discountPercent
                                                                                }
                                                                            />
                                                                        )}
                                                                    </div>

                                                                    {free && (
                                                                        <div className="flex-item-fluid text-sm color-weak">
                                                                            {c('Info').t`Free forever`}
                                                                        </div>
                                                                    )}

                                                                    {!isB2bPlan &&
                                                                        selectedCycleCheckout.discountPercent > 0 && (
                                                                            <span className="inline-flex">
                                                                                <span className="text-sm color-weak text-strike text-ellipsis">
                                                                                    {regularPrice}
                                                                                </span>
                                                                                <span className="text-sm color-weak ml-1">{` ${c(
                                                                                    'Suffix'
                                                                                ).t`/month`}`}</span>
                                                                            </span>
                                                                        )}

                                                                    {free && (
                                                                        <span className="text-sm color-weak ml-1">{` ${c(
                                                                            'Suffix'
                                                                        ).t`/month`}`}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {(upsellToCycle || toggleUpsell) && (
                                                            <>
                                                                <div className="border-top border-weak" />
                                                                <div className="p-2 flex gap-1 flex-align-items-center">
                                                                    <Toggle
                                                                        checked={!!toggleUpsell}
                                                                        id="toggle-upsell-plan"
                                                                        className="mx-1"
                                                                        onChange={(event) => {
                                                                            if (
                                                                                loadingSignup ||
                                                                                loadingPaymentDetails
                                                                            ) {
                                                                                return;
                                                                            }
                                                                            if (event.target.checked && upsellToCycle) {
                                                                                setToggleUpsell({
                                                                                    from: options.cycle,
                                                                                    to: upsellToCycle,
                                                                                });
                                                                                withLoadingPaymentDetails(
                                                                                    handleChangeCycle(
                                                                                        upsellToCycle,
                                                                                        'upsell'
                                                                                    )
                                                                                ).catch(noop);
                                                                            } else if (toggleUpsell) {
                                                                                withLoadingPaymentDetails(
                                                                                    handleChangeCycle(
                                                                                        toggleUpsell.from,
                                                                                        'upsell'
                                                                                    )
                                                                                ).catch(noop);
                                                                                setToggleUpsell(undefined);
                                                                            }
                                                                        }}
                                                                    ></Toggle>
                                                                    <label
                                                                        htmlFor="toggle-upsell-plan"
                                                                        className="flex-item-fluid text-sm"
                                                                    >
                                                                        {(() => {
                                                                            const toCycle =
                                                                                toggleUpsell?.to || upsellToCycle;
                                                                            if (!toCycle) {
                                                                                return null;
                                                                            }

                                                                            const toCycleCheckout =
                                                                                getCheckoutForCycle(toCycle);

                                                                            const discount = `${toCycleCheckout.discountPercent}%`;
                                                                            const billingCycle =
                                                                                getBillingCycleText(toCycle);
                                                                            if (!billingCycle) {
                                                                                return null;
                                                                            }
                                                                            // translator: full sentence is "Get 33% off with a 2-year subscription"
                                                                            return getOffText(discount, billingCycle);
                                                                        })()}
                                                                    </label>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            })()}

                                            {addonsPricing.length > 0 ? (
                                                <>
                                                    <div className="mx-3 mt-1 flex flex-column gap-2">
                                                        {(() => {
                                                            return addonsPricing.map(
                                                                ({ addonPricePerCycle, cycle, value, addon }) => {
                                                                    if (
                                                                        addon.Name === ADDON_NAMES.MEMBER_VPN_PRO ||
                                                                        addon.Name === ADDON_NAMES.MEMBER_VPN_BUSINESS
                                                                    ) {
                                                                        return (
                                                                            <AddonSummary
                                                                                key={addon.Name}
                                                                                label={c('Checkout summary').t`Users`}
                                                                                numberOfItems={value}
                                                                                currency={options.currency}
                                                                                price={addonPricePerCycle / cycle}
                                                                                subline={
                                                                                    <>
                                                                                        /{' '}
                                                                                        {c('Checkout summary').t`month`}
                                                                                    </>
                                                                                }
                                                                            />
                                                                        );
                                                                    }

                                                                    if (addon.Name === ADDON_NAMES.IP_VPN_BUSINESS) {
                                                                        return (
                                                                            <AddonSummary
                                                                                key={addon.Name}
                                                                                label={c('Checkout summary').t`Servers`}
                                                                                numberOfItems={value}
                                                                                currency={options.currency}
                                                                                price={addonPricePerCycle / cycle}
                                                                            />
                                                                        );
                                                                    }
                                                                }
                                                            );
                                                        })()}
                                                    </div>
                                                    <div className="mx-3 border-bottom border-weak" />
                                                </>
                                            ) : null}

                                            {isB2bPlan && (
                                                <>
                                                    <div className="mx-3 text-bold flex flex-justify-space-between text-rg gap-2">
                                                        <span>{getTotalBillingText(options.cycle)}</span>
                                                        <span>
                                                            {loadingPaymentDetails ? (
                                                                <CircleLoader />
                                                            ) : (
                                                                <Price currency={options.currency}>
                                                                    {options.checkResult.Amount}
                                                                </Price>
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="mx-3 border-bottom border-weak" />
                                                </>
                                            )}

                                            {isB2bPlan && (
                                                <>
                                                    <div className="mx-3">
                                                        <GiftCodeSummary
                                                            coupon={coupon}
                                                            onApplyCode={async (code) => {
                                                                const checkResult = await getSubscriptionPrices(
                                                                    silentApi,
                                                                    options.planIDs,
                                                                    options.currency,
                                                                    options.cycle,
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
                                                                    silentApi,
                                                                    options.planIDs,
                                                                    options.currency,
                                                                    options.cycle
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
                                                    </div>
                                                    <div className="mx-3 border-bottom border-weak" />
                                                </>
                                            )}

                                            <div className="mx-3 flex flex-column gap-2">
                                                {showLifetimeDeal && selectedCycleCheckout.discountPercent > 0 && (
                                                    <div className={clsx('flex flex-justify-space-between text-rg')}>
                                                        <span>{c('specialoffer: Label').t`Lifetime deal`}</span>
                                                        <span>
                                                            <span className="color-success">
                                                                {(() => {
                                                                    const discountPercentage = `−${selectedCycleCheckout.discountPercent}%`;
                                                                    return c('Info').t`${discountPercentage} forever`;
                                                                })()}
                                                            </span>
                                                        </span>
                                                    </div>
                                                )}

                                                <div
                                                    className={clsx(
                                                        'text-bold',
                                                        'flex flex-justify-space-between text-rg gap-2'
                                                    )}
                                                >
                                                    <span>
                                                        {isB2bPlan
                                                            ? c('Info').t`Amount due`
                                                            : getTotalBillingText(options.cycle)}
                                                    </span>
                                                    <span>
                                                        {loadingPaymentDetails ? (
                                                            <CircleLoader />
                                                        ) : (
                                                            <Price currency={options.currency}>
                                                                {options.checkResult.AmountDue}
                                                            </Price>
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="text-sm color-weak">
                                                    <span>{getRenewalNoticeText({ renewCycle: options.cycle })}</span>
                                                </div>
                                            </div>
                                        </div>
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
                    onClose={handleCloseUpsellModal}
                />
            )}
        </Layout>
    );
};

export default Step1;
