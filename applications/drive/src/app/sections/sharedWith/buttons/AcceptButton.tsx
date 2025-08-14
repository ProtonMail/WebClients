import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import { NodeType } from '@proton/drive';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import useVolumesState from '../../../store/_volumes/useVolumesState';
import { useInvitationsActions } from '../hooks/useInvitationsActions';
import { useLegacyInvitationsActions } from '../legacy/useLegacyInvitationsActions';

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
    // TODO: Remove that when we will have sdk for upload
    const { setVolumeShareIds } = useVolumesState();
    const { acceptInvitation } = useInvitationsActions({ setVolumeShareIds });
    const { acceptLegacyInvitation } = useLegacyInvitationsActions();

    const handleAcceptInvitation = async () => {
        if (type === NodeType.Album) {
            await acceptLegacyInvitation(nodeUid, invitationUid);
        } else {
            await acceptInvitation(nodeUid, invitationUid);
        }
    };

    if (buttonType === 'toolbar') {
        return (
            <ToolbarButton
                title={c('Action').t`Accept`}
                icon={<Icon name="checkmark" alt={c('Action').t`Accept`} />}
                onClick={handleAcceptInvitation}
                data-testid="toolbar-accept-invitation"
            />
        );
    }

    return (
        <ContextMenuButton
            icon="checkmark"
            name={c('Action').t`Accept`}
            action={handleAcceptInvitation}
            close={close}
            testId="shared-with-me-accept-invitation"
        />
    );
};
