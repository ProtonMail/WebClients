import type { ComponentProps, Dispatch, MutableRefObject, ReactNode, SetStateAction } from 'react';
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
    getCheckoutRenewNoticeTextFromCheckResult,
    useActiveBreakpoint,
    useErrorHandler,
    useHandler,
    useModalState,
} from '@proton/components';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { useIsChargebeeEnabled } from '@proton/components/containers/payments/PaymentSwitcher';
import { getShortBillingText } from '@proton/components/containers/payments/subscription/helpers';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { useCurrencies } from '@proton/components/payments/client-extensions/useCurrencies';
import { InvalidZipCodeError } from '@proton/components/payments/react-extensions/errors';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import { useLoading } from '@proton/hooks';
import metrics from '@proton/metrics';
import {
    type BillingAddress,
    COUPON_CODES,
    CYCLE,
    type Currency,
    type Cycle,
    FREE_PLAN,
    type FullPlansMap,
    PLANS,
    type PlanIDs,
    type SubscriptionPlan,
    getFallbackCurrency,
    getHas2024OfferCoupon,
    getPlanFromPlanIDs,
    getPlanOffer,
    getPlansMap,
    isRegionalCurrency,
} from '@proton/payments';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import type { ActiveSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { APPS, BRAND_NAME, DRIVE_APP_NAME, PASS_APP_NAME, SSO_PATHS } from '@proton/shared/lib/constants';
import { getCheckout, getOptimisticCheckResult } from '@proton/shared/lib/helpers/checkout';
import { getPricingFromPlanIDs, getTotalFromPricing, switchPlan } from '@proton/shared/lib/helpers/planIDs';
import { getPrivacyPolicyURL } from '@proton/shared/lib/helpers/url';
import type { Api, VPNServersCountData } from '@proton/shared/lib/interfaces';
import { Audience, ChargebeeEnabled, SubscriptionMode } from '@proton/shared/lib/interfaces';
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
import { AccountFormDataContextProvider } from '../signupCtx/context/accountData/AccountFormDataContext';
import type { AccountStepDetailsRef } from './AccountStepDetails';
import AccountStepDetails from './AccountStepDetails';
import type { AccountStepPaymentRef } from './AccountStepPayment';
import AccountStepPayment from './AccountStepPayment';
import AccountSwitcherItem from './AccountSwitcherItem';
import AudienceTabs from './Audience';
import Box from './Box';
import BoxContent from './BoxContent';
import BoxHeader from './BoxHeader';
import DiscountBanner from './DiscountBanner';
import FeatureItem from './FeatureItem';
import Guarantee from './Guarantee';
import Layout from './Layout';
import { PlanCardSelector } from './PlanCardSelector';
import RightSummary from './RightSummary';
import { getAccessiblePlans, getFreeSubscriptionData, getSubscriptionMapping, getUpdatedPlanIDs } from './helper';
import {
    type Measure,
    type OnOpenLogin,
    type OnOpenSwitch,
    type OnTriggerModals,
    type OptimisticOptions,
    type SignupConfiguration,
    SignupMode,
    type SignupModelV2,
    type SignupParameters2,
    UpsellTypes,
} from './interface';
import DriveTrial2024UpsellModal from './modals/DriveTrial2024UpsellModal';
import MailTrial2024UpsellModal from './modals/MailTrial2024UpsellModal';
import PassTrial2024UpsellModal from './modals/PassTrial2024UpsellModal';
import { type CheckTrialPriceParams, type CheckTrialPriceResult, checkTrialPrice } from './modals/Trial2024UpsellModal';
import PassLifetimeSpecialOffer from './pass/LifetimeOfferMessage';
import PassLifetimeFeaturedSection from './pass/PassLifetimeFeaturedSection';

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
    onTriggerModals,
    className,
    onSignOut,
    step1Ref,
    activeSessions,
    measure,
    mode,
    onChangeCurrency,
    signupTrial,
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
    onTriggerModals: OnTriggerModals;
    onOpenLogin: OnOpenLogin;
    onOpenSwitch: OnOpenSwitch;
    className?: string;
    step1Ref: MutableRefObject<Step1Rref | undefined>;
    activeSessions?: ActiveSession[];
    onChangeCurrency: (newCurrency: Currency) => Promise<FullPlansMap>;
    // true iff trial detected through signupParameters (thus the signup prefix)
    // We do not use signupParameters.trial because trials only applies to the B2B audience
    signupTrial: boolean;
}) => {
    const mailTrialOfferEnabled = useFlag('MailTrialOffer');
    const driveTrialOfferEnabled = useFlag('DriveTrialOffer');
    const passTrialOfferEnabled = useFlag('PassTrialOffer');

    const silentApi = getSilentApi(normalApi);
    const { getPaymentsApi } = usePaymentsApi();
    const handleError = useErrorHandler();
    const isChargebeeEnabled = useIsChargebeeEnabled();

    const [upsellMailTrialModal, setUpsellMailTrialModal, renderUpsellMailTrialModal] = useModalState();
    const [checkTrialResult, setCheckTrialResult] = useState<CheckTrialPriceResult | undefined>();
    const [checkingTrial, withCheckingTrial] = useLoading();

    const [isFormValid, setIsFormValid] = useState(false);

    const [upsellDriveTrialModal, setUpsellDriveTrialModal, renderUpsellDriveTrialModal] = useModalState();
    const [upsellPassTrialModal, setUpsellPassTrialModal, renderUpsellPassTrialModal] = useModalState();
    const [loadingSignup, withLoadingSignup] = useLoading();
    const [loadingSignout, withLoadingSignout] = useLoading();
    const [loadingPaymentDetails, setLoadingPaymentDetails] = useState(false);
    const accountDetailsRef = useRef<AccountStepDetailsRef>();
    const accountStepPaymentRef = useRef<AccountStepPaymentRef>();
    const theme = usePublicTheme();
    const { getAvailableCurrencies } = useCurrencies();
    const [changingCurrency, withChangingCurrency] = useLoading();

    const { viewportWidth } = useActiveBreakpoint();

    useEffect(() => {
        metrics.core_single_signup_pageLoad_total.increment({});
    }, []);

    const history = useHistory();

    const subscriptionCheckOptions = {
        planIDs: model.subscriptionData.planIDs,
        cycle: model.subscriptionData.cycle,
        currency: model.subscriptionData.currency,
        coupon: model.subscriptionData.checkResult.Coupon?.Code || undefined,
        billingAddress: model.subscriptionData.billingAddress,
        checkResult: model.subscriptionData.checkResult,
        trial: model.subscriptionData.checkResult.SubscriptionMode === SubscriptionMode.Trial || undefined,
    };
    const options: OptimisticOptions = {
        ...subscriptionCheckOptions,
        ...model.optimistic,
    };

    const [selectedB2CCurrency, setSelectedB2CCurrency] = useState<Currency>();

    const selectedPlan = getPlanFromPlanIDs(model.plansMap, options.planIDs) || FREE_PLAN;

    const availableCurrencies = getAvailableCurrencies({
        status: model.paymentMethodStatusExtended,
        plans: getAccessiblePlans({ planCards, audience, plans: model.plans }),
        user: model.session?.resumedSessionResult.User,
        subscription: model.session?.subscription,
        paramCurrency: signupParameters.currency,
        selectedPlanName: selectedPlan.Name,
    });

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
        trial?: boolean;
    }) => {
        const paymentsApi = await getSilentPaymentApi();
        return getSubscriptionPrices(
            paymentsApi,
            values.planIDs,
            values.currency,
            values.cycle,
            values.billingAddress,
            values.coupon,
            values.trial
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
                        trial: optimistic.trial,
                        zipCodeValid: true,
                    },
                    optimistic: {},
                }));
            }
        } catch (e) {
            if (latestRef.current === latest) {
                if (e instanceof InvalidZipCodeError) {
                    setModel((old) => ({
                        ...old,
                        subscriptionData: {
                            ...old.subscriptionData,
                            zipCodeValid: false,
                        },
                    }));
                } else {
                    handleError(e);
                }
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
            trial: subscriptionCheckOptions.trial || signupTrial,
            ...mergedCheckOptions,
        };

        const plan = getPlanFromPlanIDs(model.plansMap, completeCheckOptions.planIDs);
        const cycle = completeCheckOptions.cycle;
        const planCycleMapping = plan ? model.subscriptionDataCycleMapping[plan?.Name] : undefined;
        const lastRememberedCoupon =
            cycle !== undefined ? planCycleMapping?.[cycle]?.checkResult?.Coupon?.Code : undefined;
        if (!completeCheckOptions.coupon && lastRememberedCoupon) {
            completeCheckOptions.coupon = lastRememberedCoupon;
        }

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
        void measure({ event: TelemetryAccountSignupEvents.cycleSelect, dimensions: { cycle: `${cycle}` } });
        return handleOptimistic({ cycle });
    };

    const handleChangePlan = (planIDs: PlanIDs, planName: PLANS, currencyOverride?: Currency, audience?: Audience) => {
        if (model.loadingDependencies) {
            return;
        }
        void measure({ event: TelemetryAccountSignupEvents.planSelect, dimensions: { plan: planName } });

        const currency = currencyOverride ?? getPlanFromPlanIDs(model.plansMap, planIDs)?.Currency;
        const checkOptions: Partial<OptimisticOptions> = {
            planIDs,
        };

        if (currency) {
            checkOptions.currency = currency;
        }

        if (model.session?.subscription && model.session.organization && model.plansMap[planName]) {
            const switchedPlanIds = switchPlan({
                subscription: model.session.subscription,
                newPlan: planName,
                organization: model.session.organization,
                plans: model.plans,
                user: model.session.resumedSessionResult.User,
            });

            checkOptions.planIDs = switchedPlanIds;

            const result = getUpdatedPlanIDs({
                user: model.session.resumedSessionResult.User,
                subscription: model.session.subscription,
                organization: model.session.organization,
                plans: model.plans,
                toApp: app,
                currentPlan,
                options: { cycle: options.cycle, planIDs: checkOptions.planIDs },
                plansMap: model.plansMap,
            });
            if (result?.upsell) {
                checkOptions.planIDs = result.planIDs;
                setModel((old) => ({ ...old, upsell: result.upsell }));
                onTriggerModals({
                    session: model.session,
                    upsell: result.upsell,
                    subscriptionData: model.subscriptionData,
                });
            }
        }

        // TODO(plavarin): hack until we have a proper way to optimistically determine whether
        // a plan supports trials. Currently, only B2B plans support trials.
        // When we switch from B2C to B2B, the argument trial will be false, so we use signupParameters.trial instead
        if (signupParameters.trial && audience === Audience.B2B) {
            checkOptions.trial = true;
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

    // true iff trial detected through check result (thus the check prefix)
    const checkTrial = options.checkResult.SubscriptionMode === SubscriptionMode.Trial;

    const cta = (() => {
        if (mode === SignupMode.MailReferral && selectedPlan.Name !== PLANS.FREE) {
            return c('Action in trial plan').t`Try free for 30 days`;
        }

        if (checkTrial) {
            return c('Action').t`Try for free`;
        }

        return c('pass_signup_2023: Action').t`Start using ${appName} now`;
    })();

    const hasSelectedFree = selectedPlan.Name === PLANS.FREE || mode === SignupMode.MailReferral;

    const termsAndConditionsLink = (
        <Href className="color-weak" key="terms" href={getLocaleTermsURL(app)}>
            {
                // translator: Full sentence "By continuing, you agree to our terms and conditions and privacy policy."
                c('new_plans: signup').t`terms and conditions`
            }
        </Href>
    );

    const privacyPolicyLink = (
        <Href className="color-weak" key="privacy" href={getPrivacyPolicyURL(app)}>
            {
                // translator: Full sentence "By continuing, you agree to our terms and conditions and privacy policy."
                c('Link').t`privacy policy`
            }
        </Href>
    );

    const terms = (
        <div className="mt-4 text-sm color-weak text-center">
            {
                // translator: Full sentence "By continuing, you agree to our terms and conditions and privacy policy."
                c('pass_signup_2023: Info')
                    .jt`By continuing, you agree to our ${termsAndConditionsLink} and ${privacyPolicyLink}.`
            }
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
        model.upsell.mode !== UpsellTypes.UPSELL &&
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

    const showRenewalNotice = !hasSelectedFree && !checkTrial;
    const renewalNotice = showRenewalNotice && (
        <div className="w-full text-sm color-norm opacity-70">
            *
            {getCheckoutRenewNoticeTextFromCheckResult({
                checkResult: options.checkResult,
                plansMap: model.plansMap,
                planIDs: options.planIDs,
                subscription: model.session?.subscription,
                app,
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

    const headerCenterElement = (() => {
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
                        handleChangePlan(
                            { [newAudience.defaultPlan]: 1 },
                            newAudience.defaultPlan,
                            newCurrency,
                            newAudience.value
                        );
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
                disabled={model.disableCurrencySelector}
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

    const offerBanner = (() => {
        if (model.loadingDependencies) {
            return <SkeletonLoader width="36em" height="2.4rem" index={0} className="mt-4 max-w-full" />;
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
                <div className="text-center text-lg mt-2 max-w-custom" style={{ '--max-w-custom': '40rem' }}>
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
                    {c('Info').t`Get access by creating a ${BRAND_NAME} account and accepting the invitation.`}
                </>
            );
        }

        if (
            selectedPlan.Name === PLANS.VISIONARY &&
            model.upsell.mode !== UpsellTypes.UPSELL &&
            mode !== SignupMode.Invite
        ) {
            if (app === APPS.PROTONWALLET) {
                return;
            }

            const plan = `${BRAND_NAME} Visionary`;
            const text = getBoldFormattedText(c('mail_signup_2023: Info').t`**Get ${plan}** for a limited time!`);
            return wrap('hourglass', text);
        }

        const mailOfferPlans = [PLANS.BUNDLE_PRO_2024, PLANS.MAIL_BUSINESS, PLANS.MAIL_PRO];

        const businessYearlyCycle = model.subscriptionDataCycleMapping[selectedPlan.Name as PLANS]?.[CYCLE.YEARLY];
        if (mailOfferPlans.includes(selectedPlan.Name as PLANS) && !!businessYearlyCycle?.checkResult.Coupon?.Code) {
            const textLaunchOffer = getBoldFormattedText(
                c('mail_signup_2024: Info').t`Limited time offer: **Get up to 35% off** yearly plans`
            );
            return wrap('hourglass', textLaunchOffer);
        }

        const has2024OfferCoupon = getHas2024OfferCoupon(options.checkResult.Coupon?.Code);

        // Using real coupon to show the correct discount percentage
        if (has2024OfferCoupon) {
            const discount = checkout.discountPercent;
            return wrap(
                'bag-percent',
                c('pass_signup_2023: Info').jt`Your ${discount}% Black Friday discount has been applied`
            );
        }

        if (selectedPlan.Name === PLANS.DRIVE && options.checkResult.Coupon?.Code === COUPON_CODES.TRYDRIVEPLUS2024) {
            const title = selectedPlan.Title;
            const price = (
                <strong key="price">{getSimplePriceString(options.currency, checkout.withDiscountPerMonth)}</strong>
            );
            return wrap(
                'hourglass',
                c('pass_signup_2023: Info').jt`Limited time offer: ${title} for ${price} for the 1st month`
            );
        }

        if (selectedPlan.Name === PLANS.PASS_LIFETIME && !model.session?.resumedSessionResult.UID) {
            const lifetimeText = wrap(
                null,
                c('pass_lifetime_signup: Info')
                    .t`Gain lifetime access to all current and future ${PASS_APP_NAME} premium features with a single one-time payment.`
            );

            return <span className="text-center">{lifetimeText}</span>;
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
                <strong key="price">{getSimplePriceString(options.currency, checkout.withDiscountPerMonth)}</strong>
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
    })();

    return (
        <Layout
            headerCenterElement={
                <div className="mx-auto md:ml-4 lg:ml-8 md:mr-auto order-3 md:order-initial w-full md:w-auto flex justify-center md:justify-start">
                    {headerCenterElement}
                </div>
            }
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
            {renderUpsellPassTrialModal && (
                <PassTrial2024UpsellModal {...upsellPassTrialModal} {...upsellModalCommonProps} />
            )}
            <div className="flex items-center flex-column">
                {title}
                {hasPlanSelector && (
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

                {offerBanner}

                {(() => {
                    if (offerBanner) {
                        return null;
                    }

                    if (!checkout.discountPercent) {
                        return;
                    }

                    if (isPorkbunPayment) {
                        return;
                    }

                    if (signupTrial) {
                        return;
                    }

                    if (model.loadingDependencies) {
                        return <SkeletonLoader width="36em" height="2.5rem" index={0} className="mt-4 max-w-full" />;
                    }

                    return (
                        <DiscountBanner
                            discountPercent={checkout.discountPercent}
                            selectedPlanTitle={selectedPlan.Title}
                        />
                    );
                })()}

                {hasPlanSelector && (
                    <>
                        <Box className="mt-8 w-full max-w-custom" style={boxWidth}>
                            <BoxHeader
                                step={step++}
                                title={c('pass_signup_2023: Header').t`Select your plan`}
                                middle={planSelectorHeaderMiddleText}
                                right={
                                    <>
                                        {mode !== SignupMode.MailReferral && (
                                            <CycleSelector
                                                mode="buttons"
                                                cycle={options.cycle}
                                                options={cycleOptions}
                                                onSelect={(cycle) => handleChangeCycle(cycle as Cycle)}
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
                                        if (!viewportWidth['<=medium']) {
                                            accountDetailsRef.current?.scrollInto('email');
                                        }
                                    }}
                                    loading={model.loadingDependencies}
                                    signupParameters={signupParameters}
                                />
                                <div className="flex justify-center lg:justify-end">
                                    <div className="inline-block mt-3 mb-2">{currencySelector}</div>
                                </div>
                                <div className={clsx(hasSelectedFree && 'visibility-hidden', 'flex justify-center')}>
                                    {!signupTrial && <Guarantee />}
                                </div>
                            </BoxContent>
                        </Box>
                    </>
                )}
                {!model.loadingDependencies &&
                    app === APPS.PROTONPASS &&
                    audience === Audience.B2C &&
                    signupParameters.preSelectedPlan !== PLANS.PASS_LIFETIME &&
                    (hasPlanSelector || signupParameters.preSelectedPlan === PLANS.FREE) && (
                        <PassLifetimeSpecialOffer
                            price={model.plansMap[PLANS.PASS_LIFETIME]?.Pricing?.[CYCLE.YEARLY] ?? null}
                            currency={options.currency}
                            email={signupParameters.email}
                        />
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
                                        'p-6 md:flex rounded-xl',
                                        !hasBenefits && 'visibility-hidden',
                                        // By default this section is hidden for small screens.
                                        // However we want to make an exception for the Pass Lifetime.
                                        selectedPlan.Name !== PLANS.PASS_LIFETIME && 'hidden'
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

                            const inviteProps = (() => {
                                const contextProps: Partial<
                                    Pick<
                                        ComponentProps<typeof AccountFormDataContextProvider>,
                                        'availableSignupTypes' | 'defaultEmail'
                                    >
                                > = {};

                                const stepProps: Partial<
                                    Pick<ComponentProps<typeof AccountStepDetails>, 'emailReadOnly'>
                                > = {};

                                if (signupParameters.email) {
                                    contextProps.defaultEmail = signupParameters.email;
                                }

                                const invitation = signupParameters.invite;
                                if (
                                    invitation &&
                                    (invitation.type === 'wallet' ||
                                        invitation.type === 'pass' ||
                                        invitation.type === 'drive' ||
                                        invitation.type === 'porkbun')
                                ) {
                                    contextProps.defaultEmail = invitation.data.invitee;
                                    contextProps.availableSignupTypes = new Set([SignupType.External]);
                                    stepProps.emailReadOnly = invitation.data.invitee !== '';
                                }

                                return {
                                    contextProps,
                                    stepProps,
                                };
                            })();

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
                                                <AccountFormDataContextProvider
                                                    availableSignupTypes={new Set(signupTypes)}
                                                    {...inviteProps.contextProps}
                                                    domains={model.domains}
                                                >
                                                    <AccountStepDetails
                                                        {...inviteProps.stepProps}
                                                        {...(signupParameters.mode === SignupMode.PassSimpleLogin
                                                            ? {
                                                                  emailDescription: c('Info')
                                                                      .t`By creating a ${PASS_APP_NAME} account with your SimpleLogin email, you can manage your aliases directly from ${PASS_APP_NAME}.`,
                                                              }
                                                            : {})}
                                                        passwordFields={true}
                                                        model={model}
                                                        measure={measure}
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
                                                                          if (
                                                                              app === APPS.PROTONPASS &&
                                                                              passTrialOfferEnabled
                                                                          ) {
                                                                              try {
                                                                                  await fetchTrialPrice(PLANS.PASS);

                                                                                  setUpsellPassTrialModal(true);

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
                                                        onFormValidChange={setIsFormValid}
                                                        footer={(details) => {
                                                            return (
                                                                <>
                                                                    {hasSelectedFree && (
                                                                        <div className="mb-4">
                                                                            <Button
                                                                                {...(() => {
                                                                                    if (
                                                                                        loadingSignup ||
                                                                                        checkingTrial
                                                                                    ) {
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
                                                                                            {c('Link')
                                                                                                .t`switch account`}
                                                                                        </InlineLinkButton>
                                                                                    );
                                                                                    return (activeSessions?.length ||
                                                                                        0) >= 1
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
                                                                    {hasSelectedFree && terms}
                                                                    {selectedPlan.Name === PLANS.PASS_LIFETIME && (
                                                                        <PassLifetimeFeaturedSection className="mt-8" />
                                                                    )}
                                                                </>
                                                            );
                                                        }}
                                                    />
                                                </AccountFormDataContextProvider>
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
                            title={
                                signupTrial
                                    ? c('b2b_trials_2025: Header').t`Payment details`
                                    : c('pass_signup_2023: Header').t`Checkout`
                            }
                            right={!hasPlanSelector ? currencySelector : null}
                        />
                        <BoxContent>
                            {signupTrial && (
                                <div className="mb-4 text-sm color-weak">
                                    {c('b2b_trials_2025_Info').t`During the trial period, you can have up to 10 users.`}
                                </div>
                            )}
                            <AccountStepPayment
                                selectedPlan={selectedPlan}
                                measure={measure}
                                cta={cta}
                                terms={terms}
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
                                app={app}
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
                                onValidate={async () => {
                                    return accountDetailsRef.current?.validate() ?? true;
                                }}
                                isFormValid={isFormValid}
                                withLoadingSignup={withLoadingSignup}
                                onBillingAddressChange={(billingAddress: BillingAddress) => {
                                    handleOptimistic({ billingAddress });
                                }}
                                setCurrencySelectorDisabled={(disableCurrencySelector) =>
                                    setModel((old) => ({ ...old, disableCurrencySelector }))
                                }
                                onVatNumberChange={(vatNumber) => {
                                    setModel((model) => ({
                                        ...model,
                                        subscriptionData: { ...model.subscriptionData, vatNumber },
                                    }));
                                }}
                                paymentsApi={getPaymentsApi(silentApi, ChargebeeEnabled.CHARGEBEE_FORCED)}
                            />
                        </BoxContent>
                    </Box>
                )}
            </div>
        </Layout>
    );
};

export default Step1;
