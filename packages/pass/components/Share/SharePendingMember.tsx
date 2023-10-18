import type { VFC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Info } from '@proton/components/components';
import { inviteRemoveIntent, inviteResendIntent } from '@proton/pass/store/actions';
import { inviteRemoveRequest, inviteResendRequest } from '@proton/pass/store/actions/requests';
import { NewUserInviteState } from '@proton/pass/types';

import { useActionWithRequest } from '../../hooks/useActionWithRequest';
import { DropdownMenuButton } from '../Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '../Layout/Dropdown/QuickActionsDropdown';
import { ShareMemberAvatar } from './ShareMemberAvatar';

export type SharePendingMemberProps = {
    canManage: boolean;
    email: string;
    inviteId: string;
    shareId: string;
} & ({ type: 'existing' } | { type: 'new'; state: NewUserInviteState });

export const SharePendingMember: VFC<SharePendingMemberProps> = ({ canManage, email, inviteId, shareId, ...props }) => {
    const { type } = props;
    const initials = email.toUpperCase().slice(0, 2) ?? '';

    const resendInvite = useActionWithRequest({ action: inviteResendIntent, requestId: inviteResendRequest(inviteId) });
    const handleResendInvite = () => resendInvite.dispatch({ shareId, inviteId });

    const removeInvite = useActionWithRequest({ action: inviteRemoveIntent, requestId: inviteRemoveRequest(inviteId) });
    const handleRemoveInvite = () => removeInvite.dispatch({ shareId, inviteId });

    const loading = resendInvite.loading || removeInvite.loading;

    return (
        <div className="border rounded-xl px-4 py-3 max-w-full">
            <div className="flex flex-nowrap flex-align-items-center w-full">
                <ShareMemberAvatar value={initials} loading={loading} />
                <div className="flex-item-fluid">
                    <div className="text-ellipsis">{email}</div>
                    <div className="flex flex-align-items-center gap-1">
                        <span className="color-weak">{c('Info').t`Invitation sent`}</span>
                        <Info
                            title={c('Info').t`The user did not accept the invitation yet.`}
                            className="color-weak"
                            questionMark
                        />
                    </div>
                </div>
                {canManage && (
                    <QuickActionsDropdown color="weak" shape="ghost">
                        {type === 'existing' && (
                            <DropdownMenuButton
                                label={c('Action').t`Resend invitation`}
                                icon={'paper-plane'}
                                onClick={handleResendInvite}
                                disabled={resendInvite.loading}
                            />
                        )}

                        <DropdownMenuButton
                            label={c('Action').t`Remove access`}
                            icon="circle-slash"
                            danger
                            onClick={handleRemoveInvite}
                            disabled={type === 'new' || removeInvite.loading}
                        />
                    </QuickActionsDropdown>
                )}
            </div>
            {props.type === 'new' && props.state === NewUserInviteState.READY && (
                <Button pill shape="solid" color="weak" size="small" className="w-full text-sm mt-2">
                    {c('Action').t`Confirm access`}
                </Button>
            )}
        </div>
    );
};
