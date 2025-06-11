import { useMemo } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { CircleLoader, UserAvatar } from '@proton/atoms';
import { useSortedList } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { useContactEmails } from '@proton/mail/store/contactEmails/hooks';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import type { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/permissions';
import { canonicalizeEmailByGuess } from '@proton/shared/lib/helpers/email';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';

import {
    type ShareExternalInvitation,
    type ShareInvitation,
    type ShareMember,
    useDriveSharingFlags,
} from '../../../../store';
import { PermissionsDropdownMenu } from '../PermissionsDropdownMenu';
import { DirectSharingListInvitation } from './DirectSharingListInvitation';

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
    viewOnly: boolean;
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
    const { isDirectSharingDisabled } = useDriveSharingFlags();
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
            <div className="flex items-center gap-2">
                <UserAvatar name={contactName || contactEmail} />
                <p className="flex flex-column p-0 m-0">
                    <span className="text-semibold">{contactName ? contactName : contactEmail}</span>
                    {contactName && <span className="color-weak">{contactEmail}</span>}
                </p>
            </div>
            <PermissionsDropdownMenu
                disabled={isDirectSharingDisabled}
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
    viewOnly,
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
            <div className="flex flex-nowrap my-4 items-center" data-testid="share-owner">
                <div className="flex-1 flex flex-nowrap items-center gap-2">
                    <UserAvatar name={displayName || user.Email} className="shrink-0" />
                    <p className="flex-1 flex flex-column flex-nowrap p-0 m-0">
                        <span className="text-semibold">
                            {displayName} ({c('Info').t`you`})
                        </span>
                        <span className="color-weak block max-w-full text-ellipsis" title={user.Email}>
                            {user.Email}
                        </span>
                    </p>
                </div>
                <div className="mx-2 shrink-0">{c('Info').t`Owner`}</div>
            </div>

            {volumeId &&
                externalInvitations.map((externalInvitation) => {
                    const { contactName, contactEmail } = getContactNameAndEmail(
                        externalInvitation.inviteeEmail,
                        contactEmails
                    );
                    return (
                        <DirectSharingListInvitation
                            viewOnly={viewOnly}
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
                            viewOnly={viewOnly}
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
