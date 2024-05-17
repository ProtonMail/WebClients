import { ReactNode } from 'react';

import { c } from 'ttag';

import {
    IconProps,
    SettingsLink,
    SidebarListItem,
    SidebarListItemButton,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    SidebarListItemSettingsLink,
} from '@proton/components/components';

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
                left={<SidebarListItemContentIcon className="color-hint" name={icon} />}
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
    const discoverLabel = c('Wallet Sidebar').t`Discover`;
    const recoveryLabel = c('Wallet Sidebar').t`Recovery`;
    const upgradeLabel = c('Wallet Sidebar').t`Upgrade`;
    const securityLabel = c('Wallet Sidebar').t`Security`;
    const settingsLabel = c('Wallet Sidebar').t`Settings`;

    return (
        <>
            <SidebarListItem className="my-3">
                <SidebarListItemButton>
                    <SidebarListItemContent
                        data-testid="wallet-sidebar:discover"
                        left={<SidebarListItemContentIcon className="color-hint" name="grid-2" />}
                        className="sidebar-item-content flex gap-2 max-w-full"
                    >
                        <div className="ml-1 flex flex-nowrap justify-space-between items-center w-full relative">
                            <span className="text-ellipsis" title={discoverLabel}>
                                {discoverLabel}
                            </span>
                        </div>
                    </SidebarListItemContent>
                </SidebarListItemButton>
            </SidebarListItem>
            <SidebarListItem className="my-3">
                <SidebarItemContent
                    icon="arrow-rotate-right"
                    to="/recovery"
                    data-testid="wallet-sidebar:recovery"
                    label={recoveryLabel}
                />
            </SidebarListItem>
            <SidebarListItem className="my-3">
                <SidebarItemContent
                    icon="upgrade"
                    to="/upgrade"
                    data-testid="wallet-sidebar:upgrade"
                    label={upgradeLabel}
                />
            </SidebarListItem>
            <SidebarListItem className="my-3">
                <SidebarItemContent
                    icon="shield-2"
                    to="/security"
                    data-testid="wallet-sidebar:security"
                    label={securityLabel}
                >
                    <SettingsLink path="/" app={APP_NAME} />
                </SidebarItemContent>
            </SidebarListItem>
            <SidebarListItem className="my-3">
                <SidebarItemContent
                    icon="cog-wheel"
                    to="/"
                    data-testid="wallet-sidebar:settings"
                    label={settingsLabel}
                />
            </SidebarListItem>
        </>
    );
};
