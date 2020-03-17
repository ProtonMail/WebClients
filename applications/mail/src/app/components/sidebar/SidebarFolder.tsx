import React, { MouseEvent } from 'react';
import { classnames, Icon } from 'react-components';
import { FolderWithSubFolders } from 'proton-shared/lib/interfaces/Folder';
import { formatFolderName } from 'proton-shared/lib/helpers/folder';

import SidebarItem from './SidebarItem';

interface Props {
    currentLabelID: string;
    isConversation: boolean;
    folder: FolderWithSubFolders;
    level: number;
    onToggle: (event: MouseEvent) => void;
}

const SidebarFolder = ({ currentLabelID, folder, level, onToggle, isConversation }: Props) => {
    return (
        <SidebarItem
            currentLabelID={currentLabelID}
            labelID={folder.ID}
            isFolder={true}
            isConversation={isConversation}
            text={folder.Name}
            content={
                <div className="flex flex-nowrap" data-level={level}>
                    <Icon
                        className="mr0-5 navigation__icon flex-item-noshrink"
                        name={folder.subfolders?.length ? 'parent-folder' : 'folder'}
                    />
                    <span className="ellipsis pr0-5" title={folder.Name}>
                        {formatFolderName(level, folder.Name)}
                    </span>
                    {folder.subfolders?.length ? (
                        <button
                            type="button"
                            className="mr0-5 flex-item-noshrink navigation__link--expand"
                            aria-expanded={!!folder.Expanded}
                            onClick={onToggle}
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
