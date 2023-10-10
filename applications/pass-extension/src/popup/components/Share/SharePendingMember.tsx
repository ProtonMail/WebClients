import type { VFC } from 'react';

import { c } from 'ttag';

import { Info } from '@proton/components/components';
import { inviteRemoveIntent, inviteResendIntent } from '@proton/pass/store';
import { inviteRemoveRequest, inviteResendRequest } from '@proton/pass/store/actions/requests';

import { useActionWithRequest } from '../../../shared/hooks/useActionWithRequest';
import { DropdownMenuButton } from '../Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '../Dropdown/QuickActionsDropdown';
import { ShareMemberAvatar } from './ShareMemberAvatar';

export type SharePendingMemberProps = {
    canManage: boolean;
    email: string;
    inviteId: string;
    shareId: string;
};

export const SharePendingMember: VFC<SharePendingMemberProps> = ({ canManage, email, inviteId, shareId }) => {
    const initials = email.toUpperCase().slice(0, 2) ?? '';

    const resendInvite = useActionWithRequest({ action: inviteResendIntent, requestId: inviteResendRequest(inviteId) });
    const handleResendInvite = () => resendInvite.dispatch({ shareId, inviteId });

    const removeInvite = useActionWithRequest({ action: inviteRemoveIntent, requestId: inviteRemoveRequest(inviteId) });
    const handleRemoveInvite = () => removeInvite.dispatch({ shareId, inviteId });

    const loading = resendInvite.loading || removeInvite.loading;

    return (
        <div className="flex flex-nowrap flex-align-items-center border rounded-xl px-4 py-3 w-full">
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
                    <DropdownMenuButton
                        label={c('Action').t`Resend invitation`}
                        icon={'paper-plane'}
                        onClick={handleResendInvite}
                        disabled={resendInvite.loading}
                    />

                    <DropdownMenuButton
                        label={c('Action').t`Remove access`}
                        icon="circle-slash"
                        danger
                        onClick={handleRemoveInvite}
                        disabled={removeInvite.loading}
                    />
                </QuickActionsDropdown>
            )}
        </div>
    );
};
