import { useEffect, useState } from 'react';

import { c } from 'ttag';

import ContactEmailsProvider from '@proton/components/containers/contacts/ContactEmailsProvider';
import { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/constants';

import { ShareInvitee, ShareMember, useShareMemberView } from '../../../../store';
import DirectSharingAutocomplete from './DirectSharingAutocomplete';
import DirectSharingListing from './DirectSharingListing';
import { useShareInvitees } from './useShareInvitees';

interface Props {
    rootShareId: string;
    linkId: string;
    onInviteeCountChange: (inviteeCount: number) => void;
    isInvitationWorkflow: boolean;
}
const DirectSharing = ({ rootShareId, linkId, onInviteeCountChange, isInvitationWorkflow }: Props) => {
    const {
        volumeId,
        members,
        invitations,
        existingEmails,
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
    const { invitees, add: addInvitee, remove: removeInvitee, clean: cleanInvitees } = useShareInvitees(existingEmails);

    const handleSubmit = async (invitees: ShareInvitee[], selectedPermissions: SHARE_MEMBER_PERMISSIONS) => {
        setDirectSharingList([...directSharingList, ...invitees]);
        await addNewMembers(invitees, selectedPermissions);
        cleanInvitees();
    };

    const handleCancel = () => {
        cleanInvitees();
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

    useEffect(() => {
        onInviteeCountChange(invitees.length);
    }, [invitees.length]);

    return (
        <ContactEmailsProvider>
            <DirectSharingAutocomplete
                onCancel={handleCancel}
                isAdding={isAdding}
                onSubmit={handleSubmit}
                existingEmails={existingEmails}
                invitees={invitees}
                onAdd={addInvitee}
                onRemove={removeInvitee}
                hideFormActions={!isInvitationWorkflow}
            />

            {!isInvitationWorkflow && (
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
