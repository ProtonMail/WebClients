import type { ReactNode } from 'react';
import { forwardRef } from 'react';

import { c } from 'ttag';

import { NotificationDot } from '@proton/atoms/NotificationDot/NotificationDot';
import type { ThemeColor } from '@proton/colors';
import type { IconName } from '@proton/icons/types';

import SidebarListItem from './SidebarListItem';
import SidebarListItemContent from './SidebarListItemContent';
import SidebarListItemContentIcon from './SidebarListItemContentIcon';
import SidebarListItemLink from './SidebarListItemLink';

interface Props {
    to: string;
    icon: IconName;
    notification?: ThemeColor;
    children: ReactNode;
}

const SettingsListItem = forwardRef<HTMLLIElement, Props>(({ to, icon, children, notification }, ref) => {
    return (
        <SidebarListItem ref={ref}>
            <SidebarListItemLink to={to}>
                <SidebarListItemContent
                    left={<SidebarListItemContentIcon name={icon} />}
                    right={
                        notification && <NotificationDot color={notification} alt={c('Info').t`Attention required`} />
                    }
                >
                    {children}
                </SidebarListItemContent>
            </SidebarListItemLink>
        </SidebarListItem>
    );
});

SettingsListItem.displayName = 'SettingsListItem';

export default SettingsListItem;
