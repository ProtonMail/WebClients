import { c } from 'ttag';

import { Loader } from '@proton/components/components';
import { FeatureCode } from '@proton/components/containers';
import { SettingsParagraph, SettingsSectionWide } from '@proton/components/containers/account';
import { PrivateMainSettingsArea, SettingsAreaConfig } from '@proton/components/containers/layout';
import { PrivateMainSettingsAreaBase } from '@proton/components/containers/layout/PrivateMainSettingsArea';
import { useFeature } from '@proton/components/hooks';
import { BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { EasySwitchFeatureFlag } from '../../interface';
import EasySwitchStoreProvider from '../../logic/StoreProvider';
import ReportsTable from '../ReportsTable/ReportsTable';
import GmailForwarding from './GmailForwarding';
import ProviderCards from './ProviderCards/ProviderCards';

interface Props {
    config: SettingsAreaConfig;
}

const SettingsArea = ({ config }: Props) => {
    const { loading } = useFeature<EasySwitchFeatureFlag>(FeatureCode.EasySwitch);

    return (
        <EasySwitchStoreProvider>
            {loading ? (
                <PrivateMainSettingsAreaBase title={config.text} description={config.description}>
                    <Loader size="medium" className="py4 text-center" />
                </PrivateMainSettingsAreaBase>
            ) : (
                <PrivateMainSettingsArea config={config}>
                    <SettingsSectionWide>
                        <SettingsParagraph data-testId="SettingsArea:forwardSection">
                            {c('Info')
                                .t`Forward incoming mail from another account to your secure ${MAIL_APP_NAME} inbox.`}
                        </SettingsParagraph>
                        <GmailForwarding />
                    </SettingsSectionWide>
                    <SettingsSectionWide>
                        <SettingsParagraph>
                            {c('Info')
                                .t`Import your emails, calendars, and contacts from another service to ${BRAND_NAME}.`}
                        </SettingsParagraph>
                        <ProviderCards />
                    </SettingsSectionWide>
                    <SettingsSectionWide>
                        <ReportsTable />
                    </SettingsSectionWide>
                </PrivateMainSettingsArea>
            )}
        </EasySwitchStoreProvider>
    );
};

export default SettingsArea;
