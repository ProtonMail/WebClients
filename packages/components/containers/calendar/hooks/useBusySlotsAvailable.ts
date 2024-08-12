import { useActiveBreakpoint, useOrganization } from '@proton/components';
import { isUserEligibleForBusySlots } from '@proton/components/helpers/busySlots';
import { VIEWS } from '@proton/shared/lib/calendar/constants';
import { useFlag } from '@proton/unleash';

/**
 * Is busyTimeSlot feature enabled
 * Has user an eligible plan for busy time slots
 * @param view to add only when related to components display (attendees list for ex).
 */
const useBusySlotsAvailable = (view?: VIEWS, skipResponsiveCheck = false) => {
    const isBusySlotsFlagEnabled = useFlag('CalendarBusyTimeSlots');
    const [organization] = useOrganization();
    const breakpoint = useActiveBreakpoint();

    /**
     * If the flag is not enabled or the organization is not available or the viewport is small
     * Don't display busy time slots
     */
    if (
        !isBusySlotsFlagEnabled ||
        !organization ||
        (!skipResponsiveCheck && breakpoint.viewportWidth['<=small']) ||
        view === VIEWS.MONTH
    ) {
        return false;
    }

    return isUserEligibleForBusySlots(organization);
};

export default useBusySlotsAvailable;
