import { useMemo } from 'react';

import { c } from 'ttag';

import { Avatar, CircleLoader } from '@proton/atoms';
import { useContactEmails, useSortedList, useUser } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import type { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/constants';
import { canonicalizeEmailByGuess } from '@proton/shared/lib/helpers/email';
import { getInitials } from '@proton/shared/lib/helpers/string';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';

import type { ShareExternalInvitation, ShareInvitation, ShareMember } from '../../../../store';
import { DirectSharingListInvitation } from './DirectSharingListInvitation';
import { MemberDropdownMenu } from './MemberDropdownMenu';

interface Props {
    volumeId?: string;
    linkId: string;
    members: ShareMember[];
    invitations: ShareInvitation[];
    externalInvitations: ShareExternalInvitation[];
    isLoading: boolean;
    onPermissionsChange: (member: ShareMember, permission: SHARE_MEMBER_PERMISSIONS) => Promise<void>;
    onInvitationPermissionsChange: (invitationId: string, permission: SHARE_MEMBER_PERMISSIONS) => Promise<void>;
    onExternalInvitationPermissionsChange: (
        externalInvitationId: string,
        permission: SHARE_MEMBER_PERMISSIONS
    ) => Promise<void>;
    onMemberRemove: (member: ShareMember) => Promise<void>;
    onInvitationRemove: (invitationId: string) => Promise<void>;
    onExternalInvitationRemove: (externalInvitationId: string) => Promise<void>;
    onResendInvitationEmail: (invitationId: string) => Promise<void>;
    onResendExternalInvitationEmail: (externaInvitationId: string) => Promise<void>;
}

const getContactNameAndEmail = (email: string, contactEmails?: ContactEmail[]) => {
    const canonicalizedEmail = canonicalizeEmailByGuess(email);
    const { Name: contactName, Email: contactEmail } = contactEmails?.find(
        (contactEmail) => canonicalizeEmailByGuess(contactEmail.Email) === canonicalizedEmail
    ) || {
        Name: '',
        Email: email,
    };

    return {
        contactName,
        contactEmail,
    };
};

const MemberItem = ({
    member,
    contactName,
    contactEmail,
    onPermissionsChange,
    onMemberRemove,
}: {
    member: ShareMember;
    contactName?: string;
    contactEmail: string;
    onPermissionsChange: (member: ShareMember, permission: SHARE_MEMBER_PERMISSIONS) => Promise<void>;
    onMemberRemove: (member: ShareMember) => Promise<void>;
}) => {
    const [isLoading, withIsLoading] = useLoading(false);
    const { memberId, permissions } = member;
    const handlePermissionChange = (value: SHARE_MEMBER_PERMISSIONS) =>
        withIsLoading(onPermissionsChange(member, value));

    const handleMemberRemove = () => withIsLoading(onMemberRemove(member));

    return (
        <div
            key={memberId}
            className="flex my-4 justify-space-between items-center"
            data-testid="share-accepted-members"
        >
            <div className={'flex items-center'}>
                <Avatar color="weak" className="mr-2">
                    {getInitials(contactName || contactEmail)}
                </Avatar>
                <p className="flex flex-column p-0 m-0">
                    <span className="text-semibold">{contactName ? contactName : contactEmail}</span>
                    {contactName && <span className="color-weak">{contactEmail}</span>}
                </p>
            </div>
            <MemberDropdownMenu
                isLoading={isLoading}
                selectedPermissions={permissions}
                onChangePermissions={handlePermissionChange}
                onRemoveAccess={handleMemberRemove}
            />
        </div>
    );
};

export const DirectSharingListing = ({
    volumeId,
    linkId,
    members,
    invitations,
    externalInvitations,
    isLoading,
    onPermissionsChange,
    onMemberRemove,
    onInvitationRemove,
    onInvitationPermissionsChange,
    onExternalInvitationRemove,
    onExternalInvitationPermissionsChange,
    onResendInvitationEmail,
    onResendExternalInvitationEmail,
}: Props) => {
    const [user] = useUser();
    const [contactEmails] = useContactEmails();

    const displayName = user.DisplayName || user.Name;

    const membersWithName = useMemo(
        () =>
            members.map((member) => {
                const { contactName, contactEmail } = getContactNameAndEmail(member.email, contactEmails);
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
            <div className="flex my-4 justify-space-between items-center" data-testid="share-owner">
                <div className={'flex items-center'}>
                    <Avatar color="weak" className="mr-2">
                        {getInitials(displayName || user.Email)}
                    </Avatar>
                    <p className="flex flex-column p-0 m-0">
                        <span className="text-semibold">
                            {displayName} ({c('Info').t`you`})
                        </span>
                        <span className="color-weak">{user.Email}</span>
                    </p>
                </div>
                <div className="mr-8">{c('Info').t`Owner`}</div>
            </div>

            {volumeId &&
                externalInvitations.map((externalInvitation) => {
                    const { contactName, contactEmail } = getContactNameAndEmail(
                        externalInvitation.inviteeEmail,
                        contactEmails
                    );
                    return (
                        <DirectSharingListInvitation
                            key={externalInvitation.externalInvitationId}
                            invitationId={externalInvitation.externalInvitationId}
                            volumeId={volumeId}
                            linkId={linkId}
                            contactName={contactName}
                            contactEmail={contactEmail}
                            selectedPermissions={externalInvitation.permissions}
                            onInvitationRemove={onExternalInvitationRemove}
                            onInvitationPermissionsChange={onExternalInvitationPermissionsChange}
                            onResendInvitationEmail={onResendExternalInvitationEmail}
                            externalInvitationState={externalInvitation.state}
                        />
                    );
                })}
            {volumeId &&
                invitations.map((invitation) => {
                    const { contactName, contactEmail } = getContactNameAndEmail(
                        invitation.inviteeEmail,
                        contactEmails
                    );
                    return (
                        <DirectSharingListInvitation
                            key={invitation.invitationId}
                            invitationId={invitation.invitationId}
                            volumeId={volumeId}
                            linkId={linkId}
                            contactName={contactName}
                            contactEmail={contactEmail}
                            selectedPermissions={invitation.permissions}
                            onInvitationRemove={onInvitationRemove}
                            onInvitationPermissionsChange={onInvitationPermissionsChange}
                            onResendInvitationEmail={onResendInvitationEmail}
                        />
                    );
                })}

            {sortedMembersWithName.map(({ member, contactName, contactEmail }) => {
                return (
                    <MemberItem
                        key={member.memberId}
                        member={member}
                        contactName={contactName}
                        contactEmail={contactEmail}
                        onPermissionsChange={onPermissionsChange}
                        onMemberRemove={onMemberRemove}
                    />
                );
            })}
        </>
    );
};
