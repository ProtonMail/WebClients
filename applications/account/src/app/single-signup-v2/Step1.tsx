import type { Dispatch, MutableRefObject, ReactNode, SetStateAction } from 'react';
import { Fragment, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Button, Href, InlineLinkButton, Vr } from '@proton/atoms';
import type { IconName } from '@proton/components';
import {
    CurrencySelector,
    CycleSelector,
    Icon,
    SkeletonLoader,
    getCheckoutRenewNoticeText,
    useErrorHandler,
    useHandler,
    useModalState,
} from '@proton/components';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { useIsChargebeeEnabled } from '@proton/components/containers/payments/PaymentSwitcher';
import { getShortBillingText } from '@proton/components/containers/payments/subscription/helpers';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { useCurrencies } from '@proton/components/payments/client-extensions/useCurrencies';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import { useLoading } from '@proton/hooks';
import { IcTag } from '@proton/icons';
import metrics from '@proton/metrics';
import {
    type BillingAddress,
    COUPON_CODES,
    CYCLE,
    type Currency,
    type FullPlansMap,
    PLANS,
    type PlanIDs,
    getFallbackCurrency,
    getPlansMap,
    isRegionalCurrency,
} from '@proton/payments';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import type { ActiveSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import {
    APPS,
    BRAND_NAME,
    DRIVE_APP_NAME,
    PASS_APP_NAME,
    SSO_PATHS,
    WALLET_APP_NAME,
} from '@proton/shared/lib/constants';
import { getCheckout, getOptimisticCheckResult } from '@proton/shared/lib/helpers/checkout';
import {
    getPlanFromPlanIDs,
    getPricingFromPlanIDs,
    getTotalFromPricing,
    switchPlan,
} from '@proton/shared/lib/helpers/planIDs';
import { getHas2024OfferCoupon, getPlanIDs, getPlanOffer } from '@proton/shared/lib/helpers/subscription';
import type { Api, Cycle, SubscriptionPlan, VPNServersCountData } from '@proton/shared/lib/interfaces';
import { Audience } from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';
import { isFree } from '@proton/shared/lib/user/helpers';
import simpleLoginLogo from '@proton/styles/assets/img/illustrations/simplelogin-logo.svg';
import { useFlag } from '@proton/unleash';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { usePublicTheme } from '../containers/PublicThemeProvider';
import { getLocaleTermsURL } from '../content/helper';
import SignupSupportDropdown from '../signup/SignupSupportDropdown';
import { getSubscriptionPrices } from '../signup/helper';
import type { SignupCacheResult, SubscriptionData } from '../signup/interfaces';
import { SignupType } from '../signup/interfaces';
import type { AccountStepDetailsRef } from './AccountStepDetails';
import AccountStepDetails from './AccountStepDetails';
import type { AccountStepPaymentRef } from './AccountStepPayment';
import AccountStepPayment from './AccountStepPayment';
import AccountSwitcherItem from './AccountSwitcherItem';
import AudienceTabs from './Audience';
import Box from './Box';
import BoxContent from './BoxContent';
import BoxHeader from './BoxHeader';
import FeatureItem from './FeatureItem';
import Guarantee from './Guarantee';
import Layout from './Layout';
import { PlanCardSelector } from './PlanCardSelector';
import RightSummary from './RightSummary';
import { getAccessiblePlans, getFreeSubscriptionData, getSubscriptionMapping } from './helper';
import type {
    Measure,
    OnOpenLogin,
    OnOpenSwitch,
    OptimisticOptions,
    SignupConfiguration,
    SignupModelV2,
    SignupParameters2,
} from './interface';
import { SignupMode, UpsellTypes } from './interface';
import DriveTrial2024UpsellModal from './modals/DriveTrial2024UpsellModal';
import MailTrial2024UpsellModal from './modals/MailTrial2024UpsellModal';
import { type CheckTrialPriceParams, type CheckTrialPriceResult, checkTrialPrice } from './modals/Trial2024UpsellModal';

import './Step1.scss';

export interface Step1Rref {
    scrollIntoPayment: () => void;
}

const Step1 = ({
    signupConfiguration: {
        logo,
        features,
        title,
        productAppName: appName,
        product: app,
        benefits,
        signupTypes,
        cycles,
        planCards,
        audience,
        audiences,
    },
    initialSessionsLength,
    signupParameters,
    currentPlan,
    onComplete,
    model,
    setModel,
    api: normalApi,
    vpnServersCountData,
    onOpenLogin,
    onOpenSwitch,
    className,
    onSignOut,
    step1Ref,
    activeSessions,
    measure,
    mode,
    onChangeCurrency,
}: {
    initialSessionsLength: boolean;
    signupConfiguration: SignupConfiguration;
    signupParameters: SignupParameters2;
    relativePrice: string | undefined;
    isLargeViewport: boolean;
    vpnServersCountData: VPNServersCountData;
    measure: Measure;
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
    onSignOut: () => Promise<void>;
    model: SignupModelV2;
    setModel: Dispatch<SetStateAction<SignupModelV2>>;
    currentPlan: SubscriptionPlan | undefined;
    mode: SignupMode;
    api: Api;
    onOpenLogin: OnOpenLogin;
    onOpenSwitch: OnOpenSwitch;
    className?: string;
    step1Ref: MutableRefObject<Step1Rref | undefined>;
    activeSessions?: ActiveSession[];
    onChangeCurrency: (newCurrency: Currency) => Promise<FullPlansMap>;
}) => {
    const mailTrialOfferEnabled = useFlag('MailTrialOffer');
    const driveTrialOfferEnabled = useFlag('DriveTrialOffer');

    const silentApi = getSilentApi(normalApi);
    const { getPaymentsApi } = usePaymentsApi();
    const handleError = useErrorHandler();
    const isChargebeeEnabled = useIsChargebeeEnabled();

    const [upsellMailTrialModal, setUpsellMailTrialModal, renderUpsellMailTrialModal] = useModalState();
    const [checkTrialResult, setCheckTrialResult] = useState<CheckTrialPriceResult | undefined>();
    const [checkingTrial, withCheckingTrial] = useLoading();

    const [upsellDriveTrialModal, setUpsellDriveTrialModal, renderUpsellDriveTrialModal] = useModalState();
    const [loadingSignup, withLoadingSignup] = useLoading();
    const [loadingSignout, withLoadingSignout] = useLoading();
    const [loadingPaymentDetails, setLoadingPaymentDetails] = useState(false);
    const accountDetailsRef = useRef<AccountStepDetailsRef>();
    const accountStepPaymentRef = useRef<AccountStepPaymentRef>();
    const theme = usePublicTheme();
    const { getAvailableCurrencies } = useCurrencies();
    const [changingCurrency, withChangingCurrency] = useLoading();

    useEffect(() => {
        metrics.core_single_signup_pageLoad_total.increment({});
    }, []);

    const availableCurrencies = getAvailableCurrencies({
        status: model.paymentMethodStatusExtended,
        plans: getAccessiblePlans({ planCards, audience, plans: model.plans }),
        user: model.session?.resumedSessionResult.User,
        subscription: model.session?.subscription,
        paramCurrency: signupParameters.currency,
    });

    const history = useHistory();

    const subscriptionCheckOptions = {
        planIDs: model.subscriptionData.planIDs,
        cycle: model.subscriptionData.cycle,
        currency: model.subscriptionData.currency,
        coupon: model.subscriptionData.checkResult.Coupon?.Code || undefined,
        billingAddress: model.subscriptionData.billingAddress,
        checkResult: model.subscriptionData.checkResult,
    };
    const options: OptimisticOptions = {
        ...subscriptionCheckOptions,
        ...model.optimistic,
    };

    const [selectedB2CCurrency, setSelectedB2CCurrency] = useState<Currency>();

    const selectedPlan = getPlanFromPlanIDs(model.plansMap, options.planIDs) || FREE_PLAN;

    const getSilentPaymentApi = async () => {
        let chargebeeEnabled = undefined;
        if (model.session?.resumedSessionResult) {
            const user = model.session.resumedSessionResult.User;
            chargebeeEnabled = await isChargebeeEnabled(model.session.resumedSessionResult.UID, async () => user);
        }
        return getPaymentsApi(silentApi, chargebeeEnabled?.result);
    };

    const latestRef = useRef<any>();
    const check = async (values: {
        currency: Currency;
        planIDs: PlanIDs;
        cycle: Cycle;
        billingAddress: BillingAddress;
        coupon?: string;
    }) => {
        const paymentsApi = await getSilentPaymentApi();
        return getSubscriptionPrices(
            paymentsApi,
            values.planIDs,
            values.currency,
            values.cycle,
            values.billingAddress,
            values.coupon
        );
    };

    const handleOptimisticCheck = async (optimistic: Parameters<typeof check>[0], latest: any) => {
        try {
            const checkResult = await check(optimistic);
            if (latestRef.current === latest) {
                setModel((old) => ({
                    ...old,
                    subscriptionData: {
                        ...old.subscriptionData,
                        currency: optimistic.currency,
                        cycle: optimistic.cycle,
                        planIDs: optimistic.planIDs,
                        checkResult,
                        billingAddress: optimistic.billingAddress,
                    },
                    optimistic: {},
                }));
            }
        } catch (e) {
            if (latestRef.current === latest) {
                handleError(e);
                // Reset any optimistic state on failures
                setModel((old) => ({
                    ...old,
                    optimistic: {},
                }));
                return;
            }
        } finally {
            if (latestRef.current === latest) {
                setLoadingPaymentDetails(false);
            }
        }
    };

    const debouncedCheck = useHandler(
        (optimistic: Parameters<typeof check>[0], latest: any) => {
            handleOptimisticCheck(optimistic, latest).catch(noop);
        },
        { debounce: 400 }
    );

    const handleOptimistic = (checkOptions: Partial<OptimisticOptions>) => {
        if (model.session?.state.payable === false) {
            return;
        }
        const mergedCheckOptions = {
            ...model.optimistic,
            ...checkOptions,
        };
        const completeCheckOptions = {
            ...subscriptionCheckOptions,
            coupon: subscriptionCheckOptions.coupon || signupParameters.coupon,
            ...mergedCheckOptions,
        };
        const optimisticCheckResult = getOptimisticCheckResult({
            plansMap: model.plansMap,
            planIDs: completeCheckOptions.planIDs,
            cycle: completeCheckOptions.cycle,
            currency: completeCheckOptions.currency,
        });

        setModel((old) => {
            const result = {
                ...old,
                optimistic: {
                    ...mergedCheckOptions,
                    checkResult: optimisticCheckResult,
                },
            };

            if (checkOptions.currency && old.subscriptionData.currency !== checkOptions.currency) {
                const plansMap = getPlansMap(model.plans, checkOptions.currency, false);
                result.plansMap = plansMap;
            }

            return result;
        });
        const latest = {};
        latestRef.current = latest;
        setLoadingPaymentDetails(true);
        debouncedCheck(completeCheckOptions, latest);
    };

    const handleChangeCurrency = async (currency: Currency): Promise<Currency> => {
        if (model.loadingDependencies) {
            return options.currency;
        }
        void measure({ event: TelemetryAccountSignupEvents.currencySelect, dimensions: { currency } });

        const newPlansMap = await onChangeCurrency(currency);
        const hasCurrentPlanInNewCurrency = !!newPlansMap[selectedPlan.Name];

        if (!hasCurrentPlanInNewCurrency) {
            handleOptimistic({ currency, planIDs: {} });
        } else {
            handleOptimistic({ currency });
        }

        return currency;
    };

    const handleChangeCycle = (cycle: Cycle) => {
        if (model.loadingDependencies) {
            return;
        }
        measure({ event: TelemetryAccountSignupEvents.cycleSelect, dimensions: { cycle: `${cycle}` } });
        return handleOptimistic({ cycle });
    };

    const handleChangePlan = (planIDs: PlanIDs, planName: PLANS, currencyOverride?: Currency) => {
        if (model.loadingDependencies) {
            return;
        }
        measure({ event: TelemetryAccountSignupEvents.planSelect, dimensions: { plan: planName } });

        const currency = currencyOverride ?? getPlanFromPlanIDs(model.plansMap, planIDs)?.Currency;
        const checkOptions: Partial<OptimisticOptions> = {
            planIDs,
        };

        if (currency) {
            checkOptions.currency = currency;
        }

        if (model.session?.subscription && model.session.organization && model.plansMap[planName]) {
            const switchedPlanIds = switchPlan({
                planIDs: getPlanIDs(model.session.subscription),
                planID: planName,
                organization: model.session.organization,
                plans: model.plans,
                user: model.session.resumedSessionResult.User,
            });

            checkOptions.planIDs = switchedPlanIds;
        }

        return handleOptimistic(checkOptions);
    };

    useImperativeHandle(step1Ref, () => ({
        scrollIntoPayment: () => accountStepPaymentRef.current?.scrollIntoView(),
    }));

    const disableInitialFormSubmit = model.loadingDependencies;

    const handleCompletion = async (subscriptionData: SubscriptionData, type?: 'signup-token') => {
        if (disableInitialFormSubmit) {
            return;
        }

        if (model.session?.resumedSessionResult.User) {
            return onComplete({ subscriptionData, type: 'existing' });
        }

        const accountData = await accountDetailsRef.current?.data();
        if (!accountData) {
            throw new Error('Invalid data');
        }
        return onComplete({ subscriptionData, accountData, type: type || 'signup' });
    };

    const cycleOptions = cycles.map((cycle) => ({
        text: getShortBillingText(cycle, options.planIDs),
        value: cycle,
    }));

    const cta = (() => {
        if (mode === SignupMode.MailReferral && selectedPlan.Name !== PLANS.FREE) {
            return c('Action in trial plan').t`Try free for 30 days`;
        }
        if (
            app === APPS.PROTONWALLET &&
            selectedPlan.Name === PLANS.FREE &&
            mode !== SignupMode.Invite &&
            !model.session
        ) {
            return c('wallet_signup_2024: Info').t`Create ${BRAND_NAME} Account now`;
        }
        return c('pass_signup_2023: Action').t`Start using ${appName} now`;
    })();

    const hasSelectedFree = selectedPlan.Name === PLANS.FREE || mode === SignupMode.MailReferral;

    const termsAndConditionsLink = (
        <Href className="color-weak" key="terms" href={getLocaleTermsURL(app)}>
            {
                // translator: Full sentence "By creating a Proton account, you agree to our terms and conditions"
                c('new_plans: signup').t`terms and conditions`
            }
        </Href>
    );

    const termsAndConditions = (
        <div className="mt-4 text-sm color-weak text-center">
            {c('pass_signup_2023: Info').jt`By continuing, you agree to our ${termsAndConditionsLink}`}
        </div>
    );

    const isDarkBg = theme.dark;

    let step = 1;

    const hidePlanSelectorCoupons = new Set([COUPON_CODES.TRYMAILPLUS2024, COUPON_CODES.MAILPLUSINTRO]);
    let hasPlanSelector =
        !model.planParameters?.defined &&
        ([SignupMode.Default, SignupMode.MailReferral].includes(mode) ||
            (mode === SignupMode.Invite && app === APPS.PROTONWALLET)) &&
        !hidePlanSelectorCoupons.has(model.subscriptionData.checkResult.Coupon?.Code as any) &&
        !hidePlanSelectorCoupons.has(model.optimistic.coupon as any) &&
        // Don't want to show an incomplete plan selector when the user has access to have a nicer UI
        !model.session?.state.access;

    // Porkbun payment should always show the plan selector
    const hasUser = Boolean(model.session?.resumedSessionResult.UID);
    const isPorkbunPayment = hasUser && signupParameters.invite?.type === 'porkbun';
    hasPlanSelector = hasPlanSelector || isPorkbunPayment;
    const hasUserSelector = !isPorkbunPayment;

    const checkout = getCheckout({
        planIDs: options.planIDs,
        plansMap: model.plansMap,
        checkResult: options.checkResult,
    });

    const showRenewalNotice = !hasSelectedFree;
    const renewalNotice = showRenewalNotice && (
        <div className="w-full text-sm color-norm opacity-70">
            *
            {getCheckoutRenewNoticeText({
                coupon: options.checkResult.Coupon,
                cycle: options.cycle,
                plansMap: model.plansMap,
                planIDs: options.planIDs,
                checkout,
                currency: options.currency,
                subscription: model.session?.subscription,
            })}
        </div>
    );

    /**
     * If there is a regional currency then B2C plans can have plans in this currency while B2B plans do not.
     * In that case, we need to automatically select the fallback currency for B2B plans.
     */
    const handleCurrencyChangeOnAudienceChange = async (newAudience: Audience): Promise<Currency | undefined> => {
        if (audience === newAudience) {
            return;
        }

        // optionally switch B2C currency back to regional when the audience changes
        {
            const oldAudience = audience;
            // if user previously selected regional currency for B2C audience, then use it
            // if the previously selected currency isn't regional then preserve the current currency choice in B2B tab
            if (selectedB2CCurrency && isRegionalCurrency(selectedB2CCurrency) && newAudience === Audience.B2C) {
                return handleChangeCurrency(selectedB2CCurrency);
            }

            // save the user choice for future use
            if (oldAudience === Audience.B2C) {
                setSelectedB2CCurrency(options.currency);
            }
        }

        const newAudiencePlans = getAccessiblePlans({ planCards, audience: newAudience, plans: model.plans });

        const newAudienceHasPlansWithSelectedCurrency =
            newAudiencePlans.map((plan) => model.subscriptionDataCycleMapping[plan.Name]).filter(isTruthy).length > 0;

        // If the currently selected currency is available for the new audience, we don't need to artificially
        // change the currency
        if (newAudienceHasPlansWithSelectedCurrency) {
            return;
        }

        const newAvailableCurrency = getFallbackCurrency(options.currency);

        return handleChangeCurrency(newAvailableCurrency);
    };

    const afterLogo = (() => {
        if (mode === SignupMode.PassSimpleLogin) {
            return (
                <>
                    <Vr className="h-custom mr-6 lg:mr-8 opacity-50 hidden md:flex" style={{ '--h-custom': '2rem' }} />
                    <img className="mb-0.5" src={simpleLoginLogo} alt="SimpleLogin" />
                </>
            );
        }
        // Hide audience tabs
        if (isPorkbunPayment) {
            return;
        }
        if (hasPlanSelector && location.pathname !== SSO_PATHS.BUSINESS_SIGNUP) {
            return (
                <AudienceTabs
                    audience={audience}
                    audiences={audiences}
                    onChangeAudience={async (newAudience) => {
                        const newCurrency = await handleCurrencyChangeOnAudienceChange(newAudience.value);
                        handleChangePlan({ [newAudience.defaultPlan]: 1 }, newAudience.defaultPlan, newCurrency);
                        history.push(newAudience.locationDescriptor);
                    }}
                />
            );
        }
        return undefined;
    })();

    const boxWidth = { '--max-w-custom': planCards[audience].length === 4 && hasPlanSelector ? '74rem' : '57rem' };

    const currencySelector =
        // Paid users can't change the currency. Only new and free existing users can change it.
        !model.session?.resumedSessionResult.User || isFree(model.session.resumedSessionResult.User) ? (
            <CurrencySelector
                currencies={availableCurrencies}
                mode="select-two"
                className="h-full ml-auto px-3 color-primary relative interactive-pseudo interactive--no-background"
                currency={options.currency}
                loading={changingCurrency}
                onSelect={(newCurrency) => {
                    void withChangingCurrency(handleChangeCurrency(newCurrency));
                }}
                unstyled
            />
        ) : null;

    const fetchTrialPrice = async (planName: CheckTrialPriceParams['planName']) => {
        const run = async () => {
            const paymentsApi = await getSilentPaymentApi();
            const checkTrialResult = await checkTrialPrice({
                paymentsApi,
                plansMap: model.plansMap,
                currency: options.currency,
                planName,
            });

            return checkTrialResult;
        };

        const resultPromise = run();
        withCheckingTrial(resultPromise).catch(noop);
        const result = await resultPromise;

        setCheckTrialResult(result);
    };

    const upsellModalCommonProps = {
        checkTrialResult: checkTrialResult as CheckTrialPriceResult,
        onConfirm: async (data: { planIDs: PlanIDs; cycle: Cycle; coupon: string }) => handleOptimistic(data),
        onContinue: async () => {
            void withLoadingSignup(handleCompletion(getFreeSubscriptionData(model.subscriptionData))).catch(noop);
        },
    };

    const boldDiscountPercent = (
        <b key="bold-discount-percent">{
            // full sentence: Your 10% discount to Proton Pass has been applied
            c('Info').t`${checkout.discountPercent}% discount`
        }</b>
    );
    const boldPlanTitle = <b key="bold-plan-title">{selectedPlan.Title}</b>;

    const planSelectorHeaderMiddleText = useMemo(() => {
        if (!isPorkbunPayment) {
            return undefined;
        }

        const isFreePlan = selectedPlan.Name === PLANS.FREE;
        const planIDs = isFreePlan ? {} : { [selectedPlan.Name]: 1 };
        const pricing = getPricingFromPlanIDs(planIDs, model.plansMap);
        const totals = getTotalFromPricing(pricing, options.cycle);
        let discountPercent = totals.discountPercentage;

        const cycleMapping = getSubscriptionMapping({
            subscriptionDataCycleMapping: model.subscriptionDataCycleMapping,
            planIDs,
            planName: selectedPlan.Name,
        })?.[options.cycle];

        if (cycleMapping) {
            const checkout = getCheckout({
                planIDs,
                plansMap: model.plansMap,
                checkResult: cycleMapping.checkResult,
            });
            discountPercent = checkout.discountPercent;
        }

        if (discountPercent > 0) {
            return (
                <span className="color-success">
                    {c('pass_signup_2023: Header').t`Including ${discountPercent}% Porkbun discount`}
                </span>
            );
        }

        return undefined;
    }, [isPorkbunPayment, selectedPlan.Name, model.plansMap, model.subscriptionDataCycleMapping, options.cycle]);

    return (
        <Layout
            afterLogo={afterLogo}
            logo={logo}
            footer={renewalNotice}
            hasDecoration
            bottomRight={<SignupSupportDropdown isDarkBg={isDarkBg} />}
            className={className}
            footerWidth={boxWidth}
        >
            {renderUpsellMailTrialModal && (
                <MailTrial2024UpsellModal {...upsellMailTrialModal} {...upsellModalCommonProps} />
            )}
            {renderUpsellDriveTrialModal && (
                <DriveTrial2024UpsellModal {...upsellDriveTrialModal} {...upsellModalCommonProps} />
            )}
            <div className="flex items-center flex-column">
                {title}
                {hasPlanSelector && model.upsell.mode !== UpsellTypes.UPSELL && (
                    <div className="flex flex-nowrap mb-4 gap-1 md:gap-8 text-sm md:text-rg">
                        {features.map(({ key, left, text }, i, arr) => {
                            return (
                                <Fragment key={key}>
                                    <FeatureItem left={left} text={text} />
                                    {i !== arr.length - 1 && (
                                        <Vr className="min-h-custom" style={{ '--min-h-custom': '2.25rem' }} />
                                    )}
                                </Fragment>
                            );
                        })}
                    </div>
                )}

                {(() => {
                    if (!checkout.discountPercent) {
                        return;
                    }

                    if (isPorkbunPayment) {
                        return;
                    }

                    if (model.loadingDependencies) {
                        return <SkeletonLoader width="36em" height="2.5rem" index={0} className="mt-4" />;
                    }

                    return (
                        <div className="single-signup-discount-banner flex-nowrap mt-4 text-lg rounded px-4 py-2 flex gap-2">
                            <div className="shrink-0 flex items-center">
                                <IcTag size={4} />
                            </div>

                            <span className="text-center">
                                {
                                    // full sentence: Your 10% discount to Proton Pass has been applied
                                    c('Info').jt`Your ${boldDiscountPercent} to ${boldPlanTitle} has been applied`
                                }
                            </span>
                        </div>
                    );
                })()}

                {(() => {
                    if (model.loadingDependencies) {
                        return;
                    }

                    if (isPorkbunPayment) {
                        // Don't show any offers for Porkbun
                        return;
                    }

                    const wrap = (iconName: IconName | null, textLaunchOffer: ReactNode) => {
                        return (
                            <div className="signup-v2-offer-banner py-2 px-4 rounded-lg md:text-lg inline-flex flex-nowrap mt-4">
                                {iconName && <Icon name={iconName} size={3.5} className="shrink-0 mt-1" />}
                                <span className="ml-2 flex-1">{textLaunchOffer}</span>
                            </div>
                        );
                    };

                    if (signupParameters.mode === SignupMode.PassSimpleLogin) {
                        return (
                            <div
                                className="text-center text-lg mt-2 max-w-custom"
                                style={{ '--max-w-custom': '40rem' }}
                            >
                                {c('Info')
                                    .t`${PASS_APP_NAME} is the next generation password manager designed for ease of use and productivity. Open source, co-developed by SimpleLogin and ${BRAND_NAME}.`}
                            </div>
                        );
                    }

                    if (signupParameters.invite?.type === 'pass') {
                        const inviterEmailJSX = <strong key="invite">{signupParameters.invite.data.inviter}</strong>;
                        return wrap(
                            'user',
                            <>
                                <span className="block">
                                    {c('Info').jt`${inviterEmailJSX} wants to share data with you in ${PASS_APP_NAME}`}
                                </span>
                                {c('Info')
                                    .t`Get access by creating a ${BRAND_NAME} account and accepting the invitation.`}
                            </>
                        );
                    }

                    if (
                        selectedPlan.Name === PLANS.VISIONARY &&
                        model.upsell.mode !== UpsellTypes.UPSELL &&
                        mode !== SignupMode.Invite
                    ) {
                        const plan = `${BRAND_NAME} Visionary`;
                        let text;
                        if (app === APPS.PROTONWALLET) {
                            const appName = WALLET_APP_NAME;
                            text = getBoldFormattedText(
                                c('wallet_signup_2024: Info').t`**Get ${plan}** for early access to ${appName}!`
                            );
                        } else {
                            text = getBoldFormattedText(
                                c('mail_signup_2023: Info').t`**Get ${plan}** for a limited time!`
                            );
                        }
                        return wrap('hourglass', text);
                    }

                    const mailOfferPlans = [PLANS.BUNDLE_PRO_2024, PLANS.MAIL_BUSINESS, PLANS.MAIL_PRO];

                    const businessYearlyCycle =
                        model.subscriptionDataCycleMapping[selectedPlan.Name as PLANS]?.[CYCLE.YEARLY];
                    if (
                        mailOfferPlans.includes(selectedPlan.Name as PLANS) &&
                        !!businessYearlyCycle?.checkResult.Coupon?.Code
                    ) {
                        const textLaunchOffer = getBoldFormattedText(
                            c('mail_signup_2024: Info').t`Limited time offer: **Get up to 35% off** yearly plans`
                        );
                        return wrap('hourglass', textLaunchOffer);
                    }

                    const hasOptimistic2024OfferCoupon = getHas2024OfferCoupon(options.coupon);
                    const has2024OfferCoupon = getHas2024OfferCoupon(options.checkResult.Coupon?.Code);

                    // Using real coupon to show the correct discount percentage
                    if (has2024OfferCoupon) {
                        const discount = checkout.discountPercent;
                        return wrap(
                            'bag-percent',
                            c('pass_signup_2023: Info').jt`Your ${discount}% Black Friday discount has been applied`
                        );
                    }

                    // Using optimistic coupon to avoid this displaying before above is finished
                    if (
                        selectedPlan.Name === PLANS.DUO &&
                        options.cycle === CYCLE.YEARLY &&
                        !hasOptimistic2024OfferCoupon
                    ) {
                        const discount = getSimplePriceString(options.currency, checkout.discountPerCycle, '');
                        const name = selectedPlan.Title;
                        const textLaunchOffer = getBoldFormattedText(
                            c('mail_signup_2024: Info')
                                .t`Limited time offer: **Save ${discount} on ${name} with a 1-year plan**`
                        );
                        return wrap('hourglass', textLaunchOffer);
                    }

                    if (
                        selectedPlan.Name === PLANS.DRIVE &&
                        options.checkResult.Coupon?.Code === COUPON_CODES.TRYDRIVEPLUS2024
                    ) {
                        const title = selectedPlan.Title;
                        const price = (
                            <strong key="price">
                                {getSimplePriceString(options.currency, checkout.withDiscountPerMonth)}
                            </strong>
                        );
                        return wrap(
                            'hourglass',
                            c('pass_signup_2023: Info').jt`Limited time offer: ${title} for ${price} for the 1st month`
                        );
                    }

                    if (!hasPlanSelector || model.upsell.mode === UpsellTypes.UPSELL) {
                        return null;
                    }

                    const passBizYearlyCycle = model.subscriptionDataCycleMapping[PLANS.PASS_BUSINESS]?.[CYCLE.YEARLY];
                    if (
                        audience === Audience.B2B &&
                        options.cycle === CYCLE.YEARLY &&
                        passBizYearlyCycle &&
                        !!passBizYearlyCycle.checkResult.Coupon?.Code
                    ) {
                        const checkout = getCheckout({
                            planIDs: { [PLANS.PASS_BUSINESS]: 1 },
                            plansMap: model.plansMap,
                            checkResult: passBizYearlyCycle.checkResult,
                        });
                        const price = (
                            <strong key="price">
                                {getSimplePriceString(options.currency, checkout.withDiscountPerMonth)}
                            </strong>
                        );
                        const title = model.plansMap[PLANS.PASS_BUSINESS]?.Title || '';
                        // translator: full sentence is: Special launch offer: Get Pass Business for ${options.currency} per user monthly!
                        const textLaunchOffer = c('pass_signup_2023: Info')
                            .jt`Limited time offer: Get ${title} for ${price} per user monthly!`;
                        return wrap('hourglass', textLaunchOffer);
                    }

                    const bestPlanCard = planCards[audience].find((planCard) => planCard.type === 'best');
                    const bestPlan = bestPlanCard?.plan && model.plansMap[bestPlanCard.plan];
                    if (!bestPlanCard || !bestPlan) {
                        return null;
                    }

                    const planOffer = getPlanOffer(bestPlan);
                    if (!planOffer.valid) {
                        return null;
                    }

                    const cycle = planOffer.cycles[0];

                    const pricing = getPricingFromPlanIDs({ [bestPlan.Name]: 1 }, model.plansMap);
                    const totals = getTotalFromPricing(pricing, cycle);
                    const title = bestPlan.Title;

                    const price = (
                        <strong key="price">
                            {getSimplePriceString(options.currency, totals.totalPerMonth, ` ${c('Suffix').t`/month`}`)}
                        </strong>
                    );
                    // translator: full sentence is: Special launch offer: Get Pass Plus for ${options.currency} 1 /month forever!
                    const textLaunchOffer = c('pass_signup_2023: Info')
                        .jt`Special launch offer: Get ${title} for ${price} forever!`;
                    return wrap('hourglass', textLaunchOffer);
                })()}
                {hasPlanSelector && (
                    <>
                        <Box className="mt-8 w-full max-w-custom" style={boxWidth}>
                            <BoxHeader
                                step={step++}
                                title={
                                    model.upsell.mode === UpsellTypes.PLANS
                                        ? c('pass_signup_2023: Header').t`Select your plan`
                                        : c('pass_signup_2023: Header').t`Upgrade your plan`
                                }
                                middle={planSelectorHeaderMiddleText}
                                right={
                                    <>
                                        {model.upsell.mode === UpsellTypes.PLANS &&
                                            mode !== SignupMode.MailReferral && (
                                                <CycleSelector
                                                    mode="buttons"
                                                    cycle={options.cycle}
                                                    options={cycleOptions}
                                                    onSelect={handleChangeCycle}
                                                    size="small"
                                                    color="norm"
                                                    separators={false}
                                                    shape="ghost"
                                                    className="p-1"
                                                    pill
                                                />
                                            )}
                                    </>
                                }
                            />
                            <BoxContent>
                                {(() => {
                                    const oneOfCurrenciesIsRegional =
                                        isRegionalCurrency(selectedPlan.Currency) ||
                                        (currentPlan && isRegionalCurrency(currentPlan?.Currency));

                                    const cantDisplayUpsell =
                                        selectedPlan.Currency !== currentPlan?.Currency && oneOfCurrenciesIsRegional;

                                    return model.upsell.mode === UpsellTypes.PLANS || cantDisplayUpsell ? (
                                        <PlanCardSelector
                                            subscriptionDataCycleMapping={model.subscriptionDataCycleMapping}
                                            audience={audience}
                                            plansMap={model.plansMap}
                                            selectedPlanName={selectedPlan.Name}
                                            cycle={options.cycle}
                                            currency={options.currency}
                                            dark={theme.dark}
                                            planCards={planCards[audience]}
                                            onSelect={handleChangePlan}
                                            onSelectedClick={() => {
                                                accountDetailsRef.current?.scrollInto('email');
                                            }}
                                            loading={model.loadingDependencies}
                                        />
                                    ) : null;
                                })()}
                                {model.upsell.mode === UpsellTypes.PLANS && (
                                    <>
                                        <div className="flex justify-center lg:justify-end">
                                            <div className="inline-block mt-3 mb-2">{currencySelector}</div>
                                        </div>
                                        <div
                                            className={clsx(
                                                hasSelectedFree && 'visibility-hidden',
                                                'flex justify-center'
                                            )}
                                        >
                                            <Guarantee />
                                        </div>
                                    </>
                                )}
                            </BoxContent>
                        </Box>
                    </>
                )}
                {hasUserSelector && (
                    <Box className="mt-12 w-full max-w-custom" style={boxWidth}>
                        {(() => {
                            const user = model?.session?.resumedSessionResult.User;
                            const hasUserStepOptimistic = model.loadingDependencies && initialSessionsLength;
                            const hasUserStep = (user && !loadingSignout) || hasUserStepOptimistic;

                            const hasBenefits = !hasUserStep;

                            const step2Summary = (
                                <RightSummary
                                    variant={isDarkBg ? 'gradientBorder' : 'gradient'}
                                    className={clsx(
                                        'p-6 hidden md:flex rounded-xl',
                                        !hasBenefits && 'visibility-hidden'
                                    )}
                                >
                                    {hasBenefits ? benefits : null}
                                </RightSummary>
                            );

                            const createANewAccount = (
                                <InlineLinkButton
                                    key="create-a-new-account"
                                    onClick={() => {
                                        withLoadingSignout(onSignOut()).catch(noop);
                                    }}
                                >
                                    {c('pass_signup_2023: Action').t`create a new account`}
                                </InlineLinkButton>
                            );

                            const willShowStep2 = !hasSelectedFree;
                            const willHaveSingleStep = step === 1 && !willShowStep2;
                            const accountStep = willHaveSingleStep ? undefined : step++;

                            if (hasUserStepOptimistic && signupParameters.invite?.type === 'porkbun') {
                                return <SkeletonLoader width="100%" height="18rem" index={1} />;
                            }

                            if (hasUserStep) {
                                return (
                                    <>
                                        <BoxHeader
                                            step={accountStep}
                                            title={c('pass_signup_2023: Header')
                                                .t`Continue with your ${BRAND_NAME} account`}
                                        />
                                        <BoxContent>
                                            <div className="flex justify-space-between gap-10 lg:gap-20">
                                                <div className="flex-1 w-0">
                                                    {(() => {
                                                        if (hasUserStepOptimistic) {
                                                            return (
                                                                <SkeletonLoader width="100%" height="4.5em" index={1} />
                                                            );
                                                        }
                                                        if (user) {
                                                            return (
                                                                <AccountSwitcherItem
                                                                    data-testid="account-switcher-item"
                                                                    user={user}
                                                                    right={
                                                                        (activeSessions?.length || 0) > 1 ? (
                                                                            <Button
                                                                                color="norm"
                                                                                onClick={onOpenSwitch}
                                                                                shape="ghost"
                                                                            >
                                                                                {c('Action').t`Switch account`}
                                                                            </Button>
                                                                        ) : undefined
                                                                    }
                                                                />
                                                            );
                                                        }
                                                    })()}
                                                    {hasSelectedFree && (
                                                        <Button
                                                            color="norm"
                                                            pill
                                                            size="large"
                                                            className="mt-6 block mx-auto"
                                                            onClick={async () => {
                                                                await handleCompletion(
                                                                    getFreeSubscriptionData(model.subscriptionData)
                                                                );
                                                            }}
                                                        >
                                                            {cta}
                                                        </Button>
                                                    )}
                                                    <div
                                                        className={clsx(
                                                            'text-center',
                                                            hasSelectedFree ? 'mt-4' : 'mt-6',
                                                            hasUserStepOptimistic && 'visibility-hidden'
                                                        )}
                                                    >
                                                        {
                                                            // translator: Full sentence "Or create a new account"
                                                            c('pass_signup_2023: Action').jt`Or ${createANewAccount}`
                                                        }
                                                    </div>
                                                </div>
                                                {step2Summary}
                                            </div>
                                        </BoxContent>
                                    </>
                                );
                            }

                            const showSignIn =
                                signupParameters.signIn &&
                                (signupParameters.mode !== SignupMode.Invite ||
                                    signupParameters.invite?.type === 'drive' ||
                                    signupParameters.invite?.type === 'porkbun') &&
                                signupParameters.mode !== SignupMode.MailReferral &&
                                signupParameters.mode !== SignupMode.PassSimpleLogin;

                            return (
                                <>
                                    <BoxHeader
                                        {...(() => {
                                            if (
                                                signupParameters.invite?.type === 'wallet' ||
                                                signupParameters.invite?.type === 'pass'
                                            ) {
                                                return {
                                                    title: c('pass_signup_2023: Title').t`Create a ${appName} account`,
                                                };
                                            }

                                            if (signupParameters.invite?.type === 'drive') {
                                                return {
                                                    title: c('drive_signup_2023: Title')
                                                        .t`Create a free ${DRIVE_APP_NAME} account to securely access the file`,
                                                };
                                            }

                                            if (signupParameters.preSelectedPlan === PLANS.FREE) {
                                                return {
                                                    title: c('pass_signup_2023: Title')
                                                        .t`Create your ${BRAND_NAME} account`,
                                                };
                                            }

                                            return {
                                                title: c('pass_signup_2023: Title')
                                                    .t`Create your ${BRAND_NAME} account`,
                                                step: accountStep,
                                            };
                                        })()}
                                    />
                                    <BoxContent>
                                        <div className="flex md:flex-nowrap items-start justify-space-between gap-10 lg:gap-20">
                                            <div className="flex-1 w-0 relative">
                                                <AccountStepDetails
                                                    signupTypes={signupTypes}
                                                    {...(signupParameters.email
                                                        ? { defaultEmail: signupParameters.email }
                                                        : undefined)}
                                                    {...(() => {
                                                        const invitation = signupParameters.invite;
                                                        if (
                                                            invitation &&
                                                            (invitation.type === 'wallet' ||
                                                                invitation.type === 'pass' ||
                                                                invitation.type === 'drive' ||
                                                                invitation.type === 'porkbun')
                                                        ) {
                                                            return {
                                                                defaultEmail: invitation.data.invitee,
                                                                emailReadOnly: invitation.data.invitee !== '',
                                                                signupTypes: [SignupType.Email],
                                                            };
                                                        }
                                                    })()}
                                                    {...(signupParameters.mode === SignupMode.PassSimpleLogin
                                                        ? {
                                                              emailDescription: c('Info')
                                                                  .t`By creating a ${PASS_APP_NAME} account with your SimpleLogin email, you can manage your aliases directly from ${PASS_APP_NAME}.`,
                                                          }
                                                        : {})}
                                                    domains={model.domains}
                                                    passwordFields={true}
                                                    model={model}
                                                    measure={measure}
                                                    api={silentApi}
                                                    accountStepDetailsRef={accountDetailsRef}
                                                    disableChange={loadingSignup}
                                                    onSubmit={
                                                        hasSelectedFree
                                                            ? async () => {
                                                                  if (
                                                                      selectedPlan.Name === PLANS.FREE &&
                                                                      !signupParameters.noPromo
                                                                  ) {
                                                                      if (
                                                                          app === APPS.PROTONMAIL &&
                                                                          mailTrialOfferEnabled
                                                                      ) {
                                                                          try {
                                                                              await fetchTrialPrice(PLANS.MAIL);

                                                                              setUpsellMailTrialModal(true);

                                                                              return;
                                                                          } catch {}
                                                                      }
                                                                      if (
                                                                          app === APPS.PROTONDRIVE &&
                                                                          driveTrialOfferEnabled
                                                                      ) {
                                                                          try {
                                                                              await fetchTrialPrice(PLANS.DRIVE);

                                                                              setUpsellDriveTrialModal(true);

                                                                              return;
                                                                          } catch {}
                                                                      }
                                                                  }

                                                                  let subscriptionData = getFreeSubscriptionData(
                                                                      model.subscriptionData
                                                                  );
                                                                  if (
                                                                      mode === SignupMode.MailReferral &&
                                                                      selectedPlan.Name !== PLANS.FREE
                                                                  ) {
                                                                      subscriptionData = {
                                                                          ...subscriptionData,
                                                                          cycle: CYCLE.MONTHLY,
                                                                          planIDs: options.planIDs,
                                                                      };
                                                                  }
                                                                  withLoadingSignup(
                                                                      handleCompletion(subscriptionData)
                                                                  ).catch(noop);
                                                              }
                                                            : accountStepPaymentRef.current?.process
                                                    }
                                                    footer={(details) => {
                                                        return (
                                                            <>
                                                                {hasSelectedFree && (
                                                                    <div className="mb-4">
                                                                        <Button
                                                                            {...(() => {
                                                                                if (loadingSignup || checkingTrial) {
                                                                                    return { loading: true };
                                                                                }
                                                                                if (disableInitialFormSubmit) {
                                                                                    return {
                                                                                        disabled: true,
                                                                                        noDisabledStyles: true,
                                                                                    };
                                                                                }
                                                                            })()}
                                                                            type="submit"
                                                                            size="large"
                                                                            color="norm"
                                                                            className="block mx-auto"
                                                                            pill
                                                                        >
                                                                            {cta}
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                                {(showSignIn || details.emailAlreadyUsed) && (
                                                                    <div className="text-center">
                                                                        <span>
                                                                            {(() => {
                                                                                if (
                                                                                    signupParameters.signIn ===
                                                                                        'redirect' &&
                                                                                    // we don't redirect users if a coupon is present to avoid loosing the offer
                                                                                    !signupParameters.coupon
                                                                                ) {
                                                                                    const searchParams =
                                                                                        new URLSearchParams();
                                                                                    searchParams.set(
                                                                                        'email',
                                                                                        details.email
                                                                                    );
                                                                                    const signIn = (
                                                                                        <Link
                                                                                            key="signin"
                                                                                            className="link link-focus text-nowrap"
                                                                                            to={`${SSO_PATHS.SWITCH}?${searchParams.toString()}`}
                                                                                        >
                                                                                            {c('Link').t`Sign in`}
                                                                                        </Link>
                                                                                    );
                                                                                    // translator: Full sentence "Already have an account? Sign in"
                                                                                    return c('Go to sign in')
                                                                                        .jt`Already have an account? ${signIn}`;
                                                                                }

                                                                                const signIn = (
                                                                                    <InlineLinkButton
                                                                                        key="signin"
                                                                                        className="link link-focus text-nowrap"
                                                                                        onClick={() => {
                                                                                            if (
                                                                                                disableInitialFormSubmit
                                                                                            ) {
                                                                                                return;
                                                                                            }
                                                                                            onOpenLogin({
                                                                                                email: details.email.trim(),
                                                                                                location: 'step2',
                                                                                            });
                                                                                        }}
                                                                                    >
                                                                                        {c('Link').t`Sign in`}
                                                                                    </InlineLinkButton>
                                                                                );

                                                                                const switchAccount = (
                                                                                    <InlineLinkButton
                                                                                        key="switch"
                                                                                        className="link link-focus text-nowrap"
                                                                                        onClick={() => {
                                                                                            if (
                                                                                                disableInitialFormSubmit
                                                                                            ) {
                                                                                                return;
                                                                                            }
                                                                                            onOpenSwitch();
                                                                                        }}
                                                                                    >
                                                                                        {c('Link').t`switch account`}
                                                                                    </InlineLinkButton>
                                                                                );
                                                                                return (activeSessions?.length || 0) >=
                                                                                    1
                                                                                    ? // translator: Full sentence "Already have an account? Sign in or switch account"
                                                                                      c('Go to sign in')
                                                                                          .jt`Already have an account? ${signIn} or ${switchAccount}`
                                                                                    : // translator: Full sentence "Already have an account? Sign in"
                                                                                      c('Go to sign in')
                                                                                          .jt`Already have an account? ${signIn}`;
                                                                            })()}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {hasSelectedFree && termsAndConditions}
                                                            </>
                                                        );
                                                    }}
                                                />
                                            </div>
                                            {step2Summary}
                                        </div>
                                    </BoxContent>
                                </>
                            );
                        })()}
                    </Box>
                )}
                {!hasSelectedFree && (
                    <Box className="mt-12 w-full max-w-custom" style={boxWidth}>
                        <BoxHeader
                            step={step++}
                            title={c('pass_signup_2023: Header').t`Checkout`}
                            right={!hasPlanSelector ? currencySelector : null}
                        />
                        <BoxContent>
                            <AccountStepPayment
                                selectedPlan={selectedPlan}
                                measure={measure}
                                cta={cta}
                                terms={termsAndConditions}
                                key={model.session?.resumedSessionResult.UID || 'free'}
                                defaultMethod={model.session?.defaultPaymentMethod}
                                accountStepPaymentRef={accountStepPaymentRef}
                                api={normalApi}
                                model={model}
                                handleOptimistic={handleOptimistic}
                                options={options}
                                vpnServersCountData={vpnServersCountData}
                                loadingSignup={loadingSignup}
                                loadingPaymentDetails={loadingPaymentDetails || loadingSignout}
                                isDarkBg={isDarkBg}
                                signupParameters={signupParameters}
                                showRenewalNotice={showRenewalNotice}
                                onPay={async (payment, type) => {
                                    if (payment === 'signup-token') {
                                        await handleCompletion(model.subscriptionData, 'signup-token');
                                        return;
                                    }
                                    await handleCompletion({
                                        ...model.subscriptionData,
                                        payment,
                                        type,
                                    });
                                }}
                                onValidate={() => {
                                    return accountDetailsRef.current?.validate() ?? true;
                                }}
                                withLoadingSignup={withLoadingSignup}
                                onBillingAddressChange={(billingAddress: BillingAddress) => {
                                    handleOptimistic({ billingAddress });
                                }}
                            />
                        </BoxContent>
                    </Box>
                )}
            </div>
        </Layout>
    );
};

export default Step1;
