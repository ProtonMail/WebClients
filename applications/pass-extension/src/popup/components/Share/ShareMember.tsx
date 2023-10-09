import type { VFC } from 'react';
import { useMemo } from 'react';

import { c } from 'ttag';

import { Info } from '@proton/components/components';
import {
    shareEditMemberAccessIntent,
    shareRemoveMemberAccessIntent,
    vaultTransferOwnerIntent,
} from '@proton/pass/store';
import {
    shareEditMemberRoleRequest,
    shareRemoveMemberRequest,
    vaultTransferOwnerRequest,
} from '@proton/pass/store/actions/requests';
import { ShareRole } from '@proton/pass/types';

import { ConfirmationModal } from '../../../shared/components/confirmation/ConfirmationModal';
import { useActionWithRequest } from '../../../shared/hooks/useActionWithRequest';
import { useConfirm } from '../../hooks/useConfirm';
import { DropdownMenuButton } from '../Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '../Dropdown/QuickActionsDropdown';
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

export const ShareMember: VFC<ShareMemberProps> = ({
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

    const removeAccess = useActionWithRequest({
        action: shareRemoveMemberAccessIntent,
        requestId: shareRemoveMemberRequest(userShareId),
    });

    const editAccess = useActionWithRequest({
        action: shareEditMemberAccessIntent,
        requestId: shareEditMemberRoleRequest(userShareId),
    });

    const transferOwnership = useActionWithRequest({
        action: vaultTransferOwnerIntent,
        requestId: vaultTransferOwnerRequest(userShareId),
    });

    const handleRemoveAccess = () => removeAccess.dispatch({ shareId, userShareId });
    const handleEditRole = (shareRoleId: ShareRole) => editAccess.dispatch({ shareId, userShareId, shareRoleId });
    const handleTransferOwnership = useConfirm(transferOwnership.dispatch);

    const loading = transferOwnership.loading || removeAccess.loading || editAccess.loading;

    return (
        <div className="flex flex-nowrap flex-align-items-center border rounded-xl px-4 py-3 w-full">
            <ShareMemberAvatar value={initials} loading={loading} />
            <div className="flex-item-fluid">
                <div className="flex flex-nowrap flex-item-fluid flex-align-items-center gap-2">
                    <div className="text-ellipsis">{email}</div>
                    {me && <span className="color-primary text-sm">({c('Info').t`me`})</span>}
                </div>
                <div className="flex flex-align-items-center gap-1">
                    <span className="color-weak">{title}</span>
                    <Info title={description} className="color-weak" questionMark />
                </div>
            </div>

            {!me && canManage && !owner && (
                <QuickActionsDropdown color="weak" shape="ghost">
                    <DropdownMenuButton
                        label={c('Action').t`Can view`}
                        icon={role === ShareRole.READ ? 'checkmark' : undefined}
                        onClick={() => handleEditRole(ShareRole.READ)}
                        disabled={editAccess.loading}
                        className={role !== ShareRole.READ ? 'pl-11' : ''}
                    />
                    <DropdownMenuButton
                        label={c('Action').t`Can edit`}
                        icon={role === ShareRole.WRITE ? 'checkmark' : undefined}
                        onClick={() => handleEditRole(ShareRole.WRITE)}
                        disabled={editAccess.loading}
                        className={role !== ShareRole.WRITE ? 'pl-11' : ''}
                    />
                    <DropdownMenuButton
                        label={c('Action').t`Can manage`}
                        icon={role === ShareRole.ADMIN ? 'checkmark' : undefined}
                        onClick={() => handleEditRole(ShareRole.ADMIN)}
                        disabled={editAccess.loading}
                        className={role !== ShareRole.ADMIN ? 'pl-11' : ''}
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
                alertText={c('Warning').t`Are you sure you want to transfer vault ownership to ${email}?`}
            />
        </div>
    );
};
