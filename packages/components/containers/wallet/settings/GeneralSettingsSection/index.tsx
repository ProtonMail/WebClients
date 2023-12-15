import { PrivateMainSettingsArea, SectionConfig } from '@proton/components/containers/layout';

import { BitcoinUnitSetting } from './BitcoinUnitSetting';
import { FiatCurrencySetting } from './FiatCurrencySetting';

interface Props {
    config: SectionConfig;
}

export const GeneralSettingsSection = ({ config }: Props) => {
    return (
        <PrivateMainSettingsArea config={config}>
            <>
                <BitcoinUnitSetting />
                <FiatCurrencySetting />
            </>
        </PrivateMainSettingsArea>
    );
};
