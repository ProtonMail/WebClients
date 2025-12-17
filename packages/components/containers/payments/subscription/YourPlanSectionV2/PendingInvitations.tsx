import { useState } from 'react';

import { c, msgid } from 'ttag';

import { useUserInvitations } from '@proton/account/userInvitations/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { DashboardCard, DashboardCardContent } from '@proton/atoms/DashboardCard/DashboardCard';
import { DashboardGrid, DashboardGridSectionHeader } from '@proton/atoms/DashboardGrid/DashboardGrid';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import PendingInvitationModal from '@proton/components/containers/payments/subscription/PendingInvitationModal';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useUid from '@proton/components/hooks/useUid';
import { IcChevronDownFilled } from '@proton/icons/icons/IcChevronDownFilled';
import { IcChevronUpFilled } from '@proton/icons/icons/IcChevronUpFilled';
import type { PendingInvitation } from '@proton/shared/lib/interfaces';

import pendingInvitationIcon from './icons/pending-invitation.svg';

interface InvitationCardProps {
    invite: PendingInvitation;
    onViewInvitation: (invite: PendingInvitation) => void;
}
const InvitationCard = ({ invite, onViewInvitation }: InvitationCardProps) => {
    return (
        <div className="p-6 flex gap-4 justify-space-between items-center">
            <div className="flex gap-4">
                <figure className="w-custom rounded overflow-hidden ratio-square" style={{ '--w-custom': '2.75rem' }}>
                    <img src={pendingInvitationIcon} alt="" className="w-full" />
                </figure>
                <div className="flex flex-column gap-0.5">
                    <strong className="text-semibold text-lg">{c('familyOffer_2023:Family plan')
                        .t`You're invited to join ${invite.OrganizationName}`}</strong>
                    <p className="m-0">
                        {getBoldFormattedText(
                            c('familyOffer_2023:Family plan')
                                .t`You're invited by **${invite.InviterEmail}** to link your account to this group plan.`
                        )}
                    </p>
                </div>
            </div>
            <Button shape="outline" color="norm" onClick={() => onViewInvitation(invite)}>{c('familyOffer_2023:Action')
                .t`View invitation`}</Button>
        </div>
    );
};

const MAX_DEFAULT_VISIBLE_INVITES = 3;

const PendingInvitations = () => {
    const [showAllInvites, setShowAllInvites] = useState(false);
    const [selectedInvitation, setSelectedInvitation] = useState<PendingInvitation>();
    const [invitationModal, setInvitationModal, renderInvitationModal] = useModalState();
    const [invites = []] = useUserInvitations();
    const uid = useUid('pending-invitation-dashboard');

    const visibleInvites =
        showAllInvites || invites.length <= MAX_DEFAULT_VISIBLE_INVITES
            ? invites
            : invites.slice(0, MAX_DEFAULT_VISIBLE_INVITES);

    const handleInvitationClick = (invite: PendingInvitation) => {
        setSelectedInvitation(invite);
        setInvitationModal(true);
    };

    return (
        <>
            <DashboardGrid>
                <DashboardGridSectionHeader
                    title={c('familyOffer_2023:Family plan').ngettext(
                        msgid`Pending invitation`,
                        `Pending invitations`,
                        invites.length
                    )}
                />
                <DashboardCard>
                    <DashboardCardContent paddingClass="p-0" className="flex flex-column divide-y divide-weak">
                        {visibleInvites.map((invite) => (
                            <InvitationCard key={invite.ID} invite={invite} onViewInvitation={handleInvitationClick} />
                        ))}
                        {invites.length > MAX_DEFAULT_VISIBLE_INVITES && (
                            <div className="py-4 px-4">
                                <Button shape="ghost" color="norm" onClick={() => setShowAllInvites(!showAllInvites)}>
                                    {showAllInvites ? (
                                        <IcChevronUpFilled className="mr-2" />
                                    ) : (
                                        <IcChevronDownFilled className="mr-2" />
                                    )}
                                    {showAllInvites
                                        ? c('familyOffer_2023:Action').t`Show less`
                                        : c('familyOffer_2023:Action').t`Show all (${invites.length})`}
                                </Button>
                            </div>
                        )}
                    </DashboardCardContent>
                </DashboardCard>
            </DashboardGrid>
            {selectedInvitation && renderInvitationModal && (
                <PendingInvitationModal invite={selectedInvitation} {...invitationModal} key={uid} />
            )}
        </>
    );
};

export default PendingInvitations;
