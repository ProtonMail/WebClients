import { useState, useEffect } from 'react';
import { c } from 'ttag';

import { EmptyViewContainer, usePopperAnchor } from '@proton/components';

import noContentSvg from '@proton/styles/assets/img/placeholders/empty-folder.svg';
import UploadButton from '../../uploads/UploadButton';
import FolderContextMenu from './FolderContextMenu';

const EmptyFolder = () => {
    const { anchorRef, isOpen, open, close } = usePopperAnchor<HTMLDivElement>();
    const [contextMenuPosition, setContextMenuPosition] = useState<{ top: number; left: number }>();

    useEffect(() => {
        if (!anchorRef.current) {
            return;
        }

        const handleContextMenu = (ev: MouseEvent) => {
            ev.stopPropagation();
            ev.preventDefault();

            if (isOpen) {
                close();
            }

            setContextMenuPosition({ top: ev.clientY, left: ev.clientX });
        };

        anchorRef.current.addEventListener('contextmenu', handleContextMenu);

        return () => {
            anchorRef.current?.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [anchorRef, isOpen, close, setContextMenuPosition]);

    return (
        <>
            <div role="presentation" ref={anchorRef} onClick={close} className="flex w100 flex flex-item-fluid">
                <EmptyViewContainer imageProps={{ src: noContentSvg, title: c('Info').t`There are no files yet` }}>
                    <h3 className="text-bold">{c('Info').t`There are no files yet`}</h3>
                    <p>{c('Info').t`Drag and drop a file here or choose to upload.`}</p>
                    <div className="flex flex-justify-center">
                        <UploadButton className="w13e" />
                    </div>
                </EmptyViewContainer>
            </div>
            <FolderContextMenu
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
