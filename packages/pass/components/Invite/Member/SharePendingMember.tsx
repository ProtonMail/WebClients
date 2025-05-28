import type { FC, ReactNode } from 'react';

import { c } from 'ttag';

import { Button, Tooltip } from '@proton/atoms';
import { Info } from '@proton/components';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { useActionRequest } from '@proton/pass/hooks/useRequest';
import type { AccessDTO } from '@proton/pass/lib/access/types';
import {
    inviteRemoveIntent,
    inviteResendIntent,
    newUserInvitePromoteIntent,
    newUserInviteRemoveIntent,
} from '@proton/pass/store/actions';
import { NewUserInviteState } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

import { ShareMemberAvatar } from './ShareMemberAvatar';

type PendingMemberBase = AccessDTO & { canManage: boolean; email: string; className?: string };
type PendingExistingMemberProps = PendingMemberBase & { inviteId: string };
type PendingNewMemberProps = PendingMemberBase & { newUserInviteId: string; state: NewUserInviteState };

type SharePendingMemberProps = {
    actions?: ReactNode[];
    email: string;
    extra?: ReactNode;
    loading: boolean;
    className?: string;
};

export const SharePendingMember: FC<SharePendingMemberProps> = ({ actions, email, extra, loading, className }) => (
    <div className={clsx('border border-weak rounded-xl px-4 py-3 max-w-full', className)}>
        <div className="flex flex-nowrap items-center w-full">
            <ShareMemberAvatar value={email.toUpperCase().slice(0, 2) ?? ''} loading={loading} />
            <div className="flex-1">
                <Tooltip openDelay={100} originalPlacement="bottom-start" title={email}>
                    <div className="text-ellipsis">{email}</div>
                </Tooltip>
                <div className="flex items-center gap-1">
                    <span className="color-weak text-sm">{c('Info').t`Invitation sent`}</span>
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

export const PendingExistingMember: FC<PendingExistingMemberProps> = ({
    canManage,
    className,
    email,
    inviteId,
    itemId,
    shareId,
    target,
}) => {
    const resendInvite = useActionRequest(inviteResendIntent);
    const removeInvite = useActionRequest(inviteRemoveIntent);

    const resend = () => resendInvite.dispatch({ shareId, itemId, inviteId, target });
    const remove = () => removeInvite.dispatch({ shareId, itemId, inviteId, target });
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
                              onClick={resend}
                              disabled={loading}
                          />,

                          <DropdownMenuButton
                              key="remove"
                              label={c('Action').t`Remove access`}
                              icon="circle-slash"
                              danger
                              onClick={remove}
                              disabled={loading}
                          />,
                      ]
                    : undefined
            }
            className={className}
        />
    );
};

export const PendingNewMember: FC<PendingNewMemberProps> = ({
    canManage,
    email,
    shareId,
    itemId,
    state,
    newUserInviteId,
    className,
    target,
}) => {
    const promoteInvite = useActionRequest(newUserInvitePromoteIntent);
    const removeInvite = useActionRequest(newUserInviteRemoveIntent);

    const promote = () => promoteInvite.dispatch({ shareId, itemId, newUserInviteId, target });
    const remove = () => removeInvite.dispatch({ shareId, itemId, newUserInviteId, target });
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
                              onClick={remove}
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
                        onClick={promote}
                    >
                        {c('Action').t`Confirm access`}
                    </Button>
                ) : undefined
            }
            className={className}
        />
    );
};
