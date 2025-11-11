import { PrivateMainSettingsArea, type SettingsAreaConfig } from '@proton/components/index';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';

import YourPlanSectionV2 from '../../payments/subscription/YourPlanSectionV2/YourPlanSectionV2';
import { YourPlanUpsellsSectionV2 } from '../../payments/subscription/YourPlanSectionV2/YourPlanUpsellsSectionV2';
import MailBlogSection from './mail/MailBlogSection/MailBlogSection';
import { MailDownloadAndInfoSection } from './mail/MailDownloadAndInfoSection/MailDownloadAndInfoSection';
import PassBlogSection from './pass/PassBlogSection/PassBlogSection';
import PassDownloadAndInfoSection from './pass/PassDownloadAndInfoSection/PassDownloadAndInfoSection';
import AlsoInYourPlanSection from './shared/AlsoInYourPlanSection/AlsoInYourPlanSection';
import AlsoInYourPlanProtonDrive from './shared/AlsoInYourPlanSection/products/AlsoInYourPlanProtonDrive';
import AlsoInYourPlanProtonMail from './shared/AlsoInYourPlanSection/products/AlsoInYourPlanProtonMail';
import AlsoInYourPlanProtonPass from './shared/AlsoInYourPlanSection/products/AlsoInYourPlanProtonPass';
import AlsoInYourPlanProtonVPN from './shared/AlsoInYourPlanSection/products/AlsoInYourPlanProtonVPN';

interface Props {
    app: APP_NAMES;
    config: SettingsAreaConfig;
}

const AccountMailDashboard = ({ app, config }: Props) => {
    return (
        <PrivateMainSettingsArea
            config={config}
            mainAreaClass="bg-lowered settings-cards"
            wrapperClass="w-full p-4 lg:p-6 xl:p-12 max-w-custom mx-auto"
            style={{ '--max-w-custom': '93.75rem' }}
        >
            <YourPlanSectionV2 app={app} />
            <YourPlanUpsellsSectionV2 app={app} />
            <MailDownloadAndInfoSection app={app} />
            <AlsoInYourPlanSection app={app}>
                <AlsoInYourPlanProtonPass />
                <AlsoInYourPlanProtonDrive />
                <AlsoInYourPlanProtonVPN />
            </AlsoInYourPlanSection>
            <MailBlogSection />
        </PrivateMainSettingsArea>
    );
};

const AccountPassDashboard = ({ app, config }: Props) => {
    return (
        <PrivateMainSettingsArea
            config={config}
            mainAreaClass="bg-lowered settings-cards"
            wrapperClass="w-full p-4 lg:p-6 xl:p-12 max-w-custom mx-auto"
            style={{ '--max-w-custom': '93.75rem' }}
        >
            <YourPlanSectionV2 app={app} />
            <YourPlanUpsellsSectionV2 app={app} />
            <PassDownloadAndInfoSection app={app} />
            <AlsoInYourPlanSection app={app}>
                <AlsoInYourPlanProtonMail />
                <AlsoInYourPlanProtonVPN />
                <AlsoInYourPlanProtonDrive />
            </AlsoInYourPlanSection>
            <PassBlogSection />
        </PrivateMainSettingsArea>
    );
};

const AccountDashboard = ({ app, config }: Props) => {
    switch (app) {
        case APPS.PROTONMAIL:
        case APPS.PROTONCALENDAR:
            return <AccountMailDashboard app={app} config={config} />;
        case APPS.PROTONPASS:
            return <AccountPassDashboard app={app} config={config} />;
    }
};

export default AccountDashboard;
