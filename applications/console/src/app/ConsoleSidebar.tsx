import MainLogo from '@proton/components/components/logo/MainLogo';
import SettingsListItem from '@proton/components/components/sidebar/SettingsListItem';
import Sidebar from '@proton/components/components/sidebar/Sidebar';
import SidebarList from '@proton/components/components/sidebar/SidebarList';
import SidebarNav from '@proton/components/components/sidebar/SidebarNav';
import { APPS } from '@proton/shared/lib/constants';

import type { ConsoleRoute } from './interface';

interface Props {
    routes: ConsoleRoute[];
    expanded: boolean;
    onToggleExpand: () => void;
}

export const ConsoleSidebar = ({ routes, expanded, onToggleExpand }: Props) => {
    return (
        <Sidebar
            app={APPS.PROTONCONSOLE}
            appsDropdown={null}
            logo={<MainLogo to="/" />}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            hasAppLinks={false}
            footerVariant="minimal"
        >
            <SidebarNav className="overflow-auto">
                <SidebarList>
                    {routes.map((route) => (
                        <SettingsListItem to={route.to} icon={route.icon} key={route.to}>
                            <span className="text-ellipsis" title={route.text}>
                                {route.text}
                            </span>
                        </SettingsListItem>
                    ))}
                </SidebarList>
            </SidebarNav>
        </Sidebar>
    );
};
