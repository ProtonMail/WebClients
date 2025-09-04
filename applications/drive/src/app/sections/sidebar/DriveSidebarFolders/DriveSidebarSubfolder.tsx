import { useMemo } from 'react';

import { FileIcon, FileNameDisplay, Loader, SidebarListItem, SidebarListItemContent } from '@proton/components';
import { splitNodeUid } from '@proton/drive/index';

import SidebarListItemLink from '../../../components/layout/sidebar/SidebarListItemLink';
import type { SidebarItem } from '../hooks/useSidebar.store';
import { useSidebarStore } from '../hooks/useSidebar.store';
import { generateSidebarItemStyle } from '../utils';
import { DriveExpandButton } from './DriveExpandButton';

type Props = {
    shareId: string;
    item: SidebarItem;
    toggleExpand: () => void;
};

export const DriveSidebarSubfolder = ({ shareId, item, toggleExpand }: Props) => {
    const isLoading = Boolean(item?.isLoading);
    const isExpanded = Boolean(item?.isExpanded);
    const linkId = splitNodeUid(item.uid).nodeId;

    const { children } = useSidebarStore((state) => ({
        children: state.getChildren(item.uid),
    }));

    const shouldShowArrow = useMemo(() => children.length || !item.hasLoadedChildren, [item, children]);

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
                onDoubleClick={toggleExpand}
            >
                <SidebarListItemContent>
                    <div
                        className="flex flex-nowrap items-center gap-2"
                        data-testid="sidebar-sub-folders"
                        style={generateSidebarItemStyle(item.level)}
                    >
                        <DriveExpandButton expanded={isExpanded} onClick={toggleExpand} style={expandeButtonStyle} />

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
