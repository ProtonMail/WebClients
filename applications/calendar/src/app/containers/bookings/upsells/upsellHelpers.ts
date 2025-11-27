import { PLANS, type Subscription, getPlan } from '@proton/payments';
import type { UserModel } from '@proton/shared/lib/interfaces';

import type { InternalBookingPage } from '../../../store/internalBooking/interface';
import {
    MAX_BOOKING_PAGES,
    MAX_BOOKING_PAGE_MAIL_B2B,
    MAX_BOOKING_PAGE_MAIL_FREE,
    MAX_BOOKING_PAGE_MAIL_PAID,
} from '../interface';

/**
 * Test if the user has reached the plan limit and can be upsold to higher.
 * This doesn't cover plans that have 25 booking page limit as they cannot be upsold to higher plans.
 */
export const hasUserReachPlanLimit = (
    user: UserModel,
    subscription: Subscription,
    bookingsPages?: InternalBookingPage[]
): boolean => {
    // Free mail users get no booking pages
    if (!user.hasPaidMail) {
        return true;
    }

    // Users with no booking pages didn't reach any limit yet
    if (!bookingsPages) {
        return false;
    }

    const planName = getPlan(subscription)?.Name;
    switch (planName) {
        case PLANS.VISIONARY:
        case PLANS.BUNDLE_PRO_2024:
        case PLANS.BUNDLE_BIZ_2025:
            // TODO add the logic for the meetbiz2025
            return bookingsPages.length >= MAX_BOOKING_PAGES;
        case PLANS.MAIL_BUSINESS:
            return bookingsPages.length >= MAX_BOOKING_PAGE_MAIL_B2B;
        // Those plans have 5 booking page and are upsell to budlebiz2025
        case PLANS.MAIL_BUSINESS:
            return bookingsPages.length >= MAX_BOOKING_PAGE_MAIL_B2B;
        // Those plans have 1 booking page and are upsell to budlebiz2025
        case PLANS.MAIL:
        case PLANS.BUNDLE:
        case PLANS.DUO:
        case PLANS.FAMILY:
        case PLANS.MAIL_PRO:
            return bookingsPages.length >= MAX_BOOKING_PAGE_MAIL_PAID;
        // Any unhandled case will be limited at 0 booking pages
        default:
            return bookingsPages.length >= MAX_BOOKING_PAGE_MAIL_FREE;
    }
};

export const hasUserReachBookingsLimit = (bookingsPages?: InternalBookingPage[]): boolean => {
    if (!bookingsPages) {
        return false;
    }

    return bookingsPages.length >= MAX_BOOKING_PAGES;
};
