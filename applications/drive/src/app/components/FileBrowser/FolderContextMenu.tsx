import { useEffect } from 'react';
import * as React from 'react';
import { c } from 'ttag';

import { ContextMenu, DropdownMenuButton, Icon } from '@proton/components';

import useToolbarActions from '../../hooks/drive/useToolbarActions';
import useFileUploadInput from '../../hooks/drive/useFileUploadInput';

interface Props {
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

const FolderContextMenu = ({ anchorRef, isOpen, position, open, close }: Props) => {
    const { openCreateFolder } = useToolbarActions();
    const { inputRef: fileInput, handleClick: uploadFile, handleChange: handleFileChange } = useFileUploadInput();
    const {
        inputRef: folderInput,
        handleClick: uploadFolder,
        handleChange: handleFolderChange,
    } = useFileUploadInput(true);

    useEffect(() => {
        if (position) {
            open();
        }
    }, [position]);

    const menuButtons = [
        {
            name: c('Action').t`Upload file`,
            icon: 'file-arrow-up',
            testId: 'context-menu-upload-file',
            action: uploadFile,
        },
        {
            name: c('Action').t`Upload folder`,
            icon: 'folder-arrow-up',
            testId: 'context-menu-upload-folder',
            action: uploadFolder,
        },
        {
            name: c('Action').t`Create new folder`,
            icon: 'folder-plus',
            testId: 'context-menu-create-folder',
            action: openCreateFolder,
        },
    ].map((button) => (
        <DropdownMenuButton
            key={button.name}
            onContextMenu={(e) => e.stopPropagation()}
            className="flex flex-nowrap text-left"
            onClick={button.action}
            data-testid={button.testId}
        >
            <Icon className="mt0-25 mr0-5" name={button.icon} />
            {button.name}
        </DropdownMenuButton>
    ));

    return (
        <>
            <input multiple type="file" ref={folderInput} className="hidden" onChange={handleFolderChange} />
            <input multiple type="file" ref={fileInput} className="hidden" onChange={handleFileChange} />
            <ContextMenu isOpen={isOpen} close={close} position={position} anchorRef={anchorRef}>
                {menuButtons}
            </ContextMenu>
        </>
    );
};

export default FolderContextMenu;
