import EasySwitchStoreInitializer from '@proton/activation/src/logic/EasySwitchStoreInitializer';
import { type SettingsAreaConfig, SettingsParagraph } from '@proton/components';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import PrivateMainSettingsArea from '@proton/components/containers/layout/PrivateMainSettingsArea';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import useBYOEFeatureStatus from '../../hooks/useBYOEFeatureStatus';
import EasySwitchStoreProvider from '../../logic/StoreProvider';
import ReportsTable from '../ReportsTable/ReportsTable';
import GmailForwarding from './GmailForwarding';
import ProviderCard from './ProviderCards/ProviderCard';

interface Props {
    config: SettingsAreaConfig;
    app: APP_NAMES;
}

const SettingsArea = ({ config, app }: Props) => {
    const hasAccessToBYOE = useBYOEFeatureStatus();

    return (
        <EasySwitchStoreProvider>
            <EasySwitchStoreInitializer>
                <PrivateMainSettingsArea config={config}>
                    <SettingsParagraph data-testid="SettingsArea:forwardSection">
                        <div className="md:max-w-custom" style={{ '--md-max-w-custom': '27rem' }}>
                            {hasAccessToBYOE ? null : <GmailForwarding />}
                            <ProviderCard app={app} />
                        </div>
                    </SettingsParagraph>
                    <SettingsSectionWide>
                        <ReportsTable />
                    </SettingsSectionWide>
                </PrivateMainSettingsArea>
            </EasySwitchStoreInitializer>
        </EasySwitchStoreProvider>
    );
};

export default SettingsArea;
