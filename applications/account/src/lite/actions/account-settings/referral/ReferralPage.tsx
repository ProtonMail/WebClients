import PrivateMainSettingsArea from '@proton/components/containers/layout/PrivateMainSettingsArea';
import type { SectionConfig } from '@proton/components/containers/layout/interface';
import { SettingsLayoutVariant } from '@proton/components/containers/layout/interface';
import { ReferralInvitesContextProvider } from '@proton/components/containers/referral/ReferralInvitesContext';
import ReferralPageTelemetry from '@proton/components/containers/referral/components/ReferralPageTelemetry';
import { InviteSection } from '@proton/components/containers/referral/invite/InviteSection';
import { RewardSection } from '@proton/components/containers/referral/rewards/RewardSection';

import '../AccountSettings.scss';

interface Props {
    routeConfig: SectionConfig;
}
const ReferralPage = ({ routeConfig }: Props) => {
    return (
        <ReferralInvitesContextProvider>
            <ReferralPageTelemetry />
            <PrivateMainSettingsArea
                config={routeConfig}
                variant={SettingsLayoutVariant.Mobile}
                mainAreaClass="lite-app-account-settings"
            >
                <InviteSection />
                <RewardSection />
            </PrivateMainSettingsArea>
        </ReferralInvitesContextProvider>
    );
};

export default ReferralPage;
