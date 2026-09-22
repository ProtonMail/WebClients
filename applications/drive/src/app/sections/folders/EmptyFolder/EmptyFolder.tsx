import { useEffect, useState } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import { useFlagsDriveEasySwitch } from '@proton/drive/modules/flags';
import emptySvg from '@proton/styles/assets/img/illustrations/empty-my-files.svg';

import { DriveEmptyView } from '../../../legacy/components/layout/DriveEmptyView';
import { useIsFreeUploadInProgress } from '../../../modules/freeUpload';
import { FolderContextMenu } from '../menus/FolderContextMenu';
import { useFolderStore } from '../useFolder.store';
import type { FolderActions, FolderUploadFile, FolderUploadFolder } from '../useFolderActions';
import { DriveEmptyViewFreeUpload } from './DriveEmptyViewFreeUpload';
import { EmptyRootFolder } from './EmptyRootFolder';

const getEmptyContent = (
    isFreeUploadInProgress: boolean,
    folder: ReturnType<typeof useFolderStore.getState>['folder'],
    anchorRef: React.RefObject<HTMLDivElement>,
    close: () => void,
    permissions: ReturnType<typeof useFolderStore.getState>['permissions'],
    isEasySwitchNewUIEnabled: boolean
) => {
    if (isFreeUploadInProgress && folder?.isRoot) {
        return <DriveEmptyViewFreeUpload />;
    }

    if (folder?.isRoot && isEasySwitchNewUIEnabled) {
        return <EmptyRootFolder ref={anchorRef} onClick={close} dataTestId="my-files-empty-placeholder" />;
    }

    return (
        <DriveEmptyView
            image={emptySvg}
            title={
                permissions.canCreateNode
                    ? // translator: Shown as a call to action when there are no files in a folder
                      c('Info').t`Drop files here`
                    : c('Info').t`Empty folder`
            }
            subtitle={
                permissions.canCreateNode
                    ? // translator: Shown as a call to action when there are no files in a folder
                      c('Info').t`Or use the "+ New" button`
                    : c('Info').t`There is nothing to see here`
            }
            ref={anchorRef}
            onClick={close}
            dataTestId="my-files-empty-placeholder"
        />
    );
};

export const EmptyFolder = ({
    actions,
    uploadFile,
    uploadFolder,
}: {
    actions: FolderActions;
    uploadFile: FolderUploadFile;
    uploadFolder: FolderUploadFolder;
}) => {
    const { anchorRef, isOpen, open, close } = usePopperAnchor<HTMLDivElement>();
    const [contextMenuPosition, setContextMenuPosition] = useState<{ top: number; left: number }>();
    const { permissions, folder } = useFolderStore(
        useShallow((state) => ({
            permissions: state.permissions,
            folder: state.folder,
        }))
    );

    useEffect(() => {
        if (!anchorRef.current) {
            return;
        }

        const node = anchorRef.current;

        const handleContextMenu = (ev: MouseEvent) => {
            ev.stopPropagation();
            ev.preventDefault();

            if (isOpen) {
                close();
            }

            setContextMenuPosition({ top: ev.clientY, left: ev.clientX });
        };

        node.addEventListener('contextmenu', handleContextMenu);

        return () => {
            node.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [anchorRef, isOpen, close, setContextMenuPosition]);

    const isFreeUploadInProgress = useIsFreeUploadInProgress();
    const { isEasySwitchNewUIEnabled } = useFlagsDriveEasySwitch();

    return (
        <>
            {getEmptyContent(isFreeUploadInProgress, folder, anchorRef, close, permissions, isEasySwitchNewUIEnabled)}
            <FolderContextMenu
                isOpen={isOpen}
                open={open}
                close={close}
                position={contextMenuPosition}
                anchorRef={anchorRef}
                actions={actions}
                uploadFile={uploadFile}
                uploadFolder={uploadFolder}
            />
        </>
    );
};
