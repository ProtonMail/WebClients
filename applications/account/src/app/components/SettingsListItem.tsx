import { NotificationDot } from '@proton/atoms';
import {
    IconName,
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    SidebarListItemLink,
} from '@proton/components';
import { ThemeColor } from '@proton/colors';

interface Props {
    to: string;
    icon: IconName;
    notification?: ThemeColor;
    children: React.ReactNode;
    exact?: boolean;
    linkClassName?: string;
}

const SettingsListItem = ({ to, icon, children, notification, exact, linkClassName }: Props) => {
    return (
        <SidebarListItem>
            <SidebarListItemLink to={to} exact={exact} className={linkClassName}>
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
