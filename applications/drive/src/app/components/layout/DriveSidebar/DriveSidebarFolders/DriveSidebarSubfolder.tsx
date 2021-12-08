import {
    FileIcon,
    FileNameDisplay,
    Loader,
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemLink,
} from '@proton/components';

import { TreeItem } from '../../../../store';
import useSubfolderLoading from './useSubfolderLoading';
import ExpandButton from './ExpandButton';

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

    return (
        <SidebarListItem>
            <SidebarListItemLink
                to={`/${shareId}/folder/${folder.link.linkId}`}
                onClick={handleFolderClick}
                onDoubleClick={toggleExpand}
                title={folder.link.name}
            >
                <SidebarListItemContent>
                    <div className="flex flex-nowrap" style={{ marginLeft: `${(level * 10) / 16}rem` }}>
                        <ExpandButton className="mr0-5" expanded={folder.isExpanded} onClick={toggleExpand} />
                        {isLoading ? (
                            <Loader className="mr0-5 flex drive-sidebar--icon" />
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
