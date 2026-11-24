import { Loader } from '@proton/atoms/Loader/Loader';
import PrivateMainSettingsArea, {
    PrivateMainSettingsAreaBase,
} from '@proton/components/containers/layout/PrivateMainSettingsArea';
import type { SectionConfig } from '@proton/components/containers/layout/interface';

import { NavSections } from '../../components/NavSections';
import SharedServersSection from '../../components/sharedServers/SharedServersSection';
import { useB2BAdminNavigation } from '../../contexts/NavigationContext';
import { findNavItem } from '../../definitions/routes';

type Props = {
    config: SectionConfig;
};

export const SharedServersRoute = ({ config }: Props) => {
    const adminSidebarFeature = useB2BAdminNavigation();
    if (adminSidebarFeature.loading) {
        return <Loader />;
    }

    const sharedServersNavConfig = adminSidebarFeature.enabled
        ? findNavItem(adminSidebarFeature.nav, 'organization.vpn.shared-servers')
        : undefined;

    if (sharedServersNavConfig) {
        return (
            <PrivateMainSettingsAreaBase title={sharedServersNavConfig.label}>
                <NavSections
                    navItem={sharedServersNavConfig}
                    content={{
                        'organization.vpn.shared-servers.servers': <SharedServersSection />,
                    }}
                />
            </PrivateMainSettingsAreaBase>
        );
    }

    return (
        <PrivateMainSettingsArea config={config}>
            <SharedServersSection />
        </PrivateMainSettingsArea>
    );
};
