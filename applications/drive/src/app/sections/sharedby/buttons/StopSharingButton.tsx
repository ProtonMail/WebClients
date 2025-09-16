import { c } from 'ttag';

import { Icon, ToolbarButton, type useConfirmActionModal } from '@proton/components';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
import { useSharingActions } from '../../../hooks/drive/useSharingActions';

interface BaseProps {
    uid: string;
    parentUid: string | undefined;
    showConfirmModal: ReturnType<typeof useConfirmActionModal>[1];
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
export const StopSharingButton = ({ uid, parentUid, showConfirmModal, close, buttonType }: Props) => {
    const { stopSharing } = useSharingActions();

    const handleClick = () => {
        stopSharing(showConfirmModal, uid, parentUid);
    };

    if (buttonType === 'toolbar') {
        return (
            <ToolbarButton
                title={c('Action').t`Stop sharing`}
                icon={<Icon name="link-slash" />}
                onClick={handleClick}
                data-testid="toolbar-button-stop-sharing"
            />
        );
    }

    return (
        <ContextMenuButton
            name={c('Action').t`Stop sharing`}
            icon="link-slash"
            testId="context-menu-stop-sharing"
            action={handleClick}
            close={close}
        />
    );
};
