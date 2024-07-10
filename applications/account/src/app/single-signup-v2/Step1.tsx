import {
    Dispatch,
    Fragment,
    MutableRefObject,
    ReactNode,
    SetStateAction,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton';
import { Vr } from '@proton/atoms/Vr';
import { Icon, IconName, useModalState } from '@proton/components/components';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { CurrencySelector, CycleSelector, getCheckoutRenewNoticeText, useFlag } from '@proton/components/containers';
import { useIsChargebeeEnabled } from '@proton/components/containers/payments/PaymentSwitcher';
import { getBlackFridayRenewalNoticeText } from '@proton/components/containers/payments/RenewalNotice';
import { getShortBillingText } from '@proton/components/containers/payments/helper';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useHandler from '@proton/components/hooks/useHandler';
import { BillingAddress } from '@proton/components/payments/core';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import { useLoading } from '@proton/hooks';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import { LocalSessionPersisted } from '@proton/shared/lib/authentication/persistedSessionHelper';
import {
    APPS,
    BRAND_NAME,
    COUPON_CODES,
    CYCLE,
    DRIVE_APP_NAME,
    PASS_APP_NAME,
    PLANS,
    SSO_PATHS,
} from '@proton/shared/lib/constants';
import { getCheckout, getOptimisticCheckResult } from '@proton/shared/lib/helpers/checkout';
import { getPlanFromPlanIDs, switchPlan } from '@proton/shared/lib/helpers/planIDs';
import {
    getHas2023OfferCoupon,
    getPlanIDs,
    getPlanOffer,
    getPricingFromPlanIDs,
    getTotalFromPricing,
} from '@proton/shared/lib/helpers/subscription';
import {
    Api,
    Audience,
    Currency,
    Cycle,
    PlanIDs,
    SubscriptionPlan,
    User,
    VPNServersCountData,
} from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { usePublicTheme } from '../containers/PublicThemeProvider';
import SignupSupportDropdown from '../signup/SignupSupportDropdown';
import { getSubscriptionPrices } from '../signup/helper';
import { SignupCacheResult, SignupType, SubscriptionData } from '../signup/interfaces';
import AccountStepDetails, { AccountStepDetailsRef } from './AccountStepDetails';
import AccountStepPayment, { AccountStepPaymentRef } from './AccountStepPayment';
import AccountSwitcherItem from './AccountSwitcherItem';
import AudienceTabs from './Audience';
import Box from './Box';
import BoxContent from './BoxContent';
import BoxHeader from './BoxHeader';
import FeatureItem from './FeatureItem';
import FreeLogo from './FreeLogo';
import Guarantee from './Guarantee';
import Layout from './Layout';
import { PlanCardSelector, UpsellCardSelector } from './PlanCardSelector';
import RightPlanSummary from './RightPlanSummary';
import RightSummary from './RightSummary';
import { getFreeSubscriptionData, getFreeTitle } from './helper';
import {
    Measure,
    OnOpenLogin,
    OnOpenSwitch,
    OptimisticOptions,
    SignupConfiguration,
    SignupMode,
    SignupModelV2,
    SignupParameters2,
    UpsellTypes,
} from './interface';
import MailTrial2024UpsellModal from './modals/MailTrial2024UpsellModal';
import { getFreePassFeatures } from './pass/configuration';

export interface Step1Rref {
    scrollIntoPayment: () => void;
}

const Step1 = ({
    signupConfiguration: {
        logo,
        features,
        title,
        productAppName: appName,
        shortProductAppName: shortAppName,
        product: app,
        benefits,
        signupTypes,
        cycles,
        planCards,
        audience,
        audiences,
    },
    signupParameters,
    relativePrice,
    currentPlan,
    onComplete,
    model,
    setModel,
    api: normalApi,
    vpnServersCountData,
    onOpenLogin,
    onOpenSwitch,
    onChallengeLoaded,
    onChallengeError,
    className,
    onSignOut,
    step1Ref,
    activeSessions,
    measure,
    mode,
}: {
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
    onChallengeLoaded: () => void;
    onChallengeError: () => void;
    model: SignupModelV2;
    setModel: Dispatch<SetStateAction<SignupModelV2>>;
    currentPlan: SubscriptionPlan | undefined;
    mode: SignupMode;
    api: Api;
    onOpenLogin: OnOpenLogin;
    onOpenSwitch: OnOpenSwitch;
    className?: string;
    step1Ref: MutableRefObject<Step1Rref | undefined>;
    activeSessions?: LocalSessionPersisted[];
}) => {
    const mailTrialOfferEnabled = useFlag('MailTrialOffer');
    const silentApi = getSilentApi(normalApi);
    const { getPaymentsApi } = usePaymentsApi();
    const isChargebeeEnabled = useIsChargebeeEnabled();
    const [upsellMailTrialModal, setUpsellMailTrialModal, renderUpsellMailTrialModal] = useModalState();
    const [loadingSignup, withLoadingSignup] = useLoading();
    const [loadingSignout, withLoadingSignout] = useLoading();
    const [loadingChallenge, setLoadingChallenge] = useState(false);
    const [loadingPaymentDetails, setLoadingPaymentDetails] = useState(false);
    const accountDetailsRef = useRef<AccountStepDetailsRef>();
    const accountStepPaymentRef = useRef<AccountStepPaymentRef>();
    const theme = usePublicTheme();

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
    const selectedPlan = getPlanFromPlanIDs(model.plansMap, options.planIDs) || FREE_PLAN;

    const latestRef = useRef<any>();
    const check = async (values: {
        currency: Currency;
        planIDs: PlanIDs;
        cycle: Cycle;
        billingAddress: BillingAddress;
        coupon?: string;
    }) => {
        let chargebeeEnabled = undefined;
        if (model.session?.UID && model.session?.user) {
            const user: User = model.session.user;
            chargebeeEnabled = await isChargebeeEnabled(model.session.UID, async () => user);
        }
        return getSubscriptionPrices(
            getPaymentsApi(silentApi, chargebeeEnabled?.result),
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
        });
        setModel((old) => ({
            ...old,
            optimistic: {
                ...mergedCheckOptions,
                checkResult: optimisticCheckResult,
            },
        }));
        const latest = {};
        latestRef.current = latest;
        setLoadingPaymentDetails(true);
        debouncedCheck(completeCheckOptions, latest);
    };

    const handleChangeCurrency = (currency: Currency) => {
        measure({ event: TelemetryAccountSignupEvents.currencySelect, dimensions: { currency } });
        return handleOptimistic({ currency });
    };

    const handleChangeCycle = (cycle: Cycle) => {
        measure({ event: TelemetryAccountSignupEvents.cycleSelect, dimensions: { cycle: `${cycle}` } });
        return handleOptimistic({ cycle });
    };

    const handleChangePlan = (planIDs: PlanIDs, planName: PLANS) => {
        measure({ event: TelemetryAccountSignupEvents.planSelect, dimensions: { plan: planName } });

        if (model.session?.subscription && model.session.organization && model.plansMap[planName]) {
            const switchedPlanIds = switchPlan({
                planIDs: getPlanIDs(model.session.subscription),
                planID: planName,
                organization: model.session.organization,
                plans: model.plans,
            });
            return handleOptimistic({ planIDs: switchedPlanIds });
        }

        return handleOptimistic({ planIDs });
    };

    useImperativeHandle(step1Ref, () => ({
        scrollIntoPayment: () => accountStepPaymentRef.current?.scrollIntoView(),
    }));

    const handleCompletion = async (subscriptionData: SubscriptionData, type?: 'signup-token') => {
        if (model.session?.user) {
            return onComplete({ subscriptionData, type: 'existing' });
        }

        const accountData = await accountDetailsRef.current?.data();
        if (!accountData) {
            throw new Error('Invalid data');
        }
        return onComplete({ subscriptionData, accountData, type: type || 'signup' });
    };

    const cycleOptions = cycles.map((cycle) => ({
        text: getShortBillingText(cycle),
        value: cycle,
    }));

    const cta =
        mode === SignupMode.MailReferral && selectedPlan.Name !== PLANS.FREE
            ? c('Action in trial plan').t`Try free for 30 days`
            : c('pass_signup_2023: Action').t`Start using ${appName} now`;
    const hasSelectedFree = selectedPlan.Name === PLANS.FREE || mode === SignupMode.MailReferral;
    const isOnboardingMode = mode === SignupMode.Onboarding;

    const isDarkBg = theme.dark;

    let step = 1;

    const hasUpsellSection = model.upsell.mode === UpsellTypes.UPSELL;
    const hidePlanSelectorCoupons = new Set([COUPON_CODES.TRYMAILPLUS2024, COUPON_CODES.MAILPLUSINTRO]);
    const hasPlanSelector =
        (!model.planParameters?.defined || hasUpsellSection) &&
        [SignupMode.Default, SignupMode.Onboarding, SignupMode.MailReferral].includes(mode) &&
        !hidePlanSelectorCoupons.has(model.subscriptionData.checkResult.Coupon?.Code as any) &&
        !hidePlanSelectorCoupons.has(model.optimistic.coupon as any) &&
        // Don't want to show an incomplete plan selector when the user has access to have a nicer UI
        !model.session?.state.access;

    const checkout = getCheckout({
        planIDs: options.planIDs,
        plansMap: model.plansMap,
        checkResult: options.checkResult,
    });

    const renewalNotice = !hasSelectedFree && (
        <div className="w-full text-sm color-norm opacity-70">
            *
            {getHas2023OfferCoupon(options.checkResult.Coupon?.Code)
                ? getBlackFridayRenewalNoticeText({
                      price: options.checkResult.Amount + (options.checkResult.CouponDiscount || 0),
                      cycle: options.cycle,
                      plansMap: model.plansMap,
                      planIDs: options.planIDs,
                      currency: options.currency,
                  })
                : getCheckoutRenewNoticeText({
                      coupon: options.checkResult.Coupon,
                      cycle: options.cycle,
                      plansMap: model.plansMap,
                      planIDs: options.planIDs,
                      checkout,
                      currency: options.currency,
                  })}
        </div>
    );

    const audienceTabs = hasPlanSelector ? (
        <AudienceTabs
            audience={audience}
            audiences={audiences}
            onChangeAudience={(audience) => {
                handleChangePlan({ [audience.defaultPlan]: 1 }, audience.defaultPlan);
                history.push(audience.locationDescriptor);
            }}
        />
    ) : undefined;

    const boxWidth = { '--max-w-custom': planCards[audience].length === 4 && hasPlanSelector ? '74rem' : '57rem' };

    return (
        <Layout
            afterLogo={audienceTabs}
            logo={logo}
            footer={renewalNotice}
            hasDecoration
            bottomRight={<SignupSupportDropdown isDarkBg={isDarkBg} />}
            className={className}
            footerWidth={boxWidth}
        >
            {renderUpsellMailTrialModal && (
                <MailTrial2024UpsellModal
                    {...upsellMailTrialModal}
                    currency={options.currency}
                    onConfirm={async () => {
                        return handleOptimistic({
                            coupon: COUPON_CODES.MAILPLUSINTRO,
                            planIDs: { [PLANS.MAIL]: 1 },
                            cycle: CYCLE.MONTHLY,
                        });
                    }}
                    onContinue={async () => {
                        withLoadingSignup(handleCompletion(getFreeSubscriptionData(model.subscriptionData))).catch(
                            noop
                        );
                    }}
                />
            )}
            <div className="flex items-center flex-column">
                <div
                    className={clsx(
                        'single-signup-header-v2 text-center mt-6 md:mt-8 mb-4',
                        signupParameters.mode == SignupMode.Invite && 'max-w-full'
                    )}
                >
                    <h1 className="m-0 large-font lg:px-4 text-semibold">{title}</h1>
                </div>
                {!isOnboardingMode && hasPlanSelector && model.upsell.mode !== UpsellTypes.UPSELL && (
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
                    const wrap = (iconName: IconName, textLaunchOffer: ReactNode) => {
                        return (
                            <div className="signup-v2-offer-banner py-2 px-4 rounded-lg md:text-lg inline-flex flex-nowrap mt-4">
                                <Icon name={iconName} size={3.5} className="shrink-0 mt-1" />
                                <span className="ml-2 flex-1">{textLaunchOffer}</span>
                            </div>
                        );
                    };

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

                    if (selectedPlan.Name === PLANS.VISIONARY) {
                        const textLaunchOffer = c('mail_signup_2023: Info').t`Limited time offer`;
                        return wrap('hourglass', textLaunchOffer);
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
                                {getSimplePriceString(options.currency, checkout.withDiscountPerMonth, '')}
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
                                {model.upsell.mode === UpsellTypes.PLANS ? (
                                    <PlanCardSelector
                                        subscriptionDataCycleMapping={model.subscriptionDataCycleMapping}
                                        audience={audience}
                                        plansMap={model.plansMap}
                                        plan={selectedPlan.Name}
                                        cycle={options.cycle}
                                        currency={options.currency}
                                        dark={theme.dark}
                                        planCards={planCards[audience]}
                                        onSelect={handleChangePlan}
                                        onSelectedClick={() => {
                                            accountDetailsRef.current?.scrollInto('email');
                                        }}
                                    />
                                ) : (
                                    <UpsellCardSelector
                                        audience={audience}
                                        relativePrice={relativePrice}
                                        plansMap={model.plansMap}
                                        currentPlan={currentPlan}
                                        freePlan={model.freePlan}
                                        subscription={model.session?.subscription}
                                        checkout={checkout}
                                        plan={selectedPlan}
                                        cycle={options.cycle}
                                        currency={options.currency}
                                        coupon={options.checkResult?.Coupon?.Code}
                                        vpnServersCountData={vpnServersCountData}
                                        onSelect={() => {
                                            accountStepPaymentRef.current?.scrollIntoView();
                                        }}
                                        onKeep={async () => {
                                            await handleCompletion(getFreeSubscriptionData(model.subscriptionData));
                                        }}
                                    />
                                )}
                                {model.upsell.mode === UpsellTypes.PLANS && (
                                    <>
                                        <div className="flex justify-center lg:justify-end">
                                            <div className="inline-block mt-3 mb-2">
                                                <CurrencySelector
                                                    mode="select-two"
                                                    className="h-full ml-auto px-3 color-primary relative interactive-pseudo interactive--no-background"
                                                    currency={options.currency}
                                                    onSelect={handleChangeCurrency}
                                                    unstyled
                                                />
                                            </div>
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
                <Box
                    className={clsx('mt-12 w-full max-w-custom', isOnboardingMode && !hasSelectedFree && 'hidden')}
                    style={boxWidth}
                >
                    {(() => {
                        const step2Summary = isOnboardingMode ? (
                            <RightSummary variant="gradientBorder" className="mx-auto md:mx-0 rounded-xl">
                                <RightPlanSummary
                                    title={getFreeTitle(shortAppName)}
                                    price={getSimplePriceString(options.currency, 0, '')}
                                    regularPrice={getSimplePriceString(options.currency, 0, '')}
                                    logo={<FreeLogo app={app} dark={theme.dark} />}
                                    discount={0}
                                    free
                                    features={getFreePassFeatures()}
                                />
                            </RightSummary>
                        ) : (
                            <RightSummary
                                variant={isDarkBg ? 'gradientBorder' : 'gradient'}
                                className={clsx('p-6 hidden md:flex rounded-xl')}
                            >
                                {benefits}
                            </RightSummary>
                        );

                        const createANewAccount = (
                            <InlineLinkButton
                                key="create-a-new-account"
                                onClick={() => {
                                    setLoadingChallenge(true);
                                    withLoadingSignout(onSignOut()).catch(noop);
                                }}
                            >
                                {c('pass_signup_2023: Action').t`create a new account`}
                            </InlineLinkButton>
                        );

                        const user = model?.session?.user;

                        if (isOnboardingMode && !hasSelectedFree) {
                            return null;
                        }

                        if (user && !loadingSignout) {
                            return (
                                <>
                                    <BoxHeader
                                        step={step++}
                                        title={c('pass_signup_2023: Header')
                                            .t`Continue with your ${BRAND_NAME} account`}
                                    />
                                    <BoxContent>
                                        <div className="flex justify-space-between gap-14">
                                            <div className="flex-1 w-0">
                                                <AccountSwitcherItem
                                                    user={user}
                                                    right={
                                                        (activeSessions?.length || 0) > 1 ? (
                                                            <Button color="norm" onClick={onOpenSwitch} shape="ghost">
                                                                {c('Action').t`Switch account`}
                                                            </Button>
                                                        ) : undefined
                                                    }
                                                />
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
                                                {!isOnboardingMode && (
                                                    <div
                                                        className={clsx(
                                                            'text-center',
                                                            hasSelectedFree ? 'mt-4' : 'mt-6'
                                                        )}
                                                    >
                                                        {
                                                            // translator: Full sentence "Or create a new account"
                                                            c('pass_signup_2023: Action').jt`Or ${createANewAccount}`
                                                        }
                                                    </div>
                                                )}
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
                                signupParameters.invite?.type === 'drive') &&
                            signupParameters.mode !== SignupMode.MailReferral;

                        return (
                            <>
                                <BoxHeader
                                    {...(() => {
                                        if (signupParameters.invite?.type === 'pass') {
                                            return {
                                                title: c('pass_signup_2023: Title')
                                                    .t`Create a ${PASS_APP_NAME} account`,
                                            };
                                        }

                                        if (signupParameters.invite?.type === 'drive') {
                                            return {
                                                title: c('drive_signup_2023: Title')
                                                    .t`Create a free ${DRIVE_APP_NAME} account to securely access the file`,
                                            };
                                        }

                                        return {
                                            title: c('pass_signup_2023: Title').t`Create your ${BRAND_NAME} account`,
                                            step: step++,
                                        };
                                    })()}
                                />
                                <BoxContent>
                                    <div className="flex items-start justify-space-between gap-14">
                                        <div className="flex-1 w-0 relative">
                                            <AccountStepDetails
                                                {...(signupParameters.email
                                                    ? { defaultEmail: signupParameters.email }
                                                    : undefined)}
                                                {...(signupParameters.invite?.type === 'pass'
                                                    ? {
                                                          defaultEmail: signupParameters.invite.data.invitee,
                                                          disableEmail: true,
                                                      }
                                                    : undefined)}
                                                {...(signupParameters.invite?.type === 'drive'
                                                    ? {
                                                          defaultEmail: signupParameters.invite.data.invitee,
                                                          disableEmail: true,
                                                      }
                                                    : undefined)}
                                                domains={model.domains}
                                                signupTypes={
                                                    signupParameters.invite?.type === 'drive' ||
                                                    signupParameters.invite?.type === 'pass'
                                                        ? [SignupType.Email]
                                                        : signupTypes
                                                }
                                                passwordFields={true}
                                                model={model}
                                                measure={measure}
                                                loading={loadingChallenge || loadingSignout}
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
                                                              if (
                                                                  selectedPlan.Name === PLANS.FREE &&
                                                                  !signupParameters.noPromo
                                                              ) {
                                                                  if (
                                                                      app === APPS.PROTONMAIL &&
                                                                      mailTrialOfferEnabled
                                                                  ) {
                                                                      setUpsellMailTrialModal(true);
                                                                      return;
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
                                                                        type="submit"
                                                                        size="large"
                                                                        loading={loadingSignup}
                                                                        color="norm"
                                                                        className="block mx-auto"
                                                                        pill
                                                                    >
                                                                        {cta}
                                                                    </Button>
                                                                </div>
                                                            )}
                                                            {showSignIn && (
                                                                <div className="text-center">
                                                                    <span>
                                                                        {(() => {
                                                                            if (
                                                                                signupParameters.signIn === 'redirect'
                                                                            ) {
                                                                                const signIn = (
                                                                                    <InlineLinkButton
                                                                                        key="signin"
                                                                                        className="link link-focus text-nowrap"
                                                                                        onClick={() => {
                                                                                            const searchParams =
                                                                                                new URLSearchParams();
                                                                                            searchParams.set(
                                                                                                'email',
                                                                                                details.email
                                                                                            );
                                                                                            history.push(
                                                                                                `${SSO_PATHS.SWITCH}?${searchParams.toString()}`
                                                                                            );
                                                                                        }}
                                                                                    >
                                                                                        {c('Link').t`Sign in`}
                                                                                    </InlineLinkButton>
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
                                                                                        onOpenSwitch();
                                                                                    }}
                                                                                >
                                                                                    {c('Link').t`switch account`}
                                                                                </InlineLinkButton>
                                                                            );
                                                                            return (activeSessions?.length || 0) >= 1
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
                {!hasSelectedFree && (
                    <Box className="mt-12 w-full max-w-custom" style={boxWidth}>
                        <BoxHeader step={step++} title={c('pass_signup_2023: Header').t`Checkout`} />
                        <BoxContent>
                            <AccountStepPayment
                                selectedPlan={selectedPlan}
                                measure={measure}
                                cta={cta}
                                key={model.session?.UID || 'free'}
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
