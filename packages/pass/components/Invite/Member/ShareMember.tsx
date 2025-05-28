import type { FC } from 'react';

import { c } from 'ttag';

import { Info } from '@proton/components'
import { Tooltip } from '@proton/atoms';
import { ConfirmationModal } from '@proton/pass/components/Confirmation/ConfirmationModal';
import { type InviteLabels, useInviteLabels } from '@proton/pass/components/Invite/useInviteLabels';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { useConfirm } from '@proton/pass/hooks/useConfirm';
import { useActionRequest } from '@proton/pass/hooks/useRequest';
import type { AccessDTO } from '@proton/pass/lib/access/types';
import { AccessTarget } from '@proton/pass/lib/access/types';
import {
    shareEditMemberAccessIntent,
    shareRemoveMemberAccessIntent,
    vaultTransferOwnerIntent,
} from '@proton/pass/store/actions';
import { ShareRole } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

import { ShareMemberAvatar } from './ShareMemberAvatar';
import { getShareRoleDefinition } from './ShareRoleOptions';

type Props = AccessDTO & {
    canManage: boolean;
    canTransfer: boolean;
    className?: string;
    email: string;
    me: boolean;
    owner: boolean;
    role: ShareRole;
    userShareId: string;
};

const getDefinition = (owner: boolean, target: AccessTarget, role: ShareRole, labels: InviteLabels) =>
    owner
        ? {
              title: c('Info').t`Owner`,
              description:
                  target === AccessTarget.Vault
                      ? c('Info').t`Can grant and revoke access to this vault, and delete it.`
                      : c('Info').t`Can grant and revoke access to this item, and delete it.`,
          }
        : getShareRoleDefinition(target, labels)[role];

export const ShareMember: FC<Props> = ({
    canManage,
    canTransfer,
    className,
    email,
    itemId,
    me,
    owner,
    role,
    shareId,
    target,
    userShareId,
}) => {
    const initials = email.toUpperCase().slice(0, 2) ?? '';
    // TODO: Remove this in IDTEAM-4660
    const labels = useInviteLabels();
    const { title, description } = getDefinition(owner, target, role, labels);

    const removeAccess = useActionRequest(shareRemoveMemberAccessIntent);
    const editRole = useActionRequest(shareEditMemberAccessIntent);
    const transferOwner = useActionRequest(vaultTransferOwnerIntent);
    const transfer = useConfirm(transferOwner.dispatch);

    const remove = () =>
        removeAccess.dispatch({
            shareId,
            itemId,
            target,
            userShareId,
        });

    const edit = (shareRoleId: ShareRole) =>
        editRole.dispatch({
            shareId,
            itemId,
            target,
            userShareId,
            shareRoleId,
        });

    const loading = transferOwner.loading || removeAccess.loading || editRole.loading;

    return (
        <div
            className={clsx('flex flex-nowrap items-center border border-weak rounded-xl px-4 py-3 w-full', className)}
        >
            <ShareMemberAvatar value={initials} loading={loading} />
            <div className="flex-1">
                <div className="flex flex-nowrap flex-1 items-center gap-2">
                    <Tooltip openDelay={100} originalPlacement="bottom-start" title={email}>
                        <div className="text-ellipsis">{email}</div>
                    </Tooltip>
                    {me && <span className="color-primary text-sm">({c('Info').t`me`})</span>}
                </div>

                <div className="flex items-center gap-1">
                    <span className="color-weak text-sm">{title}</span>
                    <Info title={description} className="color-weak" questionMark />
                </div>
            </div>

            {!me && canManage && !owner && (
                <QuickActionsDropdown color="weak" shape="ghost">
                    <DropdownMenuButton
                        label={c('Action').t`Make viewer`}
                        icon={role === ShareRole.READ ? 'checkmark' : undefined}
                        onClick={() => edit(ShareRole.READ)}
                        disabled={editRole.loading}
                        className={role !== ShareRole.READ ? 'pl-10' : ''}
                    />
                    <DropdownMenuButton
                        label={c('Action').t`Make editor`}
                        icon={role === ShareRole.WRITE ? 'checkmark' : undefined}
                        onClick={() => edit(ShareRole.WRITE)}
                        disabled={editRole.loading}
                        className={role !== ShareRole.WRITE ? 'pl-10' : ''}
                    />
                    <DropdownMenuButton
                        label={labels.singleAction}
                        icon={role === ShareRole.MANAGER ? 'checkmark' : undefined}
                        onClick={() => edit(ShareRole.MANAGER)}
                        disabled={editRole.loading}
                        className={role !== ShareRole.MANAGER ? 'pl-10' : ''}
                    />

                    {canTransfer && role === ShareRole.MANAGER && (
                        <DropdownMenuButton
                            label={c('Action').t`Transfer ownership`}
                            icon="shield-half-filled"
                            onClick={() => transfer.prompt({ shareId, userShareId })}
                        />
                    )}
                    <DropdownMenuButton
                        label={c('Action').t`Remove access`}
                        icon="circle-slash"
                        danger
                        onClick={remove}
                    />
                </QuickActionsDropdown>
            )}

            <ConfirmationModal
                title={c('Title').t`Transfer ownership`}
                open={transfer.pending}
                onClose={transfer.cancel}
                onSubmit={transfer.confirm}
                submitText={c('Action').t`Confirm`}
                alertText={c('Warning').t`Transfer ownership of this vault to ${email}?`}
            />
        </div>
    );
};
