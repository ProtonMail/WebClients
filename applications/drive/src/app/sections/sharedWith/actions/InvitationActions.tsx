import { useUser } from '@proton/account/user/hooks';
import { Vr } from '@proton/atoms/Vr/Vr';
import { ContextSeparator, type useConfirmActionModal } from '@proton/components';
import { getDrivePerNodeType } from '@proton/drive';

import type { useReportAbuseModal } from '../../../modals/ReportAbuseModal';
import { ReportAbuseButton } from '../../commonButtons/ReportAbuseButton';
import { AcceptButton } from '../buttons/AcceptButton';
import { DeclineButton } from '../buttons/DeclineButton';
import type { InvitationItem } from '../useSharedWithMe.store';
import { createItemChecker } from './actionsItemsChecker';

interface BaseInvitationActionsProps {
    selectedInvitations: InvitationItem[];
    showConfirmModal: ReturnType<typeof useConfirmActionModal>[1];
    showReportAbuseModal: ReturnType<typeof useReportAbuseModal>['showReportAbuseModal'];
}

interface ContextMenuInvitationActionsProps extends BaseInvitationActionsProps {
    buttonType: 'contextMenu';
    close: () => void;
}

interface ToolbarInvitationActionsProps extends BaseInvitationActionsProps {
    buttonType: 'toolbar';
    close?: never;
}

type InvitationActionsProps = ContextMenuInvitationActionsProps | ToolbarInvitationActionsProps;

export const InvitationActions = ({
    selectedInvitations,
    showConfirmModal,
    showReportAbuseModal,
    close,
    buttonType,
}: InvitationActionsProps) => {
    const itemChecker = createItemChecker(selectedInvitations);
    const [user] = useUser();

    if (!itemChecker.isOnlyOneItem) {
        return null;
    }

    const invitation = selectedInvitations.at(0);
    if (!invitation) {
        return null;
    }

    return (
        <>
            <AcceptButton
                nodeUid={invitation.nodeUid}
                invitationUid={invitation.invitation.uid}
                type={invitation.type}
                {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
            />
            <DeclineButton
                nodeUid={invitation.nodeUid}
                invitationUid={invitation.invitation.uid}
                type={invitation.type}
                name={invitation.name}
                showConfirmModal={showConfirmModal}
                {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
            />
            {buttonType === 'contextMenu' ? <ContextSeparator /> : <Vr />}
            <ReportAbuseButton
                onClick={() => {
                    showReportAbuseModal({
                        drive: getDrivePerNodeType(invitation.type),
                        nodeUid: invitation.nodeUid,
                        invitation: {
                            uid: invitation.invitation.uid,
                            name: invitation.name,
                            size: invitation.size,
                            mediaType: invitation.mediaType,
                            type: invitation.type,
                        },
                        prefilled: {
                            email: user.Email,
                        },
                    });
                }}
                {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
            />
        </>
    );
};
