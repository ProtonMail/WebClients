import { useEffect, useMemo } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { FileIcon, FileNameDisplay, Loader, SidebarListItem, SidebarListItemContent } from '@proton/components';
import { splitNodeUid } from '@proton/drive/index';

import SidebarListItemLink from '../../../components/layout/sidebar/SidebarListItemLink';
import type { SidebarItem } from '../hooks/useSidebar.store';
import { useSidebarStore } from '../hooks/useSidebar.store';
import { useSidebarFolders } from '../hooks/useSidebarFolders';
import { generateSidebarItemStyle } from '../utils';
import { DriveExpandButton } from './DriveExpandButton';

type Props = {
    shareId: string;
    item: SidebarItem;
};

export const DriveSidebarSubfolder = ({ shareId, item }: Props) => {
    const { toggleExpand } = useSidebarFolders();
    const isLoading = Boolean(item?.isLoading);
    const isExpanded = Boolean(item?.isExpanded);
    const linkId = splitNodeUid(item.uid).nodeId;
    const { children, setSidebarLevel } = useSidebarStore(
        useShallow((state) => ({
            children: state.getChildren(item.uid),
            setSidebarLevel: state.setSidebarLevel,
        }))
    );

    const shouldShowArrow = useMemo(() => children.length || !item.hasLoadedChildren, [item, children]);

    useEffect(() => {
        setSidebarLevel(item.level);
    }, [item.level, setSidebarLevel]);

    const handleFolderClick = (e: any) => {
        if (e.detail !== 1) {
            e.stopPropagation();
            e.preventDefault();
        }
    };

    const expandeButtonStyle: React.CSSProperties = !shouldShowArrow
        ? {
              visibility: 'hidden',
          }
        : {};

    return (
        <SidebarListItem>
            <SidebarListItemLink
                to={`/${shareId}/folder/${linkId}`}
                onClick={handleFolderClick}
                onDoubleClick={() => toggleExpand(item.uid)}
            >
                <SidebarListItemContent>
                    <div
                        className="flex flex-nowrap items-center gap-2"
                        data-testid="sidebar-sub-folders"
                        style={generateSidebarItemStyle(item.level)}
                    >
                        <DriveExpandButton
                            expanded={isExpanded}
                            onClick={() => toggleExpand(item.uid)}
                            style={expandeButtonStyle}
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
    );
};
