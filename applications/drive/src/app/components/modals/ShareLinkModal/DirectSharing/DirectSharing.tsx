import { useState } from 'react';

import { c } from 'ttag';

import ContactEmailsProvider from '@proton/components/containers/contacts/ContactEmailsProvider';

import { ShareInvitee, useShareMemberView } from '../../../../store';
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
    const { volumeId, members, invitations, isLoading, isAdding, addNewMembers } = useShareMemberView(
        rootShareId,
        linkId
    );
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
                    />
                </>
            )}
        </ContactEmailsProvider>
    );
};

export default DirectSharing;
