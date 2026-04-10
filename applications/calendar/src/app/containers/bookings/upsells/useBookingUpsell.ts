import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { getAddons, isMeetAddon } from '@proton/payments';

import { useInternalBooking } from '../../../store/internalBooking/bookingsHook';
import { hasUserReachBookingsLimit, hasUserReachPlanLimit } from './upsellHelpers';

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
        const meetAddon = getAddons(subscription).find(({ Name }) => isMeetAddon(Name));
        const hasUserReachedPlanLimit = hasUserReachPlanLimit(user, bookingPageNumber, organization, meetAddon);
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
