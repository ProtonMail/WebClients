import { c } from 'ttag';

import { CircleLoader, UserAvatar } from '@proton/atoms';
import { useSortedList } from '@proton/components';
import { type MemberRole } from '@proton/drive/index';
import useLoading from '@proton/hooks/useLoading';
import { useContactEmails } from '@proton/mail/store/contactEmails/hooks';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { RoleDropdownMenu } from '../RoleDropdownMenu';
import { type DirectMember, MemberType } from '../interfaces';
import { getContactNameAndEmail } from './helpers/getContactNameAndEmail';

interface Props {
    linkId: string;
    ownerEmail?: string;
    ownerDisplayName?: string;
    members: DirectMember[];
    isLoading: boolean;
    onRemove: (email: string) => Promise<void>;
    onChangeRole: (email: string, role: MemberRole) => Promise<void>;
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
    const [isActionLoading, withActionLoading] = useLoading(false);

    const membersWithName = members.map((member) => {
        const { contactName, contactEmail } = getContactNameAndEmail(member.inviteeEmail, contactEmails);
        return { member, displayName: contactName, displayEmail: contactEmail };
    });

    const { sortedList: sortedMembersWithName } = useSortedList(membersWithName, {
        key: 'displayName',
        direction: SORT_DIRECTION.ASC,
    });

    if (isLoading) {
        return <CircleLoader size="medium" className="mx-auto my-6 w-full" />;
    }
    return (
        <>
            <div className="flex flex-nowrap my-4 items-center" data-testid="share-owner">
                <div className="flex-1 flex flex-nowrap items-center gap-2">
                    <UserAvatar name={ownerDisplayName || ownerEmail} className="shrink-0" />
                    <p className="flex-1 flex flex-column flex-nowrap p-0 m-0">
                        <span className="text-semibold">
                            {ownerDisplayName} ({c('Info').t`you`})
                        </span>
                        <span className="color-weak block max-w-full text-ellipsis" title={ownerEmail}>
                            {ownerEmail}
                        </span>
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
                        <RoleDropdownMenu
                            disabled={viewOnly}
                            isLoading={isActionLoading}
                            externalInvitationState={member.state}
                            onChangeRole={(newRole: MemberRole) =>
                                withActionLoading(onChangeRole(member.inviteeEmail, newRole))
                            }
                            selectedRole={member.role}
                            onCopyInvitationLink={
                                member.type === MemberType.ProtonInvitation
                                    ? () => onCopyInvitationLink(member.uid, member.inviteeEmail)
                                    : undefined
                            }
                            onRemoveAccess={() => withActionLoading(onRemove(member.inviteeEmail))}
                            onResendInvitationEmail={
                                member.type === MemberType.ProtonInvitation
                                    ? () => withActionLoading(onResendInvitation(member.uid))
                                    : undefined
                            }
                        />
                    </div>
                );
            })}
        </>
    );
};
