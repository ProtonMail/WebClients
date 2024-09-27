import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useGetUserInvitations } from '@proton/account/userInvitations/hooks';
import { Button } from '@proton/atoms';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import useUid from '@proton/components/hooks/useUid';
import { CacheType } from '@proton/redux-utilities';
import type { PendingInvitation } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import PendingInvitationModal from '../PendingInvitationModal';

interface Props {
    invites: PendingInvitation[];
}

const PendingInvitationPanel = ({ invites }: Props) => {
    const [selectedInvitation, setSelectedInvitation] = useState<PendingInvitation>();
    const [invitationModal, setInvitationModal, renderInvitationModal] = useModalState();
    const uid = useUid('pending-invitation-dashboard');
    const getUserInvitations = useGetUserInvitations();

    useEffect(() => {
        // Force refresh the invitations when user navigates back to the dashboard
        getUserInvitations({ cache: CacheType.None }).catch(noop);
    }, []);

    const handleInvitationClick = (invitation: PendingInvitation) => {
        setSelectedInvitation(invitation);
        setInvitationModal(true);
    };

    if (invites.length === 0) {
        return null;
    }

    return (
        <>
            <div className="border rounded px-6 py-5" data-testid="pending-invitations-panel">
                <div className="flex">
                    <h3 className="text-lg mb-6">
                        <strong>
                            {invites.length === 1
                                ? c('familyOffer_2023:Family plan').t`Pending invitation`
                                : c('familyOffer_2023:Family plan').t`Pending invitations`}
                        </strong>
                    </h3>
                    {invites && (
                        <section className="w-full border-top border-weak">
                            {invites.map((invitation) => (
                                <div key={invitation.ID} className="border-bottom border-weak py-2">
                                    <div>{c('familyOffer_2023:Family plan')
                                        .t`Invitation from ${invitation.OrganizationName}`}</div>
                                    <Button
                                        className="p-0"
                                        shape="underline"
                                        color="norm"
                                        onClick={() => handleInvitationClick(invitation)}
                                    >{c('familyOffer_2023:Action').t`View invitation`}</Button>
                                </div>
                            ))}
                        </section>
                    )}
                </div>
            </div>

            {selectedInvitation && renderInvitationModal && (
                <PendingInvitationModal invite={selectedInvitation} {...invitationModal} key={uid} />
            )}
        </>
    );
};

export default PendingInvitationPanel;
