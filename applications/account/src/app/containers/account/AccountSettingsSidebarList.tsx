import {
    FeatureCode,
    SectionConfig,
    SidebarList,
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    SidebarListItemLink,
    useFeature,
    useUser,
} from '@proton/components';
import { UserModel } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';

import { getDashboardPage } from './AccountDashboardSettings';
import { getPasswordAndRecoveryPage } from './AccountPasswordAndRecoverySettings';
import { getPaymentPage } from './AccountPaymentSettings';
import { getSecurityPage } from './AccountSecuritySettings';
import { getEasySwitchPage } from './AccountEasySwitchSettings';

const getPages = (user: UserModel, isEasySwitchEnabled: boolean): SectionConfig[] =>
    [
        getDashboardPage({ user }),
        getPasswordAndRecoveryPage({ user }),
        user.canPay && getPaymentPage(),
        getSecurityPage(),
        isEasySwitchEnabled && getEasySwitchPage(),
    ].filter(isTruthy);

const AccountSettingsSidebarList = ({ appSlug }: { appSlug: string }) => {
    const [user] = useUser();

    const isEasySwitchEnabled = useFeature(FeatureCode.EasySwitch).feature?.Value;

    return (
        <SidebarList>
            {getPages(user, isEasySwitchEnabled).map(({ text, to, icon }) => (
                <SidebarListItem key={to}>
                    <SidebarListItemLink to={`/${appSlug}${to}`}>
                        <SidebarListItemContent left={<SidebarListItemContentIcon name={icon} />}>
                            {text}
                        </SidebarListItemContent>
                    </SidebarListItemLink>
                </SidebarListItem>
            ))}
        </SidebarList>
    );
};

export default AccountSettingsSidebarList;
