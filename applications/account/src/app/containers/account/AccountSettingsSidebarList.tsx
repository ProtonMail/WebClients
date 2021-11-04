import {
    FeatureCode,
    SectionConfig,
    SidebarList,
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    SidebarListItemLink,
    useFeature,
    useShowRecoveryNotification,
    useUser,
} from '@proton/components';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import NotificationDot from '@proton/components/components/notificationDot/NotificationDot';

import { getDashboardPage } from './AccountDashboardSettings';
import { getPaymentPage } from './AccountPaymentSettings';
import { getEasySwitchPage } from './AccountEasySwitchSettings';
import { getPasswordAndSecurityPage } from './AccountPasswordAndSecuritySettings';
import { getRecoveryPage, hasRecoverySettings } from './AccountRecoverySettings';

const AccountSettingsSidebarList = ({ appSlug }: { appSlug: string }) => {
    const [user] = useUser();
    const showRecoveryNotification = useShowRecoveryNotification();
    const isEasySwitchEnabled = useFeature(FeatureCode.EasySwitch).feature?.Value;

    const pages: SectionConfig[] = [
        getDashboardPage({ user }),
        hasRecoverySettings(user) && getRecoveryPage(showRecoveryNotification),
        user.canPay && getPaymentPage(),
        getPasswordAndSecurityPage({ user }),
        isEasySwitchEnabled && getEasySwitchPage(),
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
