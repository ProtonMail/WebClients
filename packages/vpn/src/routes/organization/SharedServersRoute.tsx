import PrivateMainSettingsArea from '@proton/components/containers/layout/PrivateMainSettingsArea';
import type { SectionConfig } from '@proton/components/containers/layout/interface';
import SharedServersSection from '@proton/components/containers/vpn/sharedServers/SharedServersSection';

type Props = {
    config: SectionConfig;
};

export const SharedServersRoute = ({ config }: Props) => (
    <PrivateMainSettingsArea config={config}>
        <SharedServersSection />
    </PrivateMainSettingsArea>
);
