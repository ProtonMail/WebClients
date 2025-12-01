import { PLANS } from '@proton/payments';
import type { OrganizationExtended, UserModel } from '@proton/shared/lib/interfaces';

import type { InternalBookingPage } from '../../../store/internalBooking/interface';
import { MAX_BOOKING_PAGES, MAX_BOOKING_PAGE_MAIL_FREE, MAX_BOOKING_PAGE_MAIL_PAID } from '../interface';

/**
 * Test if the user has reached the plan limit and can be upsold to higher.
 * This doesn't cover plans that have 25 booking page limit as they cannot be upsold to higher plans.
 */
export const hasUserReachPlanLimit = (
    user: UserModel,
    bookingsPages?: InternalBookingPage[],
    organization?: OrganizationExtended
): boolean => {
    // Free mail users get no booking pages
    if (!user.hasPaidMail) {
        return true;
    }

    // Users with no booking pages didn't reach any limit yet or if the user cannot pay
    if (!bookingsPages) {
        return false;
    }

    const planName = organization?.PlanName;
    switch (planName) {
        // Those plans have the maximum number of booking pages
        case PLANS.VISIONARY:
        case PLANS.MAIL_BUSINESS:
        case PLANS.BUNDLE_PRO_2024:
        case PLANS.BUNDLE_BIZ_2025:
            // TODO add the logic for the meetbiz2025
            return bookingsPages.length >= MAX_BOOKING_PAGES;
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
