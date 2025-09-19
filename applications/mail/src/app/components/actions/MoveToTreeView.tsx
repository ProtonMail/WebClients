import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { FolderIcon, Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';

import type { FolderItem } from 'proton-mail/hooks/useMailTreeView/interface';

import { MoveToPlaceholders } from './MoveToComponents';

import './MoveToTreeView.scss';

interface Props {
    search: string;
    treeView: FolderItem[];
    selectedFolder: FolderItem | null;
    handleSelectFolder: (folder: FolderItem) => void;
    addRef?: (itemId: string, element: HTMLLIElement | null) => void;
}

export const MoveToTreeView = ({ treeView, selectedFolder, handleSelectFolder, search, addRef }: Props) => {
    return (
        <div className="move-tree-view overflow-auto scrollbar-always-visible flex-auto">
            {treeView.length === 0 ? (
                <MoveToPlaceholders emptyListCopy={c('Info').t`No folder found`} search={search} />
            ) : (
                <ul className="unstyled my-0 mb-4">
                    {treeView.map((folder, index) => (
                        <li
                            key={folder.ID}
                            className={clsx(index === 0 && 'mt-3')}
                            ref={(element) => addRef?.(folder.ID, element)}
                        >
                            <Button
                                fullWidth
                                shape={selectedFolder?.ID === folder.ID ? 'solid' : 'ghost'}
                                color={selectedFolder?.ID === folder.ID ? 'weak' : undefined}
                                className="text-left"
                                onClick={() => handleSelectFolder(folder)}
                                aria-pressed={selectedFolder?.ID === folder.ID}
                                data-testid={`move-to-button-${folder.Name}`}
                            >
                                <div data-level={folder.level} className="flex">
                                    <FolderIcon
                                        folder={folder}
                                        name={folder.icon}
                                        dataColor={folder?.folderIconProps?.color}
                                        className={clsx('shrink-0 mr-2 mt-0.5', folder?.folderIconProps?.className)}
                                    />
                                    <span className="text-ellipsis flex-1" title={folder.Name}>
                                        {folder.Name}
                                    </span>
                                    {selectedFolder?.ID === folder.ID && (
                                        <Icon
                                            name="checkmark"
                                            data-testid={`move-to-selected-icon-${folder.Name}`}
                                            className="text-success shrink-0 mt-0.5"
                                        />
                                    )}
                                </div>
                            </Button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
