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
    linkId: string;
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
        <>
            <div className="flex flex-nowrap my-4 items-center" data-testid="share-owner">
                <div className="flex-1 flex flex-nowrap items-center gap-2">
                    <UserAvatar name={ownerName} className="shrink-0" />
                    <p className="flex-1 flex flex-column flex-nowrap p-0 m-0">
                        <span className="text-semibold">
                            {ownerName} {ownerIsCurrentUser && <>({c('Info').t`you`})</>}
                        </span>
                        {ownerDisplayName ? (
                            <span className="color-weak block max-w-full text-ellipsis" title={ownerEmail}>
                                {ownerEmail}
                            </span>
                        ) : null}
                    </p>
                </div>
                <div className="mx-2 shrink-0">{c('Info').t`Owner`}</div>
            </div>

            {sortedMembersWithName.map(({ member, displayName, displayEmail }) => {
                return (
                    <div
                        key={member.uid}
                        className="flex flex-nowrap my-4 justify-space-between items-center"
                        data-testid="share-members"
                    >
                        <div className="flex flex-nowrap items-center gap-2">
                            <UserAvatar name={displayName || displayEmail} />
                            <p className="flex flex-column p-0 m-0">
                                <span
                                    className="w-full text-semibold text-ellipsis"
                                    title={displayName ? undefined : displayEmail}
                                >
                                    {displayName ? displayName : displayEmail}
                                </span>
                                {displayName ? (
                                    <span className="w-full color-weak text-ellipsis" title={displayEmail}>
                                        {displayEmail}
                                    </span>
                                ) : null}
                            </p>
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
        </>
    );
};
