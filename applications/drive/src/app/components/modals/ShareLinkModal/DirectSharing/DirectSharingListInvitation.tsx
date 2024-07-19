import { useCallback } from 'react';

import { c } from 'ttag';

import { Avatar } from '@proton/atoms';
import { useNotifications } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import type { SHARE_EXTERNAL_INVITATION_STATE, SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/constants';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { getInitials } from '@proton/shared/lib/helpers/string';

import { MemberDropdownMenu } from './MemberDropdownMenu';

interface Props {
    invitationId: string;
    volumeId: string;
    linkId: string;
    contactEmail: string;
    contactName?: string;
    externalInvitationState?: SHARE_EXTERNAL_INVITATION_STATE;
    selectedPermissions: SHARE_MEMBER_PERMISSIONS;
    onInvitationRemove: (invitationId: string) => Promise<void>;
    onInvitationPermissionsChange: (invitationId: string, permissions: SHARE_MEMBER_PERMISSIONS) => Promise<void>;
    onResendInvitationEmail: (invitationId: string) => Promise<void>;
}

export const DirectSharingListInvitation = ({
    invitationId,
    volumeId,
    linkId,
    contactEmail,
    contactName,
    selectedPermissions,
    externalInvitationState,
    onInvitationRemove,
    onInvitationPermissionsChange,
    onResendInvitationEmail,
}: Props) => {
    const [isLoading, withIsLoading] = useLoading(false);
    const { createNotification } = useNotifications();
    const isExternalInvitation = !!externalInvitationState;

    const copyShareInviteLinkUrl = useCallback(() => {
        textToClipboard(
            getAppHref(`/${volumeId}/${linkId}?invitation=${invitationId}&email=${contactEmail}`, APPS.PROTONDRIVE)
        );
        createNotification({
            text: c('Info').t`Invite link copied`,
        });
    }, [volumeId, linkId, invitationId, contactEmail]);

    const handleInviteRemove = () => withIsLoading(onInvitationRemove(invitationId));

    const handleInvitationPermissionsChange = (permissions: SHARE_MEMBER_PERMISSIONS) =>
        withIsLoading(onInvitationPermissionsChange(invitationId, permissions));

    const handleResendInvitationEmail = () => withIsLoading(onResendInvitationEmail(invitationId));

    return (
        <div className="flex my-4 justify-space-between items-center" data-testid="share-members">
            <div className={'flex items-center'}>
                <Avatar color="weak" className="mr-2">
                    {getInitials(contactName || contactEmail)}
                </Avatar>
                <p className="flex flex-column p-0 m-0">
                    <span className="text-semibold">{contactName ? contactName : contactEmail}</span>
                    {contactName ? <span className="color-weak">{contactEmail}</span> : null}
                </p>
            </div>
            <MemberDropdownMenu
                isLoading={isLoading}
                externalInvitationState={externalInvitationState}
                onChangePermissions={handleInvitationPermissionsChange}
                selectedPermissions={selectedPermissions}
                onCopyShareInviteLink={isExternalInvitation ? undefined : copyShareInviteLinkUrl} // TODO: Add support copy invite link for external invtations
                onRemoveAccess={handleInviteRemove}
                onResendInvitationEmail={handleResendInvitationEmail}
            />
        </div>
    );
};
