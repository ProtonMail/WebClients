import React, { MouseEvent } from 'react';
import { classnames, Icon } from 'react-components';
import { FolderWithSubFolders } from 'proton-shared/lib/interfaces/Folder';
import { formatFolderName } from 'proton-shared/lib/helpers/folder';

import SidebarItem from './SidebarItem';

interface Props {
    currentLabelID: string;
    folder: FolderWithSubFolders;
    level: number;
    onToggle: (event: MouseEvent, folder: FolderWithSubFolders) => void;
    unreadCount?: number;
}

const SidebarFolder = ({ currentLabelID, folder, level, onToggle, unreadCount }: Props) => {
    return (
        <SidebarItem
            currentLabelID={currentLabelID}
            labelID={folder.ID}
            isFolder={true}
            text={folder.Name}
            unreadCount={unreadCount}
            content={
                <div className="flex flex-nowrap" data-level={level}>
                    <Icon
                        className="mr0-5 navigation__icon flex-item-noshrink"
                        name={folder.subfolders?.length ? 'parent-folder' : 'folder'}
                    />
                    <span className="ellipsis pr0-5">{formatFolderName(level, folder.Name)}</span>
                    {folder.subfolders?.length ? (
                        <button
                            type="button"
                            className="mr0-5 flex-item-noshrink navigation__link--expand"
                            aria-expanded={!!folder.Expanded}
                            onClick={(event) => onToggle(event, folder)}
                        >
                            <Icon
                                name="caret"
                                className={classnames([
                                    'navigation__icon navigation__icon--expand',
                                    !!folder.Expanded && 'rotateX-180'
                                ])}
                            />
                        </button>
                    ) : null}
                </div>
            }
        />
    );
};

export default SidebarFolder;
