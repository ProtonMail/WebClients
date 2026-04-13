import type { FC } from 'react';

import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Info from '@proton/components/components/link/Info';
import { ConfirmationModal } from '@proton/pass/components/Confirmation/ConfirmationModal';
import { useMaybeGroup } from '@proton/pass/components/Groups/GroupsProvider';
import { MaybeGroupName } from '@proton/pass/components/Groups/MaybeGroupName';
import { type InviteLabels, useInviteLabels } from '@proton/pass/components/Invite/useInviteLabels';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { ButtonIfNeeded } from '@proton/pass/components/Utils/ButtonIfNeeded';
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
    isGroupShare: boolean;
    isManagerThroughGroup: boolean;
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
    isGroupShare,
    isManagerThroughGroup,
    itemId,
    me,
    owner,
    role,
    shareId,
    target,
    userShareId,
}) => {
    const { maybeGroupProps, isMember, onShowMembers } = useMaybeGroup(email);

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

    /** This block deals with a complex scenario: we want to prevent a user
     * having manager access to a share through a group to remove their own access.
     * First we only consider group shares members and we receive from above the flag
     * that defined that we see this share from a group shares.
     * Then we only care about manager members and finally we check we're in the
     * group corresponding to the access */
    const dontShowGroupActions = (() => {
        if (!isGroupShare) return false;
        if (!isManagerThroughGroup) return false;
        if (role !== ShareRole.MANAGER) return false;
        if (!isMember) return false;
        return true;
    })();
    const showActions = canManage && !me && !owner && !dontShowGroupActions;
    const loading = transferOwner.loading || removeAccess.loading || editRole.loading;
    const showTransfer = !isGroupShare && canTransfer && role === ShareRole.MANAGER;

    return (
        <div
            className={clsx('flex flex-nowrap items-center border border-weak rounded-xl px-4 py-3 w-full', className)}
        >
            <ButtonIfNeeded onClick={onShowMembers}>
                <ShareMemberAvatar email={email} isGroup={isGroupShare} loading={loading} />
            </ButtonIfNeeded>

            <div className="flex-1">
                <div className="flex flex-nowrap flex-1 items-center gap-2">
                    {isGroupShare ? (
                        <ButtonIfNeeded onClick={onShowMembers}>
                            <MaybeGroupName {...maybeGroupProps} />
                        </ButtonIfNeeded>
                    ) : (
                        <>
                            <Tooltip openDelay={100} originalPlacement="bottom-start" title={email}>
                                <MaybeGroupName {...maybeGroupProps} />
                            </Tooltip>
                            {me && <span className="color-primary text-sm">({c('Info').t`me`})</span>}
                        </>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <span className="color-weak text-sm">{title}</span>
                    <Info title={description} className="color-weak" questionMark />
                </div>
            </div>

            {showActions && (
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
                    {showTransfer && (
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
