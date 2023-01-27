import { c } from 'ttag';

import { DropdownMenuButton, Icon } from '@proton/components';

import useActiveShare from '../../../../../hooks/drive/useActiveShare';
import { useFolderUploadInput } from '../../../../../store';

const UploadFolderButton = () => {
    const { activeFolder } = useActiveShare();
    const {
        inputRef: fileInput,
        handleClick: handleUploadFolder,
        handleChange,
    } = useFolderUploadInput(activeFolder.shareId, activeFolder.linkId);

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
