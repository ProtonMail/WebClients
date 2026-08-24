import { useMemo, useState } from 'react';

import { FileIcon, FileNameDisplay, Loader, SidebarListItem, SidebarListItemContent } from '@proton/components';
import { splitNodeUid } from '@proton/drive/index';
import type { TreeItemWithChildren } from '@proton/drive/modules/directoryTree';

import SidebarListItemLink from '../../../legacy/components/layout/sidebar/SidebarListItemLink';
import { useSidebarStore } from '../hooks/useSidebar.store';
import { generateSidebarItemStyle, sortChildrenByName } from '../utils';
import { DriveExpandButton } from './DriveExpandButton';

type SubfolderProps = {
    shareId: string;
    item: TreeItemWithChildren;
    toggleExpand: (treeItemId: string) => Promise<void>;
    level: number;
};

export const DriveSidebarSubfolder = ({ shareId, item, toggleExpand, level }: SubfolderProps) => {
    const { expandLevel, collapseLevel } = useSidebarStore((state) => ({
        expandLevel: state.expandLevel,
        collapseLevel: state.collapseLevel,
    }));
    const [isLoading, setIsLoading] = useState(false);
    const { nodeId: linkId } = splitNodeUid(item.nodeUid);
    const isExpanded = item.children !== null;
    const sortedChildItems = useMemo(() => sortChildrenByName(item.children), [item.children]);
    const shouldShowArrow = !item.hasLoadedChildren || item.hasChildren;

    const handleExpand = () => {
        if (isExpanded) {
            collapseLevel(item.treeItemId);
        } else {
            expandLevel(item.treeItemId, level + 1);
        }
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
        <>
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
            </SidebarListItem>
            {isExpanded &&
                sortedChildItems.map((childItem) => (
                    <DriveSidebarSubfolder
                        key={childItem.treeItemId}
                        shareId={shareId}
                        item={childItem}
                        toggleExpand={toggleExpand}
                        level={level + 1}
                    />
                ))}
        </>
    );
};
