import { type FC, useEffect } from 'react';

import { c, msgid } from 'ttag';

import noop from '@proton/utils/noop';

import { useMemoSelector } from '../../hooks/useMemoSelector';
import { intoBulkSelection } from '../../lib/items/item.utils';
import { selectChildFolders, selectItemsInFolder } from '../../store/selectors';
import { ConfirmationPrompt } from '../Confirmation/ConfirmationPrompt';
import { useItemsActions } from '../Item/ItemActionsProvider';

type Props = {
    shareId: string;
    folderId: string;
    folderName: string;
    onClose: () => void;
};

export const FolderMoveItemsConfirm: FC<Props> = ({ shareId, folderId, folderName, onClose }) => {
    const { moveMany } = useItemsActions();
    const items = useMemoSelector(selectItemsInFolder, [shareId, folderId]);
    const childFolders = useMemoSelector(selectChildFolders, [shareId, folderId]);
    const count = items.length;

    const onConfirm = () => {
        moveMany(intoBulkSelection(items));
        onClose();
    };

    /** Skip warning if there is no subfolder */
    const autoConfirm = childFolders.length === 0;
    useEffect(autoConfirm ? onConfirm : noop, []);

    return (
        !autoConfirm && (
            <ConfirmationPrompt
                onCancel={onClose}
                onConfirm={onConfirm}
                title={c('Title').t`Move all items?`}
                message={c('Info').ngettext(
                    msgid`Only ${count} item in "${folderName}" will be moved. Items in subfolders will not be moved.`,
                    `Only ${count} items in "${folderName}" will be moved. Items in subfolders will not be moved.`,
                    count
                )}
            />
        )
    );
};
