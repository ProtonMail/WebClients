import type { RefObject } from 'react';
import { useLocation } from 'react-router-dom';

import type { SectionConfig, SidebarConfig } from '@proton/components';
import { MainLogo } from '@proton/components';
import Loader from '@proton/components/components/loader/Loader';
import SettingsListItem from '@proton/components/components/sidebar/SettingsListItem';
import Sidebar from '@proton/components/components/sidebar/Sidebar';
import SidebarList from '@proton/components/components/sidebar/SidebarList';
import SidebarNav from '@proton/components/components/sidebar/SidebarNav';
import { Tree } from '@proton/components/components/sidebar/nav/Tree';
import { getIsSectionAvailable, getSectionPath } from '@proton/components/containers/layout/helper';
import { APPS } from '@proton/shared/lib/constants';
import { SidebarToggle } from '@proton/vpn/components/Sidebar/Toggle';
import type { useB2BAdminSidebarFeature } from '@proton/vpn/hooks/useB2BAdminSidebarFeature';

import VpnSidebarVersion from './containers/VpnSidebarVersion';

// Coupled because MainContainer.tsx#L230-231 also is using the state to control the mobile sidebar
type CoupledParentProps = {
    sidebarExpanded: boolean;
    onSidebarToggle: () => void;
};

type Props = {
    routes: Record<string, SectionConfig>;
    organizationRoutes: SidebarConfig;
    adminSidebarFeature: ReturnType<typeof useB2BAdminSidebarFeature>;
    navigationRef: RefObject<HTMLDivElement>;
} & CoupledParentProps;

export const VPNSidebar = ({
    routes,
    organizationRoutes,
    sidebarExpanded,
    onSidebarToggle,
    adminSidebarFeature,
    navigationRef,
}: Props) => {
    const { pathname } = useLocation();

    if (adminSidebarFeature.loading) {
        return (
            <Sidebar
                app={APPS.PROTONVPN_SETTINGS}
                appsDropdown={null}
                logo={<MainLogo to="/" />}
                expanded={sidebarExpanded}
                onToggleExpand={onSidebarToggle}
                version={<VpnSidebarVersion />}
                hasAppLinks={false}
            >
                <Loader size="medium" />
            </Sidebar>
        );
    }
    const isSidebarActive = adminSidebarFeature.enabled && adminSidebarFeature.sidebar.status;

    return (
        <Sidebar
            app={APPS.PROTONVPN_SETTINGS}
            appsDropdown={null}
            logo={<MainLogo to="/" />}
            expanded={sidebarExpanded}
            onToggleExpand={onSidebarToggle}
            version={<VpnSidebarVersion />}
            hasAppLinks={false}
            navigationRef={adminSidebarFeature.enabled ? navigationRef : null}
        >
            <SidebarNav className="overflow-auto">
                {isSidebarActive ? (
                    <Tree routes={adminSidebarFeature.routes} pathname={pathname} />
                ) : (
                    <SidebarList>
                        {Object.values({
                            ...routes,
                            ...(organizationRoutes.available ? organizationRoutes.routes : {}),
                        }).map(
                            (section: SectionConfig) =>
                                getIsSectionAvailable(section) && (
                                    <SettingsListItem
                                        to={getSectionPath('', section)}
                                        icon={section.icon}
                                        notification={section.notification}
                                        key={section.to}
                                    >
                                        <span className="text-ellipsis" title={section.text}>
                                            {section.text}
                                        </span>
                                    </SettingsListItem>
                                )
                        )}
                    </SidebarList>
                )}
            </SidebarNav>
            <SidebarToggle adminSidebarFeature={adminSidebarFeature} />
        </Sidebar>
    );
};
