import { c } from 'ttag';

import { Avatar, CircleLoader } from '@proton/atoms';
import { useContactEmails, useUser } from '@proton/components/hooks';
import { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/constants';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { getInitials } from '@proton/shared/lib/helpers/string';

import { ShareInvitation, ShareMember } from '../../../../store';
import { DirectSharingListInvitation } from './DirectSharingListInvitation';
import MemberPermissionsSelect from './MemberPermissionsSelect';

interface Props {
    volumeId?: string;
    linkId: string;
    members: ShareMember[];
    invitations: ShareInvitation[];
    isLoading: boolean;
    onPermissionsChange: (member: ShareMember, permission: SHARE_MEMBER_PERMISSIONS) => void;
    onMemberRemove: (member: ShareMember) => void;
    onInvitationRemove: (invitationId: string) => void;
}

const MemberItem = ({
    member,
    onPermissionsChange,
    onMemberRemove,
}: {
    member: ShareMember;
    onPermissionsChange: (member: ShareMember, permission: SHARE_MEMBER_PERMISSIONS) => void;
    onMemberRemove: (member: ShareMember) => void;
}) => {
    const [contactEmails] = useContactEmails();
    const { email, memberId, permissions } = member;
    const { Name: contactName, Email: contactEmail } = contactEmails?.find(
        (contactEmail) => contactEmail.Email === canonicalizeInternalEmail(email)
    ) || {
        Name: '',
        Email: email,
    };

    const handlePermissionChange = (value: SHARE_MEMBER_PERMISSIONS) => {
        onPermissionsChange(member, value);
    };

    const handleMemberRemove = () => {
        onMemberRemove(member);
    };

    return (
        <div key={memberId} className="flex my-4 justify-space-between items-center">
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

const DirectSharingListing = ({
    volumeId,
    linkId,
    members,
    invitations,
    isLoading,
    onPermissionsChange,
    onMemberRemove,
    onInvitationRemove,
}: Props) => {
    const [contactEmails] = useContactEmails();

    const [user] = useUser();

    const getContactNameAndEmail = (email: string) => {
        const { Name: contactName, Email: contactEmail } = contactEmails?.find(
            (contactEmail) => contactEmail.Email === canonicalizeInternalEmail(email)
        ) || {
            Name: '',
            Email: email,
        };

        return {
            contactName,
            contactEmail,
        };
    };

    if (isLoading) {
        return <CircleLoader size="medium" className="mx-auto my-6 w-full" />;
    }
    return (
        <>
            <div className="flex my-4 justify-space-between items-center">
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
                    const { contactName, contactEmail } = getContactNameAndEmail(invitation.inviteeEmail);
                    return (
                        <DirectSharingListInvitation
                            key={invitation.invitationId}
                            invitationId={invitation.invitationId}
                            volumeId={volumeId}
                            linkId={linkId}
                            contactName={contactName}
                            contactEmail={contactEmail}
                            onInvitationRemove={onInvitationRemove}
                        />
                    );
                })}

            {members.map((member) => (
                <MemberItem
                    key={member.memberId}
                    member={member}
                    onPermissionsChange={onPermissionsChange}
                    onMemberRemove={onMemberRemove}
                />
            ))}
        </>
    );
};

export default DirectSharingListing;
