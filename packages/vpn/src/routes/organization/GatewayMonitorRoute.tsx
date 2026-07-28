import { c } from 'ttag';

import Loader from '@proton/components/components/loader/Loader';
import { VPNEvents } from '@proton/components/containers/b2bDashboard/VPN/VPNEvents';
import PrivateMainSettingsArea, {
    PrivateMainSettingsAreaBase,
} from '@proton/components/containers/layout/PrivateMainSettingsArea';
import type { SectionConfig } from '@proton/components/containers/layout/interface';

import { NavSections } from '../../components/NavSections';
import { useB2BAdminNavigation } from '../../contexts/NavigationContext';
import { findNavItem } from '../../definitions/routes';

type Props = {
    config: SectionConfig;
};

const description = c('Subtitle').t`View VPN session details for your organization.`;

export const GatewayMonitorRoute = ({ config }: Props) => {
    const adminSidebarFeature = useB2BAdminNavigation();
    if (adminSidebarFeature.loading) {
        return <Loader />;
    }

    const gatewayMonitorNavConfig = adminSidebarFeature.enabled
        ? findNavItem(adminSidebarFeature.nav, 'organization.vpn.gateway-monitor')
        : undefined;

    if (gatewayMonitorNavConfig) {
        return (
            <PrivateMainSettingsAreaBase title={gatewayMonitorNavConfig.label} description={description}>
                <NavSections
                    navItem={gatewayMonitorNavConfig}
                    content={{
                        'organization.vpn.gateway-monitor.vpn-connection-events': <VPNEvents />,
                    }}
                />
            </PrivateMainSettingsAreaBase>
        );
    }

    return (
        <PrivateMainSettingsArea config={config}>
            <VPNEvents />
        </PrivateMainSettingsArea>
    );
};
