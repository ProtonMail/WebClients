import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Dropdown, DropdownMenu, DropdownMenuButton, usePopperAnchor } from '@proton/components';
import { IcFileArrowInUp } from '@proton/icons/icons/IcFileArrowInUp';
import { IcFolderArrowUp } from '@proton/icons/icons/IcFolderArrowUp';

import { useFileUploadInput, useFolderUploadInput } from '../../../store';

interface UploadFileButtonProps {
    volumeId: string;
    token: string;
    linkId: string;
}
export const UploadButton = ({ volumeId, token, linkId }: UploadFileButtonProps) => {
    const {
        inputRef: fileInput,
        handleClick: handleFileClick,
        handleChange: handleFileChange,
    } = useFileUploadInput(volumeId, token, linkId);

    const {
        inputRef: folerInput,
        handleClick: handleFolderClick,
        handleChange: handleFolderChange,
    } = useFolderUploadInput(volumeId, token, linkId);
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <input multiple type="file" ref={fileInput} className="hidden" onChange={handleFileChange} />
            <input type="file" ref={folerInput} className="hidden" onChange={handleFolderChange} />
            <Button ref={anchorRef} onClick={toggle} className="flex gap-2 items-center" size="medium">
                <IcFileArrowInUp size={4} />
                {c('Action').t`Upload`}
            </Button>
            <Dropdown anchorRef={anchorRef} isOpen={isOpen} onClose={close}>
                <DropdownMenu>
                    <DropdownMenuButton
                        className="flex items-center gap-2"
                        onClick={handleFileClick}
                        data-testid="download-button"
                    >
                        <IcFileArrowInUp />
                        {c('Action').t`Upload file`}
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        className="flex items-center gap-2"
                        onClick={handleFolderClick}
                        data-testid="download-button"
                    >
                        <IcFolderArrowUp />
                        {c('Action').t`Upload folder`}
                    </DropdownMenuButton>
                </DropdownMenu>
            </Dropdown>
        </>
    );
};
