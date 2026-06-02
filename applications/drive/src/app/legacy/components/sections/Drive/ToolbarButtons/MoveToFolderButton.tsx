import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { generateNodeUid } from '@proton/drive/index';
import { useMoveItemsModal } from '@proton/drive/modals/moveItemsModal';
import { IcArrowsCross } from '@proton/icons/icons/IcArrowsCross';

import type { DecryptedLink } from '../../../../../legacy/store';

interface Props {
    selectedLinks: DecryptedLink[];
}

export const toNodeUidsHelper = <T extends { volumeId: string; linkId: string }>(items: T[]): string[] =>
    items.map((item) => generateNodeUid(item.volumeId, item.linkId));

const MoveToFolderButton = ({ selectedLinks }: Props) => {
    const { moveItemsModal, showMoveItemsModal } = useMoveItemsModal();

    return (
        <>
            <ToolbarButton
                title={c('Action').t`Move to folder`}
                icon={<IcArrowsCross alt={c('Action').t`Move to folder`} />}
                onClick={() => showMoveItemsModal({ nodeUids: toNodeUidsHelper(selectedLinks) })}
                data-testid="toolbar-move"
            />
            {moveItemsModal}
        </>
    );
};

export default MoveToFolderButton;
