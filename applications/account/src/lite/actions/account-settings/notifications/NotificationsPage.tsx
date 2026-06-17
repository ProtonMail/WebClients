import PrivateMainSettingsArea from '@proton/components/containers/layout/PrivateMainSettingsArea';
import type { SectionConfig } from '@proton/components/containers/layout/interface';
import { EmailSubscriptionSection } from '@proton/components/index';

import '../AccountSettings.scss';

interface Props {
    routeConfig: SectionConfig;
}
const NotificationsPage = ({ routeConfig }: Props) => {
    return (
        <PrivateMainSettingsArea config={routeConfig} mainAreaClass="lite-app-account-settings">
            <EmailSubscriptionSection toggleContainerClassName="gap-10" />
        </PrivateMainSettingsArea>
    );
};

export default NotificationsPage;
