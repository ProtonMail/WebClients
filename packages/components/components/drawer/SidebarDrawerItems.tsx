import React, { ReactNode } from 'react';

import { c } from 'ttag';

import { NotificationDot } from '@proton/atoms/NotificationDot';
import { ThemeColor } from '@proton/colors/types';
import { baseUseSelector } from '@proton/redux-shared-store';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';

import useDrawer from '../../hooks/drawer/useDrawer';
import { IconName } from '../icon/Icon';
import SidebarListItemContent from '../sidebar/SidebarListItemContent';
import SidebarListItemContentIcon from '../sidebar/SidebarListItemContentIcon';
import { selectAccountSecurityIssuesCount } from './views/SecurityCenter/AccountSecurity/slice/accountSecuritySlice';
import useSecurityCenter from './views/SecurityCenter/useSecurityCenter';

interface SidebarDrawerItemProps {
    onClick: () => void;
    icon: IconName;
    name: string;
    right?: ReactNode;
}

const SidebarDrawerItem = ({ name, icon, onClick, right }: SidebarDrawerItemProps) => {
    return (
        <button type="button" onClick={onClick} className="navigation-link">
            <SidebarListItemContent left={<SidebarListItemContentIcon name={icon} />} right={right}>
                <span>{name}</span>
            </SidebarListItemContent>
        </button>
    );
};

interface SidebarDrawerItemsProps {
    toggleHeaderDropdown: () => void;
}

const SidebarDrawerItems = ({ toggleHeaderDropdown }: SidebarDrawerItemsProps) => {
    const { toggleDrawerApp } = useDrawer();
    const displaySecurityCenter = useSecurityCenter();
    const issuesCount = baseUseSelector(selectAccountSecurityIssuesCount);

    return (
        <div className="navigation-item h-auto shrink-0 px-3 mb-4 mt-2 md:hidden">
            <SidebarDrawerItem
                onClick={() => {
                    toggleHeaderDropdown();
                    toggleDrawerApp({ app: DRAWER_NATIVE_APPS.CONTACTS })();
                }}
                icon="users"
                name={c('Header').t`Contacts`}
            />
            {displaySecurityCenter && (
                <SidebarDrawerItem
                    onClick={() => {
                        toggleHeaderDropdown();
                        toggleDrawerApp({ app: DRAWER_NATIVE_APPS.SECURITY_CENTER })();
                    }}
                    icon="shield"
                    name={c('Header').t`Security Center`}
                    right={
                        issuesCount ? (
                            <NotificationDot color={ThemeColor.Warning} alt={c('Info').t`Attention required`} />
                        ) : undefined
                    }
                />
            )}
        </div>
    );
};

export default SidebarDrawerItems;
