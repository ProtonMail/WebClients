import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { EmptyViewContainer, Icon, useActiveBreakpoint, usePopperAnchor } from '@proton/components';
import uploadSvg from '@proton/styles/assets/img/illustrations/upload.svg';

import { FolderContextMenu } from './FolderContextMenu';
import { UploadButton } from './UploadButton';

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
            <div role="presentation" ref={anchorRef} onClick={close} className="flex w100 flex flex-item-fluid">
                <EmptyViewContainer
                    imageProps={{ src: uploadSvg, title: c('Info').t`There are no files yet` }}
                    data-test-id="my-files-empty-placeholder"
                >
                    <h3 className="text-bold">{c('Info').t`Go ahead, upload a file`}</h3>
                    <p className="color-weak">
                        {!isNarrow ? c('Info').t`It’s as easy as drag and drop or selecting files` : ''}
                    </p>
                    {!isNarrow && (
                        <div className="flex flex-justify-center">
                            <UploadButton className="w13e">
                                <Icon name="arrow-up-line" className="mr0-5" />
                                {c('Action').t`Upload files`}
                            </UploadButton>
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
