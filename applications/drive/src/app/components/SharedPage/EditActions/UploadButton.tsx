import { c } from 'ttag';

import { Button } from '@proton/atoms/index';
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
            <Button
                ref={anchorRef}
                onClick={toggle}
                className="flex gap-2 py-2 items-start justify-center text-left flex-column md:gap-4 md:py-3"
                size="medium"
            >
                <Icon name="file-arrow-in" size={4} />
                {c('Action').t`Upload`}
            </Button>
            <Dropdown
                anchorRef={anchorRef}
                isOpen={isOpen}
                onClose={close}
                size={{
                    width: '15rem',
                }}
            >
                <DropdownMenu>
                    <DropdownMenuButton className="text-left" onClick={handleFileClick} data-testid="download-button">
                        <Icon name="file-arrow-in-up" className="mr-2" />
                        {c('Action').t`Upload file`}
                    </DropdownMenuButton>
                    <DropdownMenuButton className="text-left" onClick={handleFolderClick} data-testid="download-button">
                        <Icon name="folder-arrow-up" className="mr-2" />
                        {c('Action').t`Upload folder`}
                    </DropdownMenuButton>
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
