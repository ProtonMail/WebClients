import {
    FileIcon,
    FileNameDisplay,
    Loader,
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemLink,
} from '@proton/components';

import { Folder } from './useFolders';
import useSubfolderLoading from './useSubfolderLoading';
import ExpandButton from './ExpandButton';

interface Props {
    folder: Folder;
    level: number;
    toggleExpand: () => void;
}

export default function DriveSidebarSubfolder({ folder, level, toggleExpand }: Props) {
    const isLoading = useSubfolderLoading(folder);

    const handleExpandClick = (e: any) => {
        e.stopPropagation();
        e.preventDefault();
        toggleExpand();
    };

    const handleFolderClick = (e: any) => {
        if (e.detail !== 1) {
            e.stopPropagation();
            e.preventDefault();
        }
    };

    return (
        <SidebarListItem>
            <SidebarListItemLink
                to={`/${folder.shareId}/folder/${folder.linkId}`}
                onClick={handleFolderClick}
                onDoubleClick={handleExpandClick}
                title={folder.name}
            >
                <SidebarListItemContent>
                    <div className="flex flex-nowrap" style={{ marginLeft: `${level * 10}px` }}>
                        <ExpandButton className="mr0-5" expanded={folder.expanded} onClick={toggleExpand} />
                        {isLoading ? (
                            <Loader className="mr0-5 flex drive-sidebar--icon" />
                        ) : (
                            <FileIcon className="mr0-5 flex-item-centered-vert drive-sidebar--icon" mimeType="Folder" />
                        )}
                        <FileNameDisplay text={folder.name} />
                    </div>
                </SidebarListItemContent>
            </SidebarListItemLink>
        </SidebarListItem>
    );
}
