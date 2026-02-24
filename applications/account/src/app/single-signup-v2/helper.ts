import isDeepEqual from 'lodash/isEqual';

import { canBuyPassLifetime } from '@proton/components/containers/payments/subscription/subscriptionEligbility';
import {
    type ADDON_NAMES,
    type BillingAddress,
    COUPON_CODES,
    CYCLE,
    type Currency,
    type Cycle,
    type CycleMapping,
    FREE_PLAN,
    FREE_SUBSCRIPTION,
    type FreeSubscription,
    type FullPlansMap,
    type PAYMENT_METHOD_TYPES,
    PLANS,
    type PaymentsApi,
    type Plan,
    type PlanIDs,
    type PlansMap,
    type SavedPaymentMethod,
    SelectedPlan,
    type StrictPlan,
    type Subscription,
    type SubscriptionPlan,
    getAddonsFromIDs,
    getDefaultMainCurrency,
    getFreeCheckResult,
    getHas2025OfferCoupon,
    getHasPlusPlan,
    getIsB2BAudienceFromPlan,
    getIsPlanTransitionForbidden,
    getNormalCycleFromCustomCycle,
    getPaymentMethods,
    getPlan,
    getPlanFromPlanIDs,
    getPlanNameFromIDs,
    getPrice,
    getSubscription,
    hasPlanIDs,
    isForbiddenLumoPlus,
    isForbiddenModification,
    isFreeSubscription,
    isLifetimePlanSelected,
    isSubscriptionCheckForbidden,
    isValidPlanName,
    switchPlan,
} from '@proton/payments';
import { getOptimisticCheckResult } from '@proton/payments/core/checkout';
import { getAutoCoupon } from '@proton/payments/core/subscription/helpers';
import type { SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import { partnerWhitelist } from '@proton/shared/lib/api/partner';
import type { ResumedSessionResult } from '@proton/shared/lib/authentication/persistedSessionHelper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import type { Api, Organization, User } from '@proton/shared/lib/interfaces';
import { Audience } from '@proton/shared/lib/interfaces';
import { getOrganization } from '@proton/shared/lib/organization/api';
import {
    canPay as getCanPay,
    isAdmin as getIsAdmin,
    hasPaidDrive,
    hasPaidLumo,
    hasPaidMail,
    hasPaidPass,
    hasPaidWallet,
    hasPassLifetime,
} from '@proton/shared/lib/user/helpers';

import { getSubscriptionPrices } from '../signup/helper';
import type { SessionData, SignupCacheResult, SubscriptionData } from '../signup/interfaces';
import { type PlanCard, isRegularPlanCard } from './PlanCardSelector';
import type { Options, PlanParameters, SignupConfiguration, SignupParameters2, Upsell } from './interface';
import { UpsellTypes } from './interface';

export const getIsBundleB2BPlan = (plan: PLANS | ADDON_NAMES | undefined) => {
    return [PLANS.BUNDLE_PRO, PLANS.BUNDLE_PRO_2024].some((bundlePlan) => plan === bundlePlan);
};

export const getFreeSubscriptionData = (
    subscriptionData: Omit<SubscriptionData, 'checkResult' | 'planIDs' | 'payment' | 'zipCodeValid'>
): SubscriptionData => {
    return {
        ...subscriptionData,
        checkResult: getFreeCheckResult(
            subscriptionData.currency,
            // "Reset" the cycle because the custom cycles are only valid with a coupon
            getNormalCycleFromCustomCycle(subscriptionData.cycle)
        ),
        planIDs: {},
        payment: undefined,
        zipCodeValid: true,
    };
};

export const getSubscriptionData = async (
    paymentsApi: PaymentsApi,
    options: Options & {
        info?: boolean;
        trial?: boolean;
        subscription?: Subscription | FreeSubscription;
    }
): Promise<SubscriptionData> => {
    const checkResultPromise = (async () => {
        const planIDs = options.planIDs ?? {};

        if (isSubscriptionCheckForbidden(options.subscription, planIDs, options.cycle)) {
            return getOptimisticCheckResult({
                plansMap: options.plansMap,
                planIDs,
                cycle: options.cycle,
                currency: options.currency,
            });
        }

        return getSubscriptionPrices({
            paymentsApi,
            planIDs,
            currency: options.currency,
            cycle: options.cycle,
            billingAddress: options.billingAddress,
            coupon: options.coupon,
            trial: options.trial,
            ValidateZipCode: options.ValidateZipCode,
            VatId: options.VatId,
        });
    })();

    const { checkResult, planIDs } = await checkResultPromise
        .then((checkResult) => {
            return {
                checkResult,
                planIDs: options.planIDs,
            };
        })
        .catch(() => {
            if (!options?.info) {
                return {
                    checkResult: getFreeCheckResult(
                        options.currency,
                        // "Reset" the cycle because the custom cycles are only valid with a coupon
                        getNormalCycleFromCustomCycle(options.cycle)
                    ),
                    planIDs: undefined,
                };
            }
            // If this is only an "informational" call, like what we would display in a plan/cycle card at signup, we can calculate the price optimistically
            return {
                checkResult: {
                    ...getOptimisticCheckResult(options),
                    Currency: options.currency,
                    PeriodEnd: 0,
                },
                planIDs: options.planIDs,
            };
        });

    return {
        cycle: checkResult.Cycle,
        currency: checkResult.Currency,
        checkResult,
        planIDs: planIDs || {},
        skipUpsell: options.skipUpsell ?? false,
        billingAddress: options.billingAddress,
        zipCodeValid: true,
    };
};

const hasSelectedPlan = (plan: Plan | undefined, plans: (PLANS | ADDON_NAMES)[]): plan is Plan => {
    return plans.some((planName) => plan?.Name === planName);
};

const getUnlockPlanName = (toApp: APP_NAMES) => {
    if (toApp === APPS.PROTONPASS) {
        return PLANS.PASS;
    }
    if (toApp === APPS.PROTONMAIL || toApp === APPS.PROTONCALENDAR) {
        return PLANS.MAIL;
    }
    if (toApp === APPS.PROTONDRIVE) {
        return PLANS.DRIVE;
    }
    return PLANS.MAIL;
};

const getSafePlan = (plansMap: PlansMap, planName: PLANS | ADDON_NAMES) => {
    const plan = plansMap[planName];
    if (!plan) {
        throw new Error('Missing plan');
    }
    return plan;
};

const getDefaultUpsellData = ({
    plansMap,
    currentPlan,
    toApp,
}: {
    plansMap: PlansMap;
    currentPlan?: SubscriptionPlan | undefined;
    toApp: APP_NAMES;
}) => {
    return {
        plan: undefined,
        addons: undefined,
        unlockPlan: plansMap[getUnlockPlanName(toApp)],
        currentPlan,
        mode: UpsellTypes.PLANS,
        subscriptionOptions: {},
    };
};

const getUpsellDataHelper = (
    planIDs: PlanIDs | undefined,
    plansMap: PlansMap,
    defaultUpsellData: ReturnType<typeof getDefaultUpsellData>
) => {
    const plan = planIDs ? getPlanNameFromIDs(planIDs) : undefined;
    const addons = getAddonsFromIDs(planIDs ?? {});

    return {
        ...defaultUpsellData,
        addons: Object.keys(addons).length > 0 ? addons : undefined,
        plan: plan ? plansMap[plan] : undefined,
        mode: UpsellTypes.UPSELL,
    };
};

const getUpsell = ({
    audience,
    currentPlan,
    subscription,
    plansMap,
    options,
    planParameters,
    toApp,
    user,
}: {
    audience: Audience;
    currentPlan?: SubscriptionPlan | undefined;
    upsellPlanCard?: PlanCard;
    subscription?: Subscription | FreeSubscription;
    plansMap: PlansMap;
    options: Options;
    planParameters: PlanParameters;
    toApp: APP_NAMES;
    user: User | undefined;
}): Upsell => {
    const noUpsell = getDefaultUpsellData({ plansMap, currentPlan, toApp });

    // TODO: WalletEA
    if (toApp === APPS.PROTONWALLET) {
        return noUpsell;
    }

    const getBlackFridayUpsellData = ({
        plan,
        cycle = CYCLE.YEARLY,
        coupon: couponProp,
    }: {
        plan: Plan;
        cycle?: CYCLE;
        coupon?: string;
    }) => {
        const bf25bundlePlans = [PLANS.BUNDLE, PLANS.DUO, PLANS.FAMILY] as (PLANS | ADDON_NAMES)[];
        const isBundlePlan = bf25bundlePlans.includes(plan.Name);

        const defaultCoupon = isBundlePlan ? COUPON_CODES.BLACK_FRIDAY_2025_BUNDLE : COUPON_CODES.BLACK_FRIDAY_2025;

        return {
            ...noUpsell,
            plan,
            subscriptionOptions: {
                planIDs: {
                    [plan.Name]: 1,
                },
                cycle,
                coupon: couponProp ?? defaultCoupon,
            },
            mode: UpsellTypes.UPSELL,
        };
    };

    const getUpsellData = (planIDs: PlanIDs = planParameters.planIDs) => {
        return getUpsellDataHelper(planIDs, plansMap, noUpsell);
    };

    if (user && hasPassLifetime(user) && isLifetimePlanSelected(options.planIDs ?? {})) {
        return noUpsell;
    }

    if (currentPlan && planParameters.defined) {
        // if this is the case when user has a subscription and wants to buy Lumo Plus then we don't need to block them
        // by showing the upsell. Insted, this situation will be handled in another function that will call
        // `isForbiddenLumoPlus()` again and will replace the plan with PlanIDs { [currentPlanName]: 1,
        // [lumo-addon-for-current-plan]: 1 }
        if (isForbiddenLumoPlus({ subscription, newPlanName: planParameters.plan.Name, plansMap })) {
            return noUpsell;
        }

        if (planParameters.plan.Name === PLANS.VISIONARY) {
            return getUpsellData();
        }

        if (getHas2025OfferCoupon(options.coupon)) {
            if (getHasPlusPlan(currentPlan.Name)) {
                const isValidBundleDuoFamilyFromPlus =
                    options.cycle === CYCLE.YEARLY &&
                    hasSelectedPlan(planParameters.plan, [PLANS.BUNDLE, PLANS.DUO, PLANS.FAMILY]);

                if (isValidBundleDuoFamilyFromPlus) {
                    return getBlackFridayUpsellData({ plan: planParameters.plan });
                }
                // Any other selected plan will give yearly bundle
                return getBlackFridayUpsellData({ plan: getSafePlan(plansMap, PLANS.BUNDLE) });
            }

            if (currentPlan.Name === PLANS.BUNDLE) {
                if (options.cycle === CYCLE.YEARLY && hasSelectedPlan(planParameters.plan, [PLANS.DUO, PLANS.FAMILY])) {
                    return getBlackFridayUpsellData({ plan: planParameters.plan });
                }
                return getBlackFridayUpsellData({ plan: getSafePlan(plansMap, PLANS.DUO) });
            }

            if (currentPlan.Name === PLANS.DUO) {
                if (options.cycle === CYCLE.YEARLY && hasSelectedPlan(planParameters.plan, [PLANS.FAMILY])) {
                    return getBlackFridayUpsellData({ plan: planParameters.plan });
                }
                return getBlackFridayUpsellData({ plan: getSafePlan(plansMap, PLANS.FAMILY) });
            }
        } else {
            if (audience === Audience.B2B) {
                if (
                    getIsB2BAudienceFromPlan(planParameters.plan.Name) ||
                    getIsBundleB2BPlan(planParameters.plan.Name)
                ) {
                    return getUpsellData();
                }
                return noUpsell;
            } else {
                if (
                    hasSelectedPlan(planParameters.plan, [PLANS.PASS_LIFETIME]) &&
                    canBuyPassLifetime(user, subscription)
                ) {
                    return getUpsellData();
                }

                if (getHasPlusPlan(currentPlan.Name)) {
                    if (
                        hasSelectedPlan(planParameters.plan, [PLANS.PASS_FAMILY, PLANS.BUNDLE, PLANS.DUO, PLANS.FAMILY])
                    ) {
                        return getUpsellData();
                    }
                    return getUpsellData({ [PLANS.BUNDLE]: 1 });
                }

                if (currentPlan.Name === PLANS.BUNDLE) {
                    if (hasSelectedPlan(planParameters.plan, [PLANS.DUO, PLANS.FAMILY])) {
                        return getUpsellData();
                    }
                    return getUpsellData({ [PLANS.DUO]: 1 });
                }

                if (currentPlan.Name === PLANS.PASS_FAMILY || currentPlan.Name === PLANS.DUO) {
                    if (hasSelectedPlan(planParameters.plan, [PLANS.DUO, PLANS.FAMILY])) {
                        return getUpsellData();
                    }
                    return getUpsellData({ [PLANS.FAMILY]: 1 });
                }

                if (getIsB2BAudienceFromPlan(currentPlan.Name) && !getIsBundleB2BPlan(planParameters.plan.Name)) {
                    return getUpsellData({ [PLANS.BUNDLE_PRO_2024]: 1 });
                }
            }
        }
    }

    return noUpsell;
};

export const getRelativeUpsellPrice = (
    upsell: Upsell,
    plansMap: PlansMap,
    checkResult: SubscriptionEstimation | undefined,
    subscription: Subscription | FreeSubscription | undefined,
    cycle: CYCLE
) => {
    if (!upsell.currentPlan || !upsell.plan) {
        return 0;
    }

    if (subscription && checkResult && !isFreeSubscription(subscription)) {
        return (
            (checkResult.Amount + (checkResult?.CouponDiscount || 0)) / cycle - subscription.Amount / subscription.Cycle
        );
    }

    const priceCurrentPlan = getPrice({ [upsell.currentPlan.Name]: 1 }, cycle, plansMap);
    const priceUpsell = getPrice({ [upsell.plan.Name]: 1 }, cycle, plansMap);

    return priceUpsell / cycle - priceCurrentPlan / cycle;
};

const hasAccess = ({
    toApp,
    user,
    audience,
    currentPlan,
}: {
    toApp: APP_NAMES;
    user: User;
    audience: Audience;
    currentPlan?: SubscriptionPlan;
}) => {
    if (toApp === APPS.PROTONPASS) {
        if (audience === Audience.B2B) {
            return [
                PLANS.PASS_BUSINESS,
                PLANS.VISIONARY,
                PLANS.FAMILY,
                PLANS.BUNDLE_PRO,
                PLANS.BUNDLE_PRO_2024,
                PLANS.BUNDLE_BIZ_2025,
            ].includes(currentPlan?.Name as any);
        }
        return hasPaidPass(user);
    }

    if ([APPS.PROTONMAIL, APPS.PROTONCALENDAR].includes(toApp as any)) {
        return hasPaidMail(user);
    }

    if (toApp === APPS.PROTONDRIVE) {
        return hasPaidDrive(user);
    }

    if (toApp === APPS.PROTONWALLET) {
        return hasPaidWallet(user);
    }

    if (toApp === APPS.PROTONLUMO) {
        return hasPaidLumo(user);
    }

    return false;
};

export const getUpdatedPlanIDs = ({
    options,
    subscription,
    plansMap,
    currentPlan,
    toApp,
    plans,
    organization,
}: {
    options: {
        planIDs: PlanIDs | undefined;
        cycle: CYCLE;
    };
    plansMap: PlansMap;
    plans: Plan[];
    toApp: APP_NAMES;
    subscription: Subscription | FreeSubscription;
    currentPlan: SubscriptionPlan | undefined;
    organization: Organization | undefined;
}) => {
    if (!subscription || !organization || !options.planIDs) {
        return;
    }
    const planTransitionForbidden = getIsPlanTransitionForbidden({
        subscription,
        plansMap,
        planIDs: options.planIDs,
    });

    if (planTransitionForbidden?.type === 'lumo-plus') {
        const upsell = getUpsellDataHelper(
            undefined,
            plansMap,
            getDefaultUpsellData({
                plansMap,
                currentPlan,
                toApp,
            })
        );
        return {
            upsell,
            planIDs: planTransitionForbidden.newPlanIDs,
        };
    }

    if (planTransitionForbidden?.type === 'plus-to-plus') {
        const upsell = getUpsellDataHelper(
            { [PLANS.BUNDLE]: 1 },
            plansMap,
            getDefaultUpsellData({
                plansMap,
                currentPlan,
                toApp,
            })
        );
        const planIDs = switchPlan({
            subscription,
            newPlan: PLANS.BUNDLE,
            organization,
            plans,
        });
        return { upsell, planIDs };
    }

    // not handling visionary-downgrade because V2 signup page already catches it with the AccessModal
};

const handleBf2025LumoAddonEdgeCases = ({
    subscription,
    replacedPlanIDs,
    planIDsSelectedByUser,
    selectedCoupon,
    plansMap,
    currency,
    cycle,
}: {
    subscription: Subscription | FreeSubscription;
    replacedPlanIDs: PlanIDs | undefined;
    planIDsSelectedByUser: PlanIDs | undefined;
    selectedCoupon: string | undefined;
    plansMap: PlansMap;
    currency: Currency;
    cycle: CYCLE;
}) => {
    const currentPlan = SelectedPlan.createFromSubscription(subscription, plansMap);

    {
        const selectedPlanByUser = getPlanNameFromIDs(planIDsSelectedByUser ?? {});

        const userWantsToBuyLumo = currentPlan.getPlanName() !== PLANS.LUMO && selectedPlanByUser === PLANS.LUMO;

        if (userWantsToBuyLumo && getHas2025OfferCoupon(selectedCoupon)) {
            const userStaysOnTheSameCycleAndCurrency = currentPlan.cycle === cycle && currentPlan.currency === currency;
            const hasYearlySubscription = currentPlan.cycle === CYCLE.YEARLY;

            if (userStaysOnTheSameCycleAndCurrency && hasYearlySubscription) {
                return COUPON_CODES.BLACK_FRIDAY_2025_LUMOADDON;
            }

            return COUPON_CODES.BLACK_FRIDAY_2025_LUMOADDON_OMNI;
        }
    }

    {
        const planAfterItWasSwitched = getPlanNameFromIDs(replacedPlanIDs ?? {});

        const userHasLumo = currentPlan.getPlanName() === PLANS.LUMO;
        const userSelectedNonLumo = planAfterItWasSwitched !== PLANS.LUMO;

        const userWantsToBuyNonLumoPlan = userHasLumo && userSelectedNonLumo;
        if (userWantsToBuyNonLumoPlan && getHas2025OfferCoupon(selectedCoupon)) {
            return COUPON_CODES.BLACK_FRIDAY_2025_LUMOADDON_OMNI;
        }
    }

    return selectedCoupon;
};

export const getUserInfo = async ({
    api,
    audience,
    paymentsApi,
    user,
    options,
    plansMap,
    plans,
    planParameters,
    signupParameters,
    upsellPlanCard,
    toApp,
    availableCycles,
}: {
    api: Api;
    paymentsApi: PaymentsApi;
    user?: User | undefined;
    options: Options;
    plansMap: PlansMap;
    plans: Plan[];
    audience: Audience;
    upsellPlanCard?: PlanCard;
    planParameters: PlanParameters;
    signupParameters: SignupParameters2;
    toApp: APP_NAMES;
    availableCycles: CYCLE[];
}): Promise<{
    paymentMethods: SavedPaymentMethod[];
    subscription: Subscription | FreeSubscription | undefined;
    subscriptionData: SubscriptionData;
    organization: Organization | undefined;
    state: SessionData['state'];
    upsell: Upsell;
    defaultPaymentMethod: PAYMENT_METHOD_TYPES | undefined;
}> => {
    if (!user) {
        return {
            paymentMethods: [],
            subscription: undefined,
            subscriptionData: await getSubscriptionData(paymentsApi, options),
            organization: undefined,
            defaultPaymentMethod: undefined,
            state: {
                payable: true,
                subscribed: false,
                admin: false,
                access: false,
                unavailable: false,
            },
            upsell: getUpsell({ audience, plansMap, upsellPlanCard, options, planParameters, toApp, user }),
        };
    }

    const state = {
        payable: getCanPay(user),
        admin: getIsAdmin(user),
        subscribed: Boolean(user.Subscribed),
        access: false,
        unavailable: false,
    };

    const [paymentMethods, rawSubscription, organization] = await Promise.all([
        state.payable ? getPaymentMethods(api) : [],
        state.payable && state.admin && state.subscribed ? getSubscription(api, user) : FREE_SUBSCRIPTION,
        state.subscribed ? getOrganization({ api }) : undefined,
    ]);

    const subscription: Subscription | FreeSubscription = rawSubscription.UpcomingSubscription ?? rawSubscription;

    const currentPlan = (() => {
        const plan = getPlan(subscription);
        if (plan) {
            return plan;
        }
        if (organization) {
            return plansMap[organization.PlanName];
        }
    })();

    let upsell = getUpsell({
        audience,
        currentPlan,
        subscription,
        upsellPlanCard,
        plansMap,
        options,
        planParameters,
        toApp,
        user,
    });

    if (user && hasAccess({ toApp, user, audience, currentPlan })) {
        state.access = true;
    }

    // Disable the access modal and show the upsell flow instead
    if (state.payable && upsell.plan?.Name) {
        state.access = false;
    }

    const cycle = (() => {
        const preferredCycle = signupParameters.cycle || subscription.Cycle || options.cycle;

        if (availableCycles.includes(preferredCycle)) {
            return preferredCycle;
        }

        return Math.max(...availableCycles);
    })();

    let optionsWithSubscriptionDefaults = {
        ...options,
        subscription,
        cycle,
        currency: options.currency,
        coupon: options.coupon || subscription.CouponCode || undefined,
    };

    if (upsell.plan) {
        optionsWithSubscriptionDefaults = {
            ...optionsWithSubscriptionDefaults,
            ...upsell.subscriptionOptions,
            planIDs: switchPlan({
                subscription,
                newPlanIDs: {
                    [upsell.plan.Name]: 1,
                    ...upsell.addons,
                },
                organization,
                plans,
            }),
        };
    }

    optionsWithSubscriptionDefaults.coupon = handleBf2025LumoAddonEdgeCases({
        subscription: rawSubscription,
        replacedPlanIDs: optionsWithSubscriptionDefaults.planIDs ?? {},
        planIDsSelectedByUser: options.planIDs,
        selectedCoupon: optionsWithSubscriptionDefaults.coupon,
        plansMap,
        currency: optionsWithSubscriptionDefaults.currency,
        cycle: optionsWithSubscriptionDefaults.cycle,
    });

    const replacePlanIfChangeIsForbidden = getUpdatedPlanIDs({
        subscription,
        organization,
        plans,
        toApp,
        currentPlan,
        options: optionsWithSubscriptionDefaults,
        plansMap,
    });
    if (replacePlanIfChangeIsForbidden?.upsell) {
        upsell = replacePlanIfChangeIsForbidden.upsell;
    }
    if (replacePlanIfChangeIsForbidden?.planIDs) {
        optionsWithSubscriptionDefaults.planIDs = replacePlanIfChangeIsForbidden.planIDs;
    }

    if (state.payable && isForbiddenModification(subscription, optionsWithSubscriptionDefaults.planIDs ?? {})) {
        state.access = false;
        state.unavailable = true;
    }

    const subscriptionData = await (() => {
        if (!state.payable || state.access) {
            return getFreeSubscriptionData(optionsWithSubscriptionDefaults);
        }

        return getSubscriptionData(paymentsApi, optionsWithSubscriptionDefaults);
    })();

    return {
        paymentMethods,
        defaultPaymentMethod: undefined,
        subscription,
        subscriptionData,
        organization,
        state,
        upsell,
    };
};

export const getSessionDataFromSignup = (cache: SignupCacheResult): SessionData => {
    const setupData = cache.setupData;
    if (!setupData) {
        throw new Error('Missing setup data');
    }
    return {
        resumedSessionResult: setupData.session,
        subscription: undefined,
        organization: undefined,
        paymentMethods: [],
        defaultPaymentMethod: undefined,
        state: {
            payable: true,
            admin: false,
            subscribed: false,
            access: false,
            unavailable: false,
        },
    };
};

export type SubscriptionDataCycleMapping = Partial<{ [key in PLANS]: CycleMapping<SubscriptionData> }>;
export const getPlanCardSubscriptionDataMapping = ({
    result,
    plansMap,
}: {
    result: SubscriptionData[];
    plansMap: PlansMap;
}): SubscriptionDataCycleMapping => {
    return result.reduce<SubscriptionDataCycleMapping>((acc, subscriptionData) => {
        const plan = !hasPlanIDs(subscriptionData.planIDs)
            ? FREE_PLAN
            : getPlanFromPlanIDs(plansMap, subscriptionData.planIDs);
        if (!plan) {
            return acc;
        }
        let cycleMapping = acc[plan.Name as unknown as keyof typeof acc];
        if (!cycleMapping) {
            cycleMapping = {};
            acc[plan.Name as unknown as keyof typeof acc] = cycleMapping;
        }
        cycleMapping[subscriptionData.cycle] = subscriptionData;
        return acc;
    }, {});
};

export const getOptimisticPlanCardSubscriptionData = ({
    planIDs,
    plansMap,
    cycle,
    billingAddress,
    currency,
}: {
    cycle: CYCLE;
    planIDs: PlanIDs;
    plansMap: PlansMap;
    billingAddress: BillingAddress;
    currency: Currency;
}): SubscriptionData => {
    return {
        planIDs,
        currency,
        cycle,
        checkResult: {
            ...getOptimisticCheckResult({ planIDs, plansMap, cycle, currency }),
            Currency: currency,
            PeriodEnd: 0,
        },
        billingAddress,
        zipCodeValid: true,
    };
};

export const getOptimisticPlanCardsSubscriptionData = ({
    planIDs,
    plansMap,
    cycles,
    billingAddress,
}: {
    cycles: CYCLE[];
    planIDs: PlanIDs[];
    plansMap: PlansMap;
    billingAddress: BillingAddress;
}): SubscriptionDataCycleMapping => {
    const result = planIDs.flatMap((planIDs) =>
        cycles
            .map((cycle) => [planIDs, cycle] as const)
            .map(([planIDs, cycle]): SubscriptionData => {
                // make sure that the plan and all its addons exist
                const plansToCheck = Object.keys(planIDs) as (PLANS | ADDON_NAMES)[];
                // we extract the currency of the currently selected plan in plansMap.
                const currency = plansMap[plansToCheck[0]]?.Currency ?? getDefaultMainCurrency(billingAddress);
                return getOptimisticPlanCardSubscriptionData({ billingAddress, planIDs, cycle, plansMap, currency });
            })
    );

    return getPlanCardSubscriptionDataMapping({ result, plansMap });
};

export const getPlanCardSubscriptionData = async ({
    planIDs,
    plansMap,
    paymentsApi,
    coupon: maybeCoupon,
    cycles,
    billingAddress,
    trial,
}: {
    cycles: CYCLE[];
    planIDs: PlanIDs[];
    plansMap: PlansMap;
    paymentsApi: PaymentsApi;
    coupon?: string | null;
    billingAddress: BillingAddress;
    trial?: boolean;
}): Promise<SubscriptionDataCycleMapping> => {
    const result = await Promise.all(
        planIDs.flatMap((planIDs) =>
            cycles
                .map((cycle) => [planIDs, cycle] as const)
                .map(async ([planIDs, cycle]): Promise<SubscriptionData> => {
                    // make sure that the plan and all its addons exist
                    const plansToCheck = Object.keys(planIDs) as (PLANS | ADDON_NAMES)[];
                    const plansExist = plansToCheck.every(
                        (planName) => plansMap[planName]?.Pricing?.[cycle] !== undefined
                    );

                    // we extract the currency of the currently selected plan in plansMap.
                    const currency = plansMap[plansToCheck[0]]?.Currency ?? getDefaultMainCurrency(billingAddress);

                    const coupon =
                        maybeCoupon === null
                            ? undefined
                            : getAutoCoupon({ coupon: maybeCoupon, planIDs, cycle, trial, currency });

                    // If there's no coupon we can optimistically calculate the price.
                    // In addition, if the selected plan doesn't exist, then we don't do the live check call.
                    if (!coupon || !plansExist) {
                        return getOptimisticPlanCardSubscriptionData({
                            billingAddress,
                            planIDs,
                            cycle,
                            plansMap,
                            currency,
                        });
                    }

                    const subscriptionData = await getSubscriptionData(paymentsApi, {
                        plansMap,
                        planIDs,
                        cycle,
                        coupon,
                        currency,
                        billingAddress,
                        info: true,
                        trial,
                        VatId: undefined,
                    });
                    return subscriptionData;
                })
        )
    );

    return getPlanCardSubscriptionDataMapping({ result, plansMap });
};

export const swapCurrency = (
    subscriptionDataCycleMapping: SubscriptionDataCycleMapping,
    currency: Currency
): SubscriptionDataCycleMapping => {
    return (
        Object.entries(subscriptionDataCycleMapping) as [PLANS, CycleMapping<SubscriptionData>][]
    ).reduce<SubscriptionDataCycleMapping>((acc, [planName, cycleMapping]) => {
        acc[planName] = (Object.entries(cycleMapping) as [string, SubscriptionData][]).reduce<
            CycleMapping<SubscriptionData>
        >((acc, [cycle, subscriptionData]) => {
            acc[+cycle as Cycle] = {
                ...subscriptionData,
                currency,
                checkResult: {
                    ...subscriptionData.checkResult,
                    Currency: currency,
                },
            };
            return acc;
        }, {});
        return acc;
    }, {});
};

export const getSubscriptionMapping = ({
    subscriptionDataCycleMapping,
    planName,
    planIDs: newPlanIDs,
}: {
    subscriptionDataCycleMapping: SubscriptionDataCycleMapping;
    planName: PLANS | ADDON_NAMES;
    planIDs: PlanIDs;
}) => {
    // ugh
    let subscriptionMapping = subscriptionDataCycleMapping?.[planName as unknown as PLANS];
    if (!subscriptionMapping) {
        return undefined;
    }
    const firstKey = Object.keys(subscriptionMapping)[0] as unknown as keyof typeof subscriptionMapping;
    const planIDs = subscriptionMapping[firstKey]?.planIDs;
    if (!isDeepEqual(planIDs, newPlanIDs)) {
        subscriptionMapping = undefined;
    }
    return subscriptionMapping;
};

interface GetAccessiblePlansParams {
    planCards: SignupConfiguration['planCards'];
    audience: Audience;
    plans: Plan[];
    paramPlanName?: string;
}

export const getAccessiblePlans = ({
    planCards,
    audience,
    plans,
    paramPlanName,
}: GetAccessiblePlansParams): StrictPlan[] => {
    if (audience !== Audience.B2C && audience !== Audience.B2B) {
        return [];
    }

    const accessiblePlanNames = planCards[audience].map(({ plan }) => plan);
    if (paramPlanName && isValidPlanName(paramPlanName)) {
        accessiblePlanNames.push(paramPlanName);
    }

    return plans.filter(({ Name }) => accessiblePlanNames.includes(Name as PLANS)) as StrictPlan[];
};

export const getSubscriptionDataCycleMapping = async ({
    paymentsApi,
    plansMap,
    coupon,
    signupConfiguration,
    billingAddress,
}: {
    paymentsApi: PaymentsApi;
    plansMap: FullPlansMap;
    coupon: string | undefined | null;
    signupConfiguration: SignupConfiguration;
    billingAddress: BillingAddress;
}) => {
    const [b2c, b2b] = await Promise.all(
        ([Audience.B2C, Audience.B2B] as const).map((audienceToFetch) => {
            const planIDs = signupConfiguration.planCards[audienceToFetch]
                .filter(isRegularPlanCard)
                .map(({ plan }) => ({ [plan]: 1 }));
            return getPlanCardSubscriptionData({
                planIDs,
                plansMap,
                cycles: signupConfiguration.cycles,
                paymentsApi,
                coupon,
                billingAddress,
            });
        })
    );
    return { ...b2b, ...b2c };
};

export const getTemporarySignupParameters = async ({
    session,
    signupParameters,
    api,
}: {
    session: ResumedSessionResult | undefined;
    signupParameters: SignupParameters2;
    api: Api;
}) => {
    if (session && signupParameters.invite?.type === 'porkbun') {
        const { CouponName } = await api<{ CouponName: string }>(
            partnerWhitelist({ Token: signupParameters.invite.data.porkbunToken })
        ).catch(() => ({ CouponName: COUPON_CODES.PORKBUN })); // this catch will need rework if we add a new partner later

        return {
            ...signupParameters,
            preSelectedPlan: undefined,
            coupon: CouponName,
        };
    }
    return signupParameters;
};
