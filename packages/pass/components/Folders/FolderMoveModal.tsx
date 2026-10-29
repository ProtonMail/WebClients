import type { FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c } from 'ttag';

import { useMemoSelector } from '../../hooks/useMemoSelector';
import { type FolderMoveBlockReason, getFolderMoveBlockReason } from '../../lib/folders/folder.utils';
import { folderMove } from '../../store/actions/creators/folders';
import { selectFolder, selectFolderLimits, selectShareFolders } from '../../store/selectors/folders';
import { VaultSelect, VaultSelectMode } from '../Vault/VaultSelect';

const getFolderMoveBlockMessage = (reason: FolderMoveBlockReason): string => {
    switch (reason) {
        case 'current':
            return c('Info').t`The folder is already here`;
        case 'descendant':
            return c('Warning').t`You can't move a folder into itself or its subfolders`;
        case 'children':
            return c('Warning').t`You've reached the maximum number of folders at this level`;
        case 'depth':
            return c('Warning').t`Moving the folder here would exceed the maximum folder nesting level`;
    }
};

interface Props {
    shareId: string;
    folderId: string;
    folderName: string;
    onClose: () => void;
}

export const FolderMoveModal: FC<Props> = ({ shareId, folderId, folderName, onClose }) => {
    const dispatch = useDispatch();
    const folder = useSelector(selectFolder(shareId, folderId));
    const shareFolders = useMemoSelector(selectShareFolders, [shareId]);
    const limits = useSelector(selectFolderLimits);

    return (
        <VaultSelect
            open
            mode={VaultSelectMode.Writable}
            shareId={shareId}
            folderId={folder?.parentFolderId ?? null}
            showFolders
            currentVaultOnly
            title={c('Title').t`Move "${folderName}" to`}
            getDisabledReason={(_, targetFolderId) => {
                const reason = getFolderMoveBlockReason(shareFolders, folderId, targetFolderId, limits);
                return reason ? getFolderMoveBlockMessage(reason) : null;
            }}
            onSubmit={(_, targetParentFolderId) => {
                dispatch(folderMove.intent({ shareId, folderId, targetParentFolderId }));
                onClose();
            }}
            onClose={onClose}
        />
    );
};
