import Loader from '@proton/components/components/loader/Loader';
import PrivateMainSettingsArea, {
    PrivateMainSettingsAreaBase,
} from '@proton/components/containers/layout/PrivateMainSettingsArea';
import type { SectionConfig } from '@proton/components/containers/layout/interface';
import OpenVPNConfigurationSection from '@proton/components/containers/vpn/OpenVPNConfigurationSection/OpenVPNConfigurationSection';
import WireGuardConfigurationSection from '@proton/components/containers/vpn/WireGuardConfigurationSection/WireGuardConfigurationSection';
import { NavSections } from '@proton/vpn/components/NavSections';
import { VPNClientsSection } from '@proton/vpn/components/VPNClientsSection';
import { useB2BAdminNavigation } from '@proton/vpn/contexts/navigation';
import { findNavItem } from '@proton/vpn/definitions/routes';

type Props = {
    legacyRouteConfig: SectionConfig;
};

export const DownloadsRoute = ({ legacyRouteConfig }: Props) => {
    const adminSidebarFeature = useB2BAdminNavigation();
    if (adminSidebarFeature.loading) {
        return <Loader />;
    }

    const downloadsNavConfig = adminSidebarFeature.enabled
        ? findNavItem(adminSidebarFeature.nav, 'my-vpn.download-apps')
        : undefined;

    if (downloadsNavConfig) {
        return (
            <PrivateMainSettingsAreaBase title={downloadsNavConfig.label}>
                <NavSections
                    navItem={downloadsNavConfig}
                    content={{
                        'my-vpn.download-apps.protonvpn-clients': <VPNClientsSection />,
                        'my-vpn.download-apps.wireguard-configuration': <WireGuardConfigurationSection />,
                        'my-vpn.download-apps.openvpn-configuration-files': <OpenVPNConfigurationSection />,
                    }}
                />
            </PrivateMainSettingsAreaBase>
        );
    }

    return (
        <PrivateMainSettingsArea config={legacyRouteConfig}>
            <VPNClientsSection />
            <WireGuardConfigurationSection />
            <OpenVPNConfigurationSection />
        </PrivateMainSettingsArea>
    );
};
