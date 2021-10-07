import { classnames, Icon, HotkeyTuple, FolderIcon } from '@proton/components';
import { FolderWithSubFolders } from '@proton/shared/lib/interfaces/Folder';
import { formatFolderName } from '@proton/shared/lib/helpers/folder';

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
}

const SidebarFolder = ({ currentLabelID, folder, level, onToggle, unreadCount, expanded, onFocus, id }: Props) => {
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
                    <FolderIcon className="mr0-5 navigation-icon flex-item-noshrink" folder={folder} />
                    <span className="text-ellipsis pr0-5">{formatFolderName(level, folder.Name)}</span>
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
                                name="angle-down"
                                className={classnames([
                                    'navigation-icon navigation-icon--expand',
                                    !!folder.Expanded && 'rotateX-180',
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
