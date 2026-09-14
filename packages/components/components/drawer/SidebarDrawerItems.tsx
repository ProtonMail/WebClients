import type { ReactNode } from 'react';

import { c } from 'ttag';

import { selectHasAccountSecurityIssue } from '@proton/account';
import { NotificationDot } from '@proton/atoms/NotificationDot/NotificationDot';
import { ThemeColor } from '@proton/colors/types';
import type { IconComponent } from '@proton/icons/component';
import { IcShield } from '@proton/icons/icons/IcShield';
import { IcUsers } from '@proton/icons/icons/IcUsers';
import { baseUseSelector } from '@proton/react-redux-store';
import type { OpenDrawerArgs } from '@proton/shared/lib/drawer/interfaces';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';

import useDrawer from '../../hooks/drawer/useDrawer';
import SidebarListItemContent from '../sidebar/SidebarListItemContent';
import SidebarListItemContentIcon from '../sidebar/SidebarListItemContentIcon';
import useSecurityCenter from './views/SecurityCenter/useSecurityCenter';

interface SidebarDrawerItemProps {
    onClick: () => void;
    icon: IconComponent;
    name: string;
    right?: ReactNode;
}

const SidebarDrawerItem = ({ name, icon, onClick, right }: SidebarDrawerItemProps) => {
    return (
        <button type="button" onClick={onClick} className="navigation-link">
            <SidebarListItemContent left={<SidebarListItemContentIcon icon={icon} />} right={right}>
                <span>{name}</span>
            </SidebarListItemContent>
        </button>
    );
};

const SecurityCenterDrawerItem = ({
    toggleDrawerApp,
    toggleHeaderDropdown,
}: {
    toggleHeaderDropdown: () => void;
    toggleDrawerApp: (args: OpenDrawerArgs) => () => void;
}) => {
    const hasAccountSecurityWarning = baseUseSelector(selectHasAccountSecurityIssue);

    return (
        <SidebarDrawerItem
            onClick={() => {
                toggleHeaderDropdown();
                toggleDrawerApp({ app: DRAWER_NATIVE_APPS.SECURITY_CENTER })();
            }}
            icon={IcShield}
            name={c('Header').t`Security Center`}
            right={
                hasAccountSecurityWarning ? (
                    <NotificationDot color={ThemeColor.Warning} alt={c('Info').t`Attention required`} />
                ) : undefined
            }
        />
    );
};

interface SidebarDrawerItemsProps {
    toggleHeaderDropdown: () => void;
}

const SidebarDrawerItems = ({ toggleHeaderDropdown }: SidebarDrawerItemsProps) => {
    const { toggleDrawerApp } = useDrawer();
    const displaySecurityCenter = useSecurityCenter();

    return (
        <div className="navigation-item h-auto shrink-0 px-3 mb-4 mt-2 md:hidden">
            <SidebarDrawerItem
                onClick={() => {
                    toggleHeaderDropdown();
                    toggleDrawerApp({ app: DRAWER_NATIVE_APPS.CONTACTS })();
                }}
                icon={IcUsers}
                name={c('Header').t`Contacts`}
            />
            {displaySecurityCenter && (
                <SecurityCenterDrawerItem
                    toggleDrawerApp={toggleDrawerApp}
                    toggleHeaderDropdown={toggleHeaderDropdown}
                />
            )}
        </div>
    );
};

export default SidebarDrawerItems;
