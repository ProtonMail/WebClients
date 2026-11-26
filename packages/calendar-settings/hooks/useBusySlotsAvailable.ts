import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { VIEWS } from '@proton/shared/lib/calendar/constants';

/**
 * Has user an eligible plan for busy time slots
 * @param view to add only when related to components display (attendees list for ex).
 */
const useBusySlotsAvailable = (view?: VIEWS, skipResponsiveCheck = false) => {
    const [entitlements, loadingEntitlements] = useEntitlementChecksForOrgAndUser();
    const breakpoint = useActiveBreakpoint();

    if (loadingEntitlements || (!skipResponsiveCheck && breakpoint.viewportWidth['<=small']) || view === VIEWS.MONTH) {
        return false;
    }

    return entitlements.hasBusySlots;
};

export default useBusySlotsAvailable;
