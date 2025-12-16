import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';

import { useInternalBooking } from '../../../store/internalBooking/bookingsHook';
import { hasUserReachBookingsLimit, hasUserReachPlanLimit } from './upsellHelpers';

export const useBookingUpsell = () => {
    const [user] = useUser();
    const [bookings] = useInternalBooking();
    const [organization, loadingOrganization] = useOrganization();

    const shouldShowLimitModal = () => {
        const bookingsPages = bookings?.bookingPages;
        const hasUserReachedPlanLimit = hasUserReachPlanLimit(user, bookingsPages?.length || 0, organization);
        const hasUserReachedBookingLimit = hasUserReachBookingsLimit(bookingsPages);

        // This is made to make sure that if both are true, we only show the booking limit reached modal
        const areBothTrue = hasUserReachedBookingLimit && hasUserReachedBookingLimit;
        return {
            plan: hasUserReachedPlanLimit && !areBothTrue,
            booking: hasUserReachedBookingLimit || areBothTrue,
        };
    };

    return {
        shouldShowLimitModal,
        loadingLimits: loadingOrganization,
    };
};
