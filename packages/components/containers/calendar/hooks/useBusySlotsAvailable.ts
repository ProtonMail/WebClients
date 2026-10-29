import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { VIEWS } from '@proton/shared/lib/calendar/constants';
import { useFlag } from '@proton/unleash/useFlag';

import useActiveBreakpoint from '../../../hooks/useActiveBreakpoint';

/**
 * Is busyTimeSlot feature enabled
 * Has user an eligible plan for busy time slots
 * @param view to add only when related to components display (attendees list for ex).
 */
const useBusySlotsAvailable = (view?: VIEWS, skipResponsiveCheck = false) => {
    const isBusySlotsFlagEnabled = useFlag('CalendarBusyTimeSlots');
    const [entitlements, loadingEntitlements] = useEntitlementChecksForOrgAndUser();
    const breakpoint = useActiveBreakpoint();

    if (
        !isBusySlotsFlagEnabled ||
        loadingEntitlements ||
        (!skipResponsiveCheck && breakpoint.viewportWidth['<=small']) ||
        view === VIEWS.MONTH
    ) {
        return false;
    }

    return entitlements.hasBusySlots;
};

export default useBusySlotsAvailable;
