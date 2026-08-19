import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import PrivateMainSettingsArea from '@proton/components/containers/layout/PrivateMainSettingsArea';
import type { SectionConfig } from '@proton/components/containers/layout/interface';
import { DeleteSection } from '@proton/components/index';

import DataCollectionSection from './DataCollectionSection';
import { ThirdPartySection } from './ThirdPartySection';

import '../AccountSettings.scss';

interface Props {
    routeConfig: SectionConfig;
}
const PrivacyPage = ({ routeConfig }: Props) => {
    return (
        <PrivateMainSettingsArea config={routeConfig} mainAreaClass="lite-app-account-settings">
            <DataCollectionSection />
            <ThirdPartySection />
            <SettingsSectionWide>
                <DeleteSection deleteButtonFullWidth={true} />
            </SettingsSectionWide>
        </PrivateMainSettingsArea>
    );
};

export default PrivacyPage;
