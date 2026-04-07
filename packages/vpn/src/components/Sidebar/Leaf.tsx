import { c } from 'ttag';

import { NotificationDot } from '@proton/atoms/NotificationDot/NotificationDot';
import { SidebarListItemContent, SidebarListItemContentIcon } from '@proton/components/index';
import type { NavItemResolved } from '@proton/nav/types/nav';

import { OptionalItemLink } from './OptionalItemLink';
import { hasNotifications } from './hasNotifications';

export function Leaf({ item }: { item: NavItemResolved }) {
    const notification = hasNotifications(item.meta) ? item.meta.hasNotifications : undefined;
    return (
        <OptionalItemLink to={item.to}>
            <SidebarListItemContent
                left={item.icon ? <SidebarListItemContentIcon name={item.icon} /> : null}
                right={
                    notification ? <NotificationDot color={notification} alt={c('Info').t`Attention required`} /> : null
                }
            >
                {item.icon ? null : <span className="p-2" />}
                {item.label}
            </SidebarListItemContent>
        </OptionalItemLink>
    );
}
