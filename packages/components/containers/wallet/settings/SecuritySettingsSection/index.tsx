import { PrivateMainSettingsArea, SectionConfig } from '@proton/components/containers/layout';

import { TwoFactorAmountThresholdSetting } from './TwoFactorAmountThresholdSetting';

interface Props {
    config: SectionConfig;
}

export const SecuritySettingsSection = ({ config }: Props) => {
    return (
        <PrivateMainSettingsArea config={config}>
            <>
                <TwoFactorAmountThresholdSetting />
            </>
        </PrivateMainSettingsArea>
    );
};
