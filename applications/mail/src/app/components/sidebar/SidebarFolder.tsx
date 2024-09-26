import { useState } from 'react';

import { c } from 'ttag';

import type { HotkeyTuple } from '@proton/components';
import { FolderIcon, Icon } from '@proton/components';
import { formatFolderName } from '@proton/shared/lib/helpers/folder';
import type { FolderWithSubFolders } from '@proton/shared/lib/interfaces/Folder';
import clsx from '@proton/utils/clsx';

import type { ApplyLabelsParams } from '../../hooks/actions/label/useApplyLabels';
import type { MoveParams } from '../../hooks/actions/move/useMoveToFolder';
import SidebarItem from './SidebarItem';
import SidebarLabelActions from './SidebarLabelActions';

interface Props {
    currentLabelID: string;
    folder: FolderWithSubFolders;
    level: number;
    onToggle: (folder: FolderWithSubFolders, expanded: boolean) => void;
    unreadCount?: number;
    expanded?: boolean;
    onFocus: (id: string) => void;
    id: string;
    treeMode?: boolean;
    moveToFolder: (params: MoveParams) => void;
    applyLabels: (params: ApplyLabelsParams) => void;
}

const SidebarFolder = ({
    currentLabelID,
    folder,
    level,
    onToggle,
    unreadCount,
    expanded,
    onFocus,
    id,
    treeMode = true,
    moveToFolder,
    applyLabels,
}: Props) => {
    const [isOptionDropdownOpened, setIsOptionDropdownOpened] = useState(false);
    const shortcutHandlers: HotkeyTuple[] = [
        [
            'ArrowRight',
            (e) => {
                if (!expanded) {
                    e.stopPropagation();
                    onToggle(folder, true);
                }
            },
        ],
        [
            'ArrowLeft',
            () => {
                if (expanded) {
                    onToggle(folder, false);
                }
            },
        ],
    ];

    const noChevron = treeMode ? <span className="navigation-icon-empty shrink-0" /> : null;

    return (
        <SidebarItem
            currentLabelID={currentLabelID}
            labelID={folder.ID}
            isFolder
            text={folder.Name}
            unreadCount={unreadCount}
            shortcutHandlers={shortcutHandlers}
            moveToFolder={moveToFolder}
            applyLabels={applyLabels}
            id={id}
            onFocus={onFocus}
            isOptionDropdownOpened={isOptionDropdownOpened}
            content={
                <div className="flex flex-nowrap items-center gap-2" data-level={level}>
                    {folder.subfolders?.length ? (
                        <button
                            type="button"
                            className="shrink-0 navigation-link--expand relative interactive-pseudo-inset interactive--no-background"
                            aria-expanded={!!folder.Expanded}
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onToggle(folder, !expanded);
                            }}
                        >
                            <Icon
                                name="chevron-down-filled"
                                className={clsx([
                                    'navigation-icon navigation-icon--expand',
                                    !folder.Expanded && 'rotateZ-270',
                                ])}
                            />
                        </button>
                    ) : (
                        noChevron
                    )}
                    <FolderIcon className="navigation-icon shrink-0" alt={c('Info').t`Folder`} folder={folder} />
                    <div className="text-ellipsis">{formatFolderName(level, folder.Name)}</div>
                </div>
            }
            itemOptions={
                <SidebarLabelActions type={'folder'} element={folder} onToggleDropdown={setIsOptionDropdownOpened} />
            }
        />
    );
};

export default SidebarFolder;
