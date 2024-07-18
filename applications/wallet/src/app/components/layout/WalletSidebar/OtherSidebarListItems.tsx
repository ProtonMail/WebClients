import { ReactNode } from 'react';

import { c } from 'ttag';

import { signoutAction } from '@proton/account';
import {
    IconProps,
    SettingsLink,
    SidebarListItem,
    SidebarListItemButton,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    SidebarListItemSettingsLink,
} from '@proton/components/components';
import { useDispatch } from '@proton/redux-shared-store';

import { APP_NAME } from '../../../config';

interface Props {
    label: string;
    to: string;
    icon: IconProps['name'];
    'data-testid'?: string;
    children?: ReactNode;
}

const SidebarItemContent = ({ label, to, icon, ...props }: Props) => {
    return (
        <SidebarListItemSettingsLink path={to} target="_blank">
            <SidebarListItemContent
                data-testid={props['data-testid']}
                left={<SidebarListItemContentIcon size={5} className="color-weak" name={icon} />}
                className="sidebar-item-content flex gap-2 max-w-full"
            >
                <div className="ml-1 flex flex-nowrap justify-space-between items-center w-full relative">
                    <span className="text-ellipsis" title={label}>
                        {label}
                    </span>
                </div>
            </SidebarListItemContent>
        </SidebarListItemSettingsLink>
    );
};

export const OtherSidebarListItems = () => {
    const dispatch = useDispatch();

    const handleSignout = (clearDeviceRecovery: boolean) => {
        dispatch(signoutAction({ clearDeviceRecovery }));
    };

    const handleSignOutClick = () => {
        handleSignout(false);
    };

    const recoveryLabel = c('Wallet Sidebar').t`Recovery`;
    const upgradeLabel = c('Wallet Sidebar').t`Upgrade`;
    const securityLabel = c('Wallet Sidebar').t`Security`;
    const settingsLabel = c('Wallet Sidebar').t`User settings`;
    const signoutLabel = c('Wallet Sidebar').t`Sign out`;

    return (
        <>
            <SidebarListItem className="my-2">
                <SidebarItemContent
                    icon="upgrade"
                    to="/upgrade"
                    data-testid="wallet-sidebar:upgrade"
                    label={upgradeLabel}
                />
            </SidebarListItem>
            <SidebarListItem className="my-2">
                <SidebarItemContent
                    icon="arrow-rotate-right"
                    to="/recovery"
                    data-testid="wallet-sidebar:recovery"
                    label={recoveryLabel}
                />
            </SidebarListItem>
            <SidebarListItem className="my-2">
                <SidebarItemContent
                    icon="shield-2"
                    to="/security"
                    data-testid="wallet-sidebar:security"
                    label={securityLabel}
                >
                    <SettingsLink path="/" app={APP_NAME} />
                </SidebarItemContent>
            </SidebarListItem>
            <SidebarListItem className="my-2">
                <SidebarItemContent icon="user" to="/" data-testid="wallet-sidebar:settings" label={settingsLabel} />
            </SidebarListItem>
            <SidebarListItem className="my-2">
                <SidebarListItemButton onClick={() => handleSignOutClick()}>
                    <SidebarListItemContent
                        data-testid="wallet-sidebar:signout"
                        left={
                            <SidebarListItemContentIcon
                                className="color-weak"
                                size={5}
                                name="arrow-out-from-rectangle"
                            />
                        }
                        className="sidebar-item-content flex gap-2 max-w-full"
                    >
                        <div className="ml-1 flex flex-nowrap justify-space-between items-center w-full relative">
                            <span className="text-ellipsis" title={signoutLabel}>
                                {signoutLabel}
                            </span>
                        </div>
                    </SidebarListItemContent>
                </SidebarListItemButton>
            </SidebarListItem>
        </>
    );
};
