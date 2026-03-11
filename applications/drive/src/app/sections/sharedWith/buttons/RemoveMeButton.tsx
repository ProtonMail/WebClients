import { c } from 'ttag';

import type { useConfirmActionModal } from '@proton/components';
import { ToolbarButton } from '@proton/components';
import { type NodeType, getDrivePerNodeType } from '@proton/drive';
import { IcCrossBig } from '@proton/icons/icons/IcCrossBig';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import { useSharingActions } from '../../../hooks/drive/useSharingActions';

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

    const handleRemoveMe = () => {
        removeMe(showConfirmModal, getDrivePerNodeType(type), nodeUid);
    };

    if (buttonType === 'toolbar') {
        return (
            <ToolbarButton
                title={c('Action').t`Remove me`}
                icon={<IcCrossBig alt={c('Action').t`Remove me`} />}
                onClick={handleRemoveMe}
                data-testid="toolbar-shared-with-me-leave"
            />
        );
    }

    return (
        <ContextMenuButton
            icon="cross-big"
            name={c('Action').t`Remove me`}
            action={handleRemoveMe}
            close={close}
            testId="shared-with-me-leave"
        />
    );
};
