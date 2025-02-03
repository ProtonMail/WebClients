import { c } from 'ttag';

import { Loader } from '@proton/components';
import { LinkURLType } from '@proton/shared/lib/drive/constants';
import clsx from '@proton/utils/clsx';

import type { TreeItem } from '../../../../../store';
import FileRecoveryIcon from '../../../../ResolveLockedVolumes/FileRecovery/FileRecoveryIcon';
import DriveSidebarListItem from '../DriveSidebarListItem';
import ExpandButton from './DriveExpandButton';

interface DriveSidebarFoldersRootProps {
    shareId: string;
    linkId: string;
    rootFolder?: TreeItem;
    toggleExpand: (linkId: string) => void;
    collapsed: boolean;
}

export default function DriveSidebarFoldersRoot({
    shareId,
    linkId,
    rootFolder,
    toggleExpand,
    collapsed,
}: DriveSidebarFoldersRootProps) {
    const isLoading = !rootFolder?.isLoaded;

    const url = `/${shareId}/${LinkURLType.FOLDER}/${linkId}`;
    return (
        <DriveSidebarListItem
            key="root"
            to={url}
            icon="inbox"
            shareId={shareId}
            isActive={(match) => match?.url === url}
            onDoubleClick={() => toggleExpand(linkId)}
            collapsed={collapsed}
        >
            <span className={clsx('text-ellipsis', collapsed && 'sr-only')}>{c('Title').t`My files`}</span>
            {isLoading ? (
                <Loader className="drive-sidebar--icon inline-flex" />
            ) : (
                rootFolder.children.length > 0 && (
                    <ExpandButton
                        className="shrink-0"
                        expanded={rootFolder.isExpanded}
                        onClick={() => toggleExpand(rootFolder.link.linkId)}
                    />
                )
            )}
            <FileRecoveryIcon className="ml-2" />
        </DriveSidebarListItem>
    );
}
