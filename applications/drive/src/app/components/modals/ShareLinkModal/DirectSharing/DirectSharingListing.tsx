import { c } from 'ttag';

import { Avatar, CircleLoader } from '@proton/atoms';
import { useContactEmails, useUser } from '@proton/components/hooks';
import { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/constants';
import { canonicalizeEmailByGuess } from '@proton/shared/lib/helpers/email';
import { getInitials } from '@proton/shared/lib/helpers/string';
import { ContactEmail } from '@proton/shared/lib/interfaces/contacts';

import { ShareInvitation, ShareMember } from '../../../../store';
import { DirectSharingListInvitation } from './DirectSharingListInvitation';
import MemberPermissionsSelect from './MemberPermissionsSelect';

interface Props {
    volumeId?: string;
    linkId: string;
    members: ShareMember[];
    invitations: ShareInvitation[];
    isLoading: boolean;
    onPermissionsChange: (member: ShareMember, permission: SHARE_MEMBER_PERMISSIONS) => Promise<void>;
    onInvitationPermissionsChange: (invitationId: string, permission: SHARE_MEMBER_PERMISSIONS) => Promise<void>;
    onMemberRemove: (member: ShareMember) => void;
    onInvitationRemove: (invitationId: string) => void;
    onResendInvitationEmail: (invitationId: string) => Promise<void>;
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
    onMemberRemove: (member: ShareMember) => void;
}) => {
    const { memberId, permissions } = member;
    const handlePermissionChange = (value: SHARE_MEMBER_PERMISSIONS) => onPermissionsChange(member, value);

    const handleMemberRemove = () => {
        onMemberRemove(member);
    };

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
            <MemberPermissionsSelect
                selectedPermissions={permissions}
                onChange={handlePermissionChange}
                onRemove={handleMemberRemove}
            />
        </div>
    );
};

export const DirectSharingListing = ({
    volumeId,
    linkId,
    members,
    invitations,
    isLoading,
    onPermissionsChange,
    onMemberRemove,
    onInvitationRemove,
    onInvitationPermissionsChange,
    onResendInvitationEmail,
}: Props) => {
    const [user] = useUser();
    const [contactEmails] = useContactEmails();

    if (isLoading) {
        return <CircleLoader size="medium" className="mx-auto my-6 w-full" />;
    }
    return (
        <>
            <div className="flex my-4 justify-space-between items-center" data-testid="share-owner">
                <div className={'flex items-center'}>
                    <Avatar color="weak" className="mr-2">
                        {getInitials(user.DisplayName)}
                    </Avatar>
                    <p className="flex flex-column p-0 m-0">
                        <span className="text-semibold">
                            {user.DisplayName} ({c('Info').t`you`})
                        </span>
                        <span className="color-weak">{user.Email}</span>
                    </p>
                </div>
                <div className="mr-8">{c('Info').t`Owner`}</div>
            </div>

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

            {members.map((member) => {
                const { contactName, contactEmail } = getContactNameAndEmail(member.email, contactEmails);
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
