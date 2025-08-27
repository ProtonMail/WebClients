import { useUser } from '@proton/account/user/hooks';
import EasySwitchStoreInitializer from '@proton/activation/src/logic/EasySwitchStoreInitializer';
import { Loader, PrivateMainSettingsAreaBase, type SettingsAreaConfig, SettingsParagraph } from '@proton/components';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import PrivateMainSettingsArea from '@proton/components/containers/layout/PrivateMainSettingsArea';
import { FeatureCode, useFeature } from '@proton/features';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { isAdmin } from '@proton/shared/lib/user/helpers';
import { useFlag } from '@proton/unleash';

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
    const [user] = useUser();
    const { loading } = useFeature<EasySwitchFeatureFlag>(FeatureCode.EasySwitch);
    // Only admins can access to BYOE for now, this will change later
    const hasAccessToBYOE = useFlag('InboxBringYourOwnEmail') && isAdmin(user);

    if (loading) {
        return (
            <PrivateMainSettingsAreaBase title={config.title} description={config.description}>
                <Loader size="medium" className="py-14 text-center" />
            </PrivateMainSettingsAreaBase>
        );
    }

    return (
        <EasySwitchStoreProvider>
            <EasySwitchStoreInitializer>
                <PrivateMainSettingsArea config={config}>
                    <SettingsParagraph data-testid="SettingsArea:forwardSection">
                        <div className="md:max-w-custom" style={{ '--md-max-w-custom': '27rem' }}>
                            {hasAccessToBYOE ? null : <GmailForwarding app={app} />}
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
