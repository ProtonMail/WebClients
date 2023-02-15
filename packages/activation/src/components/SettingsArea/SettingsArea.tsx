import { c } from 'ttag';

import { SettingsParagraph, SettingsSectionWide } from '@proton/components/containers/account';
import { PrivateMainSettingsArea, SettingsAreaConfig } from '@proton/components/containers/layout';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import EasySwitchStoreProvider from '../../logic/StoreProvider';
import ReportsTable from '../ReportsTable/ReportsTable';
import ProviderCards from './ProviderCards/ProviderCards';

interface Props {
    config: SettingsAreaConfig;
}

const SettingsArea = ({ config }: Props) => (
    <EasySwitchStoreProvider>
        <PrivateMainSettingsArea config={config}>
            <SettingsSectionWide>
                <SettingsParagraph>
                    {c('Info')
                        .t`Import your emails, calendars, and contacts from another service to ${BRAND_NAME}. We'll guide you each step of the way and encrypt your data as it gets moved. Welcome to the world of privacy.`}
                </SettingsParagraph>
                <ProviderCards />
            </SettingsSectionWide>
            <SettingsSectionWide>
                <ReportsTable />
            </SettingsSectionWide>
        </PrivateMainSettingsArea>
    </EasySwitchStoreProvider>
);

export default SettingsArea;
