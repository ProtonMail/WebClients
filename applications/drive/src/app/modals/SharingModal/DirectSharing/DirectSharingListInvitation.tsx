import { UserAvatar } from '@proton/atoms';
import type { NonProtonInvitationState } from '@proton/drive-sdk';
import type { MemberRole } from '@proton/drive/index';
import useLoading from '@proton/hooks/useLoading';

import { RoleDropdownMenu } from '../RoleDropdownMenu';

interface Props {
    invitationUid: string;
    inviteeEmail: string;
    inviteeName?: string;
    externalInvitationState?: NonProtonInvitationState;
    selectedRole: MemberRole;
    onRemove: (email: string) => Promise<void>;
    onRoleChange: (email: string, role: MemberRole) => Promise<void>;
    onResendInvitation: (invitationUid: string) => Promise<void>;
    onCopyInvitationLink?: (invitationUid: string, email: string) => void;
    viewOnly: boolean;
}

export const DirectSharingListInvitation = ({
    invitationUid,
    inviteeEmail,
    inviteeName,
    selectedRole,
    externalInvitationState,
    onRemove,
    onRoleChange,
    onResendInvitation,
    onCopyInvitationLink,
    viewOnly,
}: Props) => {
    const [isLoading, withIsLoading] = useLoading(false);

    const handleInviteRemove = () => withIsLoading(onRemove(inviteeEmail));

    const handleInvitationRoleChange = (role: MemberRole) => withIsLoading(onRoleChange(inviteeEmail, role));

    const handleResendInvitationEmail = () => withIsLoading(onResendInvitation(invitationUid));

    return (
        <div className="flex flex-nowrap my-4 justify-space-between items-center" data-testid="share-members">
            <div className="flex flex-nowrap items-center gap-2">
                <UserAvatar name={inviteeName || inviteeEmail} />
                <p className="flex flex-column p-0 m-0">
                    <span className="w-full text-semibold text-ellipsis" title={inviteeName ? undefined : inviteeEmail}>
                        {inviteeName ? inviteeName : inviteeEmail}
                    </span>
                    {inviteeName ? (
                        <span className="w-full color-weak text-ellipsis" title={inviteeEmail}>
                            {inviteeEmail}
                        </span>
                    ) : null}
                </p>
            </div>
            <RoleDropdownMenu
                disabled={viewOnly}
                isLoading={isLoading}
                externalInvitationState={externalInvitationState}
                onChangeRole={handleInvitationRoleChange}
                selectedRole={selectedRole}
                onCopyInvitationLink={
                    onCopyInvitationLink ? () => onCopyInvitationLink(invitationUid, inviteeEmail) : undefined
                }
                onRemoveAccess={handleInviteRemove}
                onResendInvitationEmail={handleResendInvitationEmail}
            />
        </div>
    );
};
