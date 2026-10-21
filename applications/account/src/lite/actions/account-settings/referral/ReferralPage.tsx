import { useEffect } from 'react';

import { fetchAvailableApps } from '@proton/account/availableApps';
import PrivateMainSettingsArea from '@proton/components/containers/layout/PrivateMainSettingsArea';
import type { SectionConfig } from '@proton/components/containers/layout/interface';
import { SettingsLayoutVariant } from '@proton/components/containers/layout/interface';
import { ReferralInvitesContextProvider } from '@proton/components/containers/referral/ReferralInvitesContext';
import ReferralPageTelemetry from '@proton/components/containers/referral/components/ReferralPageTelemetry';
import { InviteSection } from '@proton/components/containers/referral/invite/InviteSection';
import { RewardSection } from '@proton/components/containers/referral/rewards/RewardSection';
import noop from '@proton/utils/noop';

import { useAccountDispatch } from '../../../../app/store/hooks';

import '../AccountSettings.scss';

interface Props {
    routeConfig: SectionConfig;
}
const ReferralPage = ({ routeConfig }: Props) => {
    const dispatch = useAccountDispatch();

    useEffect(() => {
        // For ReferralSignatureToggle, which only shows with Mail among them. Lite doesn't bootstrap, which is where
        // the other apps get them. On failure, there are none.
        dispatch(fetchAvailableApps()).catch(noop);
    }, []);

    return (
        <ReferralInvitesContextProvider>
            <ReferralPageTelemetry />
            <PrivateMainSettingsArea
                config={routeConfig}
                variant={SettingsLayoutVariant.Mobile}
                mainAreaClass="lite-app-account-settings bg-lowered"
            >
                <InviteSection />
                <RewardSection />
            </PrivateMainSettingsArea>
        </ReferralInvitesContextProvider>
    );
};

export default ReferralPage;
