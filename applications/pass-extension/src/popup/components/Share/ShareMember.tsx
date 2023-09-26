import type { VFC } from 'react';
import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { Avatar } from '@proton/atoms/Avatar';
import { Button } from '@proton/atoms/Button';
import { Info, Prompt } from '@proton/components/components';
import { ShareRole } from '@proton/pass/types';

import { DropdownMenuButton } from '../Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '../Dropdown/QuickActionsDropdown';
import { getShareRoleDefinition } from './ShareRoleOptions';

import './ShareMember.scss';

export type ShareMemberProps = {
    email: string;
    owner?: boolean;
} & ({ role: ShareRole; pending: false } | { role?: never; pending: true });

export const ShareMember: VFC<ShareMemberProps> = ({ email, role, owner = false, pending }: ShareMemberProps) => {
    const [confirmTransfer, setConfirmTransfer] = useState(false);
    const canTransferOwnership = true;

    const initials = email.toUpperCase().slice(0, 2) ?? '';

    const { title, description } = useMemo(() => {
        if (owner) {
            return {
                title: c('Info').t`Owner`,
                description: c('Info').t`Can grant and revoke access to this vault, and delete it.`,
            };
        }
        if (pending) {
            return {
                title: c('Info').t`Pending invitation`,
                description: c('Info').t`The user did not accept the invitation yet.`,
            };
        }

        return getShareRoleDefinition()[role];
    }, [role, owner, pending]);

    return (
        <div className="flex flex-nowrap flex-align-items-center border rounded-xl px-4 py-3 w100">
            <Avatar className="mr-4 rounded-lg pass-member--avatar">{initials}</Avatar>
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
                    icon={role !== ShareRole.READ ? 'checkmark-circle' : 'circle'}
                />
                <DropdownMenuButton
                    label={c('Action').t`Can edit`}
                    icon={role !== ShareRole.WRITE ? 'checkmark-circle' : 'circle'}
                />
                <DropdownMenuButton
                    label={c('Action').t`Can manage`}
                    icon={role !== ShareRole.ADMIN ? 'checkmark-circle' : 'circle'}
                />
                {pending && <DropdownMenuButton label={c('Action').t`Resend invitation`} icon={'paper-plane'} />}
                {canTransferOwnership && (
                    <DropdownMenuButton
                        label={c('Action').t`Transfer ownership`}
                        icon="shield-half-filled"
                        onClick={() => setConfirmTransfer(true)}
                    />
                )}
                <DropdownMenuButton label={c('Action').t`Remove access`} icon="circle-slash" danger />
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
