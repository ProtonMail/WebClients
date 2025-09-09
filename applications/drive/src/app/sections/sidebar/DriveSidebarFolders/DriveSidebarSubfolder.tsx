import { FileIcon, FileNameDisplay, Loader, SidebarListItem, SidebarListItemContent } from '@proton/components';

import SidebarListItemLink from '../../../components/layout/sidebar/SidebarListItemLink';
import type { TreeItem } from '../../../store';
import { generateSidebarItemStyle } from '../utils';
import { DriveExpandButton } from './DriveExpandButton';
import { useSubfolderLoading } from './useSubfolderLoading';

interface Props {
    shareId: string;
    folder: TreeItem;
    level: number;
    toggleExpand: () => void;
}

export const DriveSidebarSubfolder = ({ shareId, folder, level, toggleExpand }: Props) => {
    const isLoading = useSubfolderLoading(folder);

    const handleFolderClick = (e: any) => {
        if (e.detail !== 1) {
            e.stopPropagation();
            e.preventDefault();
        }
    };

    const expandeButtonStyle: React.CSSProperties =
        folder.children.length === 0 && folder.isLoaded
            ? {
                  visibility: 'hidden',
              }
            : {};

    return (
        <SidebarListItem>
            <SidebarListItemLink
                to={`/${shareId}/folder/${folder.link.linkId}`}
                onClick={handleFolderClick}
                onDoubleClick={toggleExpand}
            >
                <SidebarListItemContent>
                    <div
                        className="flex flex-nowrap items-center gap-2"
                        data-testid="sidebar-sub-folders"
                        style={generateSidebarItemStyle(level)}
                    >
                        <DriveExpandButton
                            expanded={folder.isExpanded}
                            onClick={toggleExpand}
                            style={expandeButtonStyle}
                        />
                        {isLoading ? (
                            <Loader className="flex shrink-0 drive-sidebar--icon" />
                        ) : (
                            <FileIcon className="self-center my-auto drive-sidebar--icon" mimeType="Folder" />
                        )}
                        <FileNameDisplay text={folder.link.name} />
                    </div>
                </SidebarListItemContent>
            </SidebarListItemLink>
        </SidebarListItem>
    );
};
