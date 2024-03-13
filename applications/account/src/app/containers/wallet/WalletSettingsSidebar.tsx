import { SettingsListItem, SidebarList, SidebarListItem } from '@proton/components';
import { getIsSectionAvailable, getSectionPath } from '@proton/components/containers/layout/helper';

import { WalletsSettingsSidebarList } from './WalletsSettingsSidebarList';
import { getWalletAppRoutes } from './routes';

interface Props extends ReturnType<typeof getWalletAppRoutes> {
    prefix: string;
}

const WalletSettingsSidebar = ({ header, routes, prefix }: Props) => {
    return (
        <SidebarList>
            <SidebarListItem className="navigation-link-header-group">
                <h3>{header}</h3>
            </SidebarListItem>
            {getIsSectionAvailable(routes.general) && (
                <SettingsListItem
                    to={getSectionPath(prefix, routes.general)}
                    icon={routes.general.icon}
                    notification={routes.general.notification}
                    key={routes.general.to}
                >
                    <span className="text-ellipsis" title={routes.general.text}>
                        {routes.general.text}
                    </span>
                </SettingsListItem>
            )}
            {getIsSectionAvailable(routes.security) && (
                <SettingsListItem
                    to={getSectionPath(prefix, routes.security)}
                    icon={routes.security.icon}
                    notification={routes.security.notification}
                    key={routes.security.to}
                >
                    <span className="text-ellipsis" title={routes.security.text}>
                        {routes.security.text}
                    </span>
                </SettingsListItem>
            )}
            {getIsSectionAvailable(routes.wallets) && (
                <WalletsSettingsSidebarList prefix={prefix} config={routes.wallets} />
            )}
        </SidebarList>
    );
};

export default WalletSettingsSidebar;
