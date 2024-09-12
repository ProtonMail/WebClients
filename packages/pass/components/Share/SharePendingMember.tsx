import type { FC, ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Info } from '@proton/components';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { useActionRequest } from '@proton/pass/hooks/useActionRequest';
import {
    inviteRemoveIntent,
    inviteResendIntent,
    newUserInvitePromoteIntent,
    newUserInviteRemoveIntent,
} from '@proton/pass/store/actions';
import { NewUserInviteState } from '@proton/pass/types';

import { ShareMemberAvatar } from './ShareMemberAvatar';

type PendingMemberBase = { canManage: boolean; email: string; shareId: string };
type PendingExistingMemberProps = PendingMemberBase & { inviteId: string };
type PendingNewMemberProps = PendingMemberBase & { newUserInviteId: string; state: NewUserInviteState };
type SharePendingMemberProps = { actions?: ReactNode[]; email: string; extra?: ReactNode; loading: boolean };

export const SharePendingMember: FC<SharePendingMemberProps> = ({ actions, email, extra, loading }) => (
    <div className="border rounded-xl px-4 py-3 max-w-full">
        <div className="flex flex-nowrap items-center w-full">
            <ShareMemberAvatar value={email.toUpperCase().slice(0, 2) ?? ''} loading={loading} />
            <div className="flex-1">
                <div className="text-ellipsis">{email}</div>
                <div className="flex items-center gap-1">
                    <span className="color-weak">{c('Info').t`Invitation sent`}</span>
                    <Info
                        title={c('Info').t`The user did not accept the invitation yet.`}
                        className="color-weak"
                        questionMark
                    />
                </div>
            </div>

            {actions && (
                <QuickActionsDropdown color="weak" shape="ghost">
                    {actions}
                </QuickActionsDropdown>
            )}
        </div>
        {extra}
    </div>
);

export const PendingExistingMember: FC<PendingExistingMemberProps> = ({ canManage, email, inviteId, shareId }) => {
    const resendInvite = useActionRequest(inviteResendIntent);
    const removeInvite = useActionRequest(inviteRemoveIntent);

    const handleResendInvite = () => resendInvite.dispatch({ shareId, inviteId });
    const handleRemoveInvite = () => removeInvite.dispatch({ shareId, inviteId });
    const loading = resendInvite.loading || removeInvite.loading;

    return (
        <SharePendingMember
            email={email}
            loading={loading}
            actions={
                canManage
                    ? [
                          <DropdownMenuButton
                              key="resend"
                              label={c('Action').t`Resend invitation`}
                              icon={'paper-plane'}
                              onClick={handleResendInvite}
                              disabled={loading}
                          />,

                          <DropdownMenuButton
                              key="remove"
                              label={c('Action').t`Remove access`}
                              icon="circle-slash"
                              danger
                              onClick={handleRemoveInvite}
                              disabled={loading}
                          />,
                      ]
                    : undefined
            }
        />
    );
};

export const PendingNewMember: FC<PendingNewMemberProps> = ({ canManage, email, shareId, state, newUserInviteId }) => {
    const promoteInvite = useActionRequest(newUserInvitePromoteIntent);
    const removeInvite = useActionRequest(newUserInviteRemoveIntent);

    const handlePromoteInvite = () => promoteInvite.dispatch({ shareId, newUserInviteId });
    const handleRemoveInvite = () => removeInvite.dispatch({ shareId, newUserInviteId });
    const loading = promoteInvite.loading || removeInvite.loading;

    return (
        <SharePendingMember
            email={email}
            loading={loading}
            actions={
                canManage
                    ? [
                          <DropdownMenuButton
                              key="remove"
                              label={c('Action').t`Remove access`}
                              icon="circle-slash"
                              danger
                              onClick={handleRemoveInvite}
                              disabled={loading}
                          />,
                      ]
                    : undefined
            }
            extra={
                canManage && state === NewUserInviteState.READY ? (
                    <Button
                        pill
                        shape="solid"
                        color="weak"
                        size="small"
                        className="w-full text-sm mt-2"
                        disabled={loading}
                        loading={promoteInvite.loading}
                        onClick={handlePromoteInvite}
                    >
                        {c('Action').t`Confirm access`}
                    </Button>
                ) : undefined
            }
        />
    );
};
