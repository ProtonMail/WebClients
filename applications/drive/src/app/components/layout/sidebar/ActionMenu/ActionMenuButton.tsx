import { PropsWithChildren } from 'react';

import { c } from 'ttag';

import {
    Dropdown,
    DropdownMenu,
    DropdownSizeUnit,
    Icon,
    SidebarPrimaryButton,
    usePopperAnchor,
} from '@proton/components';
import { getDevice } from '@proton/shared/lib/helpers/browser';
import clsx from '@proton/utils/clsx';

import useActiveShare from '../../../../hooks/drive/useActiveShare';
import { useFileUploadInput, useFolderUploadInput } from '../../../../store';
import { CreateNewFolderButton, UploadFileButton, UploadFolderButton } from './ActionMenuButtons';

interface Props {
    disabled?: boolean;
    className?: string;
}

// We put all input in the parent components because we need input to be present in the DOM
// even when the dropdown is closed
export const ActionMenuButton = ({ disabled, className }: PropsWithChildren<Props>) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const isDesktop = !getDevice()?.type;
    const { activeFolder } = useActiveShare();

    const {
        inputRef: folderInput,
        handleClick: handleUploadFolderClick,
        handleChange: handleInputFolderChange,
    } = useFolderUploadInput(activeFolder.shareId, activeFolder.linkId);

    const {
        inputRef: fileInput,
        handleClick: handleUploadFileClick,
        handleChange: handleInputFileChange,
    } = useFileUploadInput(activeFolder.shareId, activeFolder.linkId);

    return (
        <>
            <SidebarPrimaryButton
                ref={anchorRef}
                disabled={disabled}
                className={clsx(className, 'flex flex-justify-center flex-align-items-center')}
                onClick={toggle}
            >
                <Icon className="mr0-5" name="plus" />
                {
                    // translator: this string is used on Proton Drive to open a drop-down with 3 actions: Upload file, folder and new folder
                    c('Action').t`New`
                }
            </SidebarPrimaryButton>
            <input multiple type="file" ref={fileInput} className="hidden" onChange={handleInputFileChange} />
            <input type="file" ref={folderInput} className="hidden" onChange={handleInputFolderChange} />
            <Dropdown
                size={{ width: DropdownSizeUnit.Anchor, height: DropdownSizeUnit.Dynamic }}
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={close}
            >
                <DropdownMenu className="mt0-25 mb0-25">
                    <UploadFileButton onClick={handleUploadFileClick} />
                    {isDesktop && <UploadFolderButton onClick={handleUploadFolderClick} />}
                    <hr className="mt0-5 mb0-5" />
                    <CreateNewFolderButton />
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

export default ActionMenuButton;
