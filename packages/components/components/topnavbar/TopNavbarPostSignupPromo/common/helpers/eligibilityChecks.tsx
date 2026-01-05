import { differenceInDays, fromUnixTime } from 'date-fns';

import OfferSubscription from '@proton/components/containers/offers/helpers/offerSubscription';
import type { Cycle, FreeSubscription, PLANS } from '@proton/payments';
import { type Subscription, isFreeSubscription, isManagedExternally, isValidPlanName } from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';
import { hasPassLifetime } from '@proton/shared/lib/user/helpers';

/**
 * Collection of generic eligibility checker helper functions for the TopNavbar Post-Signup Promo component.
 * These helpers are designed to provide consistent logic for evaluating user, subscription, and app conditions.
 *
 * Helpers are modular and can be extended as needed to suit additional promo or offer eligibility requirements.
 */

export const checksAllPass = (...checks: boolean[]): boolean => checks.every(Boolean);

export const hasSubscription = (subscription?: Subscription | FreeSubscription): boolean => {
    return !!subscription && !isFreeSubscription(subscription);
};

export const isWebSubscription = (subscription?: Subscription | FreeSubscription): boolean => {
    return subscription ? !isManagedExternally(subscription) : false;
};

export const hasNoScheduledSubscription = (subscription?: Subscription | FreeSubscription): boolean => {
    return !subscription?.UpcomingSubscription;
};

export const userCanPay = (user: UserModel): boolean => {
    return user.canPay;
};

export const userNotDelinquent = (user: UserModel): boolean => {
    return !user.isDelinquent;
};

export const noPassLifetime = (user: UserModel): boolean => {
    return !hasPassLifetime(user);
};

/**
 * Checks the current app is valid against a defined list of allowed apps. For the account app it will check the parent app of the user.
 *
 * @param {Array} allowedApps - Array of app names (from APPS) that are considered eligible for the offer.
 * @param {ProtonConfig} protonConfig - The current configuration object, used to determine the running app.
 * @param {string} [parentApp] - The name of the app from which the user navigated, used if the current app is 'proton-account'.
 * @returns {boolean} Returns true if either the current app or, when on 'proton-account', the parent app is listed in allowedApps. Returns false otherwise.
 */
export const checkAppIsValid = (
    allowedApps: (typeof APPS)[keyof typeof APPS][],
    protonConfig: ProtonConfig,
    parentApp?: (typeof APPS)[keyof typeof APPS]
): boolean => {
    const currentApp = protonConfig?.APP_NAME;

    if (allowedApps.includes(currentApp)) {
        return true;
    }

    if (currentApp === APPS.PROTONACCOUNT && parentApp && allowedApps.includes(parentApp)) {
        return true;
    }

    return false;
};

/**
 * Checks the user's current subscribed cycle against a list of valid cycles.
 *
 * @param {Array} cycles - Defines the valid cycles that a user can have.
 * @param {Subscription} subscription - The user's subscription to get there current cycle.
 * @returns {boolean} True if the user's subscribed cycle matches one of the cycles.
 */
export const checkCycleIsValid = (cycles: Cycle[], subscription?: Subscription | FreeSubscription): boolean => {
    if (!subscription || isFreeSubscription(subscription)) {
        return false;
    }

    const offerSubscription = new OfferSubscription(subscription);
    const subscriptionCycle = offerSubscription.getCycle();

    return cycles.includes(subscriptionCycle);
};

/**
 * Checks if any of the specified plans exist in the given subscription.
 *
 * @param {object} plans - An object specifying which plans to check for. Add plans that are eligible for your offer.
 * @param {Subscription} [subscription] - The user's subscription to check.
 * @returns {boolean} True if any specified plan exists in the subscription, false otherwise.
 */
export const checkPlanIsValid = (
    plans: (typeof PLANS)[keyof typeof PLANS][],
    subscription?: Subscription | FreeSubscription
): boolean => {
    if (isFreeSubscription(subscription)) {
        return false;
    }

    if (!subscription) {
        return false;
    }

    const offerSubscription = new OfferSubscription(subscription);
    const currentPlans = offerSubscription.subscription.Plans;
    for (const plan of currentPlans) {
        if (isValidPlanName(plan.Name) && plans.includes(plan.Name)) {
            return true;
        }
    }

    return false;
};

/**
 * Checks the amount of time a user has been subscribed against a provided minimum time.
 *
 * @param {number} minDays - Number of days they need to have been subscribed to be eligible for an offer.
 * @param {Subscription} subscription - The user's subscription to check.
 * @returns {boolean} True if the user has been subscribed the minimum days or longer, false otherwise.
 */
export const checkTimeSubscribedIsValid = (
    minDays: number,
    subscription?: Subscription | FreeSubscription
): boolean => {
    if (!subscription || isFreeSubscription(subscription)) {
        return false;
    }

    const currentSubscriptionStartTime = subscription?.PeriodStart
        ? fromUnixTime(subscription.PeriodStart)
        : new Date();
    const daysSinceSubscription = currentSubscriptionStartTime
        ? differenceInDays(new Date(), currentSubscriptionStartTime)
        : 0;

    return daysSinceSubscription >= minDays;
};
