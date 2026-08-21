import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import {
    hasOrgMemberReachedBookingLimit,
    hasUserReachBookingsLimit,
    hasUserReachPlanLimit,
} from '@proton/calendar/bookings/eligibility';
import { ADDON_PREFIXES } from '@proton/payments/core/constants';
import { isAddonType } from '@proton/payments/core/plan/addons';
import { getAddons } from '@proton/payments/core/subscription/helpers';
import { isFreeSubscription } from '@proton/payments/core/type-guards';

import { useInternalBooking } from '../../../store/internalBooking/bookingsHook';

export const useBookingUpsell = () => {
    const [user, loadingUser] = useUser();
    const [bookings] = useInternalBooking();
    const [subscription, loadingSubscription] = useSubscription();
    const [organization, loadingOrganization] = useOrganization();

    const shouldShowLimitModal = () => {
        const hasUserReachedBookingLimit = hasUserReachBookingsLimit(bookings?.bookingPages);
        if (hasUserReachedBookingLimit) {
            return {
                planLimitReached: false,
                bookingPageLimitReached: true,
            };
        }

        const bookingPageNumber = bookings?.bookingPages?.length || 0;
        const meetAddon = getAddons(isFreeSubscription(subscription) ? undefined : subscription).find(({ Name }) =>
            isAddonType(Name, ADDON_PREFIXES.MEET)
        );
        const hasUserReachedPlanLimit = user.isMember
            ? hasOrgMemberReachedBookingLimit(user, bookings?.bookingPages, organization)
            : hasUserReachPlanLimit(user, bookingPageNumber, organization, meetAddon);

        return {
            planLimitReached: hasUserReachedPlanLimit,
            bookingPageLimitReached: false,
        };
    };

    return {
        shouldShowLimitModal,
        loadingLimits: loadingOrganization || loadingUser || loadingSubscription,
    };
};
