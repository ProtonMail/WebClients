import type { FC } from 'react';
import { useMemo } from 'react';

import { c } from 'ttag';

import { Info } from '@proton/components';
import { ConfirmationModal } from '@proton/pass/components/Confirmation/ConfirmationModal';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { useActionRequest } from '@proton/pass/hooks/useActionRequest';
import { useConfirm } from '@proton/pass/hooks/useConfirm';
import {
    shareEditMemberAccessIntent,
    shareRemoveMemberAccessIntent,
    vaultTransferOwnerIntent,
} from '@proton/pass/store/actions';
import { ShareRole } from '@proton/pass/types';

import { ShareMemberAvatar } from './ShareMemberAvatar';
import { getShareRoleDefinition } from './ShareRoleOptions';

export type ShareMemberProps = {
    canManage: boolean;
    canTransfer: boolean;
    email: string;
    me: boolean;
    owner: boolean;
    role: ShareRole;
    shareId: string;
    userShareId: string;
};

export const ShareMember: FC<ShareMemberProps> = ({
    canManage,
    canTransfer,
    email,
    me,
    owner,
    role,
    shareId,
    userShareId,
}: ShareMemberProps) => {
    const initials = email.toUpperCase().slice(0, 2) ?? '';
    const { title, description } = useMemo(() => {
        if (owner) {
            return {
                title: c('Info').t`Owner`,
                description: c('Info').t`Can grant and revoke access to this vault, and delete it.`,
            };
        }

        return getShareRoleDefinition()[role];
    }, [owner, role]);

    const removeAccess = useActionRequest(shareRemoveMemberAccessIntent);
    const editAccess = useActionRequest(shareEditMemberAccessIntent);
    const transferOwnership = useActionRequest(vaultTransferOwnerIntent);

    const handleRemoveAccess = () => removeAccess.dispatch({ shareId, userShareId });
    const handleEditRole = (shareRoleId: ShareRole) => editAccess.dispatch({ shareId, userShareId, shareRoleId });
    const handleTransferOwnership = useConfirm(transferOwnership.dispatch);

    const loading = transferOwnership.loading || removeAccess.loading || editAccess.loading;

    return (
        <div className="flex flex-nowrap items-center border rounded-xl px-4 py-3 w-full">
            <ShareMemberAvatar value={initials} loading={loading} />
            <div className="flex-1">
                <div className="flex flex-nowrap flex-1 items-center gap-2">
                    <div className="text-ellipsis">{email}</div>
                    {me && <span className="color-primary text-sm">({c('Info').t`me`})</span>}
                </div>
                <div className="flex items-center gap-1">
                    <span className="color-weak">{title}</span>
                    <Info title={description} className="color-weak" questionMark />
                </div>
            </div>

            {!me && canManage && !owner && (
                <QuickActionsDropdown color="weak" shape="ghost">
                    <DropdownMenuButton
                        label={c('Action').t`Make viewer`}
                        icon={role === ShareRole.READ ? 'checkmark' : undefined}
                        onClick={() => handleEditRole(ShareRole.READ)}
                        disabled={editAccess.loading}
                        className={role !== ShareRole.READ ? 'pl-10' : ''}
                    />
                    <DropdownMenuButton
                        label={c('Action').t`Make editor`}
                        icon={role === ShareRole.WRITE ? 'checkmark' : undefined}
                        onClick={() => handleEditRole(ShareRole.WRITE)}
                        disabled={editAccess.loading}
                        className={role !== ShareRole.WRITE ? 'pl-10' : ''}
                    />
                    <DropdownMenuButton
                        label={c('Action').t`Make admin`}
                        icon={role === ShareRole.ADMIN ? 'checkmark' : undefined}
                        onClick={() => handleEditRole(ShareRole.ADMIN)}
                        disabled={editAccess.loading}
                        className={role !== ShareRole.ADMIN ? 'pl-10' : ''}
                    />

                    {canTransfer && role === ShareRole.ADMIN && (
                        <DropdownMenuButton
                            label={c('Action').t`Transfer ownership`}
                            icon="shield-half-filled"
                            onClick={() => handleTransferOwnership.prompt({ shareId, userShareId })}
                        />
                    )}
                    <DropdownMenuButton
                        label={c('Action').t`Remove access`}
                        icon="circle-slash"
                        danger
                        onClick={handleRemoveAccess}
                    />
                </QuickActionsDropdown>
            )}

            <ConfirmationModal
                title={c('Title').t`Transfer ownership`}
                open={handleTransferOwnership.pending}
                onClose={handleTransferOwnership.cancel}
                onSubmit={handleTransferOwnership.confirm}
                submitText={c('Action').t`Confirm`}
                alertText={c('Warning').t`Transfer ownership of this vault to ${email}?`}
            />
        </div>
    );
};
