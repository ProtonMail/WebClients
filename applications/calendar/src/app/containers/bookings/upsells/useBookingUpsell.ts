import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';

import { useInternalBooking } from '../../../store/internalBooking/bookingsHook';
import { hasUserReachBookingsLimit, hasUserReachPlanLimit } from './upsellHelpers';

export const useBookingUpsell = () => {
    const [user] = useUser();
    const [bookings] = useInternalBooking();
    const [organization, loadingOrganization] = useOrganization();

    const shouldShowLimitModal = () => {
        const hasUserReachedBookingLimit = hasUserReachBookingsLimit(bookings?.bookingPages);
        if (hasUserReachedBookingLimit) {
            return {
                planLimitReached: false,
                bookingPageLimitReached: true,
            };
        }

        const hasUserReachedPlanLimit = hasUserReachPlanLimit(user, bookings?.bookingPages?.length || 0, organization);
        return {
            planLimitReached: hasUserReachedPlanLimit,
            bookingPageLimitReached: false,
        };
    };

    return {
        shouldShowLimitModal,
        loadingLimits: loadingOrganization,
    };
};
