import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';

import { useInternalBooking } from '../../../store/internalBooking/bookingsHook';
import { hasUserReachBookingsLimit, hasUserReachPlanLimit } from './upsellHelpers';

export const useBookingUpsell = () => {
    const [user] = useUser();
    const [bookings] = useInternalBooking();
    const [subscription, loadingSubscription] = useSubscription();

    const shouldShowLimitModal = () => {
        const bookingsPages = bookings?.bookingPages;
        const hasUserReachedPlanLimit = hasUserReachPlanLimit(user, subscription!, bookingsPages);
        const hasUserReachedBookingLimit = hasUserReachBookingsLimit(bookingsPages);

        return {
            plan: hasUserReachedPlanLimit,
            booking: hasUserReachedBookingLimit,
        };
    };

    return {
        shouldShowLimitModal,
        loadingLimits: loadingSubscription,
    };
};
