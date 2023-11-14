import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { usePopperAnchor } from '@proton/components';
import emptySvg from '@proton/styles/assets/img/illustrations/empty-my-files.svg';

import { DriveEmptyView } from '../../layout/DriveEmptyView';
import { FolderContextMenu } from './FolderContextMenu';

const EmptyFolder = ({ shareId }: { shareId: string }) => {
    const { anchorRef, isOpen, open, close } = usePopperAnchor<HTMLDivElement>();
    const [contextMenuPosition, setContextMenuPosition] = useState<{ top: number; left: number }>();

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
                    // translator: Shown as a call to action when there are no files in a folder
                    c('Info').t`Drop files here`
                }
                subtitle={
                    // translator: Shown as a call to action when there are no files in a folder
                    c('Info').t`Or use the "+ New" button`
                }
                ref={anchorRef}
                onClick={close}
                dataTestId="my-files-empty-placeholder"
            />
            <FolderContextMenu
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
