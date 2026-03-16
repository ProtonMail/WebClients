import { SyncsTable } from '@proton/activation/src/components/ReportsTable/SyncsTable';
import EasySwitchStoreInitializer from '@proton/activation/src/logic/EasySwitchStoreInitializer';
import type { SettingsAreaConfig } from '@proton/components';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import PrivateMainSettingsArea from '@proton/components/containers/layout/PrivateMainSettingsArea';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import EasySwitchStoreProvider from '../../logic/StoreProvider';
import ImportsTable from '../ReportsTable/ImportsTable';
import ProviderCard from './ProviderCards/ProviderCard';

import './EasySwitchTables.scss';

interface Props {
    config: SettingsAreaConfig;
    app: APP_NAMES;
}

const SettingsArea = ({ config, app }: Props) => {
    return (
        <EasySwitchStoreProvider>
            <EasySwitchStoreInitializer>
                <PrivateMainSettingsArea config={config}>
                    <SettingsSectionWide data-testid="SettingsArea:forwardSection">
                        <ProviderCard app={app} />
                    </SettingsSectionWide>
                    <SettingsSectionWide>
                        <ImportsTable />
                    </SettingsSectionWide>
                    <SettingsSectionWide>
                        <SyncsTable />
                    </SettingsSectionWide>
                </PrivateMainSettingsArea>
            </EasySwitchStoreInitializer>
        </EasySwitchStoreProvider>
    );
};

export default SettingsArea;
