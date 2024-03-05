import { useActiveBreakpoint, useFlag, useOrganization } from '@proton/components';
import { isUserEligibleForBusyTimeSlots } from '@proton/components/helpers/busyTimeSlots';

/**
 * Is busyTimeSlot feature enabled
 * Has user an eligible plan for busy time slots
 */
const useBusyTimeSlotsAvailable = () => {
    const isBusyTimeSlotFlagEnabled = useFlag('CalendarBusyTimeSlots');
    const [organization] = useOrganization();
    const breakpoint = useActiveBreakpoint();

    /**
     * If the flag is not enabled or the organization is not available or the viewport is small
     * Don't display busy time slots
     */
    if (!isBusyTimeSlotFlagEnabled || !organization || breakpoint.viewportWidth['<=small']) {
        return false;
    }

    return isUserEligibleForBusyTimeSlots(organization);
};

export default useBusyTimeSlotsAvailable;
