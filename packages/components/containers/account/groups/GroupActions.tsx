import type { CSSProperties } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import useLoading from '@proton/hooks/useLoading';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcCross } from '@proton/icons/icons/IcCross';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import {
    GROUP_MEMBERSHIP_STATUS,
    GROUP_MEMBER_PERMISSIONS,
    type GroupMembership,
} from '@proton/shared/lib/interfaces/GroupMember';

import { ButtonGroup } from '../../../components/button/ButtonGroup';
import useModalState from '../../../components/modalTwo/useModalState';
import Prompt from '../../../components/prompt/Prompt';
import useGroupActions from './useGroupActions';

// Colours the icon and the loader, which both follow the button text colour, in every button state
const getIconColorStyle = (color: string): CSSProperties => ({
    '--button-default-text-color': color,
    '--button-hover-text-color': color,
    '--button-active-text-color': color,
});

const acceptStyle = getIconColorStyle('var(--signal-success)');
const declineStyle = getIconColorStyle('var(--signal-danger)');
const leaveStyle = getIconColorStyle('var(--text-weak)');

const GroupActions = ({ membership }: { membership: GroupMembership }) => {
    const { acceptInvitation, declineInvitation, leaveMembership } = useGroupActions();
    const [loadingAccept, withLoadingAccept] = useLoading();
    const [loadingDecline, withLoadingDecline] = useLoading();
    const [loadingLeave, withLoadingLeave] = useLoading();
    const [confirmLeaveProps, setConfirmLeaveOpen, renderConfirmLeave] = useModalState();

    const canLeave = hasBit(membership.Permissions, GROUP_MEMBER_PERMISSIONS.LEAVE);

    if (membership.Status === GROUP_MEMBERSHIP_STATUS.UNANSWERED) {
        const loading = loadingAccept || loadingDecline;
        const acceptLabel = c('Action').t`Accept`;
        const declineLabel = c('Action').t`Decline`;

        return (
            <ButtonGroup size="small">
                <Tooltip title={acceptLabel}>
                    <Button
                        icon
                        style={acceptStyle}
                        loading={loadingAccept}
                        disabled={loading}
                        onClick={() => withLoadingAccept(acceptInvitation(membership))}
                        data-testid="acceptGroup"
                    >
                        <IcCheckmark size={5} alt={acceptLabel} />
                    </Button>
                </Tooltip>
                {canLeave && (
                    <Tooltip title={declineLabel}>
                        <Button
                            icon
                            style={declineStyle}
                            loading={loadingDecline}
                            disabled={loading}
                            onClick={() => withLoadingDecline(declineInvitation(membership))}
                            data-testid="declineGroup"
                        >
                            <IcCross size={5} alt={declineLabel} />
                        </Button>
                    </Tooltip>
                )}
            </ButtonGroup>
        );
    }

    const leaveLabel = c('Action').t`Leave`;

    if (!canLeave) {
        const noPermission = c('Info').t`You do not have permission to perform this action`;

        return (
            // The tooltip sits on a wrapper because disabled buttons don't receive pointer events. The button stays
            // focusable (aria-disabled instead of disabled) and its name carries the reason for keyboard users
            <Tooltip title={noPermission}>
                <div className="inline-block">
                    <Button
                        size="small"
                        shape="outline"
                        icon
                        style={leaveStyle}
                        className="is-disabled"
                        aria-disabled="true"
                        data-testid="leaveGroup"
                    >
                        <IcCross size={5} alt={`${leaveLabel}. ${noPermission}`} />
                    </Button>
                </div>
            </Tooltip>
        );
    }

    return (
        <>
            <Tooltip title={leaveLabel}>
                <Button
                    size="small"
                    shape="outline"
                    icon
                    style={leaveStyle}
                    loading={loadingLeave}
                    onClick={() => setConfirmLeaveOpen(true)}
                    data-testid="leaveGroup"
                >
                    <IcCross size={5} alt={leaveLabel} />
                </Button>
            </Tooltip>
            {renderConfirmLeave && (
                <Prompt
                    {...confirmLeaveProps}
                    title={c('Title').t`Leave group?`}
                    buttons={[
                        <Button
                            color="danger"
                            onClick={() => {
                                confirmLeaveProps.onClose();
                                void withLoadingLeave(leaveMembership(membership));
                            }}
                            data-testid="confirmLeaveGroup"
                        >
                            {c('Action').t`Leave group`}
                        </Button>,
                        <Button onClick={confirmLeaveProps.onClose}>{c('Action').t`Cancel`}</Button>,
                    ]}
                >
                    <p className="m-0">{c('Info')
                        .t`Are you sure you want to leave this group? If you leave, you will need to be reinvited by the group administrator to join again.`}</p>
                </Prompt>
            )}
        </>
    );
};

export default GroupActions;
