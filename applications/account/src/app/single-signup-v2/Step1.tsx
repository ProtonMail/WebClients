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

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Vr } from '@proton/atoms/Vr';
import { Icon, InlineLinkButton } from '@proton/components/components';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { CurrencySelector, CycleSelector } from '@proton/components/containers';
import { getShortBillingText } from '@proton/components/containers/payments/helper';
import { useLoading } from '@proton/hooks';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import { APP_NAMES, BRAND_NAME, CYCLE, PLANS } from '@proton/shared/lib/constants';
import { getOptimisticCheckResult } from '@proton/shared/lib/helpers/checkout';
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
import { SignupCacheResult, SubscriptionData } from '../signup/interfaces';
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
import { Measure, OnOpenLogin, OptimisticOptions, SignupMode, SignupModelV2, UpsellTypes } from './interface';
import { getFreePassFeatures } from './pass/configuration';

export interface Step1Rref {
    handleOptimistic: (options: Partial<OptimisticOptions>) => Promise<void>;
    scrollIntoPayment: () => void;
}

const Step1 = ({
    relativePrice,
    logo,
    features,
    app,
    shortAppName,
    appName,
    titles,
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
    relativePrice: string;
    app: APP_NAMES;
    shortAppName: string;
    appName: string;
    logo: ReactNode;
    titles: { [SignupMode.Default]: ReactNode; [SignupMode.Onboarding]: ReactNode };
    features: { text: string; left: ReactNode }[];
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
    hideFreePlan: boolean;
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

    const createFlow = useFlowRef();

    const options: OptimisticOptions = {
        currency: model.optimistic.currency || model.subscriptionData.currency,
        cycle: model.optimistic.cycle || model.subscriptionData.cycle,
        plan: model.optimistic.plan || selectedPlan,
        planIDs: model.optimistic.planIDs || model.subscriptionData.planIDs,
        checkResult: model.optimistic.checkResult || model.subscriptionData.checkResult,
    };

    const selectedPlanCard = planCards.find((planCard) => planCard.plan === options.plan.Name);

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
                model.subscriptionData.checkResult.Coupon?.Code
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
        await onComplete({ subscriptionData, accountData, type: type || 'signup' });
    };

    const cycles = [CYCLE.MONTHLY, CYCLE.YEARLY, CYCLE.TWO_YEARS].map((cycle) => ({
        text: getShortBillingText(cycle),
        value: cycle,
    }));

    const cta = c('pass_signup_2023: Action').t`Start using ${appName} now`;
    const hasSelectedFree = selectedPlanCard?.plan === PLANS.FREE;
    const isOnboardingMode = mode === SignupMode.Onboarding && !!model.session?.user;

    return (
        <Layout logo={logo} hasDecoration bottomRight={<SignupSupportDropdown />} className={className}>
            <div className="flex flex-align-items-center flex-column">
                <div className="single-signup-header-v2 text-center mt-8 mb-4">
                    <h1 className="m-0 large-font lg:px-4 text-semibold">
                        {!isOnboardingMode ? titles[SignupMode.Default] : titles[SignupMode.Onboarding]}
                    </h1>
                </div>
                {!isOnboardingMode && (
                    <div className="flex flex-nowrap mb-4 md:gap-8 gap-3">
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
                {(() => {
                    const bestPlanCard = planCards.find((planCard) => planCard.type === 'best');
                    const bestPlan = bestPlanCard?.plan && model.plansMap[bestPlanCard.plan];
                    if (!bestPlanCard || !bestPlan || model.upsell.mode === UpsellTypes.UPSELL) {
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
                    return (
                        <div className="signup-v2-offer-banner py-2 px-4 rounded-lg color-primary text-lg inline-flex flex-nowrap mt-4">
                            <Icon name="hourglass" size={14} className="flex-item-noshrink mt-1" />
                            <span className="ml-2 flex-item-fluid">{textLaunchOffer}</span>
                        </div>
                    );
                })()}
                <Box className="mt-8 w100">
                    <BoxHeader
                        step={1}
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
                                            return withLoadingPaymentDetails(handleChangeCycle(newCycle)).catch(noop);
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
                                    return withLoadingPaymentDetails(handleChangePlan(planIDs, planName)).catch(noop);
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
                                plan={options.plan}
                                cycle={options.cycle}
                                currency={options.currency}
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
                                        className="h100 px-3"
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
                <Box className={clsx('mt-12 w100', isOnboardingMode && !hasSelectedFree && 'hidden')}>
                    {(() => {
                        const step2Summary = isOnboardingMode ? (
                            <RightSummary className="mx-auto md:mx-0">
                                <RightPlanSummary
                                    title={getFreeTitle(shortAppName)}
                                    price={getSimplePriceString(options.currency, 0, '')}
                                    regularPrice={getSimplePriceString(options.currency, 0, '')}
                                    logo={<FreeLogo app={app} />}
                                    discount={0}
                                    free
                                    features={getFreePassFeatures()}
                                ></RightPlanSummary>
                            </RightSummary>
                        ) : (
                            <RightSummary gradient className="p-6 no-mobile rounded-xl">
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

                        if (user && !loadingSignout) {
                            return (
                                <>
                                    <BoxHeader
                                        step={2}
                                        title={c('pass_signup_2023: Header')
                                            .t`Continue with your ${BRAND_NAME} account`}
                                    />
                                    <BoxContent>
                                        <div className="flex flex-justify-space-between gap-14">
                                            <div className="flex-item-fluid w0">
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
                                    step={2}
                                    title={c('pass_signup_2023: Title').t`Create your ${BRAND_NAME} account`}
                                />
                                <BoxContent>
                                    <div className="flex flex-align-items-start flex-justify-space-between gap-14">
                                        <div className="flex-item-fluid w0 relative">
                                            <AccountStepDetails
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
                                                            <div className="text-center">
                                                                <span>
                                                                    {
                                                                        // translator: Full sentence "Already have an account? Sign in"
                                                                        c('Go to sign in')
                                                                            .jt`Already have an account? ${signIn}`
                                                                    }
                                                                </span>
                                                            </div>
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
                    <Box className="mt-12 w100">
                        <BoxHeader step={isOnboardingMode ? 2 : 3} title={c('pass_signup_2023: Header').t`Checkout`} />
                        <BoxContent>
                            <AccountStepPayment
                                measure={measure}
                                cta={cta}
                                key={model.session?.UID || 'free'}
                                defaultMethod={model.session?.defaultPaymentMethod}
                                accountStepPaymentRef={accountStepPaymentRef}
                                selectedPlanCard={selectedPlanCard}
                                api={normalApi}
                                model={model}
                                options={options}
                                plansMap={model.plansMap}
                                vpnServersCountData={vpnServersCountData}
                                loadingSignup={loadingSignup}
                                loadingPaymentDetails={loadingPaymentDetails || loadingSignout}
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
                            />
                        </BoxContent>
                    </Box>
                )}
            </div>
        </Layout>
    );
};

export default Step1;
