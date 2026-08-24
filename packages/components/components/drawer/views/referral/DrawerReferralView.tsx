import { useEffect } from 'react';

import { c } from 'ttag';

import { ReferralInvitesContextProvider } from '../../../../containers/referral/ReferralInvitesContext';
import Explanation from '../../../../containers/referral/drawer/Explanation';
import FAQ from '../../../../containers/referral/drawer/Faq';
import Footer from '../../../../containers/referral/drawer/Footer';
import { FriendsSection } from '../../../../containers/referral/drawer/FriendsSection';
import InviteShareLink from '../../../../containers/referral/drawer/InviteShareLink';
import { useReferralTelemetry } from '../../../../containers/referral/hooks/useReferralTelemetry';
import type { SelectedDrawerOption } from '../DrawerView';
import DrawerView from '../DrawerView';
import DrawerAppScrollContainer from '../shared/DrawerAppScrollContainer';

const DrawerReferralView = () => {
    const { sendDrawerAppView } = useReferralTelemetry();

    useEffect(() => {
        sendDrawerAppView();
    }, [sendDrawerAppView]);

    const tab: SelectedDrawerOption = {
        text: c('Referral').t`Invite friends. Get credits.`,
        value: 'referral',
        backgroundClass: 'bg-lowered',
    };

    return (
        <ReferralInvitesContextProvider>
            <DrawerView tab={tab} id="drawer-app-referral" className="drawer-referral-view bg-lowered">
                <DrawerAppScrollContainer>
                    <Explanation />
                    <InviteShareLink />
                    <FriendsSection />
                    <FAQ />
                    <Footer />
                </DrawerAppScrollContainer>
            </DrawerView>
        </ReferralInvitesContextProvider>
    );
};

export default DrawerReferralView;
