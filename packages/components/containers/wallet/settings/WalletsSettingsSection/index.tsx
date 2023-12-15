import { PrivateMainSettingsArea, SectionConfig } from '@proton/components/containers/layout';

import { WalletsOrderableList } from './WalletsOrderableList';

interface Props {
    config: SectionConfig;
}

export const WalletsSettingsSection = ({ config }: Props) => {
    return (
        <PrivateMainSettingsArea config={config}>
            <WalletsOrderableList />
        </PrivateMainSettingsArea>
    );
};
