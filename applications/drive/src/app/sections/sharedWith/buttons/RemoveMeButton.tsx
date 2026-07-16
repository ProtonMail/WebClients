import { c } from 'ttag';

import type { useConfirmActionModal } from '@proton/components';
import { ToolbarButton } from '@proton/components';
import { type NodeType, getDrivePerNodeType } from '@proton/drive';
import { IcCrossBig } from '@proton/icons/icons/IcCrossBig';

import { useSharingActions } from '../../../legacy/hooks/drive/useSharingActions';
import { ContextMenuButton } from '../../../statelessComponents/ContextMenu';

interface BaseProps {
    nodeUid: string;
    type: NodeType;
}

interface ContextMenuProps extends BaseProps {
    buttonType: 'contextMenu';
    close: () => void;
    showConfirmModal: ReturnType<typeof useConfirmActionModal>[1];
}

interface ToolbarProps extends BaseProps {
    buttonType: 'toolbar';
    close?: never;
    showConfirmModal: ReturnType<typeof useConfirmActionModal>[1];
}

type Props = ContextMenuProps | ToolbarProps;

export const RemoveMeButton = ({ nodeUid, type, showConfirmModal, close, buttonType }: Props) => {
    const { removeMe } = useSharingActions();
    const title = c('Action').t`Remove me`;

    const handleRemoveMe = () => {
        removeMe(showConfirmModal, getDrivePerNodeType(type), nodeUid);
    };

    if (buttonType === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<IcCrossBig alt={title} />}
                onClick={handleRemoveMe}
                data-testid="toolbar-shared-with-me-leave"
            />
        );
    }

    return (
        <ContextMenuButton
            icon={<IcCrossBig />}
            name={title}
            action={handleRemoveMe}
            close={close}
            testId="shared-with-me-leave"
        />
    );
};
