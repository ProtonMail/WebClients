import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown';
import { IcThreeDotsVertical } from '@proton/icons/icons/IcThreeDotsVertical';

import { useMemoSelector } from '../../hooks/useMemoSelector';
import { selectItemsInFolder } from '../../store/selectors/items';
import { DropdownMenuButton } from '../Layout/Dropdown/DropdownMenuButton';
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
            label={c('Action').t`Move all items`}
            onClick={() => folderActions.moveItems(shareId, folderId, folderName)}
        />
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
                    label={c('Action').t`Rename`}
                    onClick={() => folderActions.edit(shareId, folderId, folderName)}
                />
            )}
            {canUseFolders && (
                <DropdownMenuButton
                    label={c('Action').t`Move folder`}
                    onClick={() => folderActions.move(shareId, folderId, folderName)}
                />
            )}
            <MoveAllItemsButton shareId={shareId} folderId={folderId} folderName={folderName} />
            <DropdownMenuButton
                danger
                label={c('Action').t`Delete`}
                onClick={() => folderActions.delete(shareId, folderId, folderName)}
            />
        </SimpleDropdown>
    );
};
