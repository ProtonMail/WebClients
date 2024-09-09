import { useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { usePopperAnchor } from '@proton/components';
import type { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/constants';
import { getCanWrite } from '@proton/shared/lib/drive/permissions';
import emptySvg from '@proton/styles/assets/img/illustrations/empty-my-files.svg';

import { DriveEmptyView } from '../../layout/DriveEmptyView';
import { FolderContextMenu } from './FolderContextMenu';

const EmptyFolder = ({ shareId, permissions }: { shareId: string; permissions: SHARE_MEMBER_PERMISSIONS }) => {
    const { anchorRef, isOpen, open, close } = usePopperAnchor<HTMLDivElement>();
    const [contextMenuPosition, setContextMenuPosition] = useState<{ top: number; left: number }>();

    const isEditor = useMemo(() => getCanWrite(permissions), [permissions]);

    useEffect(() => {
        if (!anchorRef.current) {
            return;
        }

        let node = anchorRef.current;

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
                    isEditor
                        ? // translator: Shown as a call to action when there are no files in a folder
                          c('Info').t`Drop files here`
                        : c('Info').t`Empty folder`
                }
                subtitle={
                    isEditor
                        ? // translator: Shown as a call to action when there are no files in a folder
                          c('Info').t`Or use the "+ New" button`
                        : c('Info').t`There is nothing to see here`
                }
                ref={anchorRef}
                onClick={close}
                dataTestId="my-files-empty-placeholder"
            />
            <FolderContextMenu
                permissions={permissions}
                shareId={shareId}
                isOpen={isOpen}
                open={open}
                close={close}
                position={contextMenuPosition}
                anchorRef={anchorRef}
            />
        </>
    );
};

export default EmptyFolder;
