import type { SubscriptionPlan } from '@proton/payments';
import { ADDON_NAMES, PLANS } from '@proton/payments';
import type { OrganizationExtended, UserModel } from '@proton/shared/lib/interfaces';

import type { InternalBookingPage } from '../../../store/internalBooking/interface';
import { MAX_BOOKING_PAGES, MAX_BOOKING_PAGE_MAIL_FREE, MAX_BOOKING_PAGE_MAIL_PAID } from '../interface';

/**
 * Test if the user has reached the plan limit and can be upsold to higher.
 * This doesn't cover plans that have 25 booking page limit as they cannot be upsold to higher plans.
 */
export const hasUserReachPlanLimit = (
    user: UserModel,
    pageCount: number,
    organization?: OrganizationExtended,
    meetAddon?: SubscriptionPlan
): boolean => {
    // Users not paying for Mail or Meet get no booking pages
    if (!user.hasPaidMail && !user.hasPaidMeet) {
        return true;
    }

    // If the user has a addon we use this to determine the plan name and the assosciated limits
    const planName = meetAddon ? meetAddon.Name : organization?.PlanName;
    switch (planName) {
        // Those plans have the maximum number of booking pages
        case ADDON_NAMES.MEET_VPN2024:
        case ADDON_NAMES.MEET_LUMO:
        case ADDON_NAMES.MEET_DRIVE:
        case ADDON_NAMES.MEET_PASS:
        case ADDON_NAMES.MEET_DRIVE_1TB:
        case ADDON_NAMES.MEET_VPN_PASS_BUNDLE:
        case ADDON_NAMES.MEET_MAIL:
        case ADDON_NAMES.MEET_BUNDLE:
        case ADDON_NAMES.MEET_MAIL_PRO:
        case ADDON_NAMES.MEET_DUO:
        case ADDON_NAMES.MEET_FAMILY:
        case PLANS.VISIONARY:
        case PLANS.MAIL_BUSINESS:
        case PLANS.BUNDLE_PRO:
        case PLANS.BUNDLE_PRO_2024:
        case PLANS.BUNDLE_BIZ_2025:
        case PLANS.MEET_BUSINESS:
        case PLANS.MEET:
            return pageCount >= MAX_BOOKING_PAGES;
        // Those plans have 1 booking page and are upsell to budlebiz2025
        case PLANS.MAIL:
        case PLANS.BUNDLE:
        case PLANS.DUO:
        case PLANS.FAMILY:
        case PLANS.MAIL_PRO:
            return pageCount >= MAX_BOOKING_PAGE_MAIL_PAID;
        // Any unhandled case will be limited at 0 booking pages
        default:
            return pageCount >= MAX_BOOKING_PAGE_MAIL_FREE;
    }
};

/**
 * Checks the eligibility of the organisation members for a booking limit based on their subscription and bookings pages.
 * The logic is simple for the moment, any organisation member with a paid mail or meet access can create up to MAX_BOOKING_PAGES bookings.
 *
 * This logic might change when adding support for other subscription plans.
 * The logic might need to be based on plan name to get the limits.
 */
export const hasOrgMemberReachedBookingLimit = (user: UserModel, bookingsPages?: InternalBookingPage[]): boolean => {
    if (!bookingsPages) {
        return false;
    }

    if (!user.hasPaidMeet) {
        return bookingsPages.length >= 1;
    }

    return bookingsPages.length >= MAX_BOOKING_PAGES;
};

export const hasUserReachBookingsLimit = (bookingsPages?: InternalBookingPage[]): boolean => {
    if (!bookingsPages) {
        return false;
    }

    return bookingsPages.length >= MAX_BOOKING_PAGES;
};
