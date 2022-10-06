import { c } from 'ttag';

import { FolderIcon, HotkeyTuple, Icon, classnames } from '@proton/components';
import { formatFolderName } from '@proton/shared/lib/helpers/folder';
import { FolderWithSubFolders } from '@proton/shared/lib/interfaces/Folder';

import SidebarItem from './SidebarItem';

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
}: Props) => {
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

    const noChevron = treeMode ? <span className="navigation-icon-empty flex-item-noshrink" /> : null;

    return (
        <SidebarItem
            currentLabelID={currentLabelID}
            labelID={folder.ID}
            isFolder
            text={folder.Name}
            unreadCount={unreadCount}
            shortcutHandlers={shortcutHandlers}
            id={id}
            onFocus={onFocus}
            content={
                <div className="flex flex-nowrap flex-align-items-center" data-level={level}>
                    {folder.subfolders?.length ? (
                        <button
                            type="button"
                            className="mr0-5 flex-item-noshrink navigation-link--expand"
                            aria-expanded={!!folder.Expanded}
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                onToggle(folder, !expanded);
                            }}
                        >
                            <Icon
                                name="chevron-down"
                                className={classnames([
                                    'navigation-icon navigation-icon--expand',
                                    !folder.Expanded && 'rotateZ-270',
                                ])}
                            />
                        </button>
                    ) : (
                        noChevron
                    )}
                    <FolderIcon
                        className="mr0-5 navigation-icon flex-item-noshrink"
                        alt={c('Info').t`Folder`}
                        folder={folder}
                    />
                    <span className="text-ellipsis pr0-5">{formatFolderName(level, folder.Name)}</span>
                </div>
            }
        />
    );
};

export default SidebarFolder;
