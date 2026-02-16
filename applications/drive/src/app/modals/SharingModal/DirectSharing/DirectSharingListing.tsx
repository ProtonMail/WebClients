import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { UserAvatar } from '@proton/atoms/UserAvatar/UserAvatar';
import { useSortedList } from '@proton/components';
import { NonProtonInvitationState } from '@proton/drive';
import { useContactEmails } from '@proton/mail/store/contactEmails/hooks';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { findUserAddress } from '@proton/shared/lib/helpers/address';

import type { DirectSharingRole } from '../interfaces';
import { type DirectMember, MemberType } from '../interfaces';
import { DirectSharingMemberMenu } from './DirectSharingMemberMenu';
import { getContactNameAndEmail } from './helpers/getContactNameAndEmail';

interface Props {
    ownerEmail?: string;
    ownerDisplayName?: string;
    members: DirectMember[];
    isLoading: boolean;
    onRemove: (email: string) => Promise<void>;
    onChangeRole: (email: string, role: DirectSharingRole) => Promise<void>;
    onResendInvitation: (invitationId: string) => Promise<void>;
    onCopyInvitationLink: (invitationId: string, email: string) => void;
    viewOnly: boolean;
}

export const DirectSharingListing = ({
    ownerEmail,
    ownerDisplayName,
    members,
    isLoading,
    onRemove,
    onChangeRole,
    onResendInvitation,
    onCopyInvitationLink,
    viewOnly,
}: Props) => {
    const [contactEmails] = useContactEmails();

    const [addresses] = useAddresses();
    const ownerIsCurrentUser = !!findUserAddress(ownerEmail, addresses);

    const membersWithName = members.map((member) => {
        const { contactName, contactEmail } = getContactNameAndEmail(member.inviteeEmail, contactEmails);
        return { member, displayName: contactName, displayEmail: contactEmail };
    });

    const { sortedList: sortedMembersWithName } = useSortedList(membersWithName, {
        key: 'displayName',
        direction: SORT_DIRECTION.ASC,
    });

    const ownerName = ownerDisplayName || ownerEmail || c('Label').t`Anonymous`;

    if (isLoading) {
        return <CircleLoader size="medium" className="mx-auto my-6 w-full" />;
    }

    return (
        <div className="flex flex-column flex-nowrap gap-4 overflow-auto" style={{ maxHeight: '14rem' }}>
            <div
                className="shrink-0 flex flex-nowrap justify-space-between items-center gap-2 w-full"
                data-testid="share-owner"
            >
                <div className="flex flex-nowrap flex-1 items-center gap-3">
                    <UserAvatar name={ownerName} />

                    <div className="flex flex-column flex-nowrap flex-1">
                        <div className="text-ellipsis">
                            {ownerName} {ownerIsCurrentUser && <>({c('Info').t`you`})</>}
                        </div>
                        {ownerDisplayName ? (
                            <div className="text-sm color-weak text-ellipsis" title={ownerEmail}>
                                {ownerEmail}
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="color-weak shrink-0 mr-2">{c('Info').t`owner`}</div>
            </div>

            {sortedMembersWithName.map(({ member, displayName, displayEmail }) => {
                return (
                    <div
                        key={member.uid}
                        // No gap here because button has padding
                        className="shrink-0 flex flex-nowrap justify-space-between items-center w-full"
                        data-testid="share-members"
                    >
                        <div className="flex flex-nowrap flex-1 items-center gap-3">
                            <UserAvatar name={displayName || displayEmail} />

                            <div className="flex flex-column flex-nowrap flex-1">
                                <div className="text-ellipsis">{displayName ? displayName : displayEmail}</div>
                                {displayName ? (
                                    <div className="text-sm color-weak text-ellipsis" title={displayEmail}>
                                        {displayEmail}
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <DirectSharingMemberMenu
                            disabled={viewOnly}
                            selectedRole={member.role}
                            onChangeRole={(newRole) => onChangeRole(member.inviteeEmail, newRole)}
                            externalInvitationState={member.state}
                            onResendInvitation={
                                member.type === MemberType.ProtonInvitation &&
                                (!member.state || member.state === NonProtonInvitationState.Pending)
                                    ? () => onResendInvitation(member.uid)
                                    : undefined
                            }
                            onCopyInvitationLink={
                                member.type === MemberType.ProtonInvitation
                                    ? () => onCopyInvitationLink(member.uid, member.inviteeEmail)
                                    : undefined
                            }
                            onRemoveAccess={() => onRemove(member.inviteeEmail)}
                        />
                    </div>
                );
            })}
        </div>
    );
};
