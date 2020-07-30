import React, { useEffect } from 'react';
import { c } from 'ttag';

import { ContextMenu, DropdownMenuButton, Icon } from 'react-components';

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
    const { inputRef: folderInput, handleClick: uploadFolder, handleChange: handleFolderChange } = useFileUploadInput(
        true
    );

    useEffect(() => {
        if (position) {
            open();
        }
    }, [position]);

    const menuButtons = [
        {
            name: c('Action').t`Upload File`,
            icon: 'file-upload',
            action: uploadFile,
        },
        {
            name: c('Action').t`Upload Folder`,
            icon: 'folder-upload',
            action: uploadFolder,
        },
        {
            name: c('Action').t`Create New Folder`,
            icon: 'folder-new',
            action: openCreateFolder,
        },
    ].map((button) => (
        <DropdownMenuButton
            key={button.name}
            onContextMenu={(e) => e.stopPropagation()}
            className="flex flex-nowrap alignleft"
            onClick={button.action}
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
