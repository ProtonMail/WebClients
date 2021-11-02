import { useEffect } from 'react';
import * as React from 'react';

import { ContextMenu, ContextSeparator } from '@proton/components';

import { ShareFileButton } from '../ContextMenu/buttons';
import { CreateNewFolderButton, UploadFileButton, UploadFolderButton } from './ContextMenuButtons';

interface Props {
    shareId: string;
    anchorRef: React.RefObject<HTMLElement>;
    isOpen: boolean;
    position:
        | {
              top: number;
              left: number;
          }
        | undefined;
    open: () => void;
    close: () => void;
}

const FolderContextMenu = ({ shareId, anchorRef, isOpen, position, open, close }: Props) => {
    useEffect(() => {
        if (position) {
            open();
        }
    }, [position]);

    return (
        <ContextMenu isOpen={isOpen} close={close} position={position} anchorRef={anchorRef}>
            <CreateNewFolderButton close={close} />
            <ContextSeparator />
            <UploadFileButton close={close} />
            <UploadFolderButton close={close} />
            <ContextSeparator />
            <ShareFileButton close={close} shareId={shareId} />
        </ContextMenu>
    );
};

export default FolderContextMenu;
