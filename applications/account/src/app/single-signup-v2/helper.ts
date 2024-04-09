import { c } from 'ttag';

import { FeatureCode } from '@proton/components/containers';
import { getAutoCoupon } from '@proton/components/containers/payments/subscription/helpers';
import { getMaybeForcePaymentsVersion } from '@proton/components/payments/client-extensions';
import {
    BillingAddress,
    PAYMENT_METHOD_TYPES,
    PaymentsApi,
    SavedPaymentMethod,
} from '@proton/components/payments/core';
import { updateFeatureValue } from '@proton/shared/lib/api/features';
import { getOrganization } from '@proton/shared/lib/api/organization';
import { getSubscription, queryPaymentMethods } from '@proton/shared/lib/api/payments';
import {
    ADDON_NAMES,
    APPS,
    APP_NAMES,
    COUPON_CODES,
    CYCLE,
    FREE_SUBSCRIPTION,
    PLANS,
} from '@proton/shared/lib/constants';
import { getOptimisticCheckResult } from '@proton/shared/lib/helpers/checkout';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { getPlanFromPlanIDs, hasPlanIDs, switchPlan } from '@proton/shared/lib/helpers/planIDs';
import {
    getHas2023OfferCoupon,
    getNormalCycleFromCustomCycle,
    getPlan,
    getPlanIDs,
    getPricingFromPlanIDs,
} from '@proton/shared/lib/helpers/subscription';
import {
    Api,
    Audience,
    Currency,
    CycleMapping,
    Organization,
    Plan,
    PlansMap,
    Subscription,
    SubscriptionCheckResponse,
    SubscriptionPlan,
    User,
} from '@proton/shared/lib/interfaces';
import { FREE_PLAN, getFreeCheckResult } from '@proton/shared/lib/subscription/freePlans';
import {
    canPay as getCanPay,
    isAdmin as getIsAdmin,
    hasPaidDrive,
    hasPaidMail,
    hasPaidPass,
} from '@proton/shared/lib/user/helpers';
import noop from '@proton/utils/noop';

import { getSubscriptionPrices } from '../signup/helper';
import { PlanIDs, SessionData, SignupCacheResult, SubscriptionData } from '../signup/interfaces';
import type { PlanCard } from './PlanCardSelector';
import { Options, PlanParameters, SignupParameters2, Upsell, UpsellTypes } from './interface';

export const getFreeTitle = (appName: string) => {
    return c('Title').t`${appName} Free`;
};

export const getHasBusinessUpsell = (subscribedPlan: PLANS | ADDON_NAMES | undefined) => {
    const proPlansWithoutPass = [PLANS.MAIL_PRO, PLANS.DRIVE_PRO, PLANS.VPN_PRO];
    return proPlansWithoutPass.some((plan) => plan === subscribedPlan);
};

export const getHasAnyPlusPlan = (subscribedPlan: PLANS | ADDON_NAMES | undefined) => {
    return [PLANS.MAIL, PLANS.DRIVE, PLANS.VPN, PLANS.PASS_PLUS, PLANS.VPN_PASS_BUNDLE].some(
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
        return PLANS.PASS_PLUS;
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

    const defaultValue = {
        plan: undefined,
        unlockPlan: plansMap[getUnlockPlanName(toApp)],
        currentPlan,
        mode: UpsellTypes.PLANS,
        subscriptionOptions: {},
    };

    if (currentPlan) {
        if (getHas2023OfferCoupon(options.coupon)) {
            if (getHasAnyPlusPlan(currentPlan.Name)) {
                const hasSelectedPassBundle =
                    hasSelectedPlan(planParameters.plan, [PLANS.VPN_PASS_BUNDLE]) &&
                    [CYCLE.FIFTEEN, CYCLE.THIRTY].includes(options.cycle);

                const isValidPassBundleFromPass =
                    currentPlan.Name === PLANS.PASS_PLUS &&
                    hasSelectedPassBundle &&
                    !(options.cycle === CYCLE.FIFTEEN && subscription?.Cycle === CYCLE.TWO_YEARS);

                const isValidPassBundleFromVPN1 =
                    currentPlan.Name === PLANS.VPN &&
                    [CYCLE.MONTHLY].includes(subscription?.Cycle as any) &&
                    hasSelectedPassBundle;

                const isValidPassBundleFromVPN12 =
                    currentPlan.Name === PLANS.VPN &&
                    [CYCLE.YEARLY, CYCLE.FIFTEEN].includes(subscription?.Cycle as any) &&
                    hasSelectedPassBundle &&
                    options.cycle === CYCLE.THIRTY;

                // If the user is on a plus plan, and selects bundle, visionary, or family -> let it pass through
                if (
                    (options.cycle === CYCLE.YEARLY &&
                        (hasSelectedPlan(planParameters.plan, [PLANS.BUNDLE, PLANS.NEW_VISIONARY, PLANS.FAMILY]) ||
                            (hasMonthlyCycle && hasSelectedPlan(planParameters.plan, [currentPlan.Name])))) ||
                    isValidPassBundleFromPass ||
                    isValidPassBundleFromVPN1 ||
                    isValidPassBundleFromVPN12
                ) {
                    return {
                        ...defaultValue,
                        plan: planParameters.plan,
                        subscriptionOptions: {
                            planIDs: planParameters.planIDs,
                            cycle: options.cycle,
                            coupon: COUPON_CODES.END_OF_YEAR_2023,
                        },
                        mode: UpsellTypes.UPSELL,
                    };
                }

                // Any other selected plan will give bundle
                const plan = getSafePlan(plansMap, PLANS.BUNDLE);
                return {
                    ...defaultValue,
                    plan,
                    subscriptionOptions: {
                        planIDs: {
                            [plan.Name]: 1,
                        },
                        cycle: CYCLE.YEARLY,
                        coupon: COUPON_CODES.END_OF_YEAR_2023,
                    },
                    mode: UpsellTypes.UPSELL,
                };
            }

            if (currentPlan.Name === PLANS.BUNDLE) {
                if (
                    options.cycle === CYCLE.YEARLY &&
                    (hasSelectedPlan(planParameters.plan, [PLANS.NEW_VISIONARY, PLANS.FAMILY]) ||
                        (hasMonthlyCycle && hasSelectedPlan(planParameters.plan, [currentPlan.Name])))
                ) {
                    return {
                        ...defaultValue,
                        plan: planParameters.plan,
                        subscriptionOptions: {
                            planIDs: planParameters.planIDs,
                            cycle: options.cycle,
                            coupon: COUPON_CODES.END_OF_YEAR_2023,
                        },
                        mode: UpsellTypes.UPSELL,
                    };
                }

                const plan = getSafePlan(plansMap, PLANS.NEW_VISIONARY);
                return {
                    ...defaultValue,
                    plan,
                    subscriptionOptions: {
                        planIDs: {
                            [plan.Name]: 1,
                        },
                        cycle: CYCLE.YEARLY,
                        coupon: COUPON_CODES.END_OF_YEAR_2023,
                    },
                    mode: UpsellTypes.UPSELL,
                };
            }

            if (currentPlan.Name === PLANS.FAMILY) {
                if (options.cycle === CYCLE.YEARLY && hasSelectedPlan(planParameters.plan, [PLANS.NEW_VISIONARY])) {
                    return {
                        ...defaultValue,
                        plan: planParameters.plan,
                        subscriptionOptions: {
                            planIDs: planParameters.planIDs,
                            cycle: options.cycle,
                            coupon: COUPON_CODES.END_OF_YEAR_2023,
                        },
                        mode: UpsellTypes.UPSELL,
                    };
                }

                const plan = hasMonthlyCycle
                    ? getSafePlan(plansMap, currentPlan.Name)
                    : getSafePlan(plansMap, PLANS.NEW_VISIONARY);
                return {
                    ...defaultValue,
                    plan,
                    subscriptionOptions: {
                        planIDs: {
                            [plan.Name]: 1,
                        },
                        cycle: CYCLE.YEARLY,
                        coupon: COUPON_CODES.END_OF_YEAR_2023,
                    },
                    mode: UpsellTypes.UPSELL,
                };
            }

            if (getHasBusinessUpsell(currentPlan.Name)) {
                return {
                    ...defaultValue,
                    plan: plansMap[PLANS.BUNDLE_PRO],
                    mode: UpsellTypes.UPSELL,
                };
            }
        } else {
            if (audience === Audience.B2B) {
                return defaultValue;
            } else {
                if (
                    getHasAnyPlusPlan(currentPlan.Name) &&
                    ![PLANS.BUNDLE, PLANS.FAMILY, PLANS.BUNDLE_PRO, PLANS.NEW_VISIONARY].includes(
                        planParameters.plan.Name as any
                    )
                ) {
                    return {
                        ...defaultValue,
                        plan: plansMap[PLANS.BUNDLE],
                        mode: UpsellTypes.UPSELL,
                    };
                }

                if (
                    getHasBusinessUpsell(currentPlan.Name) &&
                    ![PLANS.BUNDLE_PRO, PLANS.NEW_VISIONARY].includes(planParameters.plan.Name as any)
                ) {
                    return {
                        ...defaultValue,
                        plan: plansMap[PLANS.BUNDLE_PRO],
                        mode: UpsellTypes.UPSELL,
                    };
                }
            }
        }
    }

    return defaultValue;
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
                PLANS.PASS_PRO,
                PLANS.PASS_BUSINESS,
                PLANS.NEW_VISIONARY,
                PLANS.FAMILY,
                PLANS.BUNDLE_PRO,
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
            ? api(queryPaymentMethods(forcePaymentsVersion)).then(({ PaymentMethods }) => PaymentMethods)
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

    const subscriptionData = await (() => {
        const optionsWithSubscriptionDefaults = {
            ...options,
            // TODO: make this more generic
            cycle: signupParameters.cycle || subscription.Cycle || options.cycle,
            currency: signupParameters.currency || subscription.Currency || options.currency,
            coupon: subscription.CouponCode || options.coupon,
        };

        if (!state.payable) {
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
                }),
            });
        }

        return getSubscriptionData(paymentsApi, optionsWithSubscriptionDefaults);
    })();

    if (toApp === APPS.PROTONPASS) {
        await api(updateFeatureValue(FeatureCode.PassSignup, true)).catch(noop);
    }

    if (user && hasAccess({ toApp, user, audience, currentPlan })) {
        state.access = true;
    }

    if (state.access && state.payable && planParameters.defined && currentPlan) {
        if (currentPlan.Name !== PLANS.NEW_VISIONARY && planParameters.plan.Name === PLANS.NEW_VISIONARY) {
            state.access = false;
        } else if (
            getHasAnyPlusPlan(currentPlan.Name) &&
            [PLANS.BUNDLE, PLANS.FAMILY, PLANS.BUNDLE_PRO, PLANS.NEW_VISIONARY].includes(
                planParameters.plan.Name as any
            )
        ) {
            state.access = false;
        } else if (
            currentPlan.Name === PLANS.BUNDLE &&
            [PLANS.FAMILY, PLANS.BUNDLE_PRO, PLANS.NEW_VISIONARY].includes(planParameters.plan.Name as any)
        ) {
            state.access = false;
        } else if (
            currentPlan.Name === PLANS.FAMILY &&
            [PLANS.BUNDLE_PRO, PLANS.NEW_VISIONARY].includes(planParameters.plan.Name as any)
        ) {
            state.access = false;
        }

        if (planParameters.plan.Name === currentPlan.Name) {
            state.access = true;
        }
    }

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
        UID: setupData.authResponse.UID,
        user: setupData.user,
        localID: setupData.authResponse.LocalID,
        clientKey: setupData.clientKey,
        offlineKey: setupData.offlineKey,
        keyPassword: setupData.keyPassword,
        persistent: cache.persistent,
        trusted: cache.trusted,
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
export const getPlanCardSubscriptionData = async ({
    planIDs,
    plansMap,
    paymentsApi,
    coupon: maybeCoupon,
    currency,
    cycles,
    billingAddress,
}: {
    cycles: CYCLE[];
    planIDs: PlanIDs[];
    plansMap: PlansMap;
    paymentsApi: PaymentsApi;
    coupon?: string;
    currency: Currency;
    billingAddress: BillingAddress;
}): Promise<SubscriptionDataCycleMapping> => {
    const result = await Promise.all(
        planIDs.flatMap((planIDs) =>
            cycles
                .map((cycle) => [planIDs, cycle] as const)
                .map(async ([planIDs, cycle]): Promise<SubscriptionData> => {
                    const coupon = getAutoCoupon({ coupon: maybeCoupon, planIDs, cycle });
                    // If there's no coupon we can optimistically calculate the price. Also always exclude Enterprise (price never shown).
                    if (!coupon || planIDs[PLANS.ENTERPRISE]) {
                        return {
                            planIDs,
                            currency,
                            cycle,
                            checkResult: {
                                ...getOptimisticCheckResult({ planIDs, plansMap, cycle }),
                                Currency: currency,
                                PeriodEnd: 0,
                            },
                            billingAddress,
                        };
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
