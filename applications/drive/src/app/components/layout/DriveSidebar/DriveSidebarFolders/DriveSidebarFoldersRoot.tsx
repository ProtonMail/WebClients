import { Loader } from '@proton/components';

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

    const url = `/${rootFolder.shareId}/folder/${rootFolder.linkId}`;
    return (
        <DriveSidebarListItem
            key="root"
            to={url}
            icon="inbox"
            shareId={rootFolder.shareId}
            isActive={path === url}
            rightIcon={
                isLoading ? (
                    <Loader className="flex flex-align-items-center" />
                ) : (
                    rootFolder.subfolders && (
                        <ExpandButton expanded={rootFolder.expanded} onClick={() => toggleExpand(rootFolder.linkId)} />
                    )
                )
            }
        >
            {rootFolder.name}
            <FileRecoveryIcon className="ml0-5" />
        </DriveSidebarListItem>
    );
}
