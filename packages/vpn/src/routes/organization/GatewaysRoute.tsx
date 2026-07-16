import PrivateMainSettingsArea from '@proton/components/containers/layout/PrivateMainSettingsArea';
import type { SectionConfig } from '@proton/components/containers/layout/interface';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces';

import { GatewaysSection } from '../../components/Gateways/GatewaysSection';

type Props = {
    config: SectionConfig;
    organization?: OrganizationExtended;
};

export const GatewaysRoute = ({ config, organization }: Props) => (
    <PrivateMainSettingsArea config={config}>
        <GatewaysSection organization={organization} />
    </PrivateMainSettingsArea>
);
