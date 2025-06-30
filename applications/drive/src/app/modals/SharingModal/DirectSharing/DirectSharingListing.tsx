import { useMemo } from 'react';

import { c } from 'ttag';

import { CircleLoader, UserAvatar } from '@proton/atoms';
import { useSortedList } from '@proton/components';
import { type Member, type MemberRole, type NonProtonInvitation, type ProtonInvitation } from '@proton/drive/index';
import useLoading from '@proton/hooks/useLoading';
import { useContactEmails } from '@proton/mail/store/contactEmails/hooks';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { useDriveSharingFlags } from '../../../store';
import { RoleDropdownMenu } from '../RoleDropdownMenu';
import { getContactNameAndEmail } from '../helpers/getContactNameAndEmail';
import { DirectSharingListInvitation } from './DirectSharingListInvitation';

interface Props {
    volumeId?: string;
    linkId: string;
    ownerEmail?: string;
    ownerDisplayName?: string;
    members: Member[];
    protonInvitations: ProtonInvitation[];
    nonProtonInvitations: NonProtonInvitation[];
    isLoading: boolean;
    onRemove: (email: string) => Promise<void>;
    onRoleChange: (email: string, role: MemberRole) => Promise<void>;
    onResendInvitation: (invitationId: string) => Promise<void>;
    onCopyInvitationLink: (invitationId: string, email: string) => void;
    viewOnly: boolean;
}

const MemberItem = ({
    member,
    contactName,
    contactEmail,
    onRoleChange,
    onRemove,
}: {
    member: Member;
    contactName?: string;
    contactEmail: string;
    onRoleChange: (email: string, role: MemberRole) => Promise<void>;
    onRemove: (email: string) => Promise<void>;
}) => {
    const { isDirectSharingDisabled } = useDriveSharingFlags();
    const [isLoading, withIsLoading] = useLoading(false);
    const { uid, role } = member;
    const handleRoleChange = (value: MemberRole) => withIsLoading(onRoleChange(contactEmail, value));

    const handleMemberRemove = () => withIsLoading(onRemove(contactEmail));

    return (
        <div key={uid} className="flex my-4 justify-space-between items-center" data-testid="share-accepted-members">
            <div className="flex items-center gap-2">
                <UserAvatar name={contactName || contactEmail} />
                <p className="flex flex-column p-0 m-0">
                    <span className="text-semibold">{contactName ? contactName : contactEmail}</span>
                    {contactName && <span className="color-weak">{contactEmail}</span>}
                </p>
            </div>
            <RoleDropdownMenu
                disabled={isDirectSharingDisabled}
                isLoading={isLoading}
                selectedRole={role}
                onChangeRole={handleRoleChange}
                onRemoveAccess={handleMemberRemove}
            />
        </div>
    );
};

export const DirectSharingListing = ({
    volumeId,
    ownerEmail,
    ownerDisplayName,
    members,
    protonInvitations,
    nonProtonInvitations,
    isLoading,
    onRemove,
    onRoleChange,
    onResendInvitation,
    onCopyInvitationLink,
    viewOnly,
}: Props) => {
    const [contactEmails] = useContactEmails();
    const membersWithName = useMemo(
        () =>
            members.map((member) => {
                const { contactName, contactEmail } = getContactNameAndEmail(member.inviteeEmail, contactEmails);
                return { member, contactName, contactEmail };
            }),
        [members, contactEmails]
    );
    const { sortedList: sortedMembersWithName } = useSortedList(membersWithName, {
        key: 'contactName',
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

            {volumeId &&
                nonProtonInvitations.map((nonProtonInvitation) => {
                    const { contactName, contactEmail } = getContactNameAndEmail(
                        nonProtonInvitation.inviteeEmail,
                        contactEmails
                    );
                    return (
                        <DirectSharingListInvitation
                            viewOnly={viewOnly}
                            key={nonProtonInvitation.uid}
                            invitationUid={nonProtonInvitation.uid}
                            inviteeName={contactName}
                            inviteeEmail={contactEmail}
                            selectedRole={nonProtonInvitation.role}
                            onRemove={onRemove}
                            onRoleChange={onRoleChange}
                            onResendInvitation={onResendInvitation}
                            externalInvitationState={nonProtonInvitation.state}
                        />
                    );
                })}
            {volumeId &&
                protonInvitations.map((protonInvitation) => {
                    const { contactName, contactEmail } = getContactNameAndEmail(
                        protonInvitation.inviteeEmail,
                        contactEmails
                    );
                    return (
                        <DirectSharingListInvitation
                            viewOnly={viewOnly}
                            key={protonInvitation.uid}
                            invitationUid={protonInvitation.uid}
                            inviteeName={contactName}
                            inviteeEmail={contactEmail}
                            selectedRole={protonInvitation.role}
                            onRemove={onRemove}
                            onRoleChange={onRoleChange}
                            onResendInvitation={onResendInvitation}
                            onCopyInvitationLink={onCopyInvitationLink}
                        />
                    );
                })}

            {sortedMembersWithName.map(({ member, contactName, contactEmail }) => {
                return (
                    <MemberItem
                        key={member.uid}
                        member={member}
                        contactName={contactName}
                        contactEmail={contactEmail}
                        onRemove={onRemove}
                        onRoleChange={onRoleChange}
                    />
                );
            })}
        </>
    );
};
