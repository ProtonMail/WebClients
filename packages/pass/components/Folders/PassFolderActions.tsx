import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown';
import { IcThreeDotsVertical } from '@proton/icons/icons/IcThreeDotsVertical';

import { useMemoSelector } from '../../hooks/useMemoSelector';
import { selectItemsInFolder } from '../../store/selectors';
import { useFolderActions } from './FolderActionsProvider';
import { useFoldersAccess } from './useFoldersAccess';

interface Props {
    shareId: string;
    folderId: string;
    folderName: string;
    onToggleDropdown: (value: boolean) => void;
}

/** Rendered inside the dropdown so the item lookup only runs when it is opened */
const MoveAllItemsButton: FC<Pick<Props, 'shareId' | 'folderId' | 'folderName'>> = ({
    shareId,
    folderId,
    folderName,
}) => {
    const folderActions = useFolderActions();
    const items = useMemoSelector(selectItemsInFolder, [shareId, folderId]);

    if (!items.length) return null;

    return (
        <DropdownMenuButton
            className="text-left"
            onClick={() => folderActions.moveItems(shareId, folderId, folderName)}
        >
            {c('Action').t`Move all items`}
        </DropdownMenuButton>
    );
};

export const PassFolderActions: FC<Props> = ({ shareId, folderId, folderName, onToggleDropdown }) => {
    const folderActions = useFolderActions();
    const { canUseFolders } = useFoldersAccess();

    return (
        <SimpleDropdown
            as={Button}
            className="rounded-sm"
            icon
            hasCaret={false}
            shape="ghost"
            size="small"
            content={<IcThreeDotsVertical alt={c('Title').t`Folder options`} />}
            onToggle={onToggleDropdown}
            /** Prevent 3 dots button from selecting the folder */
            onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
            }}
        >
            {canUseFolders && (
                <DropdownMenuButton
                    className="text-left"
                    onClick={() => folderActions.edit(shareId, folderId, folderName)}
                >
                    {c('Action').t`Rename`}
                </DropdownMenuButton>
            )}
            <MoveAllItemsButton shareId={shareId} folderId={folderId} folderName={folderName} />
            <DropdownMenuButton
                className="text-left color-danger"
                onClick={() => folderActions.delete(shareId, folderId, folderName)}
            >
                {c('Action').t`Delete`}
            </DropdownMenuButton>
        </SimpleDropdown>
    );
};
