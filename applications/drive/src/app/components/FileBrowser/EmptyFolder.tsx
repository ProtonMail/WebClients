import React, { useState, useEffect } from 'react';
import { c } from 'ttag';

import { IllustrationPlaceholder, usePopperAnchor } from 'react-components';

import noContentSvg from 'design-system/assets/img/placeholders/empty-folder.svg';
import UploadButton from '../uploads/UploadButton';
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
            <div role="presentation" ref={anchorRef} onClick={close} className="p2 mt2 flex w100 flex flex-item-fluid">
                <IllustrationPlaceholder url={noContentSvg} title={c('Info').t`There are no files yet`}>
                    <p className="m0">{c('Info').t`Drag and drop a file here or choose to upload.`}</p>
                    <div className="mt2 flex flex-column flex-nowrap w200p flex-item-noshrink">
                        <UploadButton />
                    </div>
                </IllustrationPlaceholder>
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
