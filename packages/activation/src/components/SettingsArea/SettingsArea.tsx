import { Loader, PrivateMainSettingsAreaBase, type SettingsAreaConfig, SettingsParagraph } from '@proton/components';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import PrivateMainSettingsArea from '@proton/components/containers/layout/PrivateMainSettingsArea';
import { FeatureCode, useFeature } from '@proton/features';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import type { EasySwitchFeatureFlag } from '../../interface';
import EasySwitchStoreProvider from '../../logic/StoreProvider';
import ReportsTable from '../ReportsTable/ReportsTable';
import GmailForwarding from './GmailForwarding';
import ProviderCard from './ProviderCards/ProviderCard';

interface Props {
    config: SettingsAreaConfig;
    app: APP_NAMES;
}

const SettingsArea = ({ config, app }: Props) => {
    const { loading } = useFeature<EasySwitchFeatureFlag>(FeatureCode.EasySwitch);

    if (loading) {
        return (
            <PrivateMainSettingsAreaBase title={config.title} description={config.description}>
                <Loader size="medium" className="py-14 text-center" />
            </PrivateMainSettingsAreaBase>
        );
    }

    return (
        <EasySwitchStoreProvider>
            <PrivateMainSettingsArea config={config}>
                <SettingsParagraph data-testid="SettingsArea:forwardSection">
                    <div className="md:max-w-custom" style={{ '--md-max-w-custom': '27rem' }}>
                        <GmailForwarding app={app} />
                        <ProviderCard app={app} />
                    </div>
                </SettingsParagraph>
                <SettingsSectionWide>
                    <ReportsTable />
                </SettingsSectionWide>
            </PrivateMainSettingsArea>
        </EasySwitchStoreProvider>
    );
};

export default SettingsArea;
