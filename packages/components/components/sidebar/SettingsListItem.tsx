import { ReactNode } from 'react';

import { NotificationDot } from '@proton/atoms';
import { ThemeColor } from '@proton/colors';

import { IconName } from '../icon/Icon';
import { SidebarListItem, SidebarListItemContent, SidebarListItemContentIcon, SidebarListItemLink } from './index';

interface Props {
    to: string;
    icon: IconName;
    notification?: ThemeColor;
    children: ReactNode;
}

const SettingsListItem = ({ to, icon, children, notification }: Props) => {
    return (
        <SidebarListItem>
            <SidebarListItemLink to={to}>
                <SidebarListItemContent
                    left={<SidebarListItemContentIcon name={icon} />}
                    right={notification && <NotificationDot color={notification} />}
                >
                    {children}
                </SidebarListItemContent>
            </SidebarListItemLink>
        </SidebarListItem>
    );
};

export default SettingsListItem;
