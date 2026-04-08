import { useEffect, useState } from 'react';

import { FileIcon, FileNameDisplay, Loader, SidebarListItem, SidebarListItemContent } from '@proton/components';
import { splitNodeUid } from '@proton/drive/index';

import SidebarListItemLink from '../../../components/layout/sidebar/SidebarListItemLink';
import type { TreeItemWithChildren } from '../../../modules/directoryTree';
import { useSidebarStore } from '../hooks/useSidebar.store';
import { generateSidebarItemStyle } from '../utils';
import { DriveExpandButton } from './DriveExpandButton';
import { DriveSidebarSubfolders } from './DriveSidebarSubfolders';

type Props = {
    shareId: string;
    item: TreeItemWithChildren;
    toggleExpand: (treeItemId: string) => Promise<void>;
    level: number;
};

export const DriveSidebarSubfolder = ({ shareId, item, toggleExpand, level }: Props) => {
    const { setSidebarLevel } = useSidebarStore((state) => ({ setSidebarLevel: state.setSidebarLevel }));
    const [isLoading, setIsLoading] = useState(false);
    const { nodeId: linkId } = splitNodeUid(item.nodeUid);
    const isExpanded = item.children !== null;
    const children = item.children ? Object.values(item.children) : [];
    const shouldShowArrow = !item.hasLoadedChildren || item.hasChildren;

    useEffect(() => {
        setSidebarLevel(level);
    }, [level, setSidebarLevel]);

    const handleExpand = () => {
        setIsLoading(true);
        void toggleExpand(item.treeItemId).finally(() => setIsLoading(false));
    };

    const handleFolderClick = (e: React.MouseEvent) => {
        if (e.detail !== 1) {
            e.stopPropagation();
            e.preventDefault();
        }
    };

    return (
        <SidebarListItem>
            <SidebarListItemLink
                to={`/${shareId}/folder/${linkId}`}
                onClick={handleFolderClick}
                onDoubleClick={handleExpand}
            >
                <SidebarListItemContent>
                    <div
                        className="flex flex-nowrap items-center gap-2"
                        data-testid="sidebar-sub-folders"
                        style={generateSidebarItemStyle(level)}
                    >
                        <DriveExpandButton
                            expanded={isExpanded}
                            onClick={handleExpand}
                            style={shouldShowArrow ? undefined : { visibility: 'hidden' }}
                        />

                        {isLoading ? (
                            <Loader className="flex shrink-0 drive-sidebar--icon" />
                        ) : (
                            <FileIcon className="self-center my-auto drive-sidebar--icon" mimeType="Folder" />
                        )}
                        <FileNameDisplay text={item.name} />
                    </div>
                </SidebarListItemContent>
            </SidebarListItemLink>

            {isExpanded && children.length > 0 && (
                <DriveSidebarSubfolders
                    shareId={shareId}
                    children={children}
                    toggleExpand={toggleExpand}
                    level={level + 1}
                />
            )}
        </SidebarListItem>
    );
};
