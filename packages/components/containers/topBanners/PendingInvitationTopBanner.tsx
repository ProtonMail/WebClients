import { c } from 'ttag';

import useSettingsLink from '@proton/components/components/link/useSettingsLink';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import useUid from '@proton/components/hooks/useUid';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';

import { useConfig, usePendingUserInvitations } from '../../hooks';
import PendingInvitationModal from '../payments/subscription/PendingInvitationModal';
import TopBanner from './TopBanner';

const allowedApps: APP_NAMES[] = [APPS.PROTONACCOUNT, APPS.PROTONCALENDAR, APPS.PROTONMAIL, APPS.PROTONDRIVE];
const PendingInvitationTopBanner = () => {
    const protonConfig = useConfig();
    const [invites = []] = usePendingUserInvitations();
    const goToSettings = useSettingsLink();
    const [modalProps, setModal, render] = useModalState();
    const uid = useUid('pending-invitation-top-banner');

    const inviteLengths = invites.length;

    if (!allowedApps.includes(protonConfig.APP_NAME)) {
        return null;
    }

    if (inviteLengths === 0) {
        return null;
    }

    const handleTopBannerClick = () => {
        if (inviteLengths === 1) {
            setModal(true);
            return;
        }

        goToSettings('/dashboard#your-plan');
    };

    const viewInviteButton = (
        <button
            key="view-invitation"
            className="link align-baseline text-left"
            type="button"
            onClick={handleTopBannerClick}
        >
            {inviteLengths === 1
                ? c('familyOffer_2023:Action').t`View the invitation`
                : c('familyOffer_2023:Action').t`View the invitations`}
        </button>
    );

    const bannerOrganization =
        inviteLengths === 1 ? invites[0].OrganizationName : c('familyOffer_2023:Family plan').t`${BRAND_NAME} groups`;

    return (
        <>
            {/* translator: The text will display "You have been invited to join" then either the org name if one invite or "Family plan" if multiple invites. Finally, a button will open the modal of one invite or redirect to the dashboard if several, the buttons say "View the invitation" with invitations if multiple invites */}
            <TopBanner className="bg-info">{c('familyOffer_2023:Family plan')
                .jt`You have been invited to join ${bannerOrganization}. ${viewInviteButton}`}</TopBanner>
            {render && <PendingInvitationModal invite={invites[0]} {...modalProps} key={uid} />}
        </>
    );
};

export default PendingInvitationTopBanner;
