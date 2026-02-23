import type { useMoveItemsModal } from 'applications/drive/src/app/modals/MoveItemsModal';
import { c } from 'ttag';

import { generateNodeUid } from '@proton/drive/index';

import type { DecryptedLink } from '../../../../store';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    shareId: string;
    selectedLinks: DecryptedLink[];
    showMoveItemsModal: ReturnType<typeof useMoveItemsModal>['showMoveItemsModal'];
    close: () => void;
}

export const toNodeUidsHelper = <T extends { volumeId: string; linkId: string }>(items: T[]): string[] =>
    items.map((item) => generateNodeUid(item.volumeId, item.linkId));

const MoveToFolderButton = ({ shareId, selectedLinks, showMoveItemsModal, close }: Props) => {
    return (
        <ContextMenuButton
            name={c('Action').t`Move to folder`}
            icon="arrows-cross"
            testId="context-menu-move"
            action={() => showMoveItemsModal({ shareId, nodeUids: toNodeUidsHelper(selectedLinks) })}
            close={close}
        />
    );
};

export default MoveToFolderButton;
