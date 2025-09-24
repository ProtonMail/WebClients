import { c } from 'ttag';

import { ReferralInvitesContextProvider } from '@proton/components/containers/referral/ReferralInvitesContext';
import Explanation from '@proton/components/containers/referral/drawer/Explanation';
import FAQ from '@proton/components/containers/referral/drawer/Faq';
import { FriendsSection } from '@proton/components/containers/referral/drawer/FriendsSection';
import InviteShareLink from '@proton/components/containers/referral/drawer/InviteShareLink';

import type { SelectedDrawerOption } from '../DrawerView';
import DrawerView from '../DrawerView';
import DrawerAppScrollContainer from '../shared/DrawerAppScrollContainer';

const DrawerReferralView = () => {
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
                </DrawerAppScrollContainer>
            </DrawerView>
        </ReferralInvitesContextProvider>
    );
};

export default DrawerReferralView;
