import { c } from 'ttag';

import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import PrivateMainSettingsArea from '@proton/components/containers/layout/PrivateMainSettingsArea';
import type { SectionConfig } from '@proton/components/containers/layout/interface';
import { DeleteSection } from '@proton/components/index';
import { IcTrashCross } from '@proton/icons/icons/IcTrashCross';

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
                <DeleteSection
                    deleteButtonText={
                        <span className="flex gap-2 items-center justify-center">
                            <IcTrashCross />
                            {c('Action').t`Delete your account`}
                        </span>
                    }
                    deleteButtonFullWidth={true}
                />
            </SettingsSectionWide>
        </PrivateMainSettingsArea>
    );
};

export default PrivacyPage;
