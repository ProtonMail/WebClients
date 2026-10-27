import { getUnixTime } from 'date-fns';

import type { COUPON_CODES } from '@proton/payments/core/constants';
import { CYCLE, PLANS, PLAN_TYPES } from '@proton/payments/core/constants';
import type { Currency } from '@proton/payments/core/interface';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import type { UserModel } from '@proton/shared/lib/interfaces/User';
import type { ProtonConfig } from '@proton/shared/lib/interfaces/config';
import type { SubscriptionPlatform } from '@proton/shared/lib/payments/subscription/constants';

export const mailAppConfig = {
    APP_NAME: 'proton-mail',
} as unknown as ProtonConfig;

export const calendarAppConfig = {
    APP_NAME: 'proton-calendar',
} as unknown as ProtonConfig;

export const accountAppConfig = {
    APP_NAME: 'proton-account',
} as unknown as ProtonConfig;

export const driveAppConfig = {
    APP_NAME: 'proton-drive',
} as unknown as ProtonConfig;

/** Only an entry point into the account app, so the Pass app itself is outside the campaign scope. */
export const passAppConfig = {
    APP_NAME: 'proton-pass',
} as unknown as ProtonConfig;

/** Renders the upsell via PrivateHeader but is outside the campaign scope. */
export const docsAppConfig = {
    APP_NAME: 'proton-docs',
} as unknown as ProtonConfig;

export const freeUser = {
    canPay: true,
    isDelinquent: false,
    isPaid: false,
    isFree: true,
    // Well past the free-user minimum account age
    CreateTime: getUnixTime(new Date(2024, 0, 1)),
} as unknown as UserModel;

export const paidUser = {
    canPay: true,
    isDelinquent: false,
    isPaid: true,
    isFree: false,
} as unknown as UserModel;

export const eligibleCurrency: Currency = 'EUR';

export const ineligibleCurrency = 'CHZ' as Currency;

interface SubscriptionOptions {
    plan?: PLANS;
    cycle?: CYCLE;
    couponCode?: COUPON_CODES | string | null;
    isTrial?: boolean;
    external?: SubscriptionPlatform | false;
    upcoming?: Partial<Subscription> | null;
}

export const buildSubscription = ({
    plan = PLANS.MAIL,
    cycle = CYCLE.YEARLY,
    couponCode = null,
    isTrial = false,
    external = false,
    upcoming = null,
}: SubscriptionOptions = {}): Subscription => {
    return {
        ID: 'subscription-id',
        IsTrial: isTrial,
        External: external,
        Cycle: cycle,
        CouponCode: couponCode,
        Plans: [
            {
                Type: PLAN_TYPES.PLAN,
                Name: plan,
            },
        ],
        UpcomingSubscription: upcoming,
    } as unknown as Subscription;
};

/**
 * The eligibility functions read `window.location.pathname` via getAppFromPathnameSafe to work out
 * the parent app when running inside the account app. jsdom defaults to '/', which resolves to no
 * parent app. That is fine for the proton-mail / proton-calendar cases, but account tests need a path.
 */
export const setPathname = (pathname: string) => {
    window.history.pushState({}, '', pathname);
};
