import { useEffect } from 'react';

import { c } from 'ttag';

import { useModalState, useSettingsLink } from '@proton/components/components';
import usePendingUserInvitations from '@proton/components/hooks/usePendingUserInvitations';
import useUid from '@proton/components/hooks/useUid';
import { APPS, APP_NAMES, BRAND_NAME } from '@proton/shared/lib/constants';
import { UserInvitationModel } from '@proton/shared/lib/models';

import { useCache, useConfig, useOrganization } from '../../hooks';
import PendingInvitationModal from '../payments/subscription/PendingInvitationModal';
import TopBanner from './TopBanner';

const PendingInvitationTopBanner = () => {
    const cache = useCache();
    const protonConfig = useConfig();
    const [invites = []] = usePendingUserInvitations();
    const [organization] = useOrganization();
    const goToSettings = useSettingsLink();
    const [modalProps, setModal, render] = useModalState();
    const uid = useUid('pending-invitation-top-banner');

    const inviteLengths = invites.length;

    useEffect(() => {
        // Force refresh the invitations when the organization changes since this could cause errors in the invitations
        if (cache.get(UserInvitationModel.key) && organization) {
            cache.delete(UserInvitationModel.key);
        }
    }, [organization]);

    const allowedApps: APP_NAMES[] = [APPS.PROTONACCOUNT, APPS.PROTONCALENDAR, APPS.PROTONMAIL, APPS.PROTONDRIVE];
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

        goToSettings('/dashboard', APPS.PROTONACCOUNT);
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
