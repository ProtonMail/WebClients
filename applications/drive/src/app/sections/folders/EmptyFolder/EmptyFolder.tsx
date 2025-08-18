import { useEffect, useState } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { usePopperAnchor } from '@proton/components';
import emptySvg from '@proton/styles/assets/img/illustrations/empty-my-files.svg';

import { DriveEmptyView } from '../../../components/layout/DriveEmptyView';
import { FolderContextMenu } from '../FolderBrowser/FolderContextMenu';
import { useFolderStore } from '../useFolder.store';

export const EmptyFolder = ({ shareId, linkId }: { shareId: string; linkId: string }) => {
    const { anchorRef, isOpen, open, close } = usePopperAnchor<HTMLDivElement>();
    const [contextMenuPosition, setContextMenuPosition] = useState<{ top: number; left: number }>();
    const { permissions } = useFolderStore(
        useShallow((state) => ({
            permissions: state.permissions,
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

    return (
        <>
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
            <FolderContextMenu
                shareId={shareId}
                linkId={linkId}
                isOpen={isOpen}
                open={open}
                close={close}
                position={contextMenuPosition}
                anchorRef={anchorRef}
            />
        </>
    );
};
