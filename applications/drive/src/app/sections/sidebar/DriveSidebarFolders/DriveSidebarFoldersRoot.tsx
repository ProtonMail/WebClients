import { c } from 'ttag';

import { Loader } from '@proton/components';
import { LinkURLType } from '@proton/shared/lib/drive/constants';
import clsx from '@proton/utils/clsx';

import FileRecoveryIcon from '../../../components/ResolveLockedVolumes/FileRecovery/FileRecoveryIcon';
import type { TreeItem } from '../../../store';
import { DriveSidebarListItem } from '../DriveSidebarListItem';
import { DriveExpandButton } from './DriveExpandButton';

interface DriveSidebarFoldersRootProps {
    shareId: string;
    linkId: string;
    rootFolder?: TreeItem;
    toggleExpand: (linkId: string) => void;
    collapsed: boolean;
}

export const DriveSidebarFoldersRoot = ({
    shareId,
    linkId,
    rootFolder,
    toggleExpand,
    collapsed,
}: DriveSidebarFoldersRootProps) => {
    const isLoading = !rootFolder?.isLoaded;

    const url = `/${shareId}/${LinkURLType.FOLDER}/${linkId}`;
    return (
        <DriveSidebarListItem
            key="root"
            to={url}
            icon="inbox"
            shareId={shareId}
            onDoubleClick={() => toggleExpand(linkId)}
            collapsed={collapsed}
        >
            <span className={clsx('text-ellipsis', collapsed && 'sr-only')}>{c('Title').t`My files`}</span>
            {isLoading ? (
                <Loader className="drive-sidebar--icon inline-flex" />
            ) : (
                rootFolder.children.length > 0 && (
                    <DriveExpandButton
                        className="shrink-0"
                        expanded={rootFolder.isExpanded}
                        onClick={() => toggleExpand(rootFolder.link.linkId)}
                    />
                )
            )}
            <FileRecoveryIcon className="ml-2" />
        </DriveSidebarListItem>
    );
};
