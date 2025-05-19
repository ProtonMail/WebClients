import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Dropdown, DropdownMenu, DropdownMenuButton, Icon, usePopperAnchor } from '@proton/components/index';

import { useFileUploadInput, useFolderUploadInput } from '../../../store';

interface UploadFileButtonProps {
    token: string;
    linkId: string;
}
export const UploadButton = ({ token, linkId }: UploadFileButtonProps) => {
    const {
        inputRef: fileInput,
        handleClick: handleFileClick,
        handleChange: handleFileChange,
    } = useFileUploadInput(token, linkId);

    const {
        inputRef: folerInput,
        handleClick: handleFolderClick,
        handleChange: handleFolderChange,
    } = useFolderUploadInput(token, linkId);
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <input multiple type="file" ref={fileInput} className="hidden" onChange={handleFileChange} />
            <input type="file" ref={folerInput} className="hidden" onChange={handleFolderChange} />
            <Button ref={anchorRef} onClick={toggle} className="flex gap-2 items-center" size="medium">
                <Icon name="file-arrow-in-up" size={4} />
                {c('Action').t`Upload`}
            </Button>
            <Dropdown anchorRef={anchorRef} isOpen={isOpen} onClose={close}>
                <DropdownMenu>
                    <DropdownMenuButton
                        className="flex items-center gap-2"
                        onClick={handleFileClick}
                        data-testid="download-button"
                    >
                        <Icon name="file-arrow-in-up" />
                        {c('Action').t`Upload file`}
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        className="flex items-center gap-2"
                        onClick={handleFolderClick}
                        data-testid="download-button"
                    >
                        <Icon name="folder-arrow-up" />
                        {c('Action').t`Upload folder`}
                    </DropdownMenuButton>
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
