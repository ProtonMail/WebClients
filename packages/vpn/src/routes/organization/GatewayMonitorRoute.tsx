import { VPNEvents } from '@proton/components/containers/b2bDashboard/VPN/VPNEvents';
import PrivateMainSettingsArea from '@proton/components/containers/layout/PrivateMainSettingsArea';
import type { SectionConfig } from '@proton/components/containers/layout/interface';

type Props = {
    config: SectionConfig;
};

export const GatewayMonitorRoute = ({ config }: Props) => (
    <PrivateMainSettingsArea config={config}>
        <VPNEvents />
    </PrivateMainSettingsArea>
);
