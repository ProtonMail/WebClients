import Loader from '@proton/components/components/loader/Loader';
import PrivateMainSettingsArea, {
    PrivateMainSettingsAreaBase,
} from '@proton/components/containers/layout/PrivateMainSettingsArea';
import type { SectionConfig } from '@proton/components/containers/layout/interface';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces';

import { GatewaysSection } from '../../components/Gateways/GatewaysSection';
import { NavSections } from '../../components/NavSections';
import { useB2BAdminNavigation } from '../../contexts/NavigationContext';
import { findNavItem } from '../../definitions/routes';

type Props = {
    config: SectionConfig;
    organization?: OrganizationExtended;
};

export const GatewaysRoute = ({ config, organization }: Props) => {
    const adminSidebarFeature = useB2BAdminNavigation();
    if (adminSidebarFeature.loading) {
        return <Loader />;
    }

    const gatewaysNavConfig = adminSidebarFeature.enabled
        ? findNavItem(adminSidebarFeature.nav, 'organization.vpn.gateways')
        : undefined;

    if (gatewaysNavConfig) {
        return (
            <PrivateMainSettingsAreaBase title={gatewaysNavConfig.label}>
                <NavSections
                    navItem={gatewaysNavConfig}
                    content={{
                        'organization.vpn.gateways.servers': <GatewaysSection organization={organization} />,
                    }}
                />
            </PrivateMainSettingsAreaBase>
        );
    }

    return (
        <PrivateMainSettingsArea config={config}>
            <GatewaysSection organization={organization} />
        </PrivateMainSettingsArea>
    );
};
