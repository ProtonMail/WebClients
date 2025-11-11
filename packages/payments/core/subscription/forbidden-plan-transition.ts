import isTruthy from '@proton/utils/isTruthy';

import { type ADDON_NAMES, CYCLE, DEFAULT_CURRENCY, PLANS } from '../constants';
import type { FreeSubscription, PlanIDs } from '../interface';
import { getSupportedAddons, hasLumoAddonFromPlanIDs, isLumoAddon } from '../plan/addons';
import { getHasPlusPlan, getPlanFromPlanIDs, getPlanNameFromIDs } from '../plan/helpers';
import type { PlansMap } from '../plan/interface';
import { clearPlanIDs } from '../planIDs';
import { getPlan, getPlanIDs, hasVisionary, isManagedExternally } from './helpers';
import type { Subscription } from './interface';
import { SelectedPlan } from './selected-plan';

export function isForbiddenLumoPlus({
    subscription,
    newPlanName,
    plansMap,
}: {
    subscription: Subscription | FreeSubscription | null | undefined;
    newPlanName: PLANS | ADDON_NAMES | undefined;
    plansMap: PlansMap;
}) {
    if (!subscription || newPlanName !== PLANS.LUMO) {
        return false;
    }
    const currentPlanIDs = getPlanIDs(subscription);
    // If the current plan is legacy VPN, we delete it and move to vpn 2024 since it has the lumo addon.
    if (currentPlanIDs[PLANS.VPN]) {
        delete currentPlanIDs[PLANS.VPN];
        currentPlanIDs[PLANS.VPN2024] = 1;
    }
    const currentPlanSupportedAddons = getSupportedAddons(currentPlanIDs);

    const currentPlanKey = getPlanNameFromIDs(currentPlanIDs);
    const currentPlan = currentPlanKey ? plansMap[currentPlanKey] : undefined;
    const lumoAddonForCurrentPlan = (Object.keys(currentPlanSupportedAddons) as ADDON_NAMES[]).find((key) =>
        isLumoAddon(key)
    );
    const lumoAddon = lumoAddonForCurrentPlan ? plansMap[lumoAddonForCurrentPlan as keyof typeof plansMap] : undefined;
    if (currentPlan && lumoAddon) {
        const newPlanIDs = {
            ...currentPlanIDs,
            [lumoAddon.Name]: currentPlanIDs[lumoAddon.Name] || 1, // Keep current addons or add at least one.
        };
        const currentPlanSelected = SelectedPlan.createNormalized(
            newPlanIDs,
            plansMap,
            subscription.Cycle || CYCLE.MONTHLY,
            subscription.Currency || DEFAULT_CURRENCY
        );

        return {
            planName: currentPlanSelected.getPlanName(),
            planIDs: currentPlanSelected.planIDs,
        };
    }
    return false;
}

export function isForbiddenPlusToPlus({
    subscription,
    newPlanIDs,
}: {
    subscription: Subscription | FreeSubscription | null | undefined;
    newPlanIDs: PlanIDs;
}): boolean {
    if (!subscription) {
        return false;
    }
    const subscribedPlan = getPlan(subscription?.UpcomingSubscription ?? subscription);
    const subscribedPlans = [subscribedPlan].filter(isTruthy).filter(
        /**
         Ignore pass lifetime, they should always be allowed to change to another plus plan
         **/ (plan) => plan.Name !== PLANS.PASS_LIFETIME
    );
    const isSubscribedToAPlusPlan = subscribedPlans.some((subscribedPlan) => getHasPlusPlan(subscribedPlan.Name));
    const newPlanName = getPlanNameFromIDs(newPlanIDs);
    const isNotSamePlanName = !subscribedPlans.some((subscribedPlan) => subscribedPlan.Name === newPlanName);
    const allowPlusToPlusTransitions = [
        {
            // Going from any plan
            from: ['*'],
            // To Pass lifetime
            to: [PLANS.PASS_LIFETIME],
        },
        {
            // Going from Drive 200 GB or Drive 1 TB
            from: [PLANS.DRIVE, PLANS.DRIVE_1TB],
            // To Drive 200 GB or Drive 1 TB should be allowed
            to: [PLANS.DRIVE, PLANS.DRIVE_1TB],
        },
        {
            // Going from VPN Plus or Pass plus
            from: [PLANS.VPN, PLANS.VPN2024, PLANS.PASS],
            // To VPN + Pass bundle
            to: [PLANS.VPN_PASS_BUNDLE],
        },
        {
            // Going from legacy vpn
            from: [PLANS.VPN],
            // To new vpn
            to: [PLANS.VPN2024],
        },
    ];
    const allowPlusToPlusTransition = allowPlusToPlusTransitions.some(({ from, to }) => {
        return subscribedPlans.some(
            (subscribedPlan) =>
                subscribedPlan.Name &&
                newPlanName &&
                (from.includes(subscribedPlan.Name) || from.includes('*')) &&
                to.includes(newPlanName)
        );
    });
    const isNewPlanAPlusPlan = getHasPlusPlan(newPlanName);

    const isSubscribedToLumoPlus = subscribedPlans.some((subscribedPlan) => subscribedPlan.Name === PLANS.LUMO);
    const newPlanIDsHaveLumoAddon = hasLumoAddonFromPlanIDs(clearPlanIDs(newPlanIDs)) && isNewPlanAPlusPlan;
    const lumoPlusToAnotherPlusWithLumoAddon = isSubscribedToLumoPlus && newPlanIDsHaveLumoAddon;

    // case for multi-subs. If user has Lumo Plus on mobile then they are ALLOWED to buy other Plus plans on web. After
    // that, they will have one mobile and one web subscription.
    const lumoPlusMobileToAnotherPlus =
        isSubscribedToLumoPlus && isNewPlanAPlusPlan && isManagedExternally(subscription);

    return Boolean(
        isSubscribedToAPlusPlan &&
            isNewPlanAPlusPlan &&
            isNotSamePlanName &&
            !allowPlusToPlusTransition &&
            !lumoPlusToAnotherPlusWithLumoAddon &&
            !lumoPlusMobileToAnotherPlus
    );
}

export function isVisionaryDowngrade({
    subscription,
    planIDs,
}: {
    subscription: Subscription | FreeSubscription | null | undefined;
    planIDs: PlanIDs;
}) {
    const userSelectedVisionary = (planIDs[PLANS.VISIONARY] ?? 0) > 0;
    return !!subscription && hasVisionary(subscription) && !userSelectedVisionary;
}

export function getIsPlanTransitionForbidden({
    subscription,
    plansMap,
    planIDs,
}: {
    subscription: Subscription | FreeSubscription | null | undefined;
    planIDs: PlanIDs;
    plansMap: PlansMap;
}) {
    const newPlan = getPlanFromPlanIDs(plansMap, planIDs);
    const newPlanName = newPlan?.Name;

    const lumoForbidden = isForbiddenLumoPlus({ plansMap, subscription, newPlanName });
    if (lumoForbidden) {
        return { type: 'lumo-plus', newPlanIDs: lumoForbidden.planIDs, newPlanName: lumoForbidden.planName } as const;
    }

    if (isForbiddenPlusToPlus({ subscription, newPlanIDs: planIDs })) {
        return { type: 'plus-to-plus', newPlanName } as const;
    }

    if (isVisionaryDowngrade({ subscription, planIDs })) {
        return { type: 'visionary-downgrade' } as const;
    }

    return null;
}
