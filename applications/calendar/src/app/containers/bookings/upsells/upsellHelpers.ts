import { PLANS, type Subscription, getPlan } from '@proton/payments';
import type { UserModel } from '@proton/shared/lib/interfaces';

import type { InternalBookingPage } from '../../../store/internalBooking/interface';

export const hasUserReachPlanLimit = (
    user: UserModel,
    subscription: Subscription,
    bookingsPages?: InternalBookingPage[]
): boolean => {
    if (!user.hasPaidMail) {
        return true;
    }

    const planName = getPlan(subscription)?.Name;
    if (!planName) {
        return true;
    }

    if (!bookingsPages) {
        return false;
    }

    switch (planName) {
        case PLANS.MAIL:
        case PLANS.BUNDLE:
        case PLANS.DUO:
        case PLANS.FAMILY:
        case PLANS.MAIL_PRO:
            return bookingsPages.length >= 1;
    }

    return false;
};

export const hasUserReachBookingsLimit = (bookingsPages?: InternalBookingPage[]): boolean => {
    if (!bookingsPages) {
        return false;
    }

    return bookingsPages.length >= 25;
};
