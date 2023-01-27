import { c } from 'ttag';

import { DropdownMenuButton, Icon } from '@proton/components';

import useActiveShare from '../../../../../hooks/drive/useActiveShare';
import { useFileUploadInput } from '../../../../../store';

const UploadFileButton = () => {
    const { activeFolder } = useActiveShare();
    const {
        inputRef: fileInput,
        handleClick,
        handleChange,
    } = useFileUploadInput(activeFolder.shareId, activeFolder.linkId);

    return (
        <>
            <input multiple type="file" ref={fileInput} className="hidden" onChange={handleChange} />
            <DropdownMenuButton
                className="text-left flex flex-align-items-center"
                onClick={handleClick}
                data-testid="dropdown-upload-file"
            >
                <Icon className="mr0-5" name="file-arrow-in-up" />
                {c('Action').t`Upload file`}
            </DropdownMenuButton>
        </>
    );
};

export default UploadFileButton;
