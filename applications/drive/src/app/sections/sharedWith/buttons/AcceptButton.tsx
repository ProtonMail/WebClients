import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import type { NodeType } from '@proton/drive';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';

import { ContextMenuButton } from '../../../statelessComponents/ContextMenu';
import { useInvitationsActions } from '../hooks/useInvitationsActions';

interface BaseProps {
    nodeUid: string;
    invitationUid: string;
    type: NodeType;
}

interface ContextMenuProps extends BaseProps {
    buttonType: 'contextMenu';
    close: () => void;
}

interface ToolbarProps extends BaseProps {
    buttonType: 'toolbar';
    close?: never;
}

type Props = ContextMenuProps | ToolbarProps;
export const AcceptButton = ({ nodeUid, invitationUid, type, close, buttonType }: Props) => {
    const { acceptInvitation } = useInvitationsActions();
    const title = c('Action').t`Accept`;

    const handleAcceptInvitation = async () => {
        await acceptInvitation(nodeUid, invitationUid, type);
    };

    if (buttonType === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<IcCheckmark alt={title} />}
                onClick={handleAcceptInvitation}
                data-testid="toolbar-accept-invitation"
            />
        );
    }

    return (
        <ContextMenuButton
            icon={<IcCheckmark />}
            name={title}
            action={handleAcceptInvitation}
            close={close}
            testId="shared-with-me-accept-invitation"
        />
    );
};
