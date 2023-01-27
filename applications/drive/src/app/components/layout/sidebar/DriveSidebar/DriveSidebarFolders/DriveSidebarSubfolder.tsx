import {
    FileIcon,
    FileNameDisplay,
    Loader,
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemLink,
} from '@proton/components';

import { TreeItem } from '../../../../../store';
import { generateSidebarItemStyle } from '../utils';
import ExpandButton from './ExpandButton';
import useSubfolderLoading from './useSubfolderLoading';

interface Props {
    shareId: string;
    folder: TreeItem;
    level: number;
    toggleExpand: () => void;
}

export default function DriveSidebarSubfolder({ shareId, folder, level, toggleExpand }: Props) {
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
                title={folder.link.name}
            >
                <SidebarListItemContent>
                    <div className="flex flex-nowrap" style={generateSidebarItemStyle(level)}>
                        <ExpandButton
                            className="mr0-5"
                            expanded={folder.isExpanded}
                            onClick={toggleExpand}
                            style={expandeButtonStyle}
                        />
                        {isLoading ? (
                            <Loader className="mr0-5 flex flex-item-noshrink drive-sidebar--icon" />
                        ) : (
                            <FileIcon className="mr0-5 flex-item-centered-vert drive-sidebar--icon" mimeType="Folder" />
                        )}
                        <FileNameDisplay text={folder.link.name} />
                    </div>
                </SidebarListItemContent>
            </SidebarListItemLink>
        </SidebarListItem>
    );
}
