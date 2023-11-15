import {
    Dispatch,
    Fragment,
    Key,
    MutableRefObject,
    ReactNode,
    SetStateAction,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Vr } from '@proton/atoms/Vr';
import { Icon, IconName, InlineLinkButton } from '@proton/components/components';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { CurrencySelector, CycleSelector, useFlag } from '@proton/components/containers';
import {
    getBlackFridayRenewalNoticeText,
    getRenewalNoticeText,
} from '@proton/components/containers/payments/RenewalNotice';
import { getShortBillingText } from '@proton/components/containers/payments/helper';
import { useLoading } from '@proton/hooks';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import { APP_NAMES, BRAND_NAME, COUPON_CODES, CYCLE, PASS_APP_NAME, PLANS } from '@proton/shared/lib/constants';
import { getCheckout, getOptimisticCheckResult } from '@proton/shared/lib/helpers/checkout';
import { switchPlan } from '@proton/shared/lib/helpers/planIDs';
import {
    getPlanIDs,
    getPlanOffer,
    getPricingFromPlanIDs,
    getTotalFromPricing,
} from '@proton/shared/lib/helpers/subscription';
import { Api, Currency, Cycle, Plan, PlanIDs, VPNServersCountData } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import SignupSupportDropdown from '../signup/SignupSupportDropdown';
import { getSubscriptionPrices } from '../signup/helper';
import { SignupCacheResult, SignupType, SubscriptionData } from '../signup/interfaces';
import { useFlowRef } from '../useFlowRef';
import AccountStepDetails, { AccountStepDetailsRef } from './AccountStepDetails';
import AccountStepPayment, { AccountStepPaymentRef } from './AccountStepPayment';
import AccountSwitcherItem from './AccountSwitcherItem';
import Box from './Box';
import BoxContent from './BoxContent';
import BoxHeader from './BoxHeader';
import FeatureItem from './FeatureItem';
import FreeLogo from './FreeLogo';
import Layout from './Layout';
import { PlanCard, PlanCardSelector, UpsellCardSelector } from './PlanCardSelector';
import RightPlanSummary from './RightPlanSummary';
import RightSummary from './RightSummary';
import { getFreeSubscriptionData, getFreeTitle } from './helper';
import {
    Measure,
    OnOpenLogin,
    OptimisticOptions,
    SignupMode,
    SignupModelV2,
    SignupParameters2,
    SignupTheme,
    UpsellTypes,
} from './interface';
import { getFreePassFeatures } from './pass/configuration';

export interface Step1Rref {
    handleOptimistic: (options: Partial<OptimisticOptions>) => Promise<void>;
    scrollIntoPayment: () => void;
}

const Step1 = ({
    signupTypes,
    signupParameters,
    theme,
    relativePrice,
    logo,
    features,
    app,
    shortAppName,
    appName,
    title,
    selectedPlan,
    currentPlan,
    benefits,
    planCards,
    onComplete,
    model,
    setModel,
    api: normalApi,
    vpnServersCountData,
    onOpenLogin,
    onChallengeLoaded,
    onChallengeError,
    className,
    onSignOut,
    step1Ref,
    measure,
    mode,
}: {
    signupParameters: SignupParameters2;
    signupTypes: SignupType[];
    theme: SignupTheme;
    relativePrice: string | undefined;
    app: APP_NAMES;
    shortAppName: string;
    appName: string;
    logo: ReactNode;
    title: ReactNode;
    features: { key: Key; text: ReactNode; left: ReactNode }[];
    selectedPlan: Plan;
    planCards: PlanCard[];
    isDesktop: boolean;
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
    currentPlan: Plan | undefined;
    mode: SignupMode;
    benefits: ReactNode;
    api: Api;
    onOpenLogin: OnOpenLogin;
    className?: string;
    step1Ref: MutableRefObject<Step1Rref | undefined>;
}) => {
    const silentApi = getSilentApi(normalApi);
    const [loadingSignup, withLoadingSignup] = useLoading();
    const [loadingSignout, withLoadingSignout] = useLoading();
    const [loadingChallenge, setLoadingChallenge] = useState(false);
    const [loadingPaymentDetails, withLoadingPaymentDetails] = useLoading();
    const accountDetailsRef = useRef<AccountStepDetailsRef>();
    const accountStepPaymentRef = useRef<AccountStepPaymentRef>();

    const isSentinelPassplusEnabled = !!useFlag('SentinelPassPlus');

    const createFlow = useFlowRef();

    const options: OptimisticOptions = {
        currency: model.optimistic.currency || model.subscriptionData.currency,
        cycle: model.optimistic.cycle || model.subscriptionData.cycle,
        plan: model.optimistic.plan || selectedPlan,
        planIDs: model.optimistic.planIDs || model.subscriptionData.planIDs,
        checkResult: model.optimistic.checkResult || model.subscriptionData.checkResult,
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
        if (model.session?.state.payable === false) {
            return;
        }
        const newCurrency = optimistic.currency || options.currency;
        const newPlanIDs = optimistic.planIDs || options.planIDs;
        const newCycle = optimistic.cycle || options.cycle;

        const optimisticCheckResult = getOptimisticCheckResult({
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

            const checkResult = await getSubscriptionPrices(
                silentApi,
                newPlanIDs,
                newCurrency,
                newCycle,
                model.subscriptionData.checkResult.Coupon?.Code || signupParameters.coupon
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
        }
    };

    const handleChangeCurrency = async (currency: Currency) => {
        measure({ event: TelemetryAccountSignupEvents.currencySelect, dimensions: { currency } });
        return handleOptimistic({ currency });
    };

    const handleChangeCycle = async (cycle: Cycle) => {
        measure({ event: TelemetryAccountSignupEvents.cycleSelect, dimensions: { cycle: `${cycle}` } });
        return handleOptimistic({ cycle });
    };

    const handleChangePlan = async (planIDs: PlanIDs, planName: PLANS) => {
        measure({ event: TelemetryAccountSignupEvents.planSelect, dimensions: { plan: planName } });
        const plan = model.plans.find((plan) => plan.Name === planName);

        if (model.session?.subscription && model.session.organization && plan?.Name) {
            const switchedPlanIds = switchPlan({
                planIDs: getPlanIDs(model.session.subscription),
                planID: plan.Name,
                organization: model.session.organization,
                plans: model.plans,
            });
            return handleOptimistic({ plan, planIDs: switchedPlanIds });
        }

        return handleOptimistic({ plan, planIDs });
    };

    useImperativeHandle(step1Ref, () => ({
        handleOptimistic,
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

    const cycles = [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS].map((cycle) => ({
        text: getShortBillingText(cycle),
        value: cycle,
    }));

    const cta = c('pass_signup_2023: Action').t`Start using ${appName} now`;
    const hasSelectedFree = options.plan.Name === PLANS.FREE;
    const isOnboardingMode = mode === SignupMode.Onboarding;

    const isDarkBg = theme.background === 'bf';

    let step = 1;

    const hasUpsellSection = model.upsell.mode === UpsellTypes.UPSELL;
    const hasPlanSelector =
        (!model.planParameters?.defined || hasUpsellSection) &&
        [SignupMode.Default, SignupMode.Onboarding].includes(mode) &&
        // Don't want to show an incomplete plan selector when the user has access to have a nicer UI
        !model.session?.state.access;

    const renewalNotice = !hasSelectedFree && (
        <div className="w-full text-sm color-norm opacity-70">
            *
            {options.checkResult.Coupon?.Code === COUPON_CODES.BLACK_FRIDAY_2023
                ? getBlackFridayRenewalNoticeText({
                      price: options.checkResult.Amount + (options.checkResult.CouponDiscount || 0),
                      cycle: options.cycle,
                      plansMap: model.plansMap,
                      planIDs: options.planIDs,
                      currency: options.currency,
                  })
                : getRenewalNoticeText({
                      renewCycle: options.cycle,
                  })}
        </div>
    );

    const checkout = getCheckout({
        planIDs: options.planIDs,
        plansMap: model.plansMap,
        checkResult: options.checkResult,
    });

    return (
        <Layout
            theme={theme}
            logo={logo}
            footer={renewalNotice}
            hasDecoration
            bottomRight={<SignupSupportDropdown isDarkBg={isDarkBg} />}
            className={className}
        >
            <div className="flex flex-align-items-center flex-column">
                <div
                    className={clsx(
                        'single-signup-header-v2 text-center mt-8 mb-4',
                        signupParameters.mode == SignupMode.Invite && 'max-w-full'
                    )}
                >
                    <h1 className="m-0 large-font lg:px-4 text-semibold">{title}</h1>
                </div>
                {!isOnboardingMode && hasPlanSelector && model.upsell.mode !== UpsellTypes.UPSELL && (
                    <div className="flex flex-nowrap mb-4 gap-1 md:gap-8">
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
                            <div className="signup-v2-offer-banner py-2 px-4 rounded-lg color-primary md:text-lg inline-flex flex-nowrap mt-4">
                                <Icon name={iconName} size={14} className="flex-item-noshrink mt-1" />
                                <span className="ml-2 flex-item-fluid">{textLaunchOffer}</span>
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

                    if (!hasPlanSelector || model.upsell.mode === UpsellTypes.UPSELL) {
                        return null;
                    }

                    const bestPlanCard = planCards.find((planCard) => planCard.type === 'best');
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
                    <Box className="mt-8 w-full">
                        <BoxHeader
                            step={step++}
                            title={
                                model.upsell.mode === UpsellTypes.PLANS
                                    ? c('pass_signup_2023: Header').t`Select your plan`
                                    : c('pass_signup_2023: Header').t`Upgrade your plan`
                            }
                            right={
                                <>
                                    {model.upsell.mode === UpsellTypes.PLANS && (
                                        <CycleSelector
                                            mode="buttons"
                                            cycle={options.cycle}
                                            options={cycles}
                                            onSelect={(newCycle) => {
                                                return withLoadingPaymentDetails(handleChangeCycle(newCycle)).catch(
                                                    noop
                                                );
                                            }}
                                            size="small"
                                            color="norm"
                                            separators={false}
                                            shape="ghost"
                                            className="gap-1"
                                            removeBackgroundColorOnGroup={true}
                                        />
                                    )}
                                </>
                            }
                        />
                        <BoxContent>
                            {model.upsell.mode === UpsellTypes.PLANS ? (
                                <PlanCardSelector
                                    plansMap={model.plansMap}
                                    plan={options.plan.Name}
                                    cycle={options.cycle}
                                    currency={options.currency}
                                    planCards={planCards}
                                    onSelect={(planIDs, planName) => {
                                        return withLoadingPaymentDetails(handleChangePlan(planIDs, planName)).catch(
                                            noop
                                        );
                                    }}
                                    onSelectedClick={() => {
                                        accountDetailsRef.current?.scrollInto('email');
                                    }}
                                />
                            ) : (
                                <UpsellCardSelector
                                    relativePrice={relativePrice}
                                    plansMap={model.plansMap}
                                    currentPlan={currentPlan}
                                    subscription={model.session?.subscription}
                                    checkout={checkout}
                                    plan={options.plan}
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
                                <div className="flex flex-justify-end mt-1 on-tablet-flex-justify-center gap-4">
                                    <div className="color-primary">
                                        <CurrencySelector
                                            mode="select-two"
                                            className="h-full px-3"
                                            currency={options.currency}
                                            onSelect={(currency) =>
                                                withLoadingPaymentDetails(handleChangeCurrency(currency))
                                            }
                                            unstyled
                                        />
                                    </div>
                                </div>
                            )}
                        </BoxContent>
                    </Box>
                )}
                <Box className={clsx('mt-12 w-full', isOnboardingMode && !hasSelectedFree && 'hidden')}>
                    {(() => {
                        const step2Summary = isOnboardingMode ? (
                            <RightSummary gradient={isDarkBg} className="mx-auto md:mx-0 rounded-xl">
                                <RightPlanSummary
                                    title={getFreeTitle(shortAppName)}
                                    price={getSimplePriceString(options.currency, 0, '')}
                                    regularPrice={getSimplePriceString(options.currency, 0, '')}
                                    logo={<FreeLogo app={app} dark={theme.background === 'bf'} />}
                                    discount={0}
                                    free
                                    features={getFreePassFeatures()}
                                ></RightPlanSummary>
                            </RightSummary>
                        ) : (
                            <RightSummary
                                gradient={!isDarkBg}
                                className={clsx('p-6 no-mobile rounded-xl', isDarkBg && 'border border-weak')}
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
                                        <div className="flex flex-justify-space-between gap-14">
                                            <div className="flex-item-fluid w-0">
                                                <AccountSwitcherItem user={user} />
                                                {hasSelectedFree && (
                                                    <Button
                                                        color="norm"
                                                        fullWidth
                                                        size="large"
                                                        className="mt-6"
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

                        return (
                            <>
                                <BoxHeader
                                    {...(signupParameters.invite?.type === 'pass'
                                        ? {
                                              title: c('pass_signup_2023: Title').t`Create a ${PASS_APP_NAME} account`,
                                          }
                                        : {
                                              title: c('pass_signup_2023: Title').t`Create your ${BRAND_NAME} account`,
                                              step: step++,
                                          })}
                                />
                                <BoxContent>
                                    <div className="flex flex-align-items-start flex-justify-space-between gap-14">
                                        <div className="flex-item-fluid w-0 relative">
                                            <AccountStepDetails
                                                {...(signupParameters.invite?.type === 'pass'
                                                    ? {
                                                          defaultEmail: signupParameters.invite.data.invited,
                                                          disableEmail: true,
                                                      }
                                                    : undefined)}
                                                domains={model.domains}
                                                signupTypes={signupTypes}
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
                                                              withLoadingSignup(
                                                                  handleCompletion(
                                                                      getFreeSubscriptionData(model.subscriptionData)
                                                                  )
                                                              ).catch(noop);
                                                          }
                                                        : undefined
                                                }
                                                footer={(details) => {
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
                                                                            .t`Start using ${appName} now`}
                                                                    </Button>
                                                                </div>
                                                            )}
                                                            {signupParameters.mode !== SignupMode.Invite && (
                                                                <div className="text-center">
                                                                    <span>
                                                                        {
                                                                            // translator: Full sentence "Already have an account? Sign in"
                                                                            c('Go to sign in')
                                                                                .jt`Already have an account? ${signIn}`
                                                                        }
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
                    <Box className="mt-12 w-full">
                        <BoxHeader step={step++} title={c('pass_signup_2023: Header').t`Checkout`} />
                        <BoxContent>
                            <AccountStepPayment
                                takeNullCreditCard={false}
                                measure={measure}
                                cta={cta}
                                key={model.session?.UID || 'free'}
                                defaultMethod={model.session?.defaultPaymentMethod}
                                accountStepPaymentRef={accountStepPaymentRef}
                                api={normalApi}
                                model={model}
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
                                isSentinelPassplusEnabled={isSentinelPassplusEnabled}
                            />
                        </BoxContent>
                    </Box>
                )}
            </div>
        </Layout>
    );
};

export default Step1;
