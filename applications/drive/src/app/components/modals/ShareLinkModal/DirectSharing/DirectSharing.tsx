import { useState } from 'react';

import { c } from 'ttag';

import ContactEmailsProvider from '@proton/components/containers/contacts/ContactEmailsProvider';

import { ShareInvitee, useShareMemberView } from '../../../../store';
import DirectSharingAutocomplete from './DirectSharingAutocomplete';
import DirectSharingListing from './DirectSharingListing';

interface Props {
    shareId: string;
    linkId: string;
    isDirectSharingWorkflow: boolean;
    onSubmit: () => void;
    onClose: () => void;
    onFocus: () => void;
}
const DirectSharing = ({ shareId, linkId, isDirectSharingWorkflow, onSubmit, onClose, onFocus }: Props) => {
    const { members, isLoading, isAdding, isDeleting, addNewMember, removeMember } = useShareMemberView(
        shareId,
        linkId
    );
    const [directSharingList, setDirectSharingList] = useState<ShareInvitee[]>(
        members.map((member) => ({
            email: member.inviter,
            name: member.inviter,
        }))
    );

    const handleSubmit = (invitees: ShareInvitee[]) => {
        setDirectSharingList([...directSharingList, ...invitees]);
        onSubmit();
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
                addNewMember={addNewMember}
            />

            {!isDirectSharingWorkflow && (
                <>
                    <h2 className="text-lg text-semibold">{c('Info').t`Share with`}</h2>
                    <DirectSharingListing
                        isLoading={isLoading}
                        members={members}
                        removeMember={removeMember}
                        isDeleting={isDeleting}
                    />
                </>
            )}
        </ContactEmailsProvider>
    );
};

export default DirectSharing;
