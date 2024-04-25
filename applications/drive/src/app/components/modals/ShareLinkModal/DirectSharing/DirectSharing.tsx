import { useState } from 'react';

import { c } from 'ttag';

import ContactEmailsProvider from '@proton/components/containers/contacts/ContactEmailsProvider';
import { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/constants';

import { ShareInvitee, ShareMember, useShareMemberView } from '../../../../store';
import DirectSharingAutocomplete from './DirectSharingAutocomplete';
import DirectSharingListing from './DirectSharingListing';

interface Props {
    rootShareId: string;
    linkId: string;
    isDirectSharingWorkflow: boolean;
    onSubmit: () => void;
    onClose: () => void;
    onFocus: () => void;
}
const DirectSharing = ({ rootShareId, linkId, isDirectSharingWorkflow, onSubmit, onClose, onFocus }: Props) => {
    const {
        volumeId,
        members,
        invitations,
        isLoading,
        isAdding,
        addNewMembers,
        removeMember,
        updateMemberPermissions,
        removeInvitation,
        updateInvitePermissions,
    } = useShareMemberView(rootShareId, linkId);
    const [directSharingList, setDirectSharingList] = useState<ShareInvitee[]>(
        members.map((member) => ({
            email: member.email,
            name: member.email,
        }))
    );

    const handleSubmit = (invitees: ShareInvitee[]) => {
        setDirectSharingList([...directSharingList, ...invitees]);
        onSubmit();
    };

    const handlePermissionsChange = async (member: ShareMember, permissions: SHARE_MEMBER_PERMISSIONS) => {
        await updateMemberPermissions({ ...member, permissions });
    };

    const handleInvitationPermissionsChange = async (invitationId: string, permissions: SHARE_MEMBER_PERMISSIONS) => {
        await updateInvitePermissions(invitationId, permissions);
    };

    const handleMemberRemove = async (member: ShareMember) => {
        await removeMember(member);
    };

    const handleInvitationRemove = async (invitationId: string) => {
        await removeInvitation(invitationId);
    };

    return (
        <ContactEmailsProvider>
            <DirectSharingAutocomplete
                onClose={onClose}
                onFocus={onFocus}
                isAdding={isAdding}
                onSubmit={handleSubmit}
                members={members}
                hidden={!isDirectSharingWorkflow}
                addNewMembers={addNewMembers}
            />

            {!isDirectSharingWorkflow && (
                <>
                    <h2 className="text-lg text-semibold">{c('Info').t`Share with`}</h2>
                    <DirectSharingListing
                        volumeId={volumeId}
                        linkId={linkId}
                        isLoading={isLoading}
                        members={members}
                        invitations={invitations}
                        onPermissionsChange={handlePermissionsChange}
                        onMemberRemove={handleMemberRemove}
                        onInvitationRemove={handleInvitationRemove}
                        onInvitationPermissionsChange={handleInvitationPermissionsChange}
                    />
                </>
            )}
        </ContactEmailsProvider>
    );
};

export default DirectSharing;
