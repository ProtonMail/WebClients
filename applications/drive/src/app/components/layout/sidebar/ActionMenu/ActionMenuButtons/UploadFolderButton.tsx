import { ChangeEventHandler } from 'react';

import { c } from 'ttag';

import { DropdownMenuButton, Icon } from '@proton/components';

import useActiveShare from '../../../../../hooks/drive/useActiveShare';
import { useFolderUploadInput } from '../../../../../store';

interface Props {
    onUploadStarted: () => void;
}

const UploadFolderButton = ({ onUploadStarted }: Props) => {
    const { activeFolder } = useActiveShare();
    const {
        inputRef: fileInput,
        handleClick: handleUploadFolder,
        handleChange: handleFileChange,
    } = useFolderUploadInput(activeFolder.shareId, activeFolder.linkId);

    const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
        handleFileChange(e);
        onUploadStarted();
    };

    return (
        <>
            <input multiple type="file" ref={fileInput} className="hidden" onChange={handleChange} />
            <DropdownMenuButton
                className="text-left flex flex-align-items-center"
                onClick={handleUploadFolder}
                data-testid="dropdown-upload-folder"
            >
                <Icon className="mr0-5" name="folder-arrow-up" />
                {c('Action').t`Upload folder`}
            </DropdownMenuButton>
        </>
    );
};

export default UploadFolderButton;
