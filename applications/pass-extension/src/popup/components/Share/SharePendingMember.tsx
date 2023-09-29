import type { VFC } from 'react';

import { c } from 'ttag';

import { Avatar } from '@proton/atoms/Avatar';
import { Info } from '@proton/components/components';
import { inviteResendIntent } from '@proton/pass/store';
import noop from '@proton/utils/noop';

import { useActionWithRequest } from '../../../shared/hooks/useRequestStatusEffect';
import { DropdownMenuButton } from '../Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '../Dropdown/QuickActionsDropdown';

import './ShareMember.scss';

export type SharePendingMemberProps = {
    email: string;
    inviteId: string;
    shareId: string;
};

export const SharePendingMember: VFC<SharePendingMemberProps> = ({ email, inviteId, shareId }) => {
    const initials = email.toUpperCase().slice(0, 2) ?? '';

    const resendInvite = useActionWithRequest(inviteResendIntent, { requestId: `invite::resend::${inviteId}` });
    const handleResendInvite = () => resendInvite.dispatch({ shareId, inviteId });

    return (
        <div className="flex flex-nowrap flex-align-items-center border rounded-xl px-4 py-3 w100">
            <Avatar className="mr-4 rounded-lg pass-member--avatar">{initials}</Avatar>
            <div className="flex-item-fluid">
                <div className="text-ellipsis">{email}</div>
                <div className="flex flex-align-items-center gap-1">
                    <span className="color-weak">{c('Info').t`Pending invitation`}</span>
                    <Info
                        title={c('Info').t`The user did not accept the invitation yet.`}
                        className="color-weak"
                        questionMark
                    />
                </div>
            </div>
            <QuickActionsDropdown color="weak" shape="ghost">
                <DropdownMenuButton
                    label={c('Action').t`Resend invitation`}
                    icon={'paper-plane'}
                    onClick={handleResendInvite}
                    disabled={resendInvite.loading}
                />

                <DropdownMenuButton label={c('Action').t`Remove access`} icon="circle-slash" danger onClick={noop} />
            </QuickActionsDropdown>
        </div>
    );
};
