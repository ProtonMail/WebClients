import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { EmptyViewContainer, useActiveBreakpoint, usePopperAnchor } from '@proton/components';
import uploadSvgMobile from '@proton/styles/assets/img/illustrations/upload-mobile.svg';
import uploadSvg from '@proton/styles/assets/img/illustrations/upload.svg';

import EmptyFolderUploadButton from './EmptyFolderUploadButton';
import { FolderContextMenu } from './FolderContextMenu';

const EmptyFolder = ({ shareId }: { shareId: string }) => {
    const { isNarrow } = useActiveBreakpoint();
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
            <div
                role="presentation"
                ref={anchorRef}
                onClick={close}
                className="flex w100 flex flex-item-fluid overflow-auto"
            >
                <EmptyViewContainer
                    imageProps={{
                        src: !isNarrow ? uploadSvg : uploadSvgMobile,
                        title: c('Info').t`There are no files yet`,
                    }}
                    data-testid="my-files-empty-placeholder"
                >
                    <h3 className="text-bold">{c('Info').t`Go ahead, upload a file`}</h3>
                    <p className="color-weak">
                        {!isNarrow ? c('Info').t`It’s as easy as drag and drop or selecting files` : ''}
                    </p>
                    {!isNarrow && (
                        <div className="flex flex-justify-center">
                            <EmptyFolderUploadButton />
                        </div>
                    )}
                </EmptyViewContainer>
            </div>
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
