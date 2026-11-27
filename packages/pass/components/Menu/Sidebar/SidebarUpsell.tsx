import { memo } from 'react';
import { useSelector } from 'react-redux';

import { useLessAggressiveUpsell } from '../../../hooks/useLessAggressiveUpsell';
import { isPaidPlan } from '../../../lib/user/user.predicates';
import { selectPassPlan } from '../../../store/selectors/user';
import { MenuUpsellCard } from '../Upsell/MenuUpsellCard';

/** `MenuUser` hosts the upsell card for the dropdown menu, but that menu is
 * hidden above the `lg` breakpoint, so the sidebar layout needs its own slot.
 * Only rendered for B2C free users once the softer upsell applies: otherwise
 * the navbar upgrade button still covers this layout. */
export const SidebarUpsell = memo(() => {
    const passPlan = useSelector(selectPassPlan);
    const lessAggressiveUpsell = useLessAggressiveUpsell();

    if (!lessAggressiveUpsell || isPaidPlan(passPlan) || BUILD_TARGET === 'safari') return null;

    return <MenuUpsellCard className="mx-4 mb-2" />;
});

SidebarUpsell.displayName = 'SidebarUpsellMemo';
