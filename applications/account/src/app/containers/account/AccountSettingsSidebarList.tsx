import {
    SectionConfig,
    SidebarList,
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    SidebarListItemLink,
    useShowRecoveryNotification,
    useUser,
} from '@proton/components';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import NotificationDot from '@proton/components/components/notificationDot/NotificationDot';

import { getDashboardPage, hasAccountDashboardPage } from './AccountDashboardSettings';
import { getEasySwitchPage } from './AccountEasySwitchSettings';
import { getSecurityPage } from './AccountSecuritySettings';
import { getRecoveryPage, hasRecoverySettings } from './AccountRecoverySettings';
import { getLanguageAndTimePage } from './AccountLanguageAndTimeSettings';
import { getAccountAndPasswordPage } from './AccountAccountAndPasswordSettings';

const AccountSettingsSidebarList = ({ appSlug }: { appSlug: string }) => {
    const [user] = useUser();
    const showRecoveryNotification = useShowRecoveryNotification();

    const pages: SectionConfig[] = [
        hasAccountDashboardPage(user) && getDashboardPage({ user }),
        hasRecoverySettings(user) && getRecoveryPage(showRecoveryNotification),
        getAccountAndPasswordPage({ user }),
        getLanguageAndTimePage(),
        getSecurityPage(),
        getEasySwitchPage(),
    ].filter(isTruthy);

    return (
        <SidebarList>
            {pages.map(({ text, to, icon, notification }) => (
                <SidebarListItem key={to}>
                    <SidebarListItemLink to={`/${appSlug}${to}`}>
                        <SidebarListItemContent
                            left={<SidebarListItemContentIcon name={icon} />}
                            right={notification && <NotificationDot />}
                        >
                            {text}
                        </SidebarListItemContent>
                    </SidebarListItemLink>
                </SidebarListItem>
            ))}
        </SidebarList>
    );
};

export default AccountSettingsSidebarList;
