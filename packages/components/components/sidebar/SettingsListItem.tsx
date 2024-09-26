import type { ReactNode } from 'react';

import { c } from 'ttag';

import { NotificationDot } from '@proton/atoms';
import type { ThemeColor } from '@proton/colors';
import type { IconName } from '@proton/components/components/icon/Icon';

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

const SettingsListItem = ({ to, icon, children, notification }: Props) => {
    return (
        <SidebarListItem>
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
};

export default SettingsListItem;
