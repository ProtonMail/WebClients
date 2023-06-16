import { c } from 'ttag';

import { FeatureCode } from '@proton/components/containers';
import { PAYMENT_METHOD_TYPES, SavedPaymentMethod } from '@proton/components/payments/core';
import { updateFeatureValue } from '@proton/shared/lib/api/features';
import { getOrganization } from '@proton/shared/lib/api/organization';
import { getSubscription, queryPaymentMethods } from '@proton/shared/lib/api/payments';
import { ADDON_NAMES, CYCLE, FREE_SUBSCRIPTION, PLANS } from '@proton/shared/lib/constants';
import { switchPlan } from '@proton/shared/lib/helpers/planIDs';
import {
    getNormalCycleFromCustomCycle,
    getPlan,
    getPlanIDs,
    getPricingFromPlanIDs,
} from '@proton/shared/lib/helpers/subscription';
import { Api, Currency, Organization, Plan, PlansMap, Subscription, User } from '@proton/shared/lib/interfaces';
import { getFreeCheckResult } from '@proton/shared/lib/subscription/freePlans';
import { canPay as getCanPay, isAdmin as getIsAdmin, hasPaidPass } from '@proton/shared/lib/user/helpers';
import noop from '@proton/utils/noop';

import { getSubscriptionPrices } from '../signup/helper';
import type { PlanIDs, SessionData, SignupCacheResult, SubscriptionData } from '../signup/interfaces';
import type { PlanCard } from './PlanCardSelector';
import { Upsell, UpsellTypes } from './interface';

export const getFreeTitle = (appName: string) => {
    return c('Title').t`${appName} Free`;
};

interface Options {
    cycle: CYCLE;
    currency: Currency;
    minimumCycle?: CYCLE;
    coupon?: string;
    planIDs: PlanIDs | undefined;
}

export const getHasBusinessUpsell = (subscribedPlan: PLANS | ADDON_NAMES | undefined) => {
    const proPlansWithoutPass = [PLANS.MAIL_PRO, PLANS.DRIVE_PRO];
    return proPlansWithoutPass.some((plan) => plan === subscribedPlan);
};

export const getHasUnlimitedUpsell = (subscribedPlan: PLANS | ADDON_NAMES | undefined) => {
    const plusPlansWithoutPass = [PLANS.MAIL, PLANS.DRIVE, PLANS.VPN];
    return plusPlansWithoutPass.some((plan) => plan === subscribedPlan);
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

const getSubscriptionData = async (api: Api, options: Options): Promise<SubscriptionData> => {
    const { planIDs, checkResult } = await getSubscriptionPrices(
        api,
        options.planIDs || {},
        options.currency,
        options.cycle,
        options.coupon
    )
        .then((checkResult) => {
            return {
                checkResult,
                planIDs: options.planIDs,
            };
        })
        .catch(() => {
            // If the check call fails, just reset everything
            return {
                checkResult: getFreeCheckResult(
                    options.currency,
                    // "Reset" the cycle because the custom cycles are only valid with a coupon
                    getNormalCycleFromCustomCycle(options.cycle)
                ),
                planIDs: undefined,
            };
        });
    return {
        cycle: checkResult.Cycle,
        minimumCycle: options.minimumCycle,
        currency: checkResult.Currency,
        checkResult,
        planIDs: planIDs || {},
        skipUpsell: !!planIDs,
    };
};

const getUpsell = ({
    currentPlan,
    upsellPlanCard,
    plansMap,
}: {
    currentPlan?: Plan | undefined;
    upsellPlanCard?: PlanCard;
    plansMap: PlansMap;
}): Upsell => {
    const unlockPlanName = PLANS.PASS_PLUS;
    let plan = plansMap[upsellPlanCard?.plan || unlockPlanName];
    let mode = UpsellTypes.PLANS;

    if (currentPlan) {
        if (getHasUnlimitedUpsell(currentPlan.Name)) {
            plan = plansMap[PLANS.BUNDLE];
            mode = UpsellTypes.UPSELL;
        }

        if (getHasBusinessUpsell(currentPlan.Name)) {
            plan = plansMap[PLANS.BUNDLE_PRO];
            mode = UpsellTypes.UPSELL;
        }
    }

    return {
        unlockPlan: plansMap[unlockPlanName],
        currentPlan,
        plan,
        mode,
    };
};

export const getRelativeUpsellPrice = (upsell: Upsell, plansMap: PlansMap, cycle: CYCLE) => {
    if (!upsell.currentPlan || !upsell.plan) {
        return 0;
    }

    const pricingCurrentPlan = getPricingFromPlanIDs({ [upsell.currentPlan.Name]: 1 }, plansMap);
    const pricingUpsell = getPricingFromPlanIDs({ [upsell.plan.Name]: 1 }, plansMap);

    return pricingUpsell.plans[cycle] / cycle - pricingCurrentPlan.plans[cycle] / cycle;
};

export const getUserInfo = async ({
    api,
    user,
    options,
    plansMap,
    plans,
    upsellPlanCard,
}: {
    api: Api;
    user?: User | undefined;
    options: Options;
    plansMap: PlansMap;
    plans: Plan[];
    upsellPlanCard?: PlanCard;
}): Promise<{
    paymentMethods: SavedPaymentMethod[];
    subscription: Subscription | undefined;
    subscriptionData: SubscriptionData;
    organization: Organization | undefined;
    state: {
        payable: boolean;
        subscribed: boolean;
        admin: boolean;
    };
    upsell: Upsell;
    defaultPaymentMethod: PAYMENT_METHOD_TYPES | undefined;
}> => {
    if (!user) {
        return {
            paymentMethods: [],
            subscription: undefined,
            subscriptionData: await getSubscriptionData(api, options),
            organization: undefined,
            defaultPaymentMethod: undefined,
            state: {
                payable: true,
                subscribed: false,
                admin: false,
            },
            upsell: getUpsell({ plansMap, upsellPlanCard }),
        };
    }

    const state = {
        payable: getCanPay(user),
        admin: getIsAdmin(user),
        subscribed: Boolean(user.Subscribed),
    } as const;

    const [paymentMethods, subscription, organization] = await Promise.all([
        state.payable
            ? api<{
                  PaymentMethods: SavedPaymentMethod[];
              }>(queryPaymentMethods()).then(({ PaymentMethods }) => PaymentMethods)
            : [],
        state.payable && state.admin && state.subscribed
            ? api<{
                  Subscription: Subscription;
              }>(getSubscription()).then(({ Subscription }) => Subscription)
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

    const upsell = getUpsell({ currentPlan, upsellPlanCard, plansMap });

    const subscriptionData = await (() => {
        const optionsWithSubscriptionDefaults = {
            ...options,
            cycle: subscription.Cycle || options.cycle,
            currency: subscription.Currency || options.currency,
            coupon: subscription.CouponCode || options.coupon,
        };

        if (!state.payable) {
            return getFreeSubscriptionData(optionsWithSubscriptionDefaults);
        }

        // This is just to set the currently selected plan better
        if (hasPaidPass(user)) {
            return getSubscriptionData(api, {
                ...optionsWithSubscriptionDefaults,
                planIDs: getPlanIDs(subscription),
            });
        }

        if (upsell.plan) {
            return getSubscriptionData(api, {
                ...optionsWithSubscriptionDefaults,
                planIDs: switchPlan({
                    planIDs: getPlanIDs(subscription),
                    planID: upsell.plan.Name,
                    organization,
                    plans,
                }),
            });
        }

        return getSubscriptionData(api, optionsWithSubscriptionDefaults);
    })();

    await api(updateFeatureValue(FeatureCode.PassSignup, true)).catch(noop);

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
