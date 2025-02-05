import { c } from 'ttag';

import { getAutoCoupon } from '@proton/components/containers/payments/subscription/helpers';
import { getMaybeForcePaymentsVersion } from '@proton/components/payments/client-extensions';
import { COUPON_CODES, CYCLE, formatPaymentMethods } from '@proton/payments';
import type {
    BillingAddress,
    FullPlansMap,
    PAYMENT_METHOD_TYPES,
    PaymentsApi,
    SavedPaymentMethod,
} from '@proton/payments';
import { DEFAULT_TAX_BILLING_ADDRESS } from '@proton/payments';
import {
    type ADDON_NAMES,
    type Currency,
    DEFAULT_CURRENCY,
    FREE_SUBSCRIPTION,
    PLANS,
    type PlanIDs,
    isStringPLAN,
} from '@proton/payments';
import { getOrganization } from '@proton/shared/lib/api/organization';
import { partnerWhitelist } from '@proton/shared/lib/api/partner';
import { getSubscription, queryPaymentMethods } from '@proton/shared/lib/api/payments';
import type { ResumedSessionResult } from '@proton/shared/lib/authentication/persistedSessionHelper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import { getOptimisticCheckResult } from '@proton/shared/lib/helpers/checkout';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import {
    getPlanFromPlanIDs,
    getPricingFromPlanIDs,
    hasPlanIDs,
    isLifetimePlanSelected,
    switchPlan,
} from '@proton/shared/lib/helpers/planIDs';
import {
    getHas2024OfferCoupon,
    getIsB2BAudienceFromPlan,
    getNormalCycleFromCustomCycle,
    getPlan,
    getPlanIDs,
} from '@proton/shared/lib/helpers/subscription';
import type {
    Api,
    Cycle,
    CycleMapping,
    Organization,
    Plan,
    PlansMap,
    StrictPlan,
    Subscription,
    SubscriptionCheckResponse,
    SubscriptionPlan,
    User,
} from '@proton/shared/lib/interfaces';
import { Audience } from '@proton/shared/lib/interfaces';
import { FREE_PLAN, getFreeCheckResult } from '@proton/shared/lib/subscription/freePlans';
import {
    canPay as getCanPay,
    isAdmin as getIsAdmin,
    hasPaidDrive,
    hasPaidMail,
    hasPaidPass,
} from '@proton/shared/lib/user/helpers';

import { getSubscriptionPrices } from '../signup/helper';
import type { SessionData, SignupCacheResult, SubscriptionData } from '../signup/interfaces';
import type { PlanCard } from './PlanCardSelector';
import type { Options, PlanParameters, SignupConfiguration, SignupParameters2, Upsell } from './interface';
import { UpsellTypes } from './interface';

export const getFreeTitle = (appName: string) => {
    return c('Title').t`${appName} Free`;
};

export const getIsProductB2BPlan = (plan: PLANS | ADDON_NAMES | undefined) => {
    const proPlans = [
        PLANS.MAIL_PRO,
        PLANS.MAIL_BUSINESS,
        PLANS.DRIVE_PRO,
        PLANS.DRIVE_BUSINESS,
        PLANS.VPN_PRO,
        PLANS.VPN_BUSINESS,
        PLANS.PASS_PRO,
        PLANS.PASS_BUSINESS,
    ];
    return proPlans.some((proPlan) => plan === proPlan);
};

export const getIsBundleB2BPlan = (plan: PLANS | ADDON_NAMES | undefined) => {
    return [PLANS.BUNDLE_PRO, PLANS.BUNDLE_PRO_2024].some((bundlePlan) => plan === bundlePlan);
};

export const getHasAnyPlusPlan = (subscribedPlan: PLANS | ADDON_NAMES | undefined) => {
    return [PLANS.MAIL, PLANS.DRIVE, PLANS.VPN, PLANS.VPN2024, PLANS.PASS, PLANS.VPN_PASS_BUNDLE].some(
        (plan) => plan === subscribedPlan
    );
};

export const getFreeSubscriptionData = (
    subscriptionData: Omit<SubscriptionData, 'checkResult' | 'planIDs' | 'payment'>
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
    };
};

export const getSubscriptionData = async (
    paymentsApi: PaymentsApi,
    options: Options & {
        info?: boolean;
    }
): Promise<SubscriptionData> => {
    const { planIDs, checkResult } = await getSubscriptionPrices(
        paymentsApi,
        options.planIDs || {},
        options.currency,
        options.cycle,
        options.billingAddress,
        options.coupon
    )
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

const getUpsell = ({
    audience,
    currentPlan,
    subscription,
    plansMap,
    options,
    planParameters,
    toApp,
}: {
    audience: Audience;
    currentPlan?: SubscriptionPlan | undefined;
    upsellPlanCard?: PlanCard;
    subscription?: Subscription;
    plansMap: PlansMap;
    options: Options;
    planParameters: PlanParameters;
    toApp: APP_NAMES;
}): Upsell => {
    const hasMonthlyCycle = subscription?.Cycle === CYCLE.MONTHLY;

    const noUpsell = {
        plan: undefined,
        unlockPlan: plansMap[getUnlockPlanName(toApp)],
        currentPlan,
        mode: UpsellTypes.PLANS,
        subscriptionOptions: {},
    };

    // TODO: WalletEA
    if (toApp === APPS.PROTONWALLET) {
        return noUpsell;
    }

    const getBlackFridayUpsellData = ({
        plan,
        cycle = CYCLE.YEARLY,
        coupon = COUPON_CODES.BLACK_FRIDAY_2024,
    }: {
        plan: Plan;
        cycle?: CYCLE;
        coupon?: string;
    }) => {
        return {
            ...noUpsell,
            plan,
            subscriptionOptions: {
                planIDs: {
                    [plan.Name]: 1,
                },
                cycle,
                coupon,
            },
            mode: UpsellTypes.UPSELL,
        };
    };

    const getUpsellData = (plan: PLANS | ADDON_NAMES) => {
        return {
            ...noUpsell,
            plan: plansMap[plan],
            mode: UpsellTypes.UPSELL,
        };
    };

    if (currentPlan && planParameters.defined) {
        if (planParameters.plan.Name === PLANS.VISIONARY) {
            return getUpsellData(planParameters.plan.Name);
        }

        if (isLifetimePlanSelected(options.planIDs ?? {}) && !getIsB2BAudienceFromPlan(currentPlan.Name)) {
            return getBlackFridayUpsellData({ plan: getSafePlan(plansMap, PLANS.PASS_LIFETIME) });
        }

        if (getHas2024OfferCoupon(options.coupon)) {
            if (getHasAnyPlusPlan(currentPlan.Name)) {
                if (currentPlan.Name === PLANS.PASS) {
                    if (
                        options.cycle === CYCLE.YEARLY &&
                        hasSelectedPlan(planParameters.plan, [PLANS.PASS_FAMILY, PLANS.BUNDLE, PLANS.DUO, PLANS.FAMILY])
                    ) {
                        return getBlackFridayUpsellData({ plan: planParameters.plan });
                    }
                    const plan = getSafePlan(plansMap, PLANS.PASS_FAMILY);
                    return getBlackFridayUpsellData({ plan });
                }

                if ((currentPlan.Name === PLANS.VPN2024 || currentPlan.Name === PLANS.VPN) && hasMonthlyCycle) {
                    if (
                        (options.cycle === CYCLE.YEARLY || options.cycle === CYCLE.TWO_YEARS) &&
                        hasSelectedPlan(planParameters.plan, [PLANS.VPN2024])
                    ) {
                        return getBlackFridayUpsellData({
                            plan: planParameters.plan,
                            cycle: options.cycle,
                            coupon: options.coupon,
                        });
                    }
                }

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
                if (
                    subscription?.CouponCode === COUPON_CODES.DEGOOGLE &&
                    hasMonthlyCycle &&
                    options.cycle === CYCLE.YEARLY &&
                    hasSelectedPlan(planParameters.plan, [PLANS.BUNDLE])
                ) {
                    return getBlackFridayUpsellData({ plan: planParameters.plan });
                }
                if (options.cycle === CYCLE.YEARLY && hasSelectedPlan(planParameters.plan, [PLANS.DUO, PLANS.FAMILY])) {
                    return getBlackFridayUpsellData({ plan: planParameters.plan });
                }
                return getBlackFridayUpsellData({ plan: getSafePlan(plansMap, PLANS.DUO) });
            }

            if (currentPlan.Name === PLANS.PASS_FAMILY || currentPlan.Name === PLANS.DUO) {
                if (options.cycle === CYCLE.YEARLY && hasSelectedPlan(planParameters.plan, [PLANS.FAMILY])) {
                    return getBlackFridayUpsellData({ plan: planParameters.plan });
                }
                return getBlackFridayUpsellData({ plan: getSafePlan(plansMap, PLANS.FAMILY) });
            }

            if (getIsProductB2BPlan(currentPlan.Name) && !getIsBundleB2BPlan(planParameters.plan.Name)) {
                return getUpsellData(PLANS.BUNDLE_PRO_2024);
            }
        } else {
            if (audience === Audience.B2B) {
                if (getIsProductB2BPlan(planParameters.plan.Name) || getIsBundleB2BPlan(planParameters.plan.Name)) {
                    return getUpsellData(planParameters.plan.Name);
                }
                return noUpsell;
            } else {
                if (getHasAnyPlusPlan(currentPlan.Name)) {
                    if (
                        hasSelectedPlan(planParameters.plan, [PLANS.PASS_FAMILY, PLANS.BUNDLE, PLANS.DUO, PLANS.FAMILY])
                    ) {
                        return getUpsellData(planParameters.plan.Name);
                    }
                    return getUpsellData(PLANS.BUNDLE);
                }

                if (currentPlan.Name === PLANS.BUNDLE) {
                    if (hasSelectedPlan(planParameters.plan, [PLANS.DUO, PLANS.FAMILY])) {
                        return getUpsellData(planParameters.plan.Name);
                    }
                    return getUpsellData(PLANS.DUO);
                }

                if (currentPlan.Name === PLANS.PASS_FAMILY || currentPlan.Name === PLANS.DUO) {
                    if (hasSelectedPlan(planParameters.plan, [PLANS.DUO, PLANS.FAMILY])) {
                        return getUpsellData(planParameters.plan.Name);
                    }
                    return getUpsellData(PLANS.FAMILY);
                }

                if (getIsProductB2BPlan(currentPlan.Name) && !getIsBundleB2BPlan(planParameters.plan.Name)) {
                    return getUpsellData(PLANS.BUNDLE_PRO_2024);
                }
            }
        }
    }

    return noUpsell;
};

export const getRelativeUpsellPrice = (
    upsell: Upsell,
    plansMap: PlansMap,
    checkResult: SubscriptionCheckResponse | undefined,
    subscription: Subscription | undefined,
    cycle: CYCLE
) => {
    if (!upsell.currentPlan || !upsell.plan) {
        return 0;
    }

    if (subscription && checkResult) {
        return (
            (checkResult.Amount + (checkResult?.CouponDiscount || 0)) / cycle - subscription.Amount / subscription.Cycle
        );
    }

    const pricingCurrentPlan = getPricingFromPlanIDs({ [upsell.currentPlan.Name]: 1 }, plansMap);
    const pricingUpsell = getPricingFromPlanIDs({ [upsell.plan.Name]: 1 }, plansMap);

    return pricingUpsell.plans[cycle] / cycle - pricingCurrentPlan.plans[cycle] / cycle;
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
                PLANS.ENTERPRISE,
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

    return false;
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
    subscription: Subscription | undefined;
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
            },
            upsell: getUpsell({ audience, plansMap, upsellPlanCard, options, planParameters, toApp }),
        };
    }

    const state = {
        payable: getCanPay(user),
        admin: getIsAdmin(user),
        subscribed: Boolean(user.Subscribed),
        access: false,
    };

    const forcePaymentsVersion = getMaybeForcePaymentsVersion(user);

    const [paymentMethods, subscription, organization] = await Promise.all([
        state.payable
            ? api(queryPaymentMethods(forcePaymentsVersion)).then(({ PaymentMethods }) =>
                  formatPaymentMethods(PaymentMethods)
              )
            : [],
        state.payable && state.admin && state.subscribed
            ? api(getSubscription(forcePaymentsVersion)).then(
                  ({ Subscription, UpcomingSubscription }) => UpcomingSubscription ?? Subscription
              )
            : (FREE_SUBSCRIPTION as unknown as Subscription),
        state.subscribed
            ? api<{
                  Organization: Organization;
              }>(getOrganization()).then(({ Organization }) => Organization)
            : undefined,
    ]);

    const currentPlan = (() => {
        const plan = getPlan(subscription);
        if (plan) {
            return plan;
        }
        if (organization) {
            return plansMap[organization.PlanName];
        }
    })();

    const upsell = getUpsell({
        audience,
        currentPlan,
        subscription,
        upsellPlanCard,
        plansMap,
        options,
        planParameters,
        toApp,
    });

    if (user && hasAccess({ toApp, user, audience, currentPlan })) {
        state.access = true;
    }

    // TODO: WalletEA
    if (toApp === APPS.PROTONWALLET) {
        state.access = false;
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

    const subscriptionData = await (() => {
        const optionsWithSubscriptionDefaults = {
            ...options,
            cycle,
            currency: options.currency,
            coupon: subscription.CouponCode || options.coupon,
        };

        if (!state.payable || state.access) {
            return getFreeSubscriptionData(optionsWithSubscriptionDefaults);
        }

        if (upsell.plan) {
            return getSubscriptionData(paymentsApi, {
                ...optionsWithSubscriptionDefaults,
                ...upsell.subscriptionOptions,
                planIDs: switchPlan({
                    planIDs: getPlanIDs(subscription),
                    planID: upsell.plan.Name,
                    organization,
                    plans,
                    user,
                }),
            });
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
        resumedSessionResult: {
            UID: setupData.authResponse.UID,
            User: setupData.user,
            LocalID: setupData.authResponse.LocalID,
            clientKey: setupData.clientKey,
            offlineKey: setupData.offlineKey,
            keyPassword: setupData.keyPassword,
            persistent: cache.persistent,
            trusted: cache.trusted,
        },
        subscription: undefined,
        organization: undefined,
        paymentMethods: [],
        defaultPaymentMethod: undefined,
        state: {
            payable: true,
            admin: false,
            subscribed: false,
            access: false,
        },
    };
};

export const runAfterScroll = (el: Element, done: () => void) => {
    let same = 0;
    let lastPos = el.scrollTop;
    let startTime = -1;
    // Timeout after 1 second
    const maxTime = 1000;
    const maxFrames = 4;

    const cb = (time: number) => {
        if (startTime === -1) {
            startTime = time;
        }
        if (time - startTime > maxTime) {
            done();
            return;
        }
        const newPos = el.scrollTop;
        if (lastPos === newPos) {
            if (same++ > maxFrames) {
                done();
                return;
            }
        } else {
            same = 0;
            lastPos = newPos;
        }

        requestAnimationFrame(cb);
    };

    requestAnimationFrame(cb);
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
                const currency = plansMap[plansToCheck[0]]?.Currency ?? DEFAULT_CURRENCY;
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
}: {
    cycles: CYCLE[];
    planIDs: PlanIDs[];
    plansMap: PlansMap;
    paymentsApi: PaymentsApi;
    coupon?: string | null;
    billingAddress: BillingAddress;
}): Promise<SubscriptionDataCycleMapping> => {
    const result = await Promise.all(
        planIDs.flatMap((planIDs) =>
            cycles
                .map((cycle) => [planIDs, cycle] as const)
                .map(async ([planIDs, cycle]): Promise<SubscriptionData> => {
                    const coupon =
                        maybeCoupon === null ? undefined : getAutoCoupon({ coupon: maybeCoupon, planIDs, cycle });

                    // make sure that the plan and all its addons exist
                    const plansToCheck = Object.keys(planIDs) as (PLANS | ADDON_NAMES)[];
                    const plansExist = plansToCheck.every(
                        (planName) => plansMap[planName]?.Pricing?.[cycle] !== undefined
                    );

                    // we extract the currency of the currently selected plan in plansMap.
                    const currency = plansMap[plansToCheck[0]]?.Currency ?? DEFAULT_CURRENCY;

                    // If there's no coupon we can optimistically calculate the price.
                    // Also always exclude Enterprise (price never shown).
                    // In addition, if the selected plan doesn't exist, then we don't do the live check call.
                    if (!coupon || planIDs[PLANS.ENTERPRISE] || !plansExist) {
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
    if (paramPlanName && isStringPLAN(paramPlanName)) {
        accessiblePlanNames.push(paramPlanName);
    }

    return plans.filter(({ Name }) => accessiblePlanNames.includes(Name as PLANS)) as StrictPlan[];
};

export const getSubscriptionDataCycleMapping = async ({
    paymentsApi,
    plansMap,
    coupon,
    signupConfiguration,
}: {
    paymentsApi: PaymentsApi;
    plansMap: FullPlansMap;
    coupon: string | undefined | null;
    signupConfiguration: SignupConfiguration;
}) => {
    const [b2c, b2b] = await Promise.all(
        ([Audience.B2C, Audience.B2B] as const).map((audienceToFetch) => {
            const planIDs = signupConfiguration.planCards[audienceToFetch].map(({ plan }) => ({ [plan]: 1 }));
            return getPlanCardSubscriptionData({
                planIDs,
                plansMap,
                cycles: signupConfiguration.cycles,
                paymentsApi,
                coupon,
                billingAddress: DEFAULT_TAX_BILLING_ADDRESS,
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
        ).catch(() => ({ CouponName: '' })); // TODO: What to do if it fails?

        return {
            ...signupParameters,
            preSelectedPlan: undefined,
            coupon: CouponName,
        };
    }
    return signupParameters;
};
