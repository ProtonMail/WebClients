import { c } from 'ttag';

import { Loader } from '@proton/components';
import { LinkURLType } from '@proton/shared/lib/drive/constants';

import { TreeItem } from '../../../../../store';
import FileRecoveryIcon from '../../../../ResolveLockedVolumes/FileRecovery/FileRecoveryIcon';
import DriveSidebarListItem from '../DriveSidebarListItem';
import ExpandButton from './ExpandButton';

interface Props {
    path: string;
    shareId: string;
    linkId: string;
    rootFolder?: TreeItem;
    toggleExpand: (linkId: string) => void;
}

export default function DriveSidebarFoldersRoot({ path, shareId, linkId, rootFolder, toggleExpand }: Props) {
    const isLoading = !rootFolder?.isLoaded;

    const url = `/${shareId}/${LinkURLType.FOLDER}/${linkId}`;
    return (
        <DriveSidebarListItem
            key="root"
            to={url}
            icon="inbox"
            shareId={shareId}
            isActive={path === url}
            onDoubleClick={() => toggleExpand(linkId)}
        >
            <span className="text-ellipsis" title={c('Title').t`My files`}>
                {c('Title').t`My files`}
            </span>
            {isLoading ? (
                <Loader className="ml0-5 drive-sidebar--icon inline-flex" />
            ) : (
                rootFolder.children.length > 0 && (
                    <ExpandButton
                        className="ml0-5 flex-item-noshrink"
                        expanded={rootFolder.isExpanded}
                        onClick={() => toggleExpand(rootFolder.link.linkId)}
                    />
                )
            )}
            <FileRecoveryIcon className="ml0-5" />
        </DriveSidebarListItem>
    );
}
