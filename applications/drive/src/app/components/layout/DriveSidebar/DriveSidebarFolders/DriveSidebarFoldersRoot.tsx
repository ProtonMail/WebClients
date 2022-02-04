import { Loader } from '@proton/components';
import { LinkURLType } from '@proton/shared/lib/drive/constants';

import FileRecoveryIcon from '../../../ResolveLockedVolumes/FileRecovery/FileRecoveryIcon';
import DriveSidebarListItem from '../DriveSidebarListItem';
import { Folder } from './useFolders';
import useSubfolderLoading from './useSubfolderLoading';
import ExpandButton from './ExpandButton';

interface Props {
    path: string;
    rootFolder: Folder;
    toggleExpand: (linkId: string) => void;
}

export default function DriveSidebarFoldersRoot({ path, rootFolder, toggleExpand }: Props) {
    const isLoading = useSubfolderLoading(rootFolder, true);

    const url = `/${rootFolder.shareId}/${LinkURLType.FOLDER}/${rootFolder.linkId}`;
    return (
        <DriveSidebarListItem
            key="root"
            to={url}
            icon="inbox"
            shareId={rootFolder.shareId}
            isActive={path === url}
            onDoubleClick={() => toggleExpand(rootFolder.linkId)}
        >
            <span className="text-ellipsis" title={rootFolder.name}>
                {rootFolder.name}
            </span>
            {isLoading ? (
                <Loader className="ml0-5 drive-sidebar--icon inline" />
            ) : (
                rootFolder.subfolders && (
                    <ExpandButton
                        className="ml0-5 flex-item-noshrink"
                        expanded={rootFolder.expanded}
                        onClick={() => toggleExpand(rootFolder.linkId)}
                    />
                )
            )}
            <FileRecoveryIcon className="ml0-5" />
        </DriveSidebarListItem>
    );
}
