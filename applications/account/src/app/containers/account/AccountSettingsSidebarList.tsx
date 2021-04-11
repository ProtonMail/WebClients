import React from 'react';
import {
    SectionConfig,
    SidebarList,
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    SidebarListItemLink,
    useUser,
} from 'react-components';
import { UserModel } from 'proton-shared/lib/interfaces';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';

import { getDashboardPage } from './AccountDashboardSettings';
import { getPasswordAndRecoveryPage } from './AccountPasswordAndRecoverySettings';
import { getPaymentPage } from './AccountPaymentSettings';
import { getSecurityPage } from './AccountSecuritySettings';

const getPages = (user: UserModel): SectionConfig[] =>
    [
        getDashboardPage({ user }),
        getPasswordAndRecoveryPage({ user }),
        user.canPay && getPaymentPage(),
        getSecurityPage(),
    ].filter(isTruthy);

const AccountSettingsSidebarList = ({ prefix }: { prefix: string }) => {
    const [user] = useUser();

    return (
        <SidebarList>
            {getPages(user).map(({ text, to, icon }) => (
                <SidebarListItem key={to}>
                    <SidebarListItemLink to={`/${prefix}${to}`}>
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
