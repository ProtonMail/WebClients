import type { VFC } from 'react';
import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Info, Prompt } from '@proton/components/components';
import { shareEditMemberAccessIntent, shareRemoveMemberAccessIntent } from '@proton/pass/store';
import { shareRemoveMemberRequest } from '@proton/pass/store/actions/requests';
import { ShareRole } from '@proton/pass/types';

import { useActionWithRequest } from '../../../shared/hooks/useRequestWithAction';
import { DropdownMenuButton } from '../Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '../Dropdown/QuickActionsDropdown';
import { ShareMemberAvatar } from './ShareMemberAvatar';
import { getShareRoleDefinition } from './ShareRoleOptions';

export type ShareMemberProps = {
    email: string;
    owner: boolean;
    role: ShareRole;
    shareId: string;
    userShareId: string;
};

export const ShareMember: VFC<ShareMemberProps> = ({ email, owner, role, shareId, userShareId }: ShareMemberProps) => {
    const initials = email.toUpperCase().slice(0, 2) ?? '';

    const [confirmTransfer, setConfirmTransfer] = useState(false);
    const canTransferOwnership = true;

    const { title, description } = useMemo(() => {
        if (owner) {
            return {
                title: c('Info').t`Owner`,
                description: c('Info').t`Can grant and revoke access to this vault, and delete it.`,
            };
        }

        return getShareRoleDefinition()[role];
    }, [role, owner]);

    const removeAccess = useActionWithRequest({
        action: shareRemoveMemberAccessIntent,
        requestId: shareRemoveMemberRequest(userShareId),
    });

    const editAccess = useActionWithRequest({
        action: shareEditMemberAccessIntent,
        requestId: shareRemoveMemberRequest(userShareId),
    });

    const handleRemoveAccess = () => removeAccess.dispatch({ shareId, userShareId });
    const handleEditRole = (shareRoleId: ShareRole) => editAccess.dispatch({ shareId, userShareId, shareRoleId });

    const loading = removeAccess.loading || editAccess.loading;

    return (
        <div className="flex flex-nowrap flex-align-items-center border rounded-xl px-4 py-3 w100">
            <ShareMemberAvatar value={initials} loading={loading} />
            <div className="flex-item-fluid">
                <div className="text-ellipsis">{email}</div>
                <div className="flex flex-align-items-center gap-1">
                    <span className="color-weak">{title}</span>
                    <Info title={description} className="color-weak" questionMark />
                </div>
            </div>
            <QuickActionsDropdown color="weak" shape="ghost" disabled={owner}>
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

                {canTransferOwnership && (
                    <DropdownMenuButton
                        label={c('Action').t`Transfer ownership`}
                        icon="shield-half-filled"
                        onClick={() => setConfirmTransfer(true)}
                    />
                )}
                <DropdownMenuButton
                    label={c('Action').t`Remove access`}
                    icon="circle-slash"
                    danger
                    onClick={handleRemoveAccess}
                />
            </QuickActionsDropdown>

            <Prompt
                title="Transfer ownership"
                open={confirmTransfer}
                onClose={() => setConfirmTransfer(false)}
                buttons={[
                    <Button size="large" shape="solid" color="norm">{c('Action').t`Confirm`}</Button>,
                    <Button size="large" shape="solid" color="weak" onClick={() => setConfirmTransfer(false)}>{c(
                        'Action'
                    ).t`Cancel`}</Button>,
                ]}
            >
                <p>{c('Info').t`Are you sure you want to transfer vault ownership to ${email}?`}</p>
            </Prompt>
        </div>
    );
};
